-- RR-REAL-001: evidencia original y resolución excepcional separadas.
create schema if not exists private;
create table public.resoluciones_inventario_llaves (
  traslado_id uuid primary key references public.traslados(id),
  inicial text,
  final text,
  responsable uuid not null references auth.users(id),
  motivo text not null check (length(trim(motivo)) >= 10),
  resuelta_en timestamptz not null default now()
);
alter table public.resoluciones_inventario_llaves enable row level security;
revoke all on public.resoluciones_inventario_llaves from anon, authenticated;
grant select on public.resoluciones_inventario_llaves to authenticated;
create policy resolucion_visible on public.resoluciones_inventario_llaves
for select to authenticated using (public.es_admin() or exists (
  select 1 from public.traslados t join public.conductores c on c.id=t.conductor_id
  where t.id=traslado_id and c.auth_user_id=(select auth.uid())
));

create function public.resolver_inventario_llaves(p_traslado_id uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inicial text; v_final text;
begin
  if auth.uid() is null or not public.es_admin() then
    raise exception using errcode='42501', message='Solo administración autoriza la resolución de llaves.';
  end if;
  perform 1 from public.traslados where id=p_traslado_id for update;
  if not found then raise exception 'Traslado inexistente.'; end if;
  select llaves_recibidas into v_inicial from public.evidencia_inspecciones where traslado_id=p_traslado_id and tipo='inicial';
  select llaves_recibidas into v_final from public.evidencia_inspecciones where traslado_id=p_traslado_id and tipo='final';
  if v_inicial is null or v_final is null then raise exception 'Falta inventario inicial o final.'; end if;
  -- No se modifica ni elimina la inspección; la justificación es el documento de resolución.
  insert into public.resoluciones_inventario_llaves(traslado_id,inicial,final,responsable,motivo)
  values(p_traslado_id,v_inicial,v_final,auth.uid(),p_motivo);
end $$;
revoke all on function public.resolver_inventario_llaves(uuid,text) from public, anon;
grant execute on function public.resolver_inventario_llaves(uuid,text) to authenticated;

create function private.validar_llaves_entrega()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inicial text; v_final text;
begin
  if new.estado is not distinct from old.estado or new.estado::text not in
    ('entrega_confirmada','servicio_cerrado') then return new; end if;
  select llaves_recibidas into v_inicial from public.evidencia_inspecciones where traslado_id=new.id and tipo='inicial';
  select llaves_recibidas into v_final from public.evidencia_inspecciones where traslado_id=new.id and tipo='final';
  if v_inicial is null or v_final is null or v_inicial !~ '^[0-9]+$' or v_final !~ '^[0-9]+$' then
    raise exception 'Falta inventario válido de llaves inicial o final. Contacta a operación.';
  end if;
  if v_inicial::numeric <> v_final::numeric and not exists (
    select 1 from public.resoluciones_inventario_llaves r where r.traslado_id=new.id
    and r.inicial=v_inicial and r.final=v_final
  ) then
    raise exception 'Diferencia de llaves: origen %, destino %. Requiere justificación documentada y resolución de administración.', v_inicial,v_final;
  end if;
  return new;
end $$;
revoke all on function private.validar_llaves_entrega() from public;
create trigger validar_llaves_entrega before update of estado on public.traslados
for each row execute function private.validar_llaves_entrega();

-- Serializa capturas y cierre sobre el traslado. Una vez capturada la inspección final,
-- no se puede "corregir" el inventario para hacer desaparecer una discrepancia.
create function private.proteger_inventario_llaves()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  v_id := case when tg_op='DELETE' then old.traslado_id else new.traslado_id end;
  if tg_op='UPDATE' and (new.traslado_id,new.tipo) is distinct from (old.traslado_id,old.tipo) then
    raise exception 'No se puede reasignar una inspección.';
  end if;
  perform 1 from public.traslados where id=v_id for update;
  if tg_op in ('UPDATE','DELETE') and exists (
    select 1 from public.evidencia_inspecciones where traslado_id=v_id and tipo='final'
  ) then
    if tg_op='DELETE' then raise exception 'Conserva el inventario original; solicita resolución a administración.'; end if;
    if new.llaves_recibidas is distinct from old.llaves_recibidas then
      raise exception 'Conserva el inventario original; solicita resolución a administración.';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.proteger_inventario_llaves() from public;
create trigger proteger_inventario_llaves before insert or update or delete on public.evidencia_inspecciones
for each row execute function private.proteger_inventario_llaves();

-- RR-REAL-002: el ciclo se asegura en DB incluso si el cliente deja de ejecutar JS.
create function private.abrir_tracking_al_iniciar()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.conductor_id is not null and new.estado::text in
    ('conductor_en_camino_al_origen','traslado_en_curso') then
    insert into public.tracking_sesiones(traslado_id,conductor_id,metadata)
    values(new.id,new.conductor_id,'{"origen":"ciclo_traslado"}')
    on conflict(traslado_id) where estado='activa' do nothing;
  end if;
  return new;
end $$;
revoke all on function private.abrir_tracking_al_iniciar() from public;
create trigger abrir_tracking_al_iniciar after update of estado on public.traslados
for each row execute function private.abrir_tracking_al_iniciar();

-- También cubre INSERT legacy y lotes nativos. No crea puntos sintéticos.
create function private.actualizar_salud_desde_punto()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_estado text; v_conductor uuid; v_captura timestamptz;
begin
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
end $$;
revoke all on function private.actualizar_salud_desde_punto() from public;
create trigger actualizar_salud_desde_punto after insert on public.ubicaciones_traslado
for each row execute function private.actualizar_salud_desde_punto();

create or replace function public.evaluar_salud_tracking(p_traslado_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_sesion record;
  v_salud record;
  v_punto record;
  v_edad_min numeric;
begin
  if auth.uid() is null or not (public.es_admin() or exists (
    select 1 from public.traslados t join public.conductores c on c.id=t.conductor_id
    where t.id=p_traslado_id and c.auth_user_id=auth.uid()
  ) or exists (
    select 1 from public.traslados t join public.usuarios u on u.id=t.usuario_id
    where t.id=p_traslado_id and u.auth_user_id=auth.uid()
  )) then raise exception using errcode='42501', message='Sin acceso al tracking.'; end if;
  select * into v_sesion from public.tracking_sesiones
  where traslado_id = p_traslado_id and estado = 'activa'
  order by creado_en desc
  limit 1;

  if v_sesion.id is null then
    return jsonb_build_object('estado', 'OFFLINE', 'motivo', 'Sin sesión de tracking',
      'detenido', false, 'ultimo_envio_en', null, 'sesion_id', null);
  end if;

  select * into v_salud from public.tracking_salud_traslado
  where traslado_id = p_traslado_id;

  if v_salud.ultimo_envio_en is null then
    return jsonb_build_object('estado', 'OFFLINE', 'motivo', 'Sin señal',
      'detenido', false, 'ultimo_envio_en', null, 'sesion_id', v_sesion.id);
  end if;

  v_edad_min := extract(epoch from (now() - least(v_salud.ultimo_envio_en, coalesce(v_salud.ultima_ubicacion_en, v_salud.ultimo_envio_en)))) / 60.0;

  if v_edad_min > 15 then
    return jsonb_build_object('estado', 'OFFLINE', 'motivo', 'Sin señal hace ' || round(v_edad_min)::text || ' min',
      'detenido', false, 'ultimo_envio_en', v_salud.ultimo_envio_en, 'sesion_id', v_sesion.id);
  end if;

  if v_edad_min > 2 then
    return jsonb_build_object('estado', 'STALE', 'motivo', 'Señal intermitente',
      'detenido', false, 'ultimo_envio_en', v_salud.ultimo_envio_en, 'sesion_id', v_sesion.id);
  end if;

  select velocidad_mps, bateria_pct into v_punto
  from public.ubicaciones_traslado
  where id = v_salud.ultimo_punto_id;

  if v_salud.precision_m is not null and v_salud.precision_m > 100 then
    return jsonb_build_object('estado', 'DEGRADED', 'motivo', 'GPS impreciso',
      'detenido', coalesce(v_punto.velocidad_mps, 99) < 0.5,
      'ultimo_envio_en', v_salud.ultimo_envio_en, 'sesion_id', v_sesion.id);
  end if;

  if v_punto.bateria_pct is not null and v_punto.bateria_pct < 20 then
    return jsonb_build_object('estado', 'DEGRADED', 'motivo', 'Batería baja del dispositivo',
      'detenido', coalesce(v_punto.velocidad_mps, 99) < 0.5,
      'ultimo_envio_en', v_salud.ultimo_envio_en, 'sesion_id', v_sesion.id);
  end if;

  return jsonb_build_object('estado', 'HEALTHY', 'motivo',
    case when coalesce(v_punto.velocidad_mps, 99) < 0.5 then 'Vehículo detenido' else 'Transmitiendo' end,
    'detenido', coalesce(v_punto.velocidad_mps, 99) < 0.5,
    'ultimo_envio_en', v_salud.ultimo_envio_en, 'sesion_id', v_sesion.id);
end;
$$;


revoke all on function public.evaluar_salud_tracking(uuid) from public;
grant execute on function public.evaluar_salud_tracking(uuid) to authenticated;

-- Sprint CLOSE P1: respuesta parcial explícita para telemetría por lote.
create or replace function public.registrar_telemetria_lote(p_traslado_id uuid, p_puntos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_conductor_id uuid; v_estado text; v_punto jsonb; v_id uuid; v_device_ts timestamptz; v_local_id uuid;
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
  and t.estado::text not in ('servicio_cerrado','servicio_cancelado','traslado_fallido') for update of t;
  if v_conductor_id is null then raise exception using errcode='42501', message='El conductor no está autorizado para registrar este traslado'; end if;

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
        insert into public.tracking_salud_traslado(traslado_id,conductor_id,ultimo_punto_id,ultima_ubicacion_en,ultimo_envio_en,fuente,online,precision_m,actualizado_en)
        values(p_traslado_id,v_conductor_id,v_id,v_device_ts,now(),v_fuente,v_online,v_precision,now()) on conflict(traslado_id) do update set conductor_id=excluded.conductor_id,ultimo_punto_id=excluded.ultimo_punto_id,ultima_ubicacion_en=excluded.ultima_ubicacion_en,ultimo_envio_en=excluded.ultimo_envio_en,fuente=excluded.fuente,online=excluded.online,precision_m=excluded.precision_m,actualizado_en=now() where tracking_salud_traslado.ultima_ubicacion_en is null or tracking_salud_traslado.ultima_ubicacion_en <= excluded.ultima_ubicacion_en;
      end if; v_id:=null;
    exception when others then
      v_rechazados:=v_rechazados+1; v_rechazados_perm:=v_rechazados_perm||jsonb_build_array(jsonb_build_object('localId',v_punto->>'localId','razon','payload_invalido')); v_id:=null;
    end;
  end loop;
  return jsonb_build_object('insertados',v_insertados,'duplicados',v_duplicados,'rechazados',v_rechazados,'recibidos',jsonb_array_length(p_puntos),'aceptados',v_aceptados,'duplicadosIds',v_duplicados_ids,'rechazadosPermanentes',v_rechazados_perm);
end $$;
revoke all on function public.registrar_telemetria_lote(uuid,jsonb) from public;
grant execute on function public.registrar_telemetria_lote(uuid,jsonb) to authenticated;

-- Reintentar inicio no puede reabrir un servicio terminado.
create or replace function public.iniciar_sesion_tracking(p_traslado_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
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
  insert into public.tracking_sesiones(traslado_id,conductor_id,metadata)
  values(p_traslado_id,v_conductor,'{"origen":"inicio_explicito"}')
  on conflict(traslado_id) where estado='activa' do nothing;
  select id into v_sesion from public.tracking_sesiones where traslado_id=p_traslado_id and estado='activa';
  return v_sesion;
end $$;
revoke all on function public.iniciar_sesion_tracking(uuid) from public, anon;
grant execute on function public.iniciar_sesion_tracking(uuid) to authenticated;
