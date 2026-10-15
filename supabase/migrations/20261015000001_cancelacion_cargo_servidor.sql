-- FIX C3 (ticket seguridad Fase 2): el cargo de cancelación se calculaba en el
-- cliente (JS) y se inyectaba como p_monto_cargo/p_porcentaje_cargo (TOCTOU:
-- el estado podía cambiar entre la lectura y la RPC). Desde ahora el servidor
-- ignora los montos del frontend y los recalcula atómicamente bajo
-- SELECT ... FOR UPDATE, con la misma tabla de PRD §4.7 que
-- packages/shared/src/rules/politica-cancelacion.ts:
--   llegó al punto de recolección → 100% | sin conductor → 0% |
--   >=6h → 20% | >=4h → 35% | >=2h → 50% | resto → 75%.
-- Se añade sobrecarga (uuid, text) que devuelve el cargo aplicado; la
-- sobrecarga legacy de 5 args se conserva por compatibilidad pero ignora los
-- montos del cliente y delega en la misma lógica.

create or replace function public.usuario_cancela_traslado(
  p_traslado_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_traslado public.traslados%rowtype;
  v_precio numeric;
  v_horas numeric;
  v_porcentaje integer;
  v_monto numeric;
  v_mensaje text;
begin
  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = auth.uid();

  if v_usuario_id is null then
    raise exception 'Solo un usuario autenticado puede cancelar su traslado.';
  end if;

  select * into v_traslado
  from public.traslados
  where id = p_traslado_id
    and usuario_id = v_usuario_id
  for update;

  if v_traslado.id is null then
    raise exception 'El traslado no existe o no pertenece al usuario autenticado.';
  end if;

  if not exists (
    select 1
    from public.estado_transiciones_validas
    where estado_actual = v_traslado.estado
      and estado_siguiente = 'servicio_cancelado'
  ) then
    raise exception
      'Este traslado ya no puede cancelarse en el estado "%". Cuando el vehículo ya está en verificación o en tránsito, usa una disputa o reporta una incidencia.',
      v_traslado.estado
      using errcode = 'check_violation';
  end if;

  -- Cálculo servidor (ignora por diseño cualquier monto del cliente).
  v_precio := coalesce(v_traslado.precio_final, v_traslado.precio_cotizado, 0);
  if v_traslado.estado = 'conductor_en_punto_de_recoleccion' then
    v_porcentaje := 100;
  elsif v_traslado.conductor_id is null then
    v_porcentaje := 0;
  else
    v_horas := extract(epoch from (v_traslado.fecha_hora_programada - now())) / 3600;
    if v_horas is null or v_horas >= 6 then
      v_porcentaje := 20;
    elsif v_horas >= 4 then
      v_porcentaje := 35;
    elsif v_horas >= 2 then
      v_porcentaje := 50;
    else
      v_porcentaje := 75;
    end if;
  end if;
  v_monto := round((v_precio * v_porcentaje) / 100, 2);
  v_mensaje := format('Cancelar ahora genera un cargo del %s%%. ¿Deseas continuar?', v_porcentaje);

  update public.traslados
  set estado = 'servicio_cancelado'
  where id = p_traslado_id
    and usuario_id = v_usuario_id
    and estado = v_traslado.estado;

  if coalesce(v_monto, 0) > 0 then
    insert into public.pagos (
      traslado_id,
      monto,
      momento,
      estado,
      metodo
    ) values (
      p_traslado_id,
      v_monto,
      'al_cierre',
      'pendiente',
      'cargo_cancelacion'
    );
  end if;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    'cancelacion_traslado',
    'usuario',
    v_usuario_id,
    jsonb_build_object(
      'motivo', p_motivo,
      'estado_anterior', v_traslado.estado,
      'estado_nuevo', 'servicio_cancelado',
      'porcentaje_cargo', v_porcentaje,
      'monto_cargo', v_monto,
      'mensaje_confirmacion', v_mensaje,
      'cargo_origen', 'servidor'
    )
  );

  return jsonb_build_object(
    'porcentaje_cargo', v_porcentaje,
    'monto_cargo', v_monto,
    'mensaje', v_mensaje
  );
end;
$$;

-- Sobrecarga legacy: misma firma histórica, pero los montos del cliente se
-- ignoran y se delega en el cálculo servidor de arriba.
create or replace function public.usuario_cancela_traslado(
  p_traslado_id uuid,
  p_motivo text,
  p_porcentaje_cargo numeric,
  p_monto_cargo numeric,
  p_mensaje text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.usuario_cancela_traslado(p_traslado_id, p_motivo);
  return;
end;
$$;

revoke all on function public.usuario_cancela_traslado(uuid, text) from public;
grant execute on function public.usuario_cancela_traslado(uuid, text) to authenticated;
revoke all on function public.usuario_cancela_traslado(uuid, text, numeric, numeric, text) from public;
grant execute on function public.usuario_cancela_traslado(uuid, text, numeric, numeric, text) to authenticated;
