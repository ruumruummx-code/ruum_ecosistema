SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.registrar_reembolso_parcial_stripe (
  p_evento_id                  text,
  p_intent_id                  text,
  p_charge_id                  text,
  p_monto_reembolsado_centavos bigint,
  p_monto_cargo_centavos       bigint,
  p_livemode                   boolean
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.registrar_resultado_reembolso (
  p_id               uuid,
  p_ok               boolean,
  p_stripe_refund_id text    DEFAULT NULL::text,
  p_error            text    DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.servidor_cancela_traslado (
  p_auth_user_id uuid,
  p_traslado_id  uuid,
  p_motivo       text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.usuario_acepta_cotizacion (
  p_traslado_id uuid
)
  RETURNS public.estado_traslado
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
end; $function$;

CREATE OR REPLACE FUNCTION public.usuario_califica_traslado (
  p_traslado_id uuid,
  p_estrellas   integer,
  p_comentario  text    DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.usuario_conteo_traslados_por_estado()
  RETURNS TABLE (
    estado public.estado_traslado,
    total  bigint
  )
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
select t.estado, count(*)::bigint
from public.traslados t
join public.usuarios u on u.id = t.usuario_id
where u.auth_user_id = (select auth.uid())
group by t.estado;
$function$;

CREATE OR REPLACE FUNCTION public.usuario_previsualizar_cancelacion (
  p_traslado_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.usuario_previsualizar_tarifa (
  p_marca                 text,
  p_modelo                text,
  p_distancia_km          numeric,
  p_tiempo_estimado_horas numeric,
  p_fecha_hora            timestamp with time zone  DEFAULT NULL::timestamp WITH time zone,
  p_condicion             public.condicion_vehiculo DEFAULT 'seminueva'::public.condicion_vehiculo
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

