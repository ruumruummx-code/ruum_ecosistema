-- RC-04: Webhook Stripe transaccional.
--
-- Antes, el handler hacía las escrituras en pasos separados desde la Edge
-- Function: marcaba `pagos.stripe_event_id` y `pagos.estado` y recién después
-- actualizaba `traslados`. Si fallaba entre medio, devolvía 500; en el
-- reintento veía el mismo `stripe_event_id`, salía con 200 y NUNCA terminaba
-- la actualización del traslado (pago completado + traslado inconsistente).
--
-- Esta función concentra pago + auditoría + avance de traslado en UNA sola
-- transacción. Si algo falla, la transacción se revierte completa y el webhook
-- devuelve 500, de modo que el reintento de Stripe vuelve a intentar todo.
--
-- Idempotencia: en vez de un early-return ciego, se recalcula la transición de
-- estado pendiente. Si ya no hay transición por hacer (el traslado ya avanzó o
-- el pago no es exitoso), la función es no-op. Si el intento previo alcanzó a
-- actualizar el pago pero no el traslado, el reintento completa el traslado.
--
-- El mapeo de estados es el mismo que logica.ts::estadoTrasladoSiguienteTrasPago
-- (fuente de verdad compartida; se replica aquí porque la función corre en la
-- base y no puede importar TypeScript).

create or replace function public.procesar_pago_stripe(
  p_stripe_event_id text,
  p_stripe_payment_intent_id text,
  p_estado_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos%rowtype;
  v_traslado public.traslados%rowtype;
  v_nuevo_estado public.estado_traslado;
  v_ya_procesado boolean := false;
begin
  -- 1. Localizar el pago por PaymentIntent. Si no existe, es un error real:
  --    fallar cerrado para que Stripe reintente (no perder el evento).
  select * into v_pago
  from public.pagos
  where stripe_payment_intent_id = p_stripe_payment_intent_id
  for update;

  if not found then
    raise exception 'Pago no encontrado para PaymentIntent %', p_stripe_payment_intent_id
      using errcode = 'P0002';
  end if;

  -- 2. Leer el traslado para calcular la transición.
  select * into v_traslado
  from public.traslados
  where id = v_pago.traslado_id;

  -- 3. Calcular la transición pendiente (mismo mapeo que logica.ts).
  if p_estado_pago = 'completado'
     and v_traslado.tipo_pago in ('anticipado', 'al_cierre') then
    v_nuevo_estado := case
      when v_traslado.estado in ('cotizacion_aceptada', 'cotizacion_generada')
           and v_traslado.tipo_pago = 'anticipado'
        then 'servicio_confirmado'::public.estado_traslado
      when v_traslado.estado = 'solicitud_creada'
           and v_traslado.tipo_pago = 'anticipado'
        then 'documentacion_pendiente'::public.estado_traslado
      when v_traslado.estado in ('entrega_confirmada', 'pago_pendiente')
        then 'pago_completado'::public.estado_traslado
      else null
    end;
  end if;

  -- 4. Idempotencia: si este mismo evento ya se aplicó y no queda transición
  --    pendiente, no hay nada que hacer.
  if v_pago.stripe_event_id = p_stripe_event_id and v_nuevo_estado is null then
    return jsonb_build_object('ok', true, 'ya_procesado', true);
  end if;

  -- 5. Aplicar el pago (idempotente: mismos valores finales).
  update public.pagos
  set estado = p_estado_pago::public.estado_pago,
      stripe_event_id = p_stripe_event_id
  where id = v_pago.id;

  -- 6. Auditoría del pago, salvo reintento exacto ya registrado.
  if v_pago.stripe_event_id is distinct from p_stripe_event_id then
    insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
    values (
      v_pago.traslado_id,
      'registro_pago',
      'sistema',
      '00000000-0000-0000-0000-000000000000',
      jsonb_build_object(
        'stripe_event_id', p_stripe_event_id,
        'stripe_payment_intent_id', p_stripe_payment_intent_id,
        'estado_pago', p_estado_pago
      )
    );
  end if;

  -- 7. Avanzar el traslado si corresponde.
  if v_nuevo_estado is not null then
    update public.traslados
    set estado = v_nuevo_estado
    where id = v_pago.traslado_id;

    insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
    values (
      v_pago.traslado_id,
      'registro_pago',
      'sistema',
      '00000000-0000-0000-0000-000000000000',
      jsonb_build_object(
        'stripe_event_id', p_stripe_event_id,
        'estado_anterior', v_traslado.estado::text,
        'estado_nuevo', v_nuevo_estado::text,
        'tipo_pago', v_traslado.tipo_pago::text
      )
    );
  end if;

  return jsonb_build_object('ok', true, 'ya_procesado', v_ya_procesado);
end;
$$;

-- Solo service_role puede ejecutar (es un webhook de servidor de confianza).
revoke all on function public.procesar_pago_stripe(text, text, text) from public;
revoke all on function public.procesar_pago_stripe(text, text, text) from anon, authenticated;
grant execute on function public.procesar_pago_stripe(text, text, text) to service_role;

comment on function public.procesar_pago_stripe(text, text, text) is
'RC-04: procesa un evento de pago de Stripe en una sola transacción (pago + auditoría + avance de traslado). Idempotente y fail-closed si el pago no existe.';
