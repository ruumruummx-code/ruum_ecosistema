-- Corrige la detección de `service_role` y roles administrativos de BD en los
-- triggers de protección de columnas financieras (`proteger_columnas_sensibles_*`).
--
-- Antes solo se comprobaba `auth.jwt() ->> 'role' = 'service_role'`, lo que
-- fallaba cuando `service_role` ejecutaba RPCs (p. ej. `procesar_pago_stripe`)
-- desde conexiones internas sin JWT HTTP (psql, pg_cron, dblink o tests SQL).
-- Se mantiene el bloqueo estricto para `authenticated` y `anon` incluso si
-- `session_user` es `postgres`/`supabase_admin` (pruebas pgTAP con SET LOCAL ROLE).

begin;

create or replace function public.proteger_columnas_sensibles_pago()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin()
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or current_setting('role', true) = 'service_role'
    or (
      session_user in ('postgres', 'supabase_admin')
      and coalesce(nullif(current_setting('role', true), 'none'), '') in ('', 'postgres', 'supabase_admin', 'service_role')
    );
  if v_bypass then return new; end if;

  if new.monto is distinct from old.monto then
    raise exception 'No puedes modificar monto de pago';
  end if;
  if new.comision_mxn is distinct from old.comision_mxn then
    raise exception 'No puedes modificar comision_mxn';
  end if;
  if new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id then
    raise exception 'No puedes modificar stripe_payment_intent_id';
  end if;
  if new.stripe_event_id is distinct from old.stripe_event_id then
    raise exception 'No puedes modificar stripe_event_id';
  end if;
  if new.stripe_verificado_en is distinct from old.stripe_verificado_en then
    raise exception 'No puedes modificar stripe_verificado_en';
  end if;
  if new.stripe_livemode is distinct from old.stripe_livemode then
    raise exception 'No puedes modificar stripe_livemode';
  end if;
  return new;
end;
$$;

create or replace function public.proteger_columnas_sensibles_payout()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin()
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or current_setting('role', true) = 'service_role'
    or (
      session_user in ('postgres', 'supabase_admin')
      and coalesce(nullif(current_setting('role', true), 'none'), '') in ('', 'postgres', 'supabase_admin', 'service_role')
    );
  if v_bypass then return new; end if;

  if new.monto_bruto is distinct from old.monto_bruto then
    raise exception 'No puedes modificar monto_bruto';
  end if;
  if new.ajustes is distinct from old.ajustes then
    raise exception 'No puedes modificar ajustes';
  end if;
  if new.monto_neto is distinct from old.monto_neto then
    raise exception 'No puedes modificar monto_neto';
  end if;
  if new.referencia_externa_validada is distinct from old.referencia_externa_validada then
    raise exception 'No puedes modificar referencia_externa_validada';
  end if;
  return new;
end;
$$;

create or replace function public.proteger_columnas_sensibles_datos_bancarios()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin()
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or current_setting('role', true) = 'service_role'
    or (
      session_user in ('postgres', 'supabase_admin')
      and coalesce(nullif(current_setting('role', true), 'none'), '') in ('', 'postgres', 'supabase_admin', 'service_role')
    );
  if v_bypass then return new; end if;

  if new.clabe is distinct from old.clabe then
    raise exception 'No puedes modificar clabe';
  end if;
  if new.numero_tarjeta is distinct from old.numero_tarjeta then
    raise exception 'No puedes modificar numero_tarjeta';
  end if;
  if new.titular_cuenta is distinct from old.titular_cuenta then
    raise exception 'No puedes modificar titular_cuenta';
  end if;
  if new.banco is distinct from old.banco then
    raise exception 'No puedes modificar banco';
  end if;
  return new;
end;
$$;

commit;
