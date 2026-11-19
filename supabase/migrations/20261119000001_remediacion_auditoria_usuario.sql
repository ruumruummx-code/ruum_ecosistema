-- Remediación de la auditoría App Usuario (2026-11-19).
--
--  1. Tarifa: piso de cobro y cargo por parada configurables en tarifas_config;
--     el piso se aplica en calcular_tarifa_traslado (mismo valor que valida
--     crear-payment-intent) para que ninguna cotización quede impagable.
--  2. Condición del vehículo: el usuario ya no puede declararla para pagar
--     menos. Vehículo nuevo/no guardado = 'seminueva' (o rescate mecánico, que
--     encarece); solo Torre de Control cambia la condición guardada.
--  3. Teléfono: cuentas creadas con la verificación SMS suspendida
--     (telefono_verificado = false) no cotizan hasta verificarlo.
--  4. Calificaciones: sin escritura directa de usuarios; RPC única que toma el
--     conductor del traslado y exige servicio_cerrado, 72 h y calificado_en = now().
--  5. Cancelación: la penalización se calcula en un solo lugar, existe una
--     previsualización de solo lectura y la cancelación real corre desde la
--     Edge Function cancelar-traslado-usuario: si ya se cobró, se reembolsa
--     (100 % menos penalización) en vez de crear otro cargo; los PaymentIntent
--     pendientes se cancelan.
--  6. aplicar_verificacion_pago_stripe: un cobro que llega para un traslado ya
--     cancelado no lo reactiva y se encola su reembolso.
--  7. Reembolsos parciales de Stripe quedan registrados (stripe_verificaciones
--     y cola de revisión financiera) en vez de perderse.
--  8. usuario_acepta_cotizacion escribe registro_auditoria.

-- ---------------------------------------------------------------------------
-- 1. Tarifa: piso y cargo por parada
-- ---------------------------------------------------------------------------
alter table public.tarifas_config
  add column if not exists piso_cobro numeric(10,2) not null default 699 check (piso_cobro >= 0),
  add column if not exists cargo_por_parada numeric(10,2) not null default 0 check (cargo_por_parada >= 0);

comment on column public.tarifas_config.piso_cobro is
  'Monto mínimo por traslado (MXN). crear-payment-intent rechaza montos menores: ambos lados leen este valor.';
comment on column public.tarifas_config.cargo_por_parada is
  'Cargo fijo por escala/tarea (MXN). 0 hasta que Negocio defina el valor; se suma en servidor_cotizar_traslado_individual.';

create or replace function public.calcular_tarifa_traslado(
  p_categoria public.categoria_tarifa_vehiculo,
  p_rango public.rango_distancia,
  p_gama public.gama_vehiculo,
  p_condicion public.condicion_vehiculo,
  p_horario public.horario_traslado,
  p_dia public.dia_traslado,
  p_distancia_km numeric,
  p_tiempo_horas numeric
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_base numeric; v_por_km numeric; v_factor_gama numeric;
  v_factor_condicion numeric; v_factor_horario numeric; v_factor_dia numeric;
  v_tarifa_hora numeric; v_tope numeric; v_piso numeric;
  v_base_categoria numeric; v_subtotal numeric; v_factor_variable numeric;
begin
  if p_distancia_km is null or p_distancia_km < 0 then raise exception 'Distancia inválida'; end if;
  if p_tiempo_horas is null or p_tiempo_horas < 0 then raise exception 'Tiempo inválido'; end if;

  select base, por_km into v_base, v_por_km from public.tarifas_vehiculo where categoria = p_categoria and rango = p_rango;
  if v_base is null then raise exception 'No hay tarifa configurada para % / %', p_categoria, p_rango; end if;

  select factor into v_factor_gama from public.tarifas_gama where gama = p_gama;
  select factor into v_factor_condicion from public.tarifas_condicion where condicion = p_condicion;
  select factor into v_factor_horario from public.tarifas_horario where horario = p_horario;
  select factor into v_factor_dia from public.tarifas_dia where dia = p_dia;
  select tarifa_hora, tope_factor_variable, piso_cobro into v_tarifa_hora, v_tope, v_piso
    from public.tarifas_config where id = true;

  v_base_categoria := v_base * v_factor_gama;
  v_subtotal := v_base_categoria + (p_distancia_km * v_por_km) + (p_tiempo_horas * v_tarifa_hora);
  v_factor_variable := least(v_factor_condicion * v_factor_horario * v_factor_dia, v_tope);

  -- Piso de cobro: un traslado corto ya no se cotiza por debajo del mínimo
  -- que Stripe acepta en crear-payment-intent.
  return greatest(round(v_subtotal * v_factor_variable, 2), coalesce(v_piso, 699));
end; $$;

-- Lectura del piso para la Edge Function de cobro (service_role).
create or replace function public.piso_cobro_traslado()
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select piso_cobro from public.tarifas_config where id = true), 699);
$$;
revoke all on function public.piso_cobro_traslado() from public, anon, authenticated;
grant execute on function public.piso_cobro_traslado() to service_role;

-- Previsualización: misma normalización de condición que la cotización real.
create or replace function public.usuario_previsualizar_tarifa(
  p_marca text,
  p_modelo text,
  p_distancia_km numeric,
  p_tiempo_estimado_horas numeric,
  p_fecha_hora timestamptz default null,
  p_condicion public.condicion_vehiculo default 'seminueva'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_permitido boolean;
  v_reintentar_en integer;
  v_categoria public.categoria_tarifa_vehiculo;
  v_gama public.gama_vehiculo;
  v_rango public.rango_distancia;
  v_horario public.horario_traslado;
  v_dia public.dia_traslado;
  v_tarifa numeric;
  v_momento timestamptz := coalesce(p_fecha_hora, now());
  v_condicion public.condicion_vehiculo := case when p_condicion = 'rescate_mecanico'
    then 'rescate_mecanico'::public.condicion_vehiculo else 'seminueva'::public.condicion_vehiculo end;
begin
  select permitido, reintentar_en into v_permitido, v_reintentar_en
  from public.consumir_rate_limit('tarifa-prev', 'uid:' || coalesce(auth.uid()::text, 'anon'), 30, 60);
  if not coalesce(v_permitido, false) then
    raise exception 'RATE_LIMITED' using errcode = 'P0001', detail = 'Límite de solicitudes de cotización excedido';
  end if;

  if p_distancia_km is null or p_tiempo_estimado_horas is null then
    return jsonb_build_object('disponible', false, 'motivo', 'Falta distancia o tiempo estimado.');
  end if;

  select categoria_tarifa, gama into v_categoria, v_gama
  from public.catalogar_vehiculo_para_tarifa(p_marca, p_modelo);
  if v_categoria is null or v_gama is null then
    return jsonb_build_object(
      'disponible', false,
      'motivo', 'El vehículo no está en el catálogo automático. Torre de Control enviará la cotización.'
    );
  end if;

  v_rango := public.rango_desde_distancia(p_distancia_km);
  v_horario := public.horario_desde_timestamp(v_momento);
  v_dia := public.dia_desde_timestamp(v_momento);
  v_tarifa := public.calcular_tarifa_traslado(
    v_categoria, v_rango, v_gama, v_condicion, v_horario, v_dia, p_distancia_km, p_tiempo_estimado_horas
  );

  return jsonb_build_object(
    'disponible', true,
    'tarifa', v_tarifa,
    'categoria_tarifa', v_categoria,
    'gama', v_gama,
    'condicion', v_condicion,
    'horario', v_horario,
    'dia', v_dia
  );
end;
$$;
revoke all on function public.usuario_previsualizar_tarifa(text, text, numeric, numeric, timestamptz, public.condicion_vehiculo) from public, anon;
grant execute on function public.usuario_previsualizar_tarifa(text, text, numeric, numeric, timestamptz, public.condicion_vehiculo) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2 y 3. Cotización individual: condición fijada en servidor, cargo por
-- parada y teléfono verificado.
-- ---------------------------------------------------------------------------
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
  -- Cuentas dadas de alta con el SMS suspendido: verificar antes del primer traslado.
  if exists (select 1 from auth.users u where u.id = p_auth_user_id
             and u.raw_user_meta_data->>'telefono_verificado' = 'false') then
    raise exception 'Verifica tu número de teléfono antes de solicitar tu primer traslado';
  end if;
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

-- ---------------------------------------------------------------------------
-- 4. Calificaciones
-- ---------------------------------------------------------------------------
drop policy if exists "usuario_califica_sus_traslados" on public.calificaciones_traslado;
drop policy if exists "usuario_ve_calificaciones_de_sus_traslados" on public.calificaciones_traslado;
create policy "usuario_ve_calificaciones_de_sus_traslados"
  on public.calificaciones_traslado for select to authenticated
  using (
    traslado_id in (
      select t.id from public.traslados t
      join public.usuarios u on u.id = t.usuario_id
      where u.auth_user_id = (select auth.uid())
    )
  );
-- anon nunca escribe; authenticated conserva el GRANT solo para Torre de
-- Control (política admin_acceso_total_calificaciones). Ningún usuario tiene
-- ya una política de escritura: la única vía es la RPC de abajo.
revoke insert, update, delete on public.calificaciones_traslado from anon;

create or replace function public.usuario_califica_traslado(
  p_traslado_id uuid,
  p_estrellas int,
  p_comentario text default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_usuario_id uuid;
  v_traslado public.traslados%rowtype;
  v_cerrado_en timestamptz;
begin
  select id into v_usuario_id from public.usuarios where auth_user_id = auth.uid();
  if v_usuario_id is null then raise exception 'Usuario no encontrado'; end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 then
    raise exception 'La calificación debe estar entre 1 y 5 estrellas.';
  end if;

  select * into v_traslado from public.traslados
   where id = p_traslado_id and usuario_id = v_usuario_id for update;
  if v_traslado.id is null then raise exception 'Traslado no encontrado'; end if;
  if v_traslado.estado <> 'servicio_cerrado' then raise exception 'Solo se puede calificar un traslado finalizado.'; end if;
  if v_traslado.conductor_id is null then raise exception 'El traslado no tiene conductor asignado.'; end if;

  select max(h.creado_en) into v_cerrado_en
    from public.historial_estados_traslado h
   where h.traslado_id = p_traslado_id and h.estado_nuevo = 'servicio_cerrado';
  -- 72 h + 15 min de gracia técnica (mismo criterio que la UI).
  if coalesce(v_cerrado_en, v_traslado.actualizado_en) < now() - interval '72 hours 15 minutes' then
    raise exception 'El plazo de 72 horas para calificar este traslado ya venció.';
  end if;

  if exists (select 1 from public.calificaciones_traslado where traslado_id = p_traslado_id) then
    raise exception 'Este traslado ya fue calificado.';
  end if;

  insert into public.calificaciones_traslado (traslado_id, conductor_id, estrellas, comentario, calificado_en)
  values (p_traslado_id, v_traslado.conductor_id, p_estrellas, nullif(left(btrim(coalesce(p_comentario, '')), 1000), ''), now());

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (p_traslado_id, 'calificacion_conductor', 'usuario', v_usuario_id,
    jsonb_build_object('conductor_id', v_traslado.conductor_id, 'estrellas', p_estrellas));

  return jsonb_build_object('ok', true, 'conductor_id', v_traslado.conductor_id, 'estrellas', p_estrellas);
end;
$$;
revoke all on function public.usuario_califica_traslado(uuid, int, text) from public, anon;
grant execute on function public.usuario_califica_traslado(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Cancelación con reembolso
-- ---------------------------------------------------------------------------
create table if not exists public.reembolsos_traslado (
  id uuid primary key default gen_random_uuid(),
  traslado_id uuid not null references public.traslados(id) on delete cascade,
  pago_id uuid not null references public.pagos(id),
  stripe_payment_intent_id text not null,
  monto numeric(10,2) not null check (monto > 0),
  motivo text not null check (motivo in ('cancelacion_usuario', 'pago_tras_cancelacion')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'completado', 'fallido')),
  stripe_refund_id text unique,
  intentos int not null default 0,
  ultimo_error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (pago_id, motivo)
);
create index if not exists reembolsos_traslado_pendientes_idx
  on public.reembolsos_traslado (estado, actualizado_en) where estado in ('pendiente', 'procesando', 'fallido');
alter table public.reembolsos_traslado enable row level security;
revoke all on public.reembolsos_traslado from public, anon, authenticated;
grant select on public.reembolsos_traslado to authenticated;
grant all on public.reembolsos_traslado to service_role;
create policy reembolsos_traslado_admin on public.reembolsos_traslado
  for select to authenticated using (public.es_admin());
create policy reembolsos_traslado_usuario on public.reembolsos_traslado
  for select to authenticated using (
    traslado_id in (select t.id from public.traslados t join public.usuarios u on u.id = t.usuario_id
                    where u.auth_user_id = (select auth.uid()))
  );

-- Cola de revisión de Finanzas (reembolsos parciales no conciliados, etc.).
create table if not exists public.revision_financiera_stripe (
  id uuid primary key default gen_random_uuid(),
  stripe_evento_id text unique,
  pago_id uuid references public.pagos(id),
  traslado_id uuid references public.traslados(id) on delete set null,
  tipo text not null,
  detalle jsonb not null default '{}'::jsonb,
  estado text not null default 'abierta' check (estado in ('abierta', 'resuelta')),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);
alter table public.revision_financiera_stripe enable row level security;
revoke all on public.revision_financiera_stripe from public, anon, authenticated;
grant select, update on public.revision_financiera_stripe to authenticated;
grant all on public.revision_financiera_stripe to service_role;
create policy revision_financiera_admin on public.revision_financiera_stripe
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Penalización PRD §4.7 en un único lugar (antes duplicada en cliente y RPC).
create or replace function public.calcular_cargo_cancelacion(p_traslado public.traslados)
returns table (porcentaje int, monto numeric)
language plpgsql stable set search_path = public as $$
declare
  v_precio numeric := coalesce(p_traslado.precio_final, p_traslado.precio_cotizado, 0);
  v_horas numeric;
begin
  if p_traslado.estado = 'conductor_en_punto_de_recoleccion' then
    porcentaje := 100;
  elsif p_traslado.conductor_id is null then
    porcentaje := 0;
  else
    v_horas := extract(epoch from (p_traslado.fecha_hora_programada - now())) / 3600;
    porcentaje := case
      when v_horas is null or v_horas >= 6 then 20
      when v_horas >= 4 then 35
      when v_horas >= 2 then 50
      else 75 end;
  end if;
  monto := round((v_precio * porcentaje) / 100, 2);
  return next;
end;
$$;
revoke all on function public.calcular_cargo_cancelacion(public.traslados) from public, anon, authenticated;

create or replace function public.monto_cobrado_traslado(p_traslado_id uuid)
returns numeric language sql stable set search_path = public as $$
  select coalesce(sum(p.monto), 0)
    from public.pagos p
   where p.traslado_id = p_traslado_id
     and p.estado = 'completado'
     and p.metodo <> 'cargo_cancelacion'
     and p.stripe_payment_intent_id is not null;
$$;
revoke all on function public.monto_cobrado_traslado(uuid) from public, anon, authenticated;

-- Previsualización de solo lectura (la UI ya no calcula la penalización).
create or replace function public.usuario_previsualizar_cancelacion(p_traslado_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_usuario_id uuid;
  v_traslado public.traslados%rowtype;
  v_cargo record;
  v_pagado numeric;
  v_cancelable boolean;
  v_retenido numeric;
begin
  select id into v_usuario_id from public.usuarios where auth_user_id = auth.uid();
  if v_usuario_id is null then raise exception 'Usuario no encontrado'; end if;
  select * into v_traslado from public.traslados where id = p_traslado_id and usuario_id = v_usuario_id;
  if v_traslado.id is null then raise exception 'Traslado no encontrado'; end if;

  v_cancelable := exists (select 1 from public.estado_transiciones_validas
                           where estado_actual = v_traslado.estado and estado_siguiente = 'servicio_cancelado');
  select * into v_cargo from public.calcular_cargo_cancelacion(v_traslado);
  v_pagado := public.monto_cobrado_traslado(p_traslado_id);
  v_retenido := least(v_cargo.monto, v_pagado);

  return jsonb_build_object(
    'cancelable', v_cancelable,
    'porcentaje_cargo', v_cargo.porcentaje,
    'monto_cargo', v_cargo.monto,
    'monto_pagado', v_pagado,
    'monto_reembolso', greatest(v_pagado - v_retenido, 0),
    'mensaje', case
      when v_cargo.porcentaje = 0 and v_pagado > 0 then 'Cancelar ahora no genera cargo; te reembolsaremos el total pagado.'
      when v_cargo.porcentaje = 0 then 'Cancelar ahora no genera cargo.'
      when v_pagado > 0 then format('Cancelar ahora genera un cargo del %s%%; lo descontamos de tu pago y reembolsamos el resto.', v_cargo.porcentaje)
      else format('Cancelar ahora genera un cargo del %s%%.', v_cargo.porcentaje) end
  );
end;
$$;
revoke all on function public.usuario_previsualizar_cancelacion(uuid) from public, anon;
grant execute on function public.usuario_previsualizar_cancelacion(uuid) to authenticated;

-- Cancelación transaccional. Solo la invoca la Edge Function con service_role
-- (que después ejecuta los reembolsos y cancela PaymentIntents en Stripe).
create or replace function public.servidor_cancela_traslado(
  p_auth_user_id uuid,
  p_traslado_id uuid,
  p_motivo text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_usuario_id uuid;
  v_traslado public.traslados%rowtype;
  v_cargo record;
  v_pagado numeric;
  v_por_retener numeric;
  v_retener numeric;
  v_reembolso_total numeric := 0;
  v_pago record;
  v_intents text[];
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Acceso denegado'; end if;
  select id into v_usuario_id from public.usuarios where auth_user_id = p_auth_user_id;
  if v_usuario_id is null then raise exception 'Solo un usuario autenticado puede cancelar su traslado.'; end if;

  select * into v_traslado from public.traslados
   where id = p_traslado_id and usuario_id = v_usuario_id for update;
  if v_traslado.id is null then raise exception 'El traslado no existe o no pertenece al usuario autenticado.'; end if;

  if not exists (select 1 from public.estado_transiciones_validas
                  where estado_actual = v_traslado.estado and estado_siguiente = 'servicio_cancelado') then
    raise exception
      'Este traslado ya no puede cancelarse en el estado "%". Cuando el vehículo ya está en verificación o en tránsito, usa una disputa o reporta una incidencia.',
      v_traslado.estado using errcode = 'check_violation';
  end if;

  select * into v_cargo from public.calcular_cargo_cancelacion(v_traslado);

  update public.traslados set estado = 'servicio_cancelado'
   where id = p_traslado_id and usuario_id = v_usuario_id and estado = v_traslado.estado;

  -- Mismo orden de bloqueo que aplicar_verificacion_pago_stripe: traslado → pagos.
  perform 1 from public.pagos where traslado_id = p_traslado_id for update;
  v_pagado := public.monto_cobrado_traslado(p_traslado_id);

  if v_pagado > 0 then
    -- Ya se cobró: no se crea otro cargo; se retiene la penalización y se
    -- reembolsa el resto (100 % si no hay penalización).
    v_por_retener := least(v_cargo.monto, v_pagado);
    for v_pago in
      select id, monto, stripe_payment_intent_id from public.pagos
       where traslado_id = p_traslado_id and estado = 'completado'
         and metodo <> 'cargo_cancelacion' and stripe_payment_intent_id is not null
       order by registrado_en
    loop
      v_retener := least(v_por_retener, v_pago.monto);
      v_por_retener := v_por_retener - v_retener;
      if v_pago.monto - v_retener > 0 then
        insert into public.reembolsos_traslado (traslado_id, pago_id, stripe_payment_intent_id, monto, motivo)
        values (p_traslado_id, v_pago.id, v_pago.stripe_payment_intent_id, v_pago.monto - v_retener, 'cancelacion_usuario')
        on conflict (pago_id, motivo) do nothing;
        v_reembolso_total := v_reembolso_total + (v_pago.monto - v_retener);
      end if;
    end loop;
  elsif coalesce(v_cargo.monto, 0) > 0 then
    insert into public.pagos (traslado_id, monto, momento, estado, metodo)
    values (p_traslado_id, v_cargo.monto, 'al_cierre', 'pendiente', 'cargo_cancelacion');
  end if;

  -- PaymentIntents vivos del traslado: la Edge Function los cancela en Stripe.
  select coalesce(array_agg(stripe_payment_intent_id), '{}') into v_intents
    from public.pagos
   where traslado_id = p_traslado_id and estado = 'pendiente'
     and stripe_payment_intent_id is not null and metodo <> 'cargo_cancelacion';

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (p_traslado_id, 'cancelacion_traslado', 'usuario', v_usuario_id,
    jsonb_build_object(
      'motivo', left(coalesce(p_motivo, ''), 500),
      'estado_anterior', v_traslado.estado,
      'estado_nuevo', 'servicio_cancelado',
      'porcentaje_cargo', v_cargo.porcentaje,
      'monto_cargo', v_cargo.monto,
      'monto_pagado', v_pagado,
      'monto_reembolso', v_reembolso_total,
      'payment_intents_a_cancelar', to_jsonb(v_intents),
      'cargo_origen', 'servidor'));

  return jsonb_build_object(
    'porcentaje_cargo', v_cargo.porcentaje,
    'monto_cargo', v_cargo.monto,
    'monto_pagado', v_pagado,
    'monto_reembolso', v_reembolso_total,
    'payment_intents_pendientes', to_jsonb(v_intents),
    'mensaje', case
      when v_reembolso_total > 0 then format('Traslado cancelado. Reembolsaremos %s MXN a tu método de pago.', v_reembolso_total)
      when v_cargo.monto > 0 and v_pagado = 0 then format('Traslado cancelado. Se registró un cargo del %s%%.', v_cargo.porcentaje)
      else 'Traslado cancelado.' end);
end;
$$;
revoke all on function public.servidor_cancela_traslado(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.servidor_cancela_traslado(uuid, uuid, text) to service_role;

-- El camino directo desde el navegador queda cerrado: cancelaba traslados
-- pagados sin reembolso y dejaba PaymentIntents vivos.
revoke execute on function public.usuario_cancela_traslado(uuid, text) from authenticated;
revoke execute on function public.usuario_cancela_traslado(uuid, text, numeric, numeric, text) from authenticated;

-- Reembolsos: reclamo con bloqueo y registro de resultado (worker = Edge Functions).
create or replace function public.reclamar_reembolsos_traslado(p_limite int default 20, p_traslado_id uuid default null)
returns setof public.reembolsos_traslado
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query
  update public.reembolsos_traslado r
     set estado = 'procesando', intentos = r.intentos + 1, actualizado_en = now()
   where r.id in (
     select id from public.reembolsos_traslado
      where (p_traslado_id is null or traslado_id = p_traslado_id)
        and (estado in ('pendiente', 'fallido')
             or (estado = 'procesando' and actualizado_en < now() - interval '10 minutes'))
        and intentos < 10
      order by creado_en
      limit greatest(1, least(coalesce(p_limite, 20), 100))
      for update skip locked)
  returning r.*;
end;
$$;
revoke all on function public.reclamar_reembolsos_traslado(int, uuid) from public, anon, authenticated;
grant execute on function public.reclamar_reembolsos_traslado(int, uuid) to service_role;

create or replace function public.registrar_resultado_reembolso(
  p_id uuid, p_ok boolean, p_stripe_refund_id text default null, p_error text default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_reembolso public.reembolsos_traslado%rowtype;
begin
  update public.reembolsos_traslado
     set estado = case when p_ok then 'completado' else 'fallido' end,
         stripe_refund_id = coalesce(p_stripe_refund_id, stripe_refund_id),
         ultimo_error = case when p_ok then null else left(p_error, 300) end,
         actualizado_en = now()
   where id = p_id
  returning * into v_reembolso;
  if v_reembolso.id is null then raise exception 'Reembolso no encontrado'; end if;
  if p_ok then
    insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
    values (v_reembolso.traslado_id, 'registro_pago', 'sistema', '00000000-0000-0000-0000-000000000000',
      jsonb_build_object('tipo', 'reembolso', 'motivo', v_reembolso.motivo, 'monto', v_reembolso.monto,
        'stripe_refund_id', p_stripe_refund_id, 'stripe_payment_intent_id', v_reembolso.stripe_payment_intent_id));
  elsif v_reembolso.intentos >= 10 then
    insert into public.revision_financiera_stripe (pago_id, traslado_id, tipo, detalle)
    values (v_reembolso.pago_id, v_reembolso.traslado_id, 'reembolso_agotado',
      jsonb_build_object('reembolso_id', v_reembolso.id, 'monto', v_reembolso.monto, 'error', left(p_error, 300)));
  end if;
end;
$$;
revoke all on function public.registrar_resultado_reembolso(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.registrar_resultado_reembolso(uuid, boolean, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Verificación canónica de Stripe: cobros sobre traslados cancelados.
-- ---------------------------------------------------------------------------
create or replace function public.aplicar_verificacion_pago_stripe(p_datos jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_pago public.pagos%rowtype; v_traslado public.traslados%rowtype;
  v_estado public.estado_pago; v_siguiente public.estado_traslado; v_id text; v_duplicado boolean;
  v_reembolso_encolado boolean := false;
begin
  if p_datos->>'origen' not in ('webhook','conciliacion') or coalesce(p_datos->>'id','')='' then raise exception 'Verificación inválida.'; end if;
  select t.* into v_traslado from public.traslados t join public.pagos p on p.traslado_id=t.id
  where p.stripe_payment_intent_id=p_datos->>'intent_id' for update of t;
  select * into v_pago from public.pagos where stripe_payment_intent_id=p_datos->>'intent_id' for update;
  if not found or v_traslado.id is null then raise exception 'Pago o traslado no encontrado.'; end if;
  if p_datos->>'traslado_id' is distinct from v_pago.traslado_id::text
    or p_datos->>'moneda' is distinct from 'mxn'
    or (p_datos->>'monto_centavos')::bigint is distinct from round(v_pago.monto*100)::bigint
    or jsonb_typeof(p_datos->'livemode') is distinct from 'boolean'
    or jsonb_typeof(p_datos->'modo_esperado') is distinct from 'boolean'
    or (p_datos->>'livemode')::boolean is distinct from (p_datos->>'modo_esperado')::boolean
    or (v_pago.stripe_livemode is not null and v_pago.stripe_livemode is distinct from (p_datos->>'livemode')::boolean) then
    raise exception 'No coincide ambiente, importe, moneda o traslado de Stripe.';
  end if;
  v_estado := case p_datos->>'estado_proveedor'
    when 'succeeded' then 'completado'::public.estado_pago
    when 'canceled' then 'fallido'::public.estado_pago
    when 'requires_payment_method' then 'fallido'::public.estado_pago
    else 'pendiente'::public.estado_pago end;
  if v_estado='completado' and (p_datos->>'monto_recibido')::bigint is distinct from round(v_pago.monto*100)::bigint then
    raise exception 'Stripe no confirma el importe recibido completo.';
  end if;
  insert into public.stripe_verificaciones(id,pago_id,origen,estado_proveedor,livemode,monto_centavos,moneda,resultado)
  values(p_datos->>'id',v_pago.id,p_datos->>'origen',p_datos->>'estado_proveedor',(p_datos->>'livemode')::boolean,
    (p_datos->>'monto_centavos')::bigint,p_datos->>'moneda',case when v_pago.estado='completado' and v_estado<>'completado' then 'requiere_revision' else 'verificado' end)
  on conflict(id) do nothing returning id into v_id;
  v_duplicado := v_id is null;
  update public.pagos set stripe_verificado_en=now(),stripe_livemode=(p_datos->>'livemode')::boolean where id=v_pago.id;
  if v_duplicado then
    if not exists(select 1 from public.stripe_verificaciones where id=p_datos->>'id' and pago_id=v_pago.id and estado_proveedor=p_datos->>'estado_proveedor') then raise exception 'Identidad de evento en conflicto.'; end if;
    return jsonb_build_object('ok',true,'duplicado',true);
  end if;
  if v_pago.estado in ('completado','reembolsado') and v_estado<>v_pago.estado then
    return jsonb_build_object('ok',true,'requiere_revision',true);
  end if;
  if v_estado='completado' then
    if v_traslado.estado = 'servicio_cancelado' and v_pago.metodo <> 'cargo_cancelacion' then
      -- Cobro sobre un traslado ya cancelado: se registra el dinero recibido,
      -- el traslado NO se reactiva y se encola el reembolso total.
      insert into public.reembolsos_traslado (traslado_id, pago_id, stripe_payment_intent_id, monto, motivo)
      values (v_traslado.id, v_pago.id, v_pago.stripe_payment_intent_id, v_pago.monto, 'pago_tras_cancelacion')
      on conflict (pago_id, motivo) do nothing;
      v_reembolso_encolado := true;
    else
      v_siguiente := case
        when v_traslado.estado='solicitud_creada' and v_traslado.tipo_pago='anticipado' then 'documentacion_pendiente'::public.estado_traslado
        when v_traslado.estado in ('cotizacion_generada','cotizacion_aceptada') and v_traslado.tipo_pago='anticipado' then 'servicio_confirmado'::public.estado_traslado
        when v_traslado.estado in ('entrega_confirmada','pago_pendiente') then 'pago_completado'::public.estado_traslado
        else null end;
    end if;
  end if;
  update public.pagos set estado=v_estado,
    stripe_event_id=case when p_datos->>'origen'='webhook' then p_datos->>'id' else stripe_event_id end
  where id=v_pago.id;
  if v_siguiente is not null then update public.traslados set estado=v_siguiente where id=v_traslado.id; end if;
  if v_estado is distinct from v_pago.estado or v_siguiente is not null then
    insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
    values(v_pago.traslado_id,'registro_pago','sistema','00000000-0000-0000-0000-000000000000',
      jsonb_build_object('stripe_event_id',p_datos->>'id','stripe_payment_intent_id',p_datos->>'intent_id',
        'origen',p_datos->>'origen','estado_pago',v_estado,'estado_anterior',v_traslado.estado,'estado_nuevo',v_siguiente,
        'reembolso_encolado',v_reembolso_encolado));
  end if;
  return jsonb_build_object('ok',true,'duplicado',false,'reembolso_encolado',v_reembolso_encolado);
end $$;
revoke all on function public.aplicar_verificacion_pago_stripe(jsonb) from public,anon,authenticated;
grant execute on function public.aplicar_verificacion_pago_stripe(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Reembolsos parciales de Stripe
-- ---------------------------------------------------------------------------
create or replace function public.registrar_reembolso_parcial_stripe(
  p_evento_id text,
  p_intent_id text,
  p_charge_id text,
  p_monto_reembolsado_centavos bigint,
  p_monto_cargo_centavos bigint,
  p_livemode boolean
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pago public.pagos%rowtype;
  v_esperado bigint;
  v_resultado text;
  v_id text;
begin
  select * into v_pago from public.pagos where stripe_payment_intent_id = p_intent_id for update;
  if v_pago.id is null then raise exception 'Pago no encontrado para el reembolso parcial.'; end if;

  -- Conciliado si coincide con los reembolsos que emitimos para este pago.
  select coalesce(round(sum(monto) * 100), 0)::bigint into v_esperado
    from public.reembolsos_traslado where pago_id = v_pago.id and estado in ('procesando', 'completado');
  v_resultado := case when v_esperado = p_monto_reembolsado_centavos
    then 'reembolso_parcial_conciliado' else 'reembolso_parcial_requiere_revision' end;

  insert into public.stripe_verificaciones (id, pago_id, origen, estado_proveedor, livemode, monto_centavos, moneda, resultado)
  values (p_evento_id, v_pago.id, 'webhook', 'partially_refunded', p_livemode, p_monto_reembolsado_centavos, 'mxn', v_resultado)
  on conflict (id) do nothing returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', true, 'duplicado', true); end if;

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (v_pago.traslado_id, 'registro_pago', 'sistema', '00000000-0000-0000-0000-000000000000',
    jsonb_build_object('tipo', 'reembolso_parcial', 'stripe_event_id', p_evento_id, 'stripe_charge_id', p_charge_id,
      'monto_reembolsado_centavos', p_monto_reembolsado_centavos, 'monto_cargo_centavos', p_monto_cargo_centavos,
      'resultado', v_resultado));

  if v_resultado = 'reembolso_parcial_requiere_revision' then
    insert into public.revision_financiera_stripe (stripe_evento_id, pago_id, traslado_id, tipo, detalle)
    values (p_evento_id, v_pago.id, v_pago.traslado_id, 'reembolso_parcial',
      jsonb_build_object('stripe_charge_id', p_charge_id, 'monto_reembolsado_centavos', p_monto_reembolsado_centavos,
        'monto_esperado_centavos', v_esperado, 'monto_cargo_centavos', p_monto_cargo_centavos))
    on conflict (stripe_evento_id) do nothing;
  end if;
  return jsonb_build_object('ok', true, 'duplicado', false, 'requiere_revision', v_resultado = 'reembolso_parcial_requiere_revision');
end;
$$;
revoke all on function public.registrar_reembolso_parcial_stripe(text, text, text, bigint, bigint, boolean) from public, anon, authenticated;
grant execute on function public.registrar_reembolso_parcial_stripe(text, text, text, bigint, bigint, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- 8. Aceptar cotización con auditoría real (antes solo console.log del navegador)
-- ---------------------------------------------------------------------------
create or replace function public.usuario_acepta_cotizacion(p_traslado_id uuid)
returns public.estado_traslado language plpgsql security definer set search_path = public as $$
declare v_traslado public.traslados%rowtype; v_usuario_id uuid; v_siguiente public.estado_traslado;
begin
  select id into v_usuario_id from public.usuarios where auth_user_id = auth.uid();
  if v_usuario_id is null then raise exception 'Usuario no encontrado'; end if;
  select * into v_traslado from public.traslados where id = p_traslado_id and usuario_id = v_usuario_id for update;
  if v_traslado.id is null then raise exception 'Traslado no encontrado'; end if;
  if v_traslado.estado <> 'cotizacion_generada' then
    if v_traslado.estado in ('cotizacion_aceptada', 'servicio_confirmado') then
      return v_traslado.estado;
    end if;
    raise exception 'La cotización no está disponible para aceptación';
  end if;
  if coalesce(v_traslado.precio_cotizado, 0) <= 0 then raise exception 'El traslado todavía no cuenta con una cotización válida'; end if;
  if v_traslado.cotizacion_expira_en is null or v_traslado.cotizacion_expira_en <= now() then raise exception 'La cotización ha vencido'; end if;
  v_siguiente := case when v_traslado.tipo_pago = 'anticipado' then 'cotizacion_aceptada' else 'servicio_confirmado' end;
  update public.traslados set estado = v_siguiente where id = p_traslado_id;
  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (p_traslado_id, 'confirmacion_servicio', 'usuario', v_usuario_id,
    jsonb_build_object('accion', 'aceptar_cotizacion', 'estado_anterior', v_traslado.estado, 'estado_nuevo', v_siguiente,
      'precio_cotizado', v_traslado.precio_cotizado, 'tipo_pago', v_traslado.tipo_pago));
  return v_siguiente;
end; $$;
revoke all on function public.usuario_acepta_cotizacion(uuid) from public;
grant execute on function public.usuario_acepta_cotizacion(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Mis traslados: conteos por estado sin traer filas (PostgREST corta en 1,000).
-- ---------------------------------------------------------------------------
create or replace function public.usuario_conteo_traslados_por_estado()
returns table (estado public.estado_traslado, total bigint)
language sql stable security invoker set search_path = public as $$
  select t.estado, count(*)::bigint
    from public.traslados t
    join public.usuarios u on u.id = t.usuario_id
   where u.auth_user_id = (select auth.uid())
   group by t.estado;
$$;
revoke all on function public.usuario_conteo_traslados_por_estado() from public, anon;
grant execute on function public.usuario_conteo_traslados_por_estado() to authenticated;

notify pgrst, 'reload schema';
