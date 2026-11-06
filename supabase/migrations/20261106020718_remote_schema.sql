SET local check_function_bodies = off;

ALTER TABLE "private"."cotizaciones_individuales"
  DROP CONSTRAINT "cotizaciones_individuales_traslado_id_fkey";

ALTER TABLE "private"."cotizaciones_individuales"
  DROP CONSTRAINT "cotizaciones_individuales_usuario_id_fkey";

ALTER TABLE "private"."cotizaciones_individuales"
  DROP CONSTRAINT "cotizaciones_individuales_vehiculo_id_fkey";

DROP FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text);

DROP FUNCTION "public"."servidor_cotizar_traslado_individual"(uuid, uuid, jsonb, jsonb, jsonb);

DROP TABLE "private"."cotizaciones_individuales";

CREATE OR REPLACE FUNCTION public.conductor_avanza_traslado (
  p_traslado_id uuid,
  p_evento      text
)
  RETURNS public.estado_traslado
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_conductor_id uuid;
  v_estado_actual public.estado_traslado;
  v_estado_siguiente public.estado_traslado;
  v_evento_auditoria public.evento_auditable;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception 'Solo un conductor autenticado puede avanzar el traslado.';
  end if;

  select estado into v_estado_actual
  from public.traslados
  where id = p_traslado_id
    and conductor_id = v_conductor_id
  for update;

  if v_estado_actual is null then
    raise exception 'El traslado no existe o no está asignado al conductor autenticado.';
  end if;

  case p_evento
    when 'conductor_en_camino' then
      if v_estado_actual <> 'conductor_asignado' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'conductor_en_camino_al_origen';
      v_evento_auditoria := 'modificacion_traslado_activo';

    when 'llegada_origen' then
      if v_estado_actual <> 'conductor_en_camino_al_origen' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'conductor_en_punto_de_recoleccion';
      v_evento_auditoria := 'llegada_conductor_origen';

    when 'iniciar_verificacion' then
      if v_estado_actual <> 'conductor_en_punto_de_recoleccion' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'verificacion_vehiculo_en_proceso';
      v_evento_auditoria := 'modificacion_traslado_activo';

    when 'iniciar_evidencia_inicial' then
      if v_estado_actual <> 'verificacion_vehiculo_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede iniciar la captura de evidencia: se requiere verificación REPUVE con resultado limpio y coincidencia de VIN/placas (o autorización de soporte).';
      end if;
      v_estado_siguiente := 'evidencia_inicial_en_proceso';
      v_evento_auditoria := 'captura_evidencia_inicial';

    when 'evidencia_inicial_completada' then
      if v_estado_actual <> 'evidencia_inicial_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede completar evidencia inicial sin verificación REPUVE válida.';
      end if;
      if not public.traslado_tiene_metodo_pago_registrado(p_traslado_id) then
        raise exception 'No se puede completar evidencia inicial: falta pago anticipado completado o método de pago al cierre.';
      end if;
      if (
        select count(distinct angulo)
        from public.evidencia_fotos
        where traslado_id = p_traslado_id
          and tipo = 'inicial'
          and sincronizada = true
          and angulo in ('frente', 'lado_piloto', 'lado_copiloto', 'trasera', 'tablero')
      ) < 5 then
        raise exception 'Evidencia inicial incompleta.';
      end if;
      v_estado_siguiente := 'evidencia_inicial_completada';
      v_evento_auditoria := 'captura_evidencia_inicial';

    when 'vehiculo_recibido' then
      if v_estado_actual <> 'evidencia_inicial_completada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede confirmar la recepción del vehículo sin verificación REPUVE válida o autorización de soporte.';
      end if;
      v_estado_siguiente := 'vehiculo_recibido';
      v_evento_auditoria := 'confirmacion_vehiculo_recibido';

    when 'iniciar_traslado' then
      if v_estado_actual <> 'vehiculo_recibido' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'traslado_en_curso';
      v_evento_auditoria := 'inicio_traslado';

    when 'llegada_destino' then
      if v_estado_actual <> 'traslado_en_curso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'llegada_a_destino';
      v_evento_auditoria := 'llegada_destino';

    when 'iniciar_evidencia_final' then
      if v_estado_actual <> 'llegada_a_destino' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'evidencia_final_en_proceso';
      v_evento_auditoria := 'captura_evidencia_final';

    when 'evidencia_final_completada' then
      if v_estado_actual <> 'evidencia_final_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if (
        select count(distinct angulo)
        from public.evidencia_fotos
        where traslado_id = p_traslado_id
          and tipo = 'final'
          and sincronizada = true
          and angulo in ('frente', 'lado_piloto', 'lado_copiloto', 'trasera', 'tablero')
      ) < 5 then
        raise exception 'Evidencia final incompleta.';
      end if;
      v_estado_siguiente := 'evidencia_final_completada';
      v_evento_auditoria := 'captura_evidencia_final';

    when 'confirmar_entrega' then
      if v_estado_actual <> 'evidencia_final_completada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'entrega_confirmada';
      v_evento_auditoria := 'confirmacion_entrega';

    when 'cerrar_viaje' then
      if v_estado_actual <> 'entrega_confirmada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      -- P1 H01: Exigir firma y recepción acreditada antes de cerrar el traslado
      if not exists (
        select 1 from public.custodia_eventos
        where traslado_id = p_traslado_id
          and (
            firma_metodo is not null
            or firma_referencia is not null
            or (metadata->>'mecanismo') = 'firma'
            or (metadata->>'firma_guardada')::boolean = true
            or (metadata->>'firma_referencia') is not null
          )
      ) and not exists (
        select 1 from public.confirmaciones_recepcion
        where traslado_id = p_traslado_id
          and (referencia is not null or mecanismo in ('firma', 'declaracion_conductor'))
      ) then
        raise exception 'No se puede cerrar el servicio sin un registro de firma o acuse de recepción persistido.';
      end if;
      v_estado_siguiente := 'servicio_cerrado';
      v_evento_auditoria := 'cierre_traslado';

    else
      raise exception 'Evento de conductor no soportado: %', p_evento;
  end case;

  update public.traslados
  set estado = v_estado_siguiente
  where id = p_traslado_id
    and conductor_id = v_conductor_id
    and estado = v_estado_actual;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    v_evento_auditoria,
    'conductor',
    v_conductor_id,
    jsonb_build_object(
      'evento_conductor', p_evento,
      'estado_anterior', v_estado_actual,
      'estado_nuevo', v_estado_siguiente
    )
  );

  return v_estado_siguiente;
end;
$function$;

CREATE OR REPLACE FUNCTION public.conductor_confirmar_llegada_destino (
  p_traslado_id         uuid,
  p_fuera_geocerca      boolean DEFAULT NULL::boolean,
  p_distancia_m         numeric DEFAULT NULL::numeric,
  p_precision_m         numeric DEFAULT NULL::numeric,
  p_antiguedad_s        integer DEFAULT NULL::integer,
  p_motivo_sin_medicion text    DEFAULT NULL::text
)
  RETURNS public.estado_traslado
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_conductor_id uuid;
  v_estado_actual public.estado_traslado;
  v_distancia_m numeric;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception 'Solo un conductor autenticado puede confirmar la llegada a destino.';
  end if;

  select estado into v_estado_actual
  from public.traslados
  where id = p_traslado_id
    and conductor_id = v_conductor_id
  for update;

  if v_estado_actual is null then
    raise exception 'El traslado no existe o no está asignado al conductor autenticado.';
  end if;

  if v_estado_actual = 'llegada_a_destino' then
    return v_estado_actual;
  end if;

  if v_estado_actual <> 'traslado_en_curso' then
    raise exception 'No se puede confirmar llegada a destino desde estado %', v_estado_actual;
  end if;

  if p_distancia_m is not null and p_distancia_m < 0 then
    raise exception 'La distancia de geocerca no puede ser negativa.';
  end if;

  v_distancia_m := case
    when p_distancia_m is null then null
    else round(p_distancia_m)
  end;

  update public.traslados
  set estado = 'llegada_a_destino'
  where id = p_traslado_id
    and conductor_id = v_conductor_id
    and estado = 'traslado_en_curso';

  if not found then
    raise exception 'No se pudo confirmar la llegada a destino. Intenta de nuevo.';
  end if;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    'llegada_destino',
    'conductor',
    v_conductor_id,
    jsonb_build_object(
      'accion', 'conductor_confirmar_llegada_destino',
      'estado_anterior', v_estado_actual,
      'estado_nuevo', 'llegada_a_destino',
      'transicion_atomica', true,
      'fuera_geocerca', p_fuera_geocerca,
      'distancia_m', v_distancia_m,
      'precision_m', p_precision_m,
      'antiguedad_s', p_antiguedad_s,
      'motivo_sin_medicion', p_motivo_sin_medicion,
      'medicion_valida', (v_distancia_m is not null and p_fuera_geocerca is not null and p_motivo_sin_medicion is null)
    )
  );

  return 'llegada_a_destino';
end;
$function$;

CREATE OR REPLACE FUNCTION public.conductor_guarda_datos_bancarios (
  p_titular_cuenta text,
  p_banco          text,
  p_clabe          text,
  p_numero_tarjeta text DEFAULT NULL::text,
  p_password       text DEFAULT NULL::text
)
  RETURNS public.datos_bancarios_conductor
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
  AS $function$
declare
  v_conductor_id uuid;
  v_encrypted_password text;
  v_claims_raw text;
  v_claims jsonb;
  v_pw_ts bigint;
  v_autenticado boolean := false;
  v_row public.datos_bancarios_conductor;
  v_clabe text := regexp_replace(coalesce(p_clabe, ''), '[^0-9]', '', 'g');
  v_tarjeta_raw text := regexp_replace(coalesce(p_numero_tarjeta, ''), '[^0-9*]', '', 'g');
  v_tarjeta_enmascarada text := null;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception using
      errcode = '42501',
      message = 'No se encontro el conductor autenticado.';
  end if;

  -- H11: Verificación estricta de contraseña en servidor ligada a la acción o a esta sesión activa
  -- 1. Si se proporciona contraseña en la acción: validación criptográfica directa contra auth.users
  if p_password is not null and length(trim(p_password)) > 0 then
    select encrypted_password into v_encrypted_password
    from auth.users
    where id = auth.uid();

    if v_encrypted_password is not null and extensions.crypt(p_password, v_encrypted_password) = v_encrypted_password then
      v_autenticado := true;
    else
      raise exception using
        errcode = '42501',
        message = 'Contraseña incorrecta. Se requiere validar tu contraseña actual para cambiar datos bancarios.';
    end if;
  end if;

  -- 2. Si no se pasó contraseña explícita, comprobar claims de ESTA sesión específica:
  -- NUNCA confiar en 'iat' (se renueva con refresh sin contraseña)
  -- NUNCA confiar en 'auth.users.last_sign_in_at' (se actualiza por logins en otros dispositivos/sesiones)
  if not v_autenticado then
    v_claims_raw := current_setting('request.jwt.claims', true);
    if v_claims_raw is not null and v_claims_raw <> '' then
      begin
        v_claims := v_claims_raw::jsonb;
        if v_claims ? 'amr' and jsonb_typeof(v_claims->'amr') = 'array' then
          select (elem->>'timestamp')::bigint into v_pw_ts
          from jsonb_array_elements(v_claims->'amr') elem
          where elem->>'method' = 'password'
            and elem->>'timestamp' is not null
          order by (elem->>'timestamp')::bigint desc
          limit 1;

          if v_pw_ts is not null and to_timestamp(v_pw_ts) >= (now() - interval '15 minutes') then
            v_autenticado := true;
          end if;
        end if;
      exception when others then
        v_autenticado := false;
      end;
    end if;
  end if;

  if not v_autenticado then
    raise exception using
      errcode = '42501',
      message = 'Se requiere confirmación reciente de contraseña para guardar datos bancarios.';
  end if;

  if length(trim(coalesce(p_titular_cuenta, ''))) < 3 then
    raise exception using
      errcode = '22023',
      message = 'Escribe el nombre del titular de la cuenta.';
  end if;

  if length(trim(coalesce(p_banco, ''))) < 2 then
    raise exception using
      errcode = '22023',
      message = 'Escribe el banco del conductor.';
  end if;

  if v_clabe !~ '^[0-9]{18}$' then
    raise exception using
      errcode = '23514',
      message = 'La CLABE debe tener exactamente 18 digitos.';
  end if;

  -- Procesar tarjeta: si viene con dígitos, guardar únicamente formato enmascarado (últimos 4)
  if length(v_tarjeta_raw) > 0 then
    if v_tarjeta_raw ~ '^[0-9]{16,19}$' then
      v_tarjeta_enmascarada := repeat('*', length(v_tarjeta_raw) - 4) || right(v_tarjeta_raw, 4);
    elsif v_tarjeta_raw ~ '^[0-9*]{4,19}$' then
      v_tarjeta_enmascarada := repeat('*', greatest(length(v_tarjeta_raw) - 4, 0)) || right(v_tarjeta_raw, 4);
    else
      raise exception using
        errcode = '23514',
        message = 'El numero de tarjeta debe tener entre 16 y 19 digitos.';
    end if;
  end if;

  insert into public.datos_bancarios_conductor (
    conductor_id,
    titular_cuenta,
    banco,
    clabe,
    numero_tarjeta,
    estado,
    actualizado_en
  ) values (
    v_conductor_id,
    trim(p_titular_cuenta),
    trim(p_banco),
    v_clabe,
    v_tarjeta_enmascarada,
    'en_revision',
    now()
  )
  on conflict (conductor_id) do update set
    titular_cuenta = excluded.titular_cuenta,
    banco = excluded.banco,
    clabe = excluded.clabe,
    numero_tarjeta = excluded.numero_tarjeta,
    estado = 'en_revision',
    actualizado_en = now()
  returning * into v_row;

  insert into public.registro_auditoria (
    actor,
    actor_id,
    evento,
    datos
  ) values (
    'conductor',
    v_conductor_id,
    'actualizacion_datos_bancarios_conductor',
    jsonb_build_object(
      'banco', v_row.banco,
      'clabe_ultimos4', right(v_row.clabe, 4),
      'tarjeta_enmascarada', v_row.numero_tarjeta,
      'estado', v_row.estado,
      'metodo_autenticacion', case when p_password is not null then 'password_accion' else 'session_amr_password' end
    )
  );

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.conductor_reportar_incidencia_transaccional (
  p_traslado_id     uuid,
  p_tipo            public.tipo_incidencia,
  p_momento         public.momento_incidencia,
  p_descripcion     text,
  p_incidencia_id   uuid                      DEFAULT NULL::uuid,
  p_escalar_urgente boolean                   DEFAULT false
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_conductor_id uuid;
  v_estado_traslado public.estado_traslado;
  v_id uuid;
  v_insertada uuid;
  v_existente public.incidencias%rowtype;
  v_texto text;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Solo un conductor autenticado puede reportar incidencias.';
  end if;

  -- H07: Validar pertenencia estricta del traslado al conductor autenticado (evita escalamiento de privilegios por SECURITY DEFINER)
  select estado into v_estado_traslado
  from public.traslados
  where id = p_traslado_id
    and conductor_id = v_conductor_id;

  if v_estado_traslado is null then
    raise exception using
      errcode = '42501',
      message = 'Acceso denegado: el traslado no existe o no está asignado al conductor autenticado.';
  end if;

  if v_estado_traslado in ('cancelado', 'servicio_cerrado') then
    raise exception using
      errcode = '22023',
      message = 'No se pueden reportar incidencias en un traslado cerrado o cancelado.';
  end if;

  v_texto := trim(coalesce(p_descripcion, ''));
  if length(v_texto) < 10 then
    raise exception using
      errcode = '22023',
      message = 'Describe el problema con al menos 10 caracteres.';
  end if;

  v_id := coalesce(p_incidencia_id, gen_random_uuid());

  -- Inserción atómica con resolución de concurrencia (ON CONFLICT DO NOTHING)
  insert into public.incidencias (
    id,
    traslado_id,
    tipo,
    momento,
    reportada_por,
    descripcion
  ) values (
    v_id,
    p_traslado_id,
    p_tipo,
    p_momento,
    'conductor',
    v_texto
  )
  on conflict (id) do nothing
  returning id into v_insertada;

  if v_insertada is not null then
    -- Inserción exitosa de nueva incidencia: registrar auditoría
    insert into public.registro_auditoria (
      traslado_id,
      evento,
      actor,
      actor_id,
      datos
    ) values (
      p_traslado_id,
      'reporte_incidencia',
      'conductor',
      v_conductor_id,
      jsonb_build_object(
        'incidencia_id', v_id,
        'tipo', p_tipo,
        'momento', p_momento,
        'escalamiento_urgente', p_escalar_urgente
      )
    );

    -- Escalamiento urgente garantizado en la misma transacción atómica
    if p_escalar_urgente then
      insert into public.registro_auditoria (
        traslado_id,
        evento,
        actor,
        actor_id,
        datos
      ) values (
        p_traslado_id,
        'activacion_soporte_emergencia',
        'conductor',
        v_conductor_id,
        jsonb_build_object(
          'traslado_id', p_traslado_id,
          'incidencia_id', v_id,
          'prioridad', 'alta',
          'canal', '911',
          'origen', 'app-conductor'
        )
      );
    end if;

    return jsonb_build_object(
      'id', v_id,
      'reintentado', false,
      'escalado_urgente', p_escalar_urgente
    );
  end if;

  -- Reintento concurrente o idempotente: bloquear y verificar la fila existente
  select * into strict v_existente
  from public.incidencias
  where id = v_id
  for update;

  -- Validar pertenencia estricta de la incidencia previa (no permitir adoptar incidencias de otros traslados o actores)
  if v_existente.traslado_id <> p_traslado_id or v_existente.reportada_por <> 'conductor' then
    raise exception using
      errcode = '42501',
      message = 'Conflicto de identidad: la incidencia ya existe para otro traslado o actor.';
  end if;

  -- Validar conflicto de payload
  if (v_existente.tipo, v_existente.momento, v_existente.descripcion) is distinct from (p_tipo, p_momento, v_texto) then
    raise exception using
      errcode = '23505',
      message = 'Conflicto de contenido: intento de reusar un id con datos distintos.';
  end if;

  -- Escalamiento urgente idempotente: si es urgente y aún no se había registrado la activación de soporte, registrarla una sola vez
  if p_escalar_urgente and not exists (
    select 1 from public.registro_auditoria
    where traslado_id = p_traslado_id
      and evento = 'activacion_soporte_emergencia'
      and (datos->>'incidencia_id') = v_id::text
  ) then
    insert into public.registro_auditoria (
      traslado_id,
      evento,
      actor,
      actor_id,
      datos
    ) values (
      p_traslado_id,
      'activacion_soporte_emergencia',
      'conductor',
      v_conductor_id,
      jsonb_build_object(
        'traslado_id', p_traslado_id,
        'incidencia_id', v_id,
        'prioridad', 'alta',
        'canal', '911',
        'origen', 'app-conductor'
      )
    );
  end if;

  return jsonb_build_object(
    'id', v_id,
    'reintentado', true,
    'escalado_urgente', p_escalar_urgente
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.usuario_crea_traslado (
  p_vehiculo_id        uuid,
  p_vehiculo           jsonb,
  p_traslado           jsonb,
  p_clave_idempotencia uuid,
  p_paradas            jsonb DEFAULT '[]'::jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."conductor_confirmar_llegada_destino"(uuid, boolean, numeric, numeric, integer, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."conductor_guarda_datos_bancarios"(text, text, text, text, text) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."conductor_guarda_datos_bancarios"(text, text, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."conductor_guarda_datos_bancarios"(text, text, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."conductor_guarda_datos_bancarios"(text, text, text, text, text) TO "service_role";

