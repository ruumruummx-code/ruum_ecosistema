begin;
select plan(12);

-- ============================================================================
-- Setup
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a',     gen_random_uuid()),
  ('user_b',     gen_random_uuid()),
  ('cond_a',     gen_random_uuid()),
  ('cond_b',     gen_random_uuid()),
  ('admin_comp', gen_random_uuid()),
  ('admin_op',   gen_random_uuid()),
  ('superadmin', gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt52.test' from _ctx;

-- Conductores
insert into public.conductores (id, auth_user_id, nombre, estado,
  nivel_certificacion, certificacion_pago, calificacion_promedio)
select v, v, k, 'activo'::estado_conductor, 1,
  'estandar'::certificacion_conductor, 5.0
from _ctx where k in ('cond_a', 'cond_b');

-- Empresas
insert into public.empresas (id, nombre, estado_verificacion, estado_operativo,
  limite_credito_mxn, credito_disponible_mxn, dias_credito)
values
  (gen_random_uuid(), 'Empresa Test SA', 'pendiente'::estado_verificacion, 'activa', 10000, 10000, 30);

-- Admin
insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k,
  case k
    when 'admin_comp' then 'compliance'::rol_admin_operativo
    when 'admin_op'   then 'operador'::rol_admin_operativo
  end
from _ctx where k like 'admin_%';

grant select on _ctx to authenticated;

create function pg_temp.actuar_como(p_auth_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', p_auth_id, 'role', 'authenticated')::text, true);
end;
$$;

create function pg_temp.actuar_como_superadmin(p_auth_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', p_auth_id, 'role', 'authenticated',
      'app_metadata', jsonb_build_object('role', 'superadmin'))::text, true);
end;
$$;

set local role authenticated;

-- ============================================================================
-- Test 1: cond_a ve su propio registro
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'cond_a'));
select is(
  (select count(*) from public.conductores
   where auth_user_id = (select v from _ctx where k = 'cond_a')),
  1::bigint, 'cond_a ve su propio registro');

-- ============================================================================
-- Test 2: cond_a NO ve cond_b
-- ============================================================================
select is(
  (select count(*) from public.conductores
   where auth_user_id = (select v from _ctx where k = 'cond_b')),
  0::bigint, 'cond_a NO ve cond_b');

-- ============================================================================
-- Test 3: compliance ve ambos conductores
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.conductores
   where auth_user_id in (select v from _ctx where k in ('cond_a','cond_b'))),
  2::bigint, 'compliance ve ambos conductores');

-- ============================================================================
-- Test 4: compliance NO puede cambiar nivel_certificacion (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.conductores set nivel_certificacion = 99
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir cambiar nivel_certificacion';
  exception when others then
    if sqlerrm not like '%No puedes modificar nivel_certificacion%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar nivel_certificacion');

-- ============================================================================
-- Test 5: compliance NO puede cambiar certificacion_pago (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.conductores set certificacion_pago = 'premium'::certificacion_conductor
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir cambiar certificacion_pago';
  exception when others then
    if sqlerrm not like '%No puedes modificar certificacion_pago%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar certificacion_pago');

-- ============================================================================
-- Test 6: compliance NO puede cambiar auth_user_id (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.conductores set auth_user_id = gen_random_uuid()
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir cambiar auth_user_id';
  exception when others then
    if sqlerrm not like '%No puedes modificar auth_user_id%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar auth_user_id');

-- ============================================================================
-- Test 7: operador (sin conductores:validar) NO puede UPDATE conductores
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_op'));
select is(
  (with r as (
    update public.conductores set estado = 'suspendido_7d'::estado_conductor
    where auth_user_id = (select v from _ctx where k = 'cond_a') returning 1
  ) select count(*) from r),
  0::bigint, 'operador NO puede UPDATE conductores (sin :validar)');

-- ============================================================================
-- Test 8: compliance NO puede DELETE conductores
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (with r as (
    delete from public.conductores
    where auth_user_id = (select v from _ctx where k = 'cond_a') returning 1
  ) select count(*) from r),
  0::bigint, 'compliance NO puede DELETE conductores');

-- ============================================================================
-- Test 9: usuario normal NO ve empresas
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));
select is(
  (select count(*) from public.empresas),
  0::bigint, 'user_a NO ve empresas');

-- ============================================================================
-- Test 10: compliance ve empresas
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.empresas),
  1::bigint, 'compliance ve empresas');

-- ============================================================================
-- Test 11: compliance NO puede cambiar limite_credito_mxn (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.empresas set limite_credito_mxn = 999999999;
    raise exception 'NO debió permitir cambiar limite_credito_mxn';
  exception when others then
    if sqlerrm not like '%No puedes modificar limite_credito_mxn%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar limite_credito_mxn');

-- ============================================================================
-- Test 12: superadmin puede cambiar nivel_certificacion
-- ============================================================================
select pg_temp.actuar_como_superadmin((select v from _ctx where k = 'superadmin'));
select is(
  (with r as (
    update public.conductores set nivel_certificacion = 2
    where auth_user_id = (select v from _ctx where k = 'cond_a') returning 1
  ) select count(*) from r),
  1::bigint, 'superadmin SÍ puede cambiar nivel_certificacion');

select * from finish();
rollback;