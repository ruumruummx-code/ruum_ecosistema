-- Closed operations never regain GPS collection, including post-close disputes.
-- Serialize collection and closure on the same transfer row before touching sessions.
create or replace function private.exigir_tracking_abierto(p_traslado_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.traslados%rowtype;
begin
  select * into t from public.traslados where id=p_traslado_id for update;
  if not found then raise exception using errcode='23503',message='Traslado no encontrado.'; end if;
  if current_setting('role',true) in ('anon','authenticated') and (auth.uid() is null or not (public.es_admin() or exists(select 1 from public.conductores c where c.id=t.conductor_id and c.auth_user_id=auth.uid()))) then
    raise exception using errcode='42501',message='Sin autorización para registrar tracking.';
  end if;
  if t.cerrado_en is not null or t.estado_operativo::text in ('closed','cancelled','failed')
    or t.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido',
      'cierre_operativo_con_incidencia_abierta','disputa_resuelta','reclamo_resuelto') then
    raise exception using errcode='55000',message='TRASLADO_OPERATIVAMENTE_CERRADO';
  end if;
end $$;
revoke all on function private.exigir_tracking_abierto(uuid) from public,anon,authenticated;

create or replace function private.proteger_tracking_terminal()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name='ubicaciones_traslado' then
    begin
      perform private.exigir_tracking_abierto(new.traslado_id);
    exception when object_not_in_prerequisite_state then
      if new.dispositivo_timestamp is null or not exists(select 1 from public.traslados where id=new.traslado_id and cerrado_en is not null and new.dispositivo_timestamp <= cerrado_en) then raise; end if;
      new.fuente := left('archivo_offline:' || coalesce(new.fuente,''),64);
    end;
  elsif new.estado='activa' then
    perform private.exigir_tracking_abierto(new.traslado_id);
  end if;
  return new;
end $$;
revoke all on function private.proteger_tracking_terminal() from public,anon,authenticated;
create trigger proteger_ubicacion_terminal before insert or update on public.ubicaciones_traslado
for each row execute function private.proteger_tracking_terminal();
create trigger proteger_sesion_terminal before insert or update on public.tracking_sesiones
for each row execute function private.proteger_tracking_terminal();

CREATE OR REPLACE FUNCTION public.iniciar_sesion_tracking(p_traslado_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_conductor uuid; v_estado text; v_sesion uuid;
begin
  select conductor_id,estado::text into v_conductor,v_estado from public.traslados
  where id=p_traslado_id for update;
  if v_conductor is null or v_estado in ('servicio_cerrado','servicio_cancelado','traslado_fallido') then
    raise exception 'No se puede iniciar tracking en un traslado terminado o sin conductor.';
  end if;
  if auth.uid() is null or not (public.es_admin() or exists (
    select 1 from public.conductores where id=v_conductor and auth_user_id=auth.uid()
  )) then raise exception using errcode='42501', message='Sin autorización para iniciar tracking.'; end if;
  perform private.exigir_tracking_abierto(p_traslado_id);
  insert into public.tracking_sesiones(traslado_id,conductor_id,metadata)
  values(p_traslado_id,v_conductor,'{"origen":"inicio_explicito"}')
  on conflict(traslado_id) where estado='activa' do nothing;
  select id into v_sesion from public.tracking_sesiones where traslado_id=p_traslado_id and estado='activa';
  return v_sesion;
end $function$
;

CREATE OR REPLACE FUNCTION public.registrar_heartbeat_tracking(p_traslado_id uuid, p_lat numeric, p_lng numeric, p_precision_m numeric DEFAULT NULL::numeric, p_velocidad_mps numeric DEFAULT NULL::numeric, p_bateria_pct integer DEFAULT NULL::integer, p_online boolean DEFAULT true, p_plataforma text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_conductor_id uuid;
  v_estado text;
  v_punto uuid;
  v_sesion uuid;
  v_dest_lat numeric;
  v_dest_lng numeric;
  v_prev_dist numeric;
  v_dist numeric;
begin
  if p_lat is null or p_lat not between -90 and 90
     or p_lng is null or p_lng not between -180 and 180 then
    raise exception 'Coordenadas inválidas.';
  end if;
  if p_precision_m is not null and (p_precision_m < 0 or p_precision_m > 10000) then
    raise exception 'Precisión inválida.';
  end if;
  if p_velocidad_mps is not null and (p_velocidad_mps < 0 or p_velocidad_mps > 120) then
    raise exception 'Velocidad inválida.';
  end if;
  if p_bateria_pct is not null and (p_bateria_pct < 0 or p_bateria_pct > 100) then
    raise exception 'Batería inválida.';
  end if;

  select t.conductor_id, t.estado::text, t.destino_lat, t.destino_lng
    into v_conductor_id, v_estado, v_dest_lat, v_dest_lng
  from public.traslados t
  join public.conductores c on c.id = t.conductor_id
  where t.id = p_traslado_id
    and c.auth_user_id = auth.uid()
    and t.estado::text not in ('servicio_cerrado', 'servicio_cancelado', 'traslado_fallido') for update of t;

  if v_conductor_id is null then
    raise exception using errcode='42501', message='El conductor no está autorizado para registrar este traslado';
  end if;

  perform private.exigir_tracking_abierto(p_traslado_id);

  perform pg_advisory_xact_lock(hashtext('tracking:' || p_traslado_id::text));

  insert into public.ubicaciones_traslado (
    traslado_id, conductor_id, lat, lng, precision_m, velocidad_mps,
    bateria_pct, online, fuente, registrado_en
  ) values (
    p_traslado_id, v_conductor_id, p_lat, p_lng, p_precision_m, p_velocidad_mps,
    p_bateria_pct, coalesce(p_online, true), 'heartbeat', now()
  )
  returning id into v_punto;

  insert into public.tracking_salud_traslado (
    traslado_id, conductor_id, ultimo_punto_id, ultima_ubicacion_en,
    ultimo_envio_en, fuente, online, precision_m, actualizado_en
  ) values (
    p_traslado_id, v_conductor_id, v_punto, now(), now(),
    'heartbeat', coalesce(p_online, true), p_precision_m, now()
  )
  on conflict (traslado_id) do update set
    conductor_id = excluded.conductor_id,
    ultimo_punto_id = excluded.ultimo_punto_id,
    ultima_ubicacion_en = excluded.ultima_ubicacion_en,
    ultimo_envio_en = excluded.ultimo_envio_en,
    fuente = excluded.fuente,
    online = excluded.online,
    precision_m = excluded.precision_m,
    actualizado_en = now();

  -- 10.10 v1 — heurística de alejamiento (la polilínea completa es futura)
  if v_dest_lat is not null and v_dest_lng is not null then
    v_dist := 111.32 * sqrt(
      power((p_lat - v_dest_lat) * cos(radians((p_lat + v_dest_lat) / 2)), 2)
      + power(p_lng - v_dest_lng, 2)
    );
  end if;

  select ultima_distancia_destino_km into v_prev_dist
  from public.tracking_sesiones
  where traslado_id = p_traslado_id and estado = 'activa';

  insert into public.tracking_sesiones (traslado_id, conductor_id, estado, ultimo_heartbeat_en, ultima_lat, ultima_lng, ultima_precision_m, ultima_velocidad_mps, ultima_bateria_pct, ultima_distancia_destino_km, desviacion_sospechosa, plataforma, metadata)
  values (p_traslado_id, v_conductor_id, 'activa', now(), p_lat, p_lng, p_precision_m, p_velocidad_mps, p_bateria_pct, v_dist,
    coalesce(v_prev_dist is not null and v_dist is not null and v_dist > v_prev_dist + 0.5 and coalesce(p_velocidad_mps, 0) > 2, false),
    left(coalesce(p_plataforma, ''), 32),
    jsonb_build_object('origen', 'heartbeat_auto'))
  on conflict (traslado_id) where estado = 'activa' do update set
    ultimo_heartbeat_en = now(),
    ultima_lat = excluded.ultima_lat,
    ultima_lng = excluded.ultima_lng,
    ultima_precision_m = excluded.ultima_precision_m,
    ultima_velocidad_mps = excluded.ultima_velocidad_mps,
    ultima_bateria_pct = excluded.ultima_bateria_pct,
    ultima_distancia_destino_km = excluded.ultima_distancia_destino_km,
    desviacion_sospechosa = tracking_sesiones.desviacion_sospechosa or excluded.desviacion_sospechosa,
    plataforma = coalesce(nullif(excluded.plataforma, ''), tracking_sesiones.plataforma)
  returning id into v_sesion;

  -- si la fila ya existía, on conflict no retorna: leerla
  if v_sesion is null then
    select id into v_sesion from public.tracking_sesiones
    where traslado_id = p_traslado_id and estado = 'activa';
  end if;

  return jsonb_build_object(
    'sesion_id', v_sesion,
    'punto_id', v_punto,
    'salud', public.evaluar_salud_tracking(p_traslado_id)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_telemetria_lote(p_traslado_id uuid, p_puntos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conductor_id uuid; v_estado text; v_terminal boolean := false; v_cierre timestamptz; v_punto jsonb; v_id uuid; v_device_ts timestamptz; v_local_id uuid;
  v_lat numeric; v_lng numeric; v_precision numeric; v_velocidad numeric; v_direccion numeric; v_altitud numeric;
  v_bateria integer; v_online boolean; v_fuente text; v_estado_punto text;
  v_aceptados jsonb := '[]'::jsonb; v_duplicados_ids jsonb := '[]'::jsonb; v_rechazados_perm jsonb := '[]'::jsonb;
  v_insertados int := 0; v_duplicados int := 0; v_rechazados int := 0; v_razon text;
begin
  if jsonb_typeof(p_puntos) <> 'array' or jsonb_array_length(p_puntos) not between 1 and 100 then
    raise exception using errcode='22023', message='El lote debe contener entre 1 y 100 puntos';
  end if;
  select t.conductor_id,t.estado::text into v_conductor_id,v_estado from public.traslados t
  join public.conductores c on c.id=t.conductor_id where t.id=p_traslado_id and c.auth_user_id=auth.uid()
  for update of t;
  if v_conductor_id is null then raise exception using errcode='42501', message='El conductor no está autorizado para registrar este traslado'; end if;

  -- Closed transfers accept only captures made before their original closure.
  -- Those points are archived without touching session or live health.
  begin
    perform private.exigir_tracking_abierto(p_traslado_id);
  exception when object_not_in_prerequisite_state then
    v_terminal:=true;
    select cerrado_en into v_cierre from public.traslados where id=p_traslado_id;
  end;

  for v_punto in select value from jsonb_array_elements(p_puntos) loop
    v_razon := null;
    begin
      v_local_id := nullif(v_punto->>'localId','')::uuid; v_lat := (v_punto->>'lat')::numeric; v_lng := (v_punto->>'lng')::numeric;
      v_precision := nullif(v_punto->>'precisionM','')::numeric; v_velocidad := nullif(v_punto->>'velocidadMps','')::numeric;
      v_direccion := nullif(v_punto->>'direccionGrados','')::numeric; v_altitud := nullif(v_punto->>'altitudM','')::numeric;
      v_bateria := nullif(v_punto->>'bateriaPct','')::integer; v_online := nullif(v_punto->>'online','')::boolean;
      v_device_ts := (v_punto->>'deviceTimestamp')::timestamptz; v_fuente := left(coalesce(nullif(v_punto->>'fuente',''),'android_foreground_service'),64);
      v_estado_punto := left(coalesce(nullif(v_punto->>'estadoViaje',''),v_estado),64);
      if v_local_id is null then v_razon:='local_id_invalido';
      elsif v_lat is null or v_lng is null or v_lat not between -90 and 90 or v_lng not between -180 and 180 then v_razon:='coordenadas_fuera_de_rango';
      elsif v_device_ts is null or v_device_ts < now()-interval '24 hours' or v_device_ts > now()+interval '10 minutes' then v_razon:='timestamp_fuera_de_rango';
      elsif v_terminal and (v_cierre is null or v_device_ts > v_cierre) then v_razon:='traslado_cerrado';
      elsif v_precision is not null and v_precision not between 0 and 10000 then v_razon:='precision_fuera_de_rango';
      elsif v_velocidad is not null and v_velocidad not between 0 and 120 then v_razon:='velocidad_fuera_de_rango';
      elsif v_direccion is not null and v_direccion not between 0 and 360 then v_razon:='direccion_fuera_de_rango';
      elsif v_bateria is not null and v_bateria not between 0 and 100 then v_razon:='bateria_fuera_de_rango'; end if;
      if v_razon is not null then
        v_rechazados:=v_rechazados+1; v_rechazados_perm:=v_rechazados_perm||jsonb_build_array(jsonb_build_object('localId',v_punto->>'localId','razon',v_razon)); continue;
      end if;
      insert into public.ubicaciones_traslado(traslado_id,conductor_id,local_id,lat,lng,precision_m,velocidad_mps,direccion_grados,altitud_m,dispositivo_timestamp,servidor_timestamp,estado_viaje,fuente,bateria_pct,online,registrado_en)
      values(p_traslado_id,v_conductor_id,v_local_id,v_lat,v_lng,v_precision,v_velocidad,v_direccion,v_altitud,v_device_ts,now(),v_estado_punto,v_fuente,v_bateria,v_online,now())
      on conflict(traslado_id,local_id) where local_id is not null do nothing returning id into v_id;
      if v_id is null then v_duplicados:=v_duplicados+1; v_duplicados_ids:=v_duplicados_ids||to_jsonb(v_local_id::text);
      else v_insertados:=v_insertados+1; v_aceptados:=v_aceptados||to_jsonb(v_local_id::text);
        if not v_terminal then
        insert into public.tracking_salud_traslado(traslado_id,conductor_id,ultimo_punto_id,ultima_ubicacion_en,ultimo_envio_en,fuente,online,precision_m,actualizado_en)
        values(p_traslado_id,v_conductor_id,v_id,v_device_ts,now(),v_fuente,v_online,v_precision,now()) on conflict(traslado_id) do update set conductor_id=excluded.conductor_id,ultimo_punto_id=excluded.ultimo_punto_id,ultima_ubicacion_en=excluded.ultima_ubicacion_en,ultimo_envio_en=excluded.ultimo_envio_en,fuente=excluded.fuente,online=excluded.online,precision_m=excluded.precision_m,actualizado_en=now() where tracking_salud_traslado.ultima_ubicacion_en is null or tracking_salud_traslado.ultima_ubicacion_en <= excluded.ultima_ubicacion_en;
        end if;
      end if; v_id:=null;
    exception when others then
      v_rechazados:=v_rechazados+1; v_rechazados_perm:=v_rechazados_perm||jsonb_build_array(jsonb_build_object('localId',v_punto->>'localId','razon','payload_invalido')); v_id:=null;
    end;
  end loop;
  return jsonb_build_object('insertados',v_insertados,'duplicados',v_duplicados,'rechazados',v_rechazados,'recibidos',jsonb_array_length(p_puntos),'aceptados',v_aceptados,'duplicadosIds',v_duplicados_ids,'rechazadosPermanentes',v_rechazados_perm);
end $function$
;

CREATE OR REPLACE FUNCTION private.actualizar_salud_desde_punto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_estado text; v_conductor uuid; v_captura timestamptz;
begin
  begin
    perform private.exigir_tracking_abierto(new.traslado_id);
  exception when object_not_in_prerequisite_state then
    return new; -- Historical offline point; never revive live tracking.
  end;
  select estado::text,conductor_id into v_estado,v_conductor from public.traslados where id=new.traslado_id for update;
  if v_conductor is distinct from new.conductor_id or v_estado in ('servicio_cerrado','servicio_cancelado','traslado_fallido') then
    raise exception 'Tracking no permitido para este traslado.';
  end if;
  v_captura := coalesce(new.dispositivo_timestamp,new.registrado_en);
  insert into public.tracking_sesiones(traslado_id,conductor_id,ultimo_heartbeat_en,ultima_lat,ultima_lng,plataforma)
  values(new.traslado_id,new.conductor_id,now(),new.lat,new.lng,new.fuente)
  on conflict(traslado_id) where estado='activa' do update set ultimo_heartbeat_en=now(),
    ultima_lat=excluded.ultima_lat,ultima_lng=excluded.ultima_lng,plataforma=excluded.plataforma;
  insert into public.tracking_salud_traslado(traslado_id,conductor_id,ultimo_punto_id,ultima_ubicacion_en,ultimo_envio_en,fuente,online,precision_m,actualizado_en)
  values(new.traslado_id,new.conductor_id,new.id,v_captura,now(),new.fuente,new.online,new.precision_m,now())
  on conflict(traslado_id) do update set ultimo_punto_id=excluded.ultimo_punto_id,
    ultima_ubicacion_en=excluded.ultima_ubicacion_en,ultimo_envio_en=excluded.ultimo_envio_en,
    fuente=excluded.fuente,online=excluded.online,precision_m=excluded.precision_m,actualizado_en=now()
  where tracking_salud_traslado.ultima_ubicacion_en is null or tracking_salud_traslado.ultima_ubicacion_en <= excluded.ultima_ubicacion_en;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION private.abrir_tracking_al_iniciar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.cerrado_en is null and new.estado_operativo::text not in ('closed','cancelled','failed')
    and new.conductor_id is not null and new.estado::text in
    ('conductor_en_camino_al_origen','traslado_en_curso') then
    insert into public.tracking_sesiones(traslado_id,conductor_id,metadata)
    values(new.id,new.conductor_id,'{"origen":"ciclo_traslado"}')
    on conflict(traslado_id) where estado='activa' do nothing;
  end if;
  return new;
end $function$
;

create or replace function public.cerrar_tracking_al_terminar()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.cerrado_en is not null or new.estado_operativo::text in ('closed','cancelled','failed')
    or new.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido',
      'cierre_operativo_con_incidencia_abierta','disputa_resuelta','reclamo_resuelto') then
    update public.tracking_sesiones set estado='cerrada', finalizada_en=clock_timestamp(),
      metadata=metadata||jsonb_build_object('cierre','operacion_terminal','estado',new.estado::text)
    where traslado_id=new.id and estado='activa';
  end if;
  return new;
end $$;
create or replace trigger traslados_cerrar_tracking after update of estado,estado_operativo,cerrado_en on public.traslados
for each row execute function public.cerrar_tracking_al_terminar();


-- Close invalid sessions, preserving their history and audit.
with candidatos as materialized (
  select s.id,s.traslado_id,s.estado,s.iniciada_en,t.cerrado_en,t.estado as estado_traslado
  from public.tracking_sesiones s join public.traslados t on t.id=s.traslado_id
  where s.estado='activa' and (t.cerrado_en is not null or t.estado_operativo::text in ('closed','cancelled','failed')
    or t.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido','disputa_resuelta','reclamo_resuelto','cierre_operativo_con_incidencia_abierta'))
), corregidos as (
  update public.tracking_sesiones s set estado='cerrada',finalizada_en=clock_timestamp(),
    metadata=metadata||jsonb_build_object('cierre','reparacion_tracking_post_cierre','reparado_en',clock_timestamp())
  from candidatos c where s.id=c.id returning s.id,s.traslado_id,s.finalizada_en
)
insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
select c.traslado_id,'modificacion_traslado_activo','sistema','00000000-0000-0000-0000-000000000000',
  jsonb_build_object('accion','cerrar_tracking_post_cierre','sesion_id',c.id,'antes',to_jsonb(o),'finalizada_en',c.finalizada_en)
from corregidos c join candidatos o on o.id=c.id;

