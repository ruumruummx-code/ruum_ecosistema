-- Política de producto 2026-10-29: todos ingresan en Concer 4 (5.0).
-- El nivel depende solo de las calificaciones reales de usuarios.
-- No modifica estado/expediente, documentos, suspensiones, asignaciones ni pagos.
-- PostgreSQL 17: cambiar la expresión conserva la columna y sus dependencias.
alter table public.conductores
  alter column calificacion_promedio set default 5.0,
  alter column nivel_por_experiencia set default 'coleccion',
  alter column nivel_por_calificacion set default 'coleccion';

alter table public.conductores alter column nivel_operativo_vigente
  set expression as (case
    when calificacion_promedio >= 4.9 then 'coleccion'::public.nivel_concer
    when calificacion_promedio >= 4.8 then 'luxury'::public.nivel_concer
    when calificacion_promedio >= 4.5 then 'ejecutivo'::public.nivel_concer
    when calificacion_promedio >= 4.0 then 'basico'::public.nivel_concer
    else null::public.nivel_concer
  end);

-- Campo legacy conservado por compatibilidad; nunca limita el nivel generado.
create or replace function private.sincronizar_nivel_por_calificacion()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.nivel_por_calificacion := case
    when new.calificacion_promedio >= 4.9 then 'coleccion'::public.nivel_concer
    when new.calificacion_promedio >= 4.8 then 'luxury'::public.nivel_concer
    when new.calificacion_promedio >= 4.5 then 'ejecutivo'::public.nivel_concer
    else 'basico'::public.nivel_concer
  end;
  return new;
end;
$$;
revoke all on function private.sincronizar_nivel_por_calificacion() from public, anon, authenticated;
-- Preview puede conservar este trigger al reconstruir el esquema.
create or replace trigger sincronizar_nivel_por_calificacion
  before insert or update of calificacion_promedio on public.conductores
  for each row execute function private.sincronizar_nivel_por_calificacion();

-- Las calificaciones se insertan con el rol del usuario. El trigger necesita
-- actualizar reputación sin otorgarle UPDATE sobre conductores al usuario.
-- Solo se invoca como trigger tras una escritura autorizada por RLS.
create or replace function public.trigger_recalcular_calificacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_calificacion_conductor(old.conductor_id);
    return old;
  end if;
  perform public.recalcular_calificacion_conductor(new.conductor_id);
  if tg_op = 'UPDATE' and old.conductor_id is distinct from new.conductor_id then
    perform public.recalcular_calificacion_conductor(old.conductor_id);
  end if;
  return new;
end;
$$;
revoke all on function public.trigger_recalcular_calificacion() from public, anon, authenticated;
drop trigger calificaciones_recalcular_promedio on public.calificaciones_traslado;
create trigger calificaciones_recalcular_promedio
  after insert or update or delete on public.calificaciones_traslado
  for each row execute function public.trigger_recalcular_calificacion();

-- Recalcular con las últimas 100 calificaciones reales de los últimos 6 meses.
-- Sin historial se conserva 5.0. No se inventan valoraciones ni certificaciones.
update public.conductores c
set calificacion_promedio = coalesce((
  select round(avg(ultimas.estrellas)::numeric, 2)
  from (
    select ct.estrellas from public.calificaciones_traslado ct
    where ct.conductor_id = c.id and ct.calificado_en >= now() - interval '6 months'
    order by ct.calificado_en desc limit 100
  ) ultimas
), 5.0);

create or replace function private.evaluar_elegibilidad_asignacion(
  p_traslado_id uuid,
  p_conductor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conductor record;
  v_traslado record;
  v_preferencias record;
  v_motivos text[] := array[]::text[];
  v_tipo_ruta text;
  v_nivel_conductor integer := 0;
  v_nivel_requerido integer := 1;
  v_es_nocturno boolean := false;
begin
  select c.* into v_conductor
  from public.conductores c
  where c.id = p_conductor_id;

  select t.*, v.tipo::text as vehiculo_tipo
    into v_traslado
  from public.traslados t
  join public.vehiculos v on v.id = t.vehiculo_id
  where t.id = p_traslado_id;

  if v_conductor.id is null then
    return jsonb_build_object('elegible', false, 'motivos', jsonb_build_array('conductor_no_encontrado'));
  end if;
  if v_traslado.id is null then
    return jsonb_build_object('elegible', false, 'motivos', jsonb_build_array('traslado_no_encontrado'));
  end if;

  select p.* into v_preferencias
  from public.preferencias_conductor p
  where p.conductor_id = p_conductor_id;

  if v_conductor.estado::text not in ('activo', 'modo_prueba_supervisada') then
    v_motivos := array_append(v_motivos, 'estado_conductor_no_operativo');
  end if;
  if coalesce(v_conductor.estado_expediente::text, '') <> 'aprobado' then
    v_motivos := array_append(v_motivos, 'expediente_no_aprobado');
  end if;
  if not coalesce(v_conductor.documentos_vigentes, false) then
    v_motivos := array_append(v_motivos, 'documentos_no_vigentes');
  end if;
  if coalesce(v_conductor.suspensiones_activas, 0) > 0 then
    v_motivos := array_append(v_motivos, 'suspension_activa');
  end if;
  if v_traslado.estado::text <> 'pendiente_de_conductor' or v_traslado.conductor_id is not null then
    v_motivos := array_append(v_motivos, 'traslado_no_disponible');
  end if;

  v_tipo_ruta := case
    when coalesce(v_traslado.tipo_ruta, 'local') = 'local'
      or lower(coalesce(v_traslado.origen_ciudad, '')) = lower(coalesce(v_traslado.destino_ciudad, ''))
      then 'intraurbana'
    when v_traslado.distancia_km is not null and v_traslado.distancia_km <= 100
      then 'interurbana_menos_100km'
    else 'interurbana_mas_100km'
  end;

  v_nivel_conductor := private.nivel_concer_orden(v_conductor.nivel_operativo_vigente);
  v_nivel_requerido := greatest(
    case v_traslado.vehiculo_tipo
      when 'coleccion' then 4
      when 'luxury' then 3
      when 'pick_up' then 2
      when 'van' then 2
      else 1
    end,
    case v_tipo_ruta
      when 'interurbana_mas_100km' then 3
      when 'interurbana_menos_100km' then 2
      else 1
    end
  );

  if v_nivel_conductor < v_nivel_requerido then
    v_motivos := array_append(v_motivos, 'nivel_concer_insuficiente');
  end if;
  if v_nivel_requerido >= 2 and coalesce(v_conductor.incidencias_graves_6m, 0) > 0 then
    v_motivos := array_append(v_motivos, 'incidencias_graves_6m');
  end if;
  if v_nivel_requerido >= 3 and coalesce(v_conductor.incidencias_graves_12m, 0) > 0 then
    v_motivos := array_append(v_motivos, 'incidencias_graves_12m');
  end if;
  -- Política 2026-10-29: las certificaciones históricas no limitan
  -- el nivel inicial máximo; permanecen como registros de capacitación.

  if coalesce(v_preferencias.modo_no_molestar, false) then
    v_motivos := array_append(v_motivos, 'conductor_no_disponible');
  end if;
  if v_tipo_ruta = 'intraurbana' and not coalesce(v_preferencias.Traslados_locales, true) then
    v_motivos := array_append(v_motivos, 'preferencia_no_locales');
  end if;
  if v_tipo_ruta <> 'intraurbana' and not coalesce(v_preferencias.Traslados_foraneos, true) then
    v_motivos := array_append(v_motivos, 'preferencia_no_foraneos');
  end if;

  if v_traslado.fecha_hora_programada is not null then
    v_es_nocturno := extract(hour from v_traslado.fecha_hora_programada at time zone 'America/Mexico_City') >= 22
      or extract(hour from v_traslado.fecha_hora_programada at time zone 'America/Mexico_City') < 6;
  end if;
  if v_es_nocturno and not coalesce(v_preferencias.Traslados_nocturnos, false) then
    v_motivos := array_append(v_motivos, 'preferencia_no_nocturnos');
  end if;

  if exists (
    select 1 from public.traslados ocupado
    where ocupado.conductor_id = p_conductor_id
      and ocupado.id <> p_traslado_id
      and ocupado.estado::text in (
        'conductor_asignado', 'conductor_en_camino_al_origen', 'conductor_en_punto_de_recoleccion',
        'verificacion_vehiculo_en_proceso', 'evidencia_inicial_en_proceso', 'evidencia_inicial_completada',
        'vehiculo_recibido', 'traslado_en_curso', 'incidencia_reportada', 'llegada_a_destino',
        'evidencia_final_en_proceso', 'evidencia_final_completada', 'entrega_confirmada',
        'pago_pendiente', 'pago_completado'
      )
  ) then
    v_motivos := array_append(v_motivos, 'conductor_con_traslado_activo');
  end if;

  return jsonb_build_object(
    'elegible', cardinality(v_motivos) = 0,
    'motivos', to_jsonb(v_motivos),
    'tipo_ruta', v_tipo_ruta,
    'nivel_conductor', v_nivel_conductor,
    'nivel_requerido', v_nivel_requerido
  );
end;
$$;

