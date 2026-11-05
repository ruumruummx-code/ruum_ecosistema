-- Cotización individual: cálculo SQL único y autorización durable de un solo uso.
-- No se aceptan precios, distancias ni clasificaciones como autoridad desde el navegador.
create schema if not exists private;

create table private.cotizaciones_individuales (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id),
  vehiculo_id uuid references public.vehiculos(id),
  vehiculo jsonb,
  vehiculo_guardado jsonb,
  traslado jsonb not null,
  paradas jsonb not null,
  snapshot jsonb not null,
  expira_en timestamptz not null,
  traslado_id uuid unique references public.traslados(id)
);
alter table private.cotizaciones_individuales enable row level security;
revoke all on private.cotizaciones_individuales from public, anon, authenticated, service_role;
create index cotizaciones_individuales_usuario_expira_idx on private.cotizaciones_individuales(usuario_id, expira_en);
create index cotizaciones_individuales_vehiculo_idx on private.cotizaciones_individuales(vehiculo_id);

-- Únicamente la ruta autenticada de Next.js usa esta RPC con credenciales de servidor.
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
    select to_jsonb(v), v.marca, v.modelo, v.categoria_tarifa, v.gama, coalesce(v.condicion, 'seminueva')
      into v_guardado, v_marca, v_modelo, v_categoria, v_gama, v_condicion
      from public.vehiculos v where v.id = p_vehiculo_id and v.usuario_id = v_usuario_id;
    if v_guardado is null then raise exception 'El vehículo no existe o no pertenece al usuario'; end if;
  else
    if jsonb_typeof(p_vehiculo) is distinct from 'object' then raise exception 'Vehículo requerido'; end if;
    v_marca := p_vehiculo->>'marca';
    v_modelo := p_vehiculo->>'modelo';
    v_condicion := coalesce(nullif(p_vehiculo->>'condicion','')::public.condicion_vehiculo, 'seminueva');
  end if;
  if v_categoria is null or v_gama is null then
    select categoria_tarifa, gama into v_categoria, v_gama
      from public.catalogar_vehiculo_para_tarifa(v_marca, v_modelo);
  end if;
  if v_categoria is null or v_gama is null then raise exception 'El vehículo requiere clasificación antes de cotizar'; end if;

  v_tarifa := public.calcular_tarifa_traslado(v_categoria, public.rango_desde_distancia(v_distancia),
    v_gama, v_condicion, public.horario_desde_timestamp(v_momento), public.dia_desde_timestamp(v_momento), v_distancia, v_horas);
  if v_tarifa is null or v_tarifa <= 0 or v_tarifa = 'NaN'::numeric then raise exception 'Configuración tarifaria inválida'; end if;
  v_inputs := jsonb_build_object('categoria', v_categoria, 'gama', v_gama, 'condicion', v_condicion,
    'distanciaKm', v_distancia, 'tiempoEstimadoHoras', v_horas, 'paradasCount', jsonb_array_length(p_paradas),
    'modalidad', p_traslado->>'modalidad_programacion', 'fechaProgramada', p_traslado->>'fecha_hora_programada');
  -- El nonce impredecible identifica evidencia inmutable en private; el hash es solo trazabilidad.
  -- La autorización no depende de una firma o un secreto compartido con el navegador.
  v_snapshot := jsonb_build_object('version', '2.1', 'nonce', v_id, 'monto', v_tarifa,
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
set search_path = public, pg_temp
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
  v_cotizacion private.cotizaciones_individuales%rowtype;
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

  -- El bloqueo de cotización serializa consumos incluso con distintas claves idempotentes.
  select * into v_cotizacion from private.cotizaciones_individuales
    where id = nullif(v_snapshot_tarifa->>'nonce', '')::uuid and usuario_id = v_usuario_id for update;
  if not found then raise exception 'Cotización no emitida por el servidor para este usuario'; end if;
  if v_cotizacion.traslado_id is not null then raise exception 'Cotización ya utilizada'; end if;
  if v_cotizacion.expira_en <= clock_timestamp() then raise exception 'La cotización del traslado ha expirado'; end if;
  if v_snapshot_tarifa is distinct from v_cotizacion.snapshot
     or p_vehiculo_id is distinct from v_cotizacion.vehiculo_id
     or p_vehiculo is distinct from v_cotizacion.vehiculo
     or (p_traslado - 'snapshot_tarifa') is distinct from v_cotizacion.traslado
     or v_paradas is distinct from v_cotizacion.paradas then
    raise exception 'La solicitud cambió después de cotizar. Cotiza nuevamente';
  end if;
  if p_vehiculo_id is not null and v_cotizacion.vehiculo_guardado is distinct from (
    select to_jsonb(v) from public.vehiculos v where v.id = p_vehiculo_id and v.usuario_id = v_usuario_id
  ) then raise exception 'El vehículo cambió después de cotizar. Cotiza nuevamente'; end if;

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

  -- Usar exclusivamente los valores emitidos y protegidos en la base de datos.
  v_distancia_km := (v_cotizacion.snapshot->'inputs'->>'distanciaKm')::numeric;
  v_tiempo_estimado_horas := (v_cotizacion.snapshot->'inputs'->>'tiempoEstimadoHoras')::numeric;
  v_precio_cotizado := (v_cotizacion.snapshot->>'monto')::numeric;

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

  update private.cotizaciones_individuales set traslado_id = v_traslado_id where id = v_cotizacion.id;

  return jsonb_build_object('id', v_traslado_id, 'tipo_pago', v_tipo_pago, 'precio_cotizado', v_precio_cotizado);
end;
$$;

revoke all on function public.usuario_crea_traslado(uuid, jsonb, jsonb, uuid, jsonb) from public;
grant execute on function public.usuario_crea_traslado(uuid, jsonb, jsonb, uuid, jsonb) to authenticated;

-- Cerrar la firma antigua: omitir p_paradas no puede eludir la cotización.
revoke all on function public.usuario_crea_traslado(uuid, jsonb, jsonb, uuid) from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';
