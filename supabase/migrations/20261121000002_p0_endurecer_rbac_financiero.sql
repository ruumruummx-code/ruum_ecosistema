-- P0: Endurecer RLS en tablas financieras
-- Bugs corregidos:
--   1. `admin_acceso_total_pagos` era ALL con with_check=NULL
--      → admin con solo pagos:leer podía UPDATE/DELETE/INSERT
--   2. `admin_acceso_total_payouts` era ALL con es_admin()
--      → cualquier admin (incluido operador) podía modificar payouts
--   3. `admin_acceso_total_datos_bancarios` era ALL con es_admin()
--      → cualquier admin podía modificar CLABE/tarjeta de conductores

begin;

-- ============================================================================
-- PAGOS
-- ============================================================================
drop policy if exists "admin_acceso_total_pagos" on public.pagos;

create policy "admin_lee_pagos" on public.pagos
  for select to authenticated
  using (
    admin_tiene_permiso('pagos:leer')
    or admin_tiene_permiso('pagos:ejecutar')
    or admin_tiene_permiso('pagos:exportar')
  );

create policy "admin_actualiza_pagos" on public.pagos
  for update to authenticated
  using (admin_tiene_permiso('pagos:ejecutar'))
  with check (admin_tiene_permiso('pagos:ejecutar'));

-- INSERT/DELETE: sin policy → solo service_role vía RPC

create or replace function public.proteger_columnas_sensibles_pago()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
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

drop trigger if exists proteger_columnas_sensibles_pago on public.pagos;
create trigger proteger_columnas_sensibles_pago
  before update on public.pagos
  for each row execute function public.proteger_columnas_sensibles_pago();

-- ============================================================================
-- PAYOUTS CONDUCTOR
-- ============================================================================
drop policy if exists "admin_acceso_total_payouts" on public.payouts_conductor;

create policy "admin_lee_payouts" on public.payouts_conductor
  for select to authenticated
  using (
    admin_tiene_permiso('pagos:leer')
    or admin_tiene_permiso('pagos:ejecutar')
    or admin_tiene_permiso('pagos:exportar')
  );

create policy "admin_actualiza_payouts" on public.payouts_conductor
  for update to authenticated
  using (admin_tiene_permiso('pagos:ejecutar'))
  with check (admin_tiene_permiso('pagos:ejecutar'));

create or replace function public.proteger_columnas_sensibles_payout()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
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

drop trigger if exists proteger_columnas_sensibles_payout on public.payouts_conductor;
create trigger proteger_columnas_sensibles_payout
  before update on public.payouts_conductor
  for each row execute function public.proteger_columnas_sensibles_payout();

-- ============================================================================
-- DATOS BANCARIOS CONDUCTOR
-- ============================================================================
drop policy if exists "admin_acceso_total_datos_bancarios" on public.datos_bancarios_conductor;

create policy "admin_lee_datos_bancarios" on public.datos_bancarios_conductor
  for select to authenticated
  using (
    admin_tiene_permiso('conductores:validar')
    or admin_tiene_permiso('conductores:sancionar')
  );

-- Solo pueden cambiar estado/motivo_rechazo (aprobación/rechazo). Columnas
-- sensibles protegidas por trigger.
create policy "admin_actualiza_estado_datos_bancarios" on public.datos_bancarios_conductor
  for update to authenticated
  using (admin_tiene_permiso('conductores:validar'))
  with check (admin_tiene_permiso('conductores:validar'));

create or replace function public.proteger_columnas_sensibles_datos_bancarios()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
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

drop trigger if exists proteger_columnas_sensibles_datos_bancarios on public.datos_bancarios_conductor;
create trigger proteger_columnas_sensibles_datos_bancarios
  before update on public.datos_bancarios_conductor
  for each row execute function public.proteger_columnas_sensibles_datos_bancarios();

commit;