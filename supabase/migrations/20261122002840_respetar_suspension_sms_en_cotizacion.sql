-- La API aplica la política de SMS antes de invocar esta RPC de service_role.
create or replace function public.servidor_cotizar_traslado_individual(
  p_auth_user_id uuid,
  p_vehiculo_id uuid,
  p_vehiculo jsonb,
  p_traslado jsonb,
  p_paradas jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid;
  v_categoria public.categoria_tarifa_vehiculo;
  v_gama public.gama_vehiculo;
  v_condicion public.condicion_vehiculo;
  v_guardado jsonb;
  v_marca text;
  v_modelo text;
  v_distancia numeric := (p_traslado->>'distancia_km')::numeric;
  v_horas numeric := (p_traslado->>'tiempo_estimado_horas')::numeric;
  v_momento timestamptz := coalesce(nullif(p_traslado->>'fecha_hora_programada', '')::timestamptz, statement_timestamp());
  v_id uuid := gen_random_uuid();
  v_expira timestamptz := statement_timestamp() + interval '15 minutes';
  v_tarifa numeric;
  v_cargo_parada numeric;
  v_inputs jsonb;
  v_snapshot jsonb;
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Acceso denegado'; end if;
  select id into v_usuario_id from public.usuarios
    where auth_user_id = p_auth_user_id and estado_verificacion = 'verificado';
  if v_usuario_id is null then raise exception 'Usuario no encontrado o no verificado'; end if;
  if v_distancia is null or v_distancia not between 0.01 and 20000
     or v_horas is null or v_horas not between 0.01 and 720 then raise exception 'Ruta inválida'; end if;
  if jsonb_typeof(p_traslado) is distinct from 'object'
     or jsonb_typeof(p_paradas) is distinct from 'array' then raise exception 'Solicitud inválida'; end if;
  if jsonb_array_length(p_paradas) > 8 then raise exception 'Máximo 8 escalas/tareas'; end if;
  if (p_traslado->>'origen_lat')::numeric not between -90 and 90
     or (p_traslado->>'destino_lat')::numeric not between -90 and 90
     or (p_traslado->>'origen_lng')::numeric not between -180 and 180
     or (p_traslado->>'destino_lng')::numeric not between -180 and 180
     or p_traslado->>'origen_lat' is null or p_traslado->>'destino_lat' is null
     or p_traslado->>'origen_lng' is null or p_traslado->>'destino_lng' is null then
    raise exception 'Coordenadas de ruta inválidas';
  end if;
  if p_traslado->>'modalidad_programacion' is null or p_traslado->>'modalidad_programacion' not in ('programado','lo_antes_posible')
     or (p_traslado->>'modalidad_programacion'='lo_antes_posible' and nullif(p_traslado->>'fecha_hora_programada','') is not null) then
    raise exception 'Modalidad de programación inválida';
  end if;
  if p_traslado->>'modalidad_programacion' = 'programado' and
     (nullif(p_traslado->>'fecha_hora_programada', '') is null or v_momento < statement_timestamp() + interval '2 hours') then
    raise exception 'La fecha no cumple con la anticipación mínima de 2 horas';
  end if;

  if p_vehiculo_id is not null then
    -- Vehículo guardado: la condición vigente es la registrada (la cambia Torre de Control).
    select to_jsonb(v), v.marca, v.modelo, v.categoria_tarifa, v.gama, coalesce(v.condicion, 'seminueva')
      into v_guardado, v_marca, v_modelo, v_categoria, v_gama, v_condicion
      from public.vehiculos v where v.id = p_vehiculo_id and v.usuario_id = v_usuario_id;
    if v_guardado is null then raise exception 'El vehículo no existe o no pertenece al usuario'; end if;
  else
    if jsonb_typeof(p_vehiculo) is distinct from 'object' then raise exception 'Vehículo requerido'; end if;
    v_marca := p_vehiculo->>'marca';
    v_modelo := p_vehiculo->>'modelo';
    -- La condición declarada no abarata el servicio: solo rescate mecánico
    -- (que encarece y cambia requisitos) se respeta; el resto es 'seminueva'.
    v_condicion := case when p_vehiculo->>'condicion' = 'rescate_mecanico'
      then 'rescate_mecanico'::public.condicion_vehiculo else 'seminueva'::public.condicion_vehiculo end;
  end if;
  if v_categoria is null or v_gama is null then
    select categoria_tarifa, gama into v_categoria, v_gama
      from public.catalogar_vehiculo_para_tarifa(v_marca, v_modelo);
  end if;
  if v_categoria is null or v_gama is null then raise exception 'El vehículo requiere clasificación antes de cotizar'; end if;

  v_tarifa := public.calcular_tarifa_traslado(v_categoria, public.rango_desde_distancia(v_distancia),
    v_gama, v_condicion, public.horario_desde_timestamp(v_momento), public.dia_desde_timestamp(v_momento), v_distancia, v_horas);
  if v_tarifa is null or v_tarifa <= 0 or v_tarifa = 'NaN'::numeric then raise exception 'Configuración tarifaria inválida'; end if;
  select coalesce(cargo_por_parada, 0) into v_cargo_parada from public.tarifas_config where id = true;
  v_tarifa := round(v_tarifa + jsonb_array_length(p_paradas) * coalesce(v_cargo_parada, 0), 2);

  v_inputs := jsonb_build_object('categoria', v_categoria, 'gama', v_gama, 'condicion', v_condicion,
    'distanciaKm', v_distancia, 'tiempoEstimadoHoras', v_horas, 'paradasCount', jsonb_array_length(p_paradas),
    'cargoPorParada', coalesce(v_cargo_parada, 0),
    'modalidad', p_traslado->>'modalidad_programacion', 'fechaProgramada', p_traslado->>'fecha_hora_programada');
  v_snapshot := jsonb_build_object('version', '2.2', 'nonce', v_id, 'monto', v_tarifa,
    'inputs', v_inputs, 'timestamp', statement_timestamp(), 'expiraEn', v_expira,
    'hash', encode(sha256(convert_to(jsonb_build_object('vehiculo_id', p_vehiculo_id, 'vehiculo', p_vehiculo,
      'traslado', p_traslado - 'snapshot_tarifa', 'paradas', p_paradas)::text, 'UTF8')), 'hex'));
  insert into private.cotizaciones_individuales(id, usuario_id, vehiculo_id, vehiculo, vehiculo_guardado, traslado, paradas, snapshot, expira_en)
    values(v_id, v_usuario_id, p_vehiculo_id, p_vehiculo, v_guardado, p_traslado - 'snapshot_tarifa', p_paradas, v_snapshot, v_expira);
  return v_snapshot;
end;
$$;
revoke all on function public.servidor_cotizar_traslado_individual(uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.servidor_cotizar_traslado_individual(uuid, uuid, jsonb, jsonb, jsonb) to service_role;
