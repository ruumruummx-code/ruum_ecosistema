-- RR-REAL-003: cron real -> petición autenticada de un solo uso -> Stripe -> transacción.
create extension if not exists pg_net with schema extensions;
alter table public.pagos add column if not exists stripe_verificado_en timestamptz;
alter table public.pagos add column if not exists stripe_livemode boolean;
create table public.stripe_verificaciones (
  id text primary key, pago_id uuid not null references public.pagos(id),
  origen text not null check(origen in ('webhook','conciliacion')),
  estado_proveedor text not null, livemode boolean not null, monto_centavos bigint not null,
  moneda text not null, resultado text not null, creado_en timestamptz not null default now()
);
alter table public.stripe_verificaciones enable row level security;
revoke all on public.stripe_verificaciones from public,anon,authenticated;
grant select on public.stripe_verificaciones to authenticated;
grant all on public.stripe_verificaciones to service_role;
create policy stripe_verificaciones_admin on public.stripe_verificaciones for select to authenticated using(public.es_admin());

create function public.aplicar_verificacion_pago_stripe(p_datos jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_pago public.pagos%rowtype; v_traslado public.traslados%rowtype;
  v_estado public.estado_pago; v_siguiente public.estado_traslado; v_id text; v_duplicado boolean;
begin
  if p_datos->>'origen' not in ('webhook','conciliacion') or coalesce(p_datos->>'id','')='' then raise exception 'Verificación inválida.'; end if;
  -- Mismo orden de bloqueo que los flujos de traslado: traslado antes de pago.
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
    v_siguiente := case
      when v_traslado.estado='solicitud_creada' and v_traslado.tipo_pago='anticipado' then 'documentacion_pendiente'::public.estado_traslado
      when v_traslado.estado in ('cotizacion_generada','cotizacion_aceptada') and v_traslado.tipo_pago='anticipado' then 'servicio_confirmado'::public.estado_traslado
      when v_traslado.estado in ('entrega_confirmada','pago_pendiente') then 'pago_completado'::public.estado_traslado
      else null end;
  end if;
  update public.pagos set estado=v_estado,
    stripe_event_id=case when p_datos->>'origen'='webhook' then p_datos->>'id' else stripe_event_id end
  where id=v_pago.id;
  if v_siguiente is not null then update public.traslados set estado=v_siguiente where id=v_traslado.id; end if;
  -- Un estado ya completado no vuelve a generar auditoría de cobro por otro event.id.
  if v_estado is distinct from v_pago.estado or v_siguiente is not null then
    insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
    values(v_pago.traslado_id,'registro_pago','sistema','00000000-0000-0000-0000-000000000000',
      jsonb_build_object('stripe_event_id',p_datos->>'id','stripe_payment_intent_id',p_datos->>'intent_id',
        'origen',p_datos->>'origen','estado_pago',v_estado,'estado_anterior',v_traslado.estado,'estado_nuevo',v_siguiente));
  end if;
  return jsonb_build_object('ok',true,'duplicado',false);
end $$;
revoke all on function public.aplicar_verificacion_pago_stripe(jsonb) from public,anon,authenticated;
grant execute on function public.aplicar_verificacion_pago_stripe(jsonb) to service_role;
-- El RPC legado sin comprobación de proveedor tampoco queda disponible al cliente.
do $$ begin
  if to_regprocedure('public.procesar_pago_stripe(text,text,text)') is not null then
    revoke all on function public.procesar_pago_stripe(text,text,text) from public,anon,authenticated;
  end if;
end $$;

create table public.stripe_conciliacion_ejecuciones (
  id uuid primary key default gen_random_uuid(), nonce_hash text not null,
  estado text not null default 'encolada' check(estado in ('encolada','procesando','completada','fallida')),
  request_id bigint, creada_en timestamptz not null default now(), finalizada_en timestamptz,
  resultado jsonb
);
alter table public.stripe_conciliacion_ejecuciones enable row level security;
revoke all on public.stripe_conciliacion_ejecuciones from public,anon,authenticated;
grant select on public.stripe_conciliacion_ejecuciones to authenticated;
grant all on public.stripe_conciliacion_ejecuciones to service_role;
create policy conciliacion_visible_admin on public.stripe_conciliacion_ejecuciones for select to authenticated using(public.es_admin());
create table private.stripe_conciliacion_config (singleton boolean primary key default true check(singleton),endpoint text not null);
insert into private.stripe_conciliacion_config(endpoint) values('https://asmzetwwwugaoowiukdv.supabase.co/functions/v1/reconciliar-pagos-stripe');

create function public.tomar_ejecucion_conciliacion(p_id uuid,p_nonce text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.stripe_conciliacion_ejecuciones set estado='procesando'
  where id=p_id and estado='encolada' and creada_en>now()-interval '10 minutes'
    and nonce_hash=encode(extensions.digest(p_nonce,'sha256'),'hex');
  return found;
end $$;
revoke all on function public.tomar_ejecucion_conciliacion(uuid,text) from public,anon,authenticated;
grant execute on function public.tomar_ejecucion_conciliacion(uuid,text) to service_role;

create function public.reconciliar_pagos_stripe()
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_nonce text; v_request bigint; v_endpoint text;
begin
  -- No se ocultan las ejecuciones fallidas o perdidas.
  update public.stripe_conciliacion_ejecuciones set estado='fallida',finalizada_en=now(),resultado='{"error":"worker_timeout"}'
  where estado in ('encolada','procesando') and creada_en<now()-interval '10 minutes';
  v_nonce:=encode(extensions.gen_random_bytes(32),'hex');
  select endpoint into strict v_endpoint from private.stripe_conciliacion_config where singleton;
  insert into public.stripe_conciliacion_ejecuciones(nonce_hash) values(encode(extensions.digest(v_nonce,'sha256'),'hex')) returning id into v_id;
  select net.http_post(url:=v_endpoint,headers:='{"Content-Type":"application/json"}'::jsonb,
    body:=jsonb_build_object('ejecucion_id',v_id,'nonce',v_nonce),timeout_milliseconds:=120000) into v_request;
  update public.stripe_conciliacion_ejecuciones set request_id=v_request where id=v_id;
  return v_id;
end $$;
revoke all on function public.reconciliar_pagos_stripe() from public,anon,authenticated;
grant execute on function public.reconciliar_pagos_stripe() to service_role;
