-- RUUM-USR-F6-001: Endurecimiento del Flujo 6 – Solicitud individual
-- 1. Añade columna snapshot_tarifa a public.traslados para persistencia de evidencia auditable.
-- 2. Actualiza usuario_crea_traslado:
--    - Integra snapshot_tarifa (CB-1 / CA-2).
--    - Valida TTL/vigencia del snapshot (CA-3).
--    - Alinea reglas de rescate_mecanico permitiendo vehículos no rodantes bajo dicha condición (CB-3 / T8 / CA-7).
--    - Registra hash del snapshot en auditoría.

alter table public.traslados add column if not exists snapshot_tarifa jsonb;

create or replace function public.usuario_crea_traslado(
  p_vehiculo_id uuid,
  p_vehiculo jsonb,
  p_traslado jsonb,
  p_clave_idempotencia uuid,
  p_paradas jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_estado_verificacion public.estado_verificacion;
  v_tipo_pago public.tipo_pago := 'anticipado'::public.tipo_pago;
  v_vehiculo_id uuid;
  v_tipo_vehiculo public.tipo_vehiculo;
  v_traslado_id uuid;
  v_anio int;
  v_anio_maximo int := extract(year from now())::int + 1;
  v_presupuesto numeric;
  v_modalidad text;
  v_fecha_programada timestamptz;
  v_tiene_tarjeta boolean;
  v_tiene_verificacion boolean;
  v_tiene_placas boolean;
  v_puede_circular boolean;
  v_marca text;
  v_modelo text;
  v_categoria_tarifa public.categoria_tarifa_vehiculo;
  v_gama public.gama_vehiculo;
  v_condicion public.condicion_vehiculo;
  v_distancia_km numeric;
  v_tiempo_estimado_horas numeric;
  v_precio_cotizado numeric;
  v_estado_inicial public.estado_traslado := 'solicitud_creada'::public.estado_traslado;
  v_momento timestamptz;
  v_paradas jsonb := coalesce(p_paradas, '[]'::jsonb);
  v_count int;
  v_item jsonb;
  v_idx int;
  v_tipo_parada text;
  v_tipo_tarea text;
  v_snapshot_tarifa jsonb := p_traslado->'snapshot_tarifa';
  v_snapshot_expira timestamptz;
begin
  select id, estado_verificacion
    into v_usuario_id, v_estado_verificacion
    from public.usuarios
   where auth_user_id = auth.uid();
  if v_usuario_id is null then raise exception 'Usuario no encontrado'; end if;
  if v_estado_verificacion <> 'verificado' then raise exception 'Tu cuenta debe estar verificada para solicitar un traslado'; end if;
  if p_clave_idempotencia is null then raise exception 'La clave de idempotencia es obligatoria'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_usuario_id::text || p_clave_idempotencia::text, 0));
  select id, tipo_pago, precio_cotizado
    into v_traslado_id, v_tipo_pago, v_precio_cotizado
    from public.traslados
   where usuario_id = v_usuario_id and clave_idempotencia = p_clave_idempotencia;
  if v_traslado_id is not null then
    return jsonb_build_object('id', v_traslado_id, 'tipo_pago', v_tipo_pago, 'precio_cotizado', v_precio_cotizado);
  end if;
  v_tipo_pago := 'anticipado'::public.tipo_pago;

  if jsonb_typeof(v_paradas) <> 'array' then raise exception 'Paradas debe ser un arreglo'; end if;
  v_count := jsonb_array_length(v_paradas);
  if v_count > 8 then raise exception 'Máximo 8 escalas/tareas permitidas (recibidas %)', v_count; end if;

  v_modalidad := p_traslado->>'modalidad_programacion';
  if v_modalidad not in ('lo_antes_posible', 'programado') then raise exception 'Modalidad de programación inválida'; end if;
  v_fecha_programada := nullif(p_traslado->>'fecha_hora_programada', '')::timestamptz;
  if v_modalidad = 'programado' then
    if v_fecha_programada is null then raise exception 'La fecha programada es obligatoria'; end if;
    if v_fecha_programada < now() + interval '2 hours' then raise exception 'La fecha no cumple con la anticipación mínima de 2 horas'; end if;
  elsif v_fecha_programada is not null then
    raise exception 'La modalidad inmediata no admite fecha programada';
  end if;

  if p_vehiculo_id is not null then
    select id, tipo, marca, modelo, tiene_tarjeta_circulacion, tiene_verificacion, tiene_placas,
           puede_circular_rodando, categoria_tarifa, gama, condicion
      into v_vehiculo_id, v_tipo_vehiculo, v_marca, v_modelo, v_tiene_tarjeta, v_tiene_verificacion,
           v_tiene_placas, v_puede_circular, v_categoria_tarifa, v_gama, v_condicion
      from public.vehiculos
     where id = p_vehiculo_id and usuario_id = v_usuario_id;
    if v_vehiculo_id is null then raise exception 'El vehículo indicado no existe o no pertenece al usuario.'; end if;
    if v_categoria_tarifa is null or v_gama is null then
      select categoria_tarifa, gama into v_categoria_tarifa, v_gama
        from public.catalogar_vehiculo_para_tarifa(v_marca, v_modelo);
    end if;
    v_condicion := coalesce(v_condicion, 'seminueva'::public.condicion_vehiculo);
  else
    if p_vehiculo is null then raise exception 'Debes indicar un vehículo guardado (p_vehiculo_id) o los datos de un vehículo nuevo (p_vehiculo).'; end if;
    v_anio := (p_vehiculo->>'anio')::int;
    if v_anio is null or v_anio < 1980 or v_anio > v_anio_maximo then raise exception 'El año del vehículo debe ser un número entre 1980 y %.', v_anio_maximo; end if;
    v_tipo_vehiculo := (p_vehiculo->>'tipo')::public.tipo_vehiculo;
    v_marca := p_vehiculo->>'marca';
    v_modelo := p_vehiculo->>'modelo';
    v_tiene_tarjeta := coalesce((p_vehiculo->>'tiene_tarjeta_circulacion')::boolean, false);
    v_tiene_verificacion := coalesce((p_vehiculo->>'tiene_verificacion')::boolean, false);
    v_tiene_placas := coalesce((p_vehiculo->>'tiene_placas')::boolean, false);
    v_puede_circular := coalesce((p_vehiculo->>'puede_circular_rodando')::boolean, false);
    v_condicion := coalesce(nullif(p_vehiculo->>'condicion', '')::public.condicion_vehiculo, 'seminueva'::public.condicion_vehiculo);
    select categoria_tarifa, gama into v_categoria_tarifa, v_gama
      from public.catalogar_vehiculo_para_tarifa(v_marca, v_modelo);
    insert into public.vehiculos (
      usuario_id, tipo, transmision, marca, modelo, anio, color, placas, vin,
      estado_general_declarado, tiene_tarjeta_circulacion, tiene_verificacion,
      tiene_placas, puede_circular_rodando, categoria_tarifa, gama, condicion
    ) values (
      v_usuario_id, v_tipo_vehiculo, p_vehiculo->>'transmision', v_marca, v_modelo, v_anio,
      p_vehiculo->>'color', p_vehiculo->>'placas', p_vehiculo->>'vin', p_vehiculo->>'estado_general_declarado',
      v_tiene_tarjeta, v_tiene_verificacion, v_tiene_placas, v_puede_circular,
      v_categoria_tarifa, v_gama, v_condicion
    ) returning id into v_vehiculo_id;
  end if;

  -- ALINEACIÓN RESCATE MECÁNICO (CB-3 / T8 / CA-7):
  -- Para rescate mecánico, se exige documentación vigente pero se permite vehículo no rodante (puedeCircular = false).
  -- Para el resto de condiciones, el vehículo debe encender y circular rodando obligatoriamente.
  if not (v_tiene_tarjeta and v_tiene_verificacion and v_tiene_placas) then
    raise exception 'El MVP solo admite vehículos que cuentan con documentación vigente (tarjeta, verificación y placas).';
  end if;
  if not v_puede_circular and v_condicion <> 'rescate_mecanico' then
    raise exception 'El vehículo debe poder circular rodando a menos que se trate de rescate mecánico.';
  end if;

  -- INTEGRACIÓN SNAPSHOT FIRMADO (CB-1 / CA-2 / CA-3):
  if v_snapshot_tarifa is not null then
    v_snapshot_expira := nullif(v_snapshot_tarifa->>'expiraEn', '')::timestamptz;
    if v_snapshot_expira is not null and v_snapshot_expira <= now() then
      raise exception 'La cotización del traslado ha expirado. Por favor cotiza nuevamente.';
    end if;
    v_distancia_km := nullif(v_snapshot_tarifa->'inputs'->>'distanciaKm', '')::numeric;
    v_tiempo_estimado_horas := nullif(v_snapshot_tarifa->'inputs'->>'tiempoEstimadoHoras', '')::numeric;
    v_precio_cotizado := nullif(v_snapshot_tarifa->>'monto', '')::numeric;
  else
    v_distancia_km := nullif(p_traslado->>'distancia_km', '')::numeric;
    v_tiempo_estimado_horas := nullif(p_traslado->>'tiempo_estimado_horas', '')::numeric;
  end if;

  if (v_distancia_km is null) <> (v_tiempo_estimado_horas is null) then raise exception 'La distancia y el tiempo estimado de ruta deben enviarse juntos.'; end if;
  if v_distancia_km is not null and (v_distancia_km < 0 or v_distancia_km > 20000) then raise exception 'La distancia estimada de ruta es inválida.'; end if;
  if v_tiempo_estimado_horas is not null and (v_tiempo_estimado_horas < 0 or v_tiempo_estimado_horas > 720) then raise exception 'El tiempo estimado de ruta es inválido.'; end if;

  if v_precio_cotizado is null and v_categoria_tarifa is not null and v_gama is not null and v_condicion is not null
     and v_distancia_km is not null and v_tiempo_estimado_horas is not null then
    v_momento := coalesce(v_fecha_programada, now());
    v_precio_cotizado := public.calcular_tarifa_traslado(
      v_categoria_tarifa,
      public.rango_desde_distancia(v_distancia_km),
      v_gama,
      v_condicion,
      public.horario_desde_timestamp(v_momento),
      public.dia_desde_timestamp(v_momento),
      v_distancia_km,
      v_tiempo_estimado_horas
    );
  end if;

  if v_precio_cotizado is not null then
    v_estado_inicial := 'cotizacion_generada'::public.estado_traslado;
  end if;

  insert into public.traslados (
    usuario_id, vehiculo_id, estado, contacto_entrega_nombre, contacto_entrega_telefono,
    contacto_recepcion_nombre, contacto_recepcion_telefono, origen_lat, origen_lng, origen_direccion,
    origen_ciudad, origen_referencias, destino_lat, destino_lng, destino_direccion, destino_ciudad,
    destino_referencias, instrucciones_especiales, modalidad_programacion, fecha_hora_programada,
    tipo_ruta, ventana_recoleccion, ventana_entrega, tipo_servicio, motivo_servicio, presupuesto_usuario,
    precio_cotizado, precio_final, tipo_pago, clave_idempotencia, distancia_km, tiempo_estimado_horas,
    cotizacion_expira_en, snapshot_tarifa
  ) values (
    v_usuario_id, v_vehiculo_id, v_estado_inicial, p_traslado->>'contacto_entrega_nombre', p_traslado->>'contacto_entrega_telefono',
    p_traslado->>'contacto_recepcion_nombre', p_traslado->>'contacto_recepcion_telefono', nullif(p_traslado->>'origen_lat','')::numeric,
    nullif(p_traslado->>'origen_lng','')::numeric, p_traslado->>'origen_direccion', p_traslado->>'origen_ciudad', p_traslado->>'origen_referencias',
    nullif(p_traslado->>'destino_lat','')::numeric, nullif(p_traslado->>'destino_lng','')::numeric, p_traslado->>'destino_direccion',
    p_traslado->>'destino_ciudad', p_traslado->>'destino_referencias', p_traslado->>'instrucciones_especiales', p_traslado->>'modalidad_programacion',
    v_fecha_programada, p_traslado->>'tipo_ruta', p_traslado->>'ventana_recoleccion', p_traslado->>'ventana_entrega', p_traslado->>'tipo_servicio',
    p_traslado->>'motivo_servicio', v_presupuesto, v_precio_cotizado, null, v_tipo_pago, p_clave_idempotencia, v_distancia_km,
    v_tiempo_estimado_horas, case when v_precio_cotizado is not null then now() + interval '72 hours' else null end,
    v_snapshot_tarifa
  ) returning id into v_traslado_id;

  if v_count > 0 then
    for v_idx in 0..v_count-1 loop
      v_item := v_paradas->v_idx;
      v_tipo_parada := v_item->>'tipo';
      if v_tipo_parada not in ('escala','tarea') then raise exception 'Tipo de parada inválido en posición %: %', v_idx+1, v_tipo_parada; end if;
      if (v_item->>'calle') is null or btrim(v_item->>'calle') = '' then raise exception 'Calle requerida en parada %', v_idx+1; end if;
      if (v_item->>'numero') is null or btrim(v_item->>'numero') = '' then raise exception 'Número requerido en parada %', v_idx+1; end if;
      if (v_item->>'colonia') is null or btrim(v_item->>'colonia') = '' then raise exception 'Colonia requerida en parada %', v_idx+1; end if;
      if (v_item->>'codigo_postal') !~ '^\d{5}$' then raise exception 'CP inválido en parada %', v_idx+1; end if;
      if (v_item->>'estado') is null or btrim(v_item->>'estado') = '' then raise exception 'Estado requerido en parada %', v_idx+1; end if;
      if (v_item->>'ciudad') is null or btrim(v_item->>'ciudad') = '' then raise exception 'Ciudad requerida en parada %', v_idx+1; end if;
      v_tipo_tarea := null;
      if v_tipo_parada = 'tarea' then
        v_tipo_tarea := v_item->>'tipo_tarea';
        if v_tipo_tarea not in ('entrega_parcial','recoleccion','tramite','inspeccion','carga_descarga','otro') then raise exception 'Tipo de tarea inválido en parada %', v_idx+1; end if;
      end if;
      insert into public.traslado_paradas (
        traslado_id, orden, tipo, calle, numero, colonia, codigo_postal, estado, ciudad, direccion,
        referencias, lat, lng, tipo_tarea, contacto_nombre, contacto_telefono, instrucciones, requiere_evidencia, tiempo_espera_min
      ) values (
        v_traslado_id, v_idx+1, v_tipo_parada::public.tipo_parada, v_item->>'calle', v_item->>'numero', v_item->>'colonia',
        v_item->>'codigo_postal', v_item->>'estado', v_item->>'ciudad', coalesce(v_item->>'direccion', concat_ws(', ', v_item->>'calle', v_item->>'numero', v_item->>'colonia', v_item->>'codigo_postal', v_item->>'ciudad')),
        nullif(v_item->>'referencias',''), nullif(v_item->>'lat','')::numeric, nullif(v_item->>'lng','')::numeric,
        case when v_tipo_parada='tarea' then v_tipo_tarea::public.tipo_tarea_parada else null end, null, null, null, false, null
      );
    end loop;
  end if;

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (v_traslado_id, 'creacion_solicitud_traslado', 'usuario', v_usuario_id,
    jsonb_build_object('vehiculo_id', v_vehiculo_id, 'vehiculo_reutilizado', p_vehiculo_id is not null,
      'tipo_pago', v_tipo_pago, 'presupuesto_usuario', v_presupuesto, 'distancia_km', v_distancia_km,
      'tiempo_estimado_horas', v_tiempo_estimado_horas, 'precio_cotizado_automatico', v_precio_cotizado,
      'paradas_count', v_count, 'snapshot_tarifa_hash', v_snapshot_tarifa->>'hash'));

  return jsonb_build_object('id', v_traslado_id, 'tipo_pago', v_tipo_pago, 'precio_cotizado', v_precio_cotizado);
end;
$$;

revoke all on function public.usuario_crea_traslado(uuid, jsonb, jsonb, uuid, jsonb) from public;
grant execute on function public.usuario_crea_traslado(uuid, jsonb, jsonb, uuid, jsonb) to authenticated;

-- RUUM-USR-F6-001 (CB-2 / Bloque B): Reconciliador y compensador durable de saga para traslados individuales.
-- Procesa traslados en 'cotizacion_generada' mayores a 15 minutos (TTL de cotización vencido):
-- 1. Si existe un pago en 'pagos' con estado aprobado ('completado', 'aprobado', 'succeeded'), transiciona a 'servicio_confirmado'.
-- 2. Si no existe pago o el pago falló, compensa el traslado a 'servicio_cancelado' con motivo 'pago_fallido_compensacion'.
create or replace function public.reconciliar_saga_traslados_individuales(p_limite integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_confirmados integer := 0;
  v_compensados integer := 0;
  v_errores integer := 0;
  r record;
  v_pago record;
begin
  if p_limite is null or p_limite < 1 or p_limite > 200 then
    raise exception 'Límite de reconciliación inválido (debe ser entre 1 y 200).';
  end if;

  for r in
    select t.id, t.usuario_id, t.creado_en
    from public.traslados t
    where t.estado = 'cotizacion_generada'
      and t.creado_en < (now() - interval '15 minutes')
    order by t.creado_en asc
    limit p_limite
    for update skip locked
  loop
    begin
      -- Verificar si existe pago aprobado en la tabla de pagos
      select p.id, p.estado into v_pago
      from public.pagos p
      where p.traslado_id = r.id
      order by p.creado_en desc
      limit 1;

      if v_pago.id is not null and v_pago.estado in ('completado', 'aprobado', 'succeeded') then
        -- Caso: Pago confirmado en pasarela pero webhook no transicionó el traslado
        update public.traslados
        set estado = 'servicio_confirmado',
            actualizado_en = now()
        where id = r.id;

        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'reconciliacion_pago_exitoso_traslado', 'sistema', r.usuario_id,
          jsonb_build_object('pago_id', v_pago.id, 'estado_anterior', 'cotizacion_generada', 'nuevo_estado', 'servicio_confirmado'));

        v_confirmados := v_confirmados + 1;
      else
        -- Caso: Abandono o pago fallido tras 15 minutos -> Compensación de saga
        update public.traslados
        set estado = 'servicio_cancelado',
            actualizado_en = now()
        where id = r.id;

        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'compensacion_saga_pago_fallido', 'sistema', r.usuario_id,
          jsonb_build_object('motivo', 'pago_fallido_compensacion', 'tiempo_transcurrido_min', 15, 'pago_estado', v_pago.estado));

        v_compensados := v_compensados + 1;
      end if;
    exception when others then
      v_errores := v_errores + 1;
      insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
      values (r.id, 'error_reconciliacion_saga_f6', 'sistema', r.usuario_id,
        jsonb_build_object('error', sqlerrm, 'sqlstate', sqlstate));
    end;
  end loop;

  return jsonb_build_object('confirmados', v_confirmados, 'compensados', v_compensados, 'errores', v_errores);
end;
$$;

revoke all on function public.reconciliar_saga_traslados_individuales(integer) from public, anon, authenticated;
grant execute on function public.reconciliar_saga_traslados_individuales(integer) to service_role;

comment on function public.reconciliar_saga_traslados_individuales(integer) is
  'F6-001: job de mantenimiento/reconciliación cada 5 minutos; transiciona a servicio_confirmado traslados pagados pendientes o compensa a servicio_cancelado traslados abandonados > 15m con SKIP LOCKED.';

notify pgrst, 'reload schema';
