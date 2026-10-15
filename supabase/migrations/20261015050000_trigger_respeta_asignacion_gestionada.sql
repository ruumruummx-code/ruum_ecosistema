-- FIX post-hardening C1/C4: el trigger proteger_campos_traslado_conductor
-- (20261015033000) bloquea también las asignaciones legítimas del sistema
-- (resolver_competencia_asignacion, aceptar_asignacion), rompiendo
-- rt40/rt48/rt53/rt62: esas RPC actualizan conductor_id+estado+ganancia
-- dentro de transacciones security definer auditadas.
--
-- Corrección mínima, siguiendo la convención ya establecida por el trigger
-- sincronizar_asignacion_traslado (20260908000004):
--   1) el trigger honra el flag transaction-local
--      ruum.asignacion_gestionada='1';
--   2) resolver_competencia_asignacion marca ese flag solo alrededor de su
--      UPDATE a traslados (aceptar/cancelar/reasignar ya lo marcan).
-- Los UPDATE directos por PostgREST corren sin el flag (un cliente no puede
-- inyectar SET LOCAL en un UPDATE), así que el blindaje anti-conductor
-- sigue intacto para ediciones manuales (cubierto por rt65).

create or replace function public.proteger_campos_traslado_conductor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Flujo de asignación gestionada: las RPC de asignación actualizan
  -- conductor_id/estado dentro de funciones security definer auditadas.
  if coalesce(nullif(current_setting('ruum.asignacion_gestionada', true), ''), '0') = '1' then
    return new;
  end if;
  if public.es_admin() then return new; end if;
  if auth.uid() is null then return new; end if;
  if new.usuario_id is distinct from old.usuario_id
    or new.precio_cotizado is distinct from old.precio_cotizado
    or new.precio_final is distinct from old.precio_final
    or new.origen_lat is distinct from old.origen_lat
    or new.origen_lng is distinct from old.origen_lng
    or new.destino_lat is distinct from old.destino_lat
    or new.destino_lng is distinct from old.destino_lng
    or new.vehiculo_id is distinct from old.vehiculo_id
    or new.conductor_id is distinct from old.conductor_id then
    raise exception 'Conductor no autorizado a modificar precio/ruta/titularidad.';
  end if;
  return new;
end; $$;

-- resolver_competencia_asignacion con flag de asignación gestionada alrededor
-- de su UPDATE a traslados (cuerpo idéntico a 20260902131724 salvo el flag).
create or replace function private.resolver_competencia_asignacion(p_competencia_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_competencia public.competencias_asignacion%rowtype;
  v_traslado public.traslados%rowtype;
  v_ganador record;
  v_ganancia numeric;
begin
  select * into v_competencia
  from public.competencias_asignacion
  where id = p_competencia_id
  for update;
  if v_competencia.id is null or v_competencia.estado <> 'abierta' or now() < v_competencia.cierra_en then
    return false;
  end if;

  select * into v_traslado from public.traslados where id = v_competencia.traslado_id for update;
  if v_traslado.id is null or v_traslado.estado::text <> 'pendiente_de_conductor' or v_traslado.conductor_id is not null then
    update public.competencias_asignacion
      set estado = 'cancelada', resuelta_en = now(), detalle_resolucion = jsonb_build_object('motivo', 'traslado_no_disponible')
    where id = p_competencia_id;
    update public.solicitudes_asignacion set estado = 'cancelada'
    where competencia_id = p_competencia_id and estado = 'solicitada';
    return false;
  end if;

  select s.*, evaluacion.resultado as elegibilidad_actual
    into v_ganador
  from public.solicitudes_asignacion s
  cross join lateral (
    select private.evaluar_elegibilidad_asignacion(s.traslado_id, s.conductor_id) resultado
  ) evaluacion
  where s.competencia_id = p_competencia_id
    and s.estado = 'solicitada'
    and (evaluacion.resultado->>'elegible')::boolean
  order by
    case s.categoria_puntualidad when 'a' then 3 when 'b' then 2 when 'sin_datos' then 2 else 1 end desc,
    s.asignaciones_7d asc,
    s.ultima_asignacion_en asc nulls first,
    s.clave_desempate asc
  limit 1;

  if v_ganador.id is null then
    update public.solicitudes_asignacion
      set estado = 'no_elegible'
    where competencia_id = p_competencia_id and estado = 'solicitada';
    update public.competencias_asignacion
      set estado = 'sin_solicitudes', resuelta_en = now(),
          detalle_resolucion = jsonb_build_object('motivo', 'sin_solicitudes_elegibles')
    where id = p_competencia_id;
    return false;
  end if;

  v_ganancia := public.calcular_pago_conductor_traslado(v_competencia.traslado_id, v_ganador.conductor_id);
  perform set_config('ruum.asignacion_gestionada', '1', true);
  update public.traslados
    set estado = 'conductor_asignado', conductor_id = v_ganador.conductor_id,
        ganancia_conductor_congelada = v_ganancia
  where id = v_competencia.traslado_id
    and estado::text = 'pendiente_de_conductor' and conductor_id is null;
  perform set_config('ruum.asignacion_gestionada', '0', true);
  if not found then return false; end if;

  update public.solicitudes_asignacion
    set estado = case when id = v_ganador.id then 'seleccionada' else 'no_seleccionada' end
  where competencia_id = p_competencia_id and estado = 'solicitada';

  update public.competencias_asignacion
    set estado = 'resuelta', resuelta_en = now(), conductor_seleccionado_id = v_ganador.conductor_id,
        detalle_resolucion = jsonb_build_object(
          'criterio', 'puntualidad_equidad_antiguedad_desempate_determinista',
          'categoria_puntualidad', v_ganador.categoria_puntualidad,
          'puntualidad_porcentaje', v_ganador.puntualidad_porcentaje,
          'puntualidad_muestra', v_ganador.puntualidad_muestra,
          'asignaciones_7d', v_ganador.asignaciones_7d,
          'ultima_asignacion_en', v_ganador.ultima_asignacion_en,
          'politica_version', v_competencia.politica_version,
          'ganancia_conductor_congelada', v_ganancia
        )
  where id = p_competencia_id;

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (
    v_competencia.traslado_id, 'asignacion_conductor', 'sistema', v_competencia.id,
    jsonb_build_object('competencia_id', v_competencia.id, 'conductor_id', v_ganador.conductor_id,
      'politica_version', v_competencia.politica_version, 'categoria_puntualidad', v_ganador.categoria_puntualidad,
      'asignaciones_7d', v_ganador.asignaciones_7d, 'ganancia_conductor_congelada', v_ganancia)
  );
  return true;
end;
$$;
