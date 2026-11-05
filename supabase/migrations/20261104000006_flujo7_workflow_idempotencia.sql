-- RUUM-USR-F7-001: workflow durable, idempotencia y reserva de cobro.
alter table public.checkout_traslados_masivos
  add column if not exists idempotency_key text,
  add column if not exists route_hash text,
  add column if not exists pago_reservado_en timestamptz,
  add column if not exists workflow_estado text not null default 'cotizado',
  add column if not exists workflow_ultimo_error text,
  add column if not exists workflow_actualizado_en timestamptz not null default now();

update public.checkout_traslados_masivos
set idempotency_key = coalesce(nullif(idempotency_key, ''), id::text),
    route_hash = coalesce(nullif(route_hash, ''), encode(extensions.digest(id::text, 'sha256'), 'hex'))
where idempotency_key is null or route_hash is null;

alter table public.checkout_traslados_masivos
  alter column idempotency_key set not null,
  alter column route_hash set not null;

create unique index if not exists checkout_masivo_usuario_idempotency_uidx
  on public.checkout_traslados_masivos (auth_user_id, idempotency_key);
create unique index if not exists checkout_masivo_payment_intent_uidx
  on public.checkout_traslados_masivos (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create index if not exists checkout_masivo_workflow_pendiente_idx
  on public.checkout_traslados_masivos (workflow_estado, workflow_actualizado_en)
  where pagado_en is null and expirado_en is null;

create table if not exists public.checkout_masivo_checkpoints (
  checkout_id uuid primary key references public.checkout_traslados_masivos(id) on delete cascade,
  estado text not null default 'cotizado' check (estado in ('cotizado','reserva_pago','payment_intent_creado','pago_confirmado','generando','completado','error_reconciliable','error_permanente')),
  intentos integer not null default 0 check (intentos >= 0),
  ultimo_error text,
  disponible_en timestamptz not null default now(),
  bloqueado_hasta timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.checkout_masivo_checkpoints enable row level security;
revoke all on public.checkout_masivo_checkpoints from anon, authenticated;
grant all on public.checkout_masivo_checkpoints to service_role;

create or replace function public.reservar_checkout_masivo(
  p_id uuid, p_auth_user_id uuid, p_idempotency_key text, p_route_hash text, p_monto_centavos bigint
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.checkout_traslados_masivos%rowtype;
begin
  select * into strict v from public.checkout_traslados_masivos where id = p_id and auth_user_id = p_auth_user_id for update;
  if v.monto_centavos <> p_monto_centavos then raise exception 'checkout_amount_changed'; end if;
  if v.idempotency_key <> p_idempotency_key then raise exception 'checkout_idempotency_mismatch'; end if;
  if v.stripe_payment_intent_id is not null then
    return jsonb_build_object('estado','payment_intent_existente','payment_intent_id',v.stripe_payment_intent_id);
  end if;
  if v.pago_reservado_en is not null and v.pago_reservado_en > now() - interval '15 minutes' then
    return jsonb_build_object('estado','en_progreso');
  end if;
  update public.checkout_traslados_masivos
    set route_hash = p_route_hash, pago_reservado_en = now(), workflow_estado = 'reserva_pago', workflow_actualizado_en = now()
    where id = v.id;
  insert into public.checkout_masivo_checkpoints(checkout_id, estado, intentos, disponible_en, actualizado_en)
    values (v.id, 'reserva_pago', 0, now(), now())
    on conflict (checkout_id) do update set estado = 'reserva_pago', actualizado_en = now(), disponible_en = now(), ultimo_error = null;
  return jsonb_build_object('estado','reservado');
end $$;

create or replace function public.vincular_checkout_masivo_payment_intent(p_id uuid, p_auth_user_id uuid, p_intent text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.checkout_traslados_masivos
    set stripe_payment_intent_id = p_intent, pago_reservado_en = null, workflow_estado = 'payment_intent_creado', workflow_actualizado_en = now()
    where id = p_id and auth_user_id = p_auth_user_id and stripe_payment_intent_id is null;
  if not found then return false; end if;
  update public.checkout_masivo_checkpoints set estado = 'payment_intent_creado', actualizado_en = now() where checkout_id = p_id;
  return true;
end $$;

create or replace function public.registrar_checkout_pago_confirmado(p_id uuid, p_intent text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.checkout_traslados_masivos set workflow_estado = 'pago_confirmado', workflow_actualizado_en = now()
    where id = p_id and stripe_payment_intent_id = p_intent and pagado_en is null;
  if not found then return false; end if;
  insert into public.checkout_masivo_checkpoints(checkout_id, estado, actualizado_en)
    values (p_id, 'pago_confirmado', now())
    on conflict (checkout_id) do update set estado = 'pago_confirmado', actualizado_en = now(), ultimo_error = null;
  return true;
end $$;

create or replace function public.reclamar_checkpoints_checkout_masivo(p_lote integer default 25)
returns table(checkout_id uuid, intent_id text, intentos integer) language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query
  with candidatos as (
    select c.checkout_id from public.checkout_masivo_checkpoints c
    join public.checkout_traslados_masivos x on x.id = c.checkout_id
    where c.estado in ('payment_intent_creado','pago_confirmado','error_reconciliable')
      and x.pagado_en is null and x.expirado_en is null
      and c.disponible_en <= now() and (c.bloqueado_hasta is null or c.bloqueado_hasta < now())
    order by c.actualizado_en
    limit greatest(1, least(p_lote, 100))
    for update of c skip locked
  ), actualizados as (
    update public.checkout_masivo_checkpoints c set bloqueado_hasta = now() + interval '2 minutes', intentos = c.intentos + 1, actualizado_en = now()
      from candidatos k where c.checkout_id = k.checkout_id returning c.checkout_id, c.intentos
  )
  select a.checkout_id, x.stripe_payment_intent_id, a.intentos from actualizados a join public.checkout_traslados_masivos x on x.id = a.checkout_id;
end $$;

create or replace function public.marcar_checkpoint_checkout_masivo(p_id uuid, p_estado text, p_error text default null, p_reintentar_en timestamptz default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.checkout_masivo_checkpoints set estado = p_estado, ultimo_error = left(p_error, 1000), disponible_en = coalesce(p_reintentar_en, now()), bloqueado_hasta = null, actualizado_en = now() where checkout_id = p_id;
  update public.checkout_traslados_masivos set workflow_estado = p_estado, workflow_ultimo_error = left(p_error, 1000), workflow_actualizado_en = now() where id = p_id;
end $$;

revoke all on function public.reservar_checkout_masivo(uuid,uuid,text,text,bigint), public.vincular_checkout_masivo_payment_intent(uuid,uuid,text), public.registrar_checkout_pago_confirmado(uuid,text), public.reclamar_checkpoints_checkout_masivo(integer), public.marcar_checkpoint_checkout_masivo(uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.reservar_checkout_masivo(uuid,uuid,text,text,bigint), public.vincular_checkout_masivo_payment_intent(uuid,uuid,text), public.registrar_checkout_pago_confirmado(uuid,text), public.reclamar_checkpoints_checkout_masivo(integer), public.marcar_checkpoint_checkout_masivo(uuid,text,text,timestamptz) to service_role;
