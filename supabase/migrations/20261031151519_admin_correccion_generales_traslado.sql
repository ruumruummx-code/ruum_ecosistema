-- Protección desde que el conductor inicia el camino al origen; conserva el
-- bloqueo por historial aunque el estado cambie por incidencia o cancelación.
create or replace function private.estado_operacion_iniciada(p_estado text)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select p_estado = any(array[
    'conductor_en_camino_al_origen','conductor_en_punto_de_recoleccion',
    'verificacion_vehiculo_en_proceso','evidencia_inicial_en_proceso',
    'evidencia_inicial_completada','vehiculo_recibido','traslado_en_curso',
    'incidencia_reportada','llegada_a_destino','evidencia_final_en_proceso',
    'evidencia_final_completada','entrega_confirmada','pago_pendiente',
    'pago_completado','servicio_cerrado','dano_no_reportado_en_revision',
    'reclamo_abierto','reclamo_resuelto','cierre_operativo_con_incidencia_abierta',
    'disputa_abierta','disputa_resuelta']);
$$;
revoke all on function private.estado_operacion_iniciada(text) from public;

create or replace function private.proteger_vehiculo_operacion()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_iniciado boolean; v_antes jsonb; v_despues jsonb; v_admin uuid;
begin
  v_antes := to_jsonb(old) - array['actualizado_en','version'];
  if tg_op='UPDATE' then
    v_despues := to_jsonb(new) - array['actualizado_en','version'];
    if v_antes = v_despues then return new; end if;
  end if;
  -- Se comparte con el inicio/transición del traslado para serializar la edición.
  perform pg_advisory_xact_lock(hashtextextended('rr-vehiculo:' || old.id::text,0));
  select exists(select 1 from public.traslados t where t.vehiculo_id=old.id and (
    private.estado_operacion_iniciada(t.estado::text) or exists(
      select 1 from public.historial_estados_traslado h where h.traslado_id=t.id
      and (private.estado_operacion_iniciada(h.estado_nuevo::text)
        or private.estado_operacion_iniciada(h.estado_anterior::text))))) into v_iniciado;
  if v_iniciado and auth.uid() is not null then
    if not public.admin_tiene_permiso('vehiculos:gestionar') then
      raise exception using errcode='42501', message='TRASLADO_INICIADO_SOLO_ADMIN: solicita a administración la corrección del vehículo.';
    end if;
    select id into strict v_admin from public.admins where auth_user_id=auth.uid();
    insert into public.auditoria_admin_seguridad(auth_user_id,admin_id,tipo,recurso,accion,datos)
    values(auth.uid(),v_admin,'mutacion','vehiculos','corregir_en_operacion',
      jsonb_build_object('vehiculo_id',old.id,'antes',v_antes,'despues',v_despues,
        'traslados', (select jsonb_agg(t.id) from public.traslados t where t.vehiculo_id=old.id)));
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.proteger_vehiculo_operacion() from public;
create trigger proteger_vehiculo_operacion before update or delete on public.vehiculos
for each row execute function private.proteger_vehiculo_operacion();

create or replace function private.proteger_generales_traslado_iniciado()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_antes jsonb; v_despues jsonb; v_iniciado boolean; v_admin uuid;
  v_campos text[] := array['usuario_id','vehiculo_id',
    'contacto_entrega_nombre','contacto_entrega_telefono','contacto_recepcion_nombre','contacto_recepcion_telefono',
    'origen_lat','origen_lng','origen_direccion','origen_ciudad','origen_referencias',
    'destino_lat','destino_lng','destino_direccion','destino_ciudad','destino_referencias',
    'instrucciones_especiales','modalidad_programacion','fecha_hora_programada','tipo_ruta',
    'ventana_recoleccion','ventana_entrega','tipo_servicio','motivo_servicio','distancia_km','tiempo_estimado_horas'];
begin
  perform pg_advisory_xact_lock(hashtextextended('rr-vehiculo:' || old.vehiculo_id::text,0));
  select jsonb_object_agg(key,value) into v_antes from jsonb_each(to_jsonb(old)) where key=any(v_campos);
  select jsonb_object_agg(key,value) into v_despues from jsonb_each(to_jsonb(new)) where key=any(v_campos);
  if v_antes is not distinct from v_despues then return new; end if;
  v_iniciado := private.estado_operacion_iniciada(old.estado::text)
    or private.estado_operacion_iniciada(new.estado::text)
    or exists(select 1 from public.historial_estados_traslado h where h.traslado_id=old.id
      and (private.estado_operacion_iniciada(h.estado_nuevo::text) or private.estado_operacion_iniciada(h.estado_anterior::text)));
  if v_iniciado and auth.uid() is not null then
    if not public.admin_tiene_permiso('Traslados:gestionar') then
      raise exception using errcode='42501',message='TRASLADO_INICIADO_SOLO_ADMIN: solicita a administración la corrección de datos generales.';
    end if;
    select id into strict v_admin from public.admins where auth_user_id=auth.uid();
    insert into public.auditoria_admin_seguridad(auth_user_id,admin_id,tipo,recurso,accion,datos)
    values(auth.uid(),v_admin,'mutacion','traslados','corregir_generales_en_operacion',
      jsonb_build_object('traslado_id',old.id,'antes',v_antes,'despues',v_despues));
  end if;
  return new;
end $$;
revoke all on function private.proteger_generales_traslado_iniciado() from public;
create trigger proteger_generales_traslado_iniciado before update on public.traslados
for each row execute function private.proteger_generales_traslado_iniciado();
