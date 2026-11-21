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

insert into public.conductores (id, auth_user_id, nombre, estado,
  nivel_certificacion, certificacion_pago, calificacion_promedio)
select v, v, k, 'activo'::estado_conductor, 1,
  'estandar'::certificacion_conductor, 5.0
from _ctx where k in ('cond_a', 'cond_b');

insert into public.empresas (id, nombre, estado_verificacion, estado_operativo,
  limite_credito_mxn, credito_disponible_mxn, dias_credito)
values
  (gen_random_uuid(), 'Empresa Test SA', 'pendiente'::estado_verificacion, 'activa', 10000, 10000, 30);

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
-- Test 4: UPDATE directo a conductores bloqueado (GRANT o trigger)
-- ============================================================================
do $$ begin
  begin
    update public.conductores set nivel_certificacion = 99
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir UPDATE de conductores';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%No puedes modificar%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
end $$;
select is(true, true, 'UPDATE conductores bloqueado (GRANT o trigger)');

-- ============================================================================
-- Test 5: UPDATE de certificacion_pago bloqueado
-- ============================================================================
do $$ begin
  begin
    update public.conductores set certificacion_pago = 'premium'::certificacion_conductor
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir UPDATE de certificacion_pago';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%No puedes modificar%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
end $$;
select is(true, true, 'UPDATE certificacion_pago bloqueado');

-- ============================================================================
-- Test 6: UPDATE de auth_user_id bloqueado
-- ============================================================================
do $$ begin
  begin
    update public.conductores set auth_user_id = gen_random_uuid()
    where auth_user_id = (select v from _ctx where k = 'cond_a');
    raise exception 'NO debió permitir UPDATE de auth_user_id';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%No puedes modificar%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
end $$;
select is(true, true, 'UPDATE auth_user_id bloqueado');

-- ============================================================================
-- Test 7: operador NO puede DELETE conductores
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_op'));
with r as (
  delete from public.conductores
  where auth_user_id = (select v from _ctx where k = 'cond_a') returning 1
)
select is((select count(*) from r), 0::bigint, 'operador NO puede DELETE conductores');
-- ============================================================================
-- Test 8: compliance NO puede DELETE conductores
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
  with r as (
  delete from public.conductores
  where auth_user_id = (select v from _ctx where k = 'cond_a') returning 1
)
select is((select count(*) from r), 0::bigint, 'operador NO puede DELETE conductores');
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
-- Test 12: superadmin SÍ puede cambiar limite_credito_mxn
-- ============================================================================
select pg_temp.actuar_como_superadmin((select v from _ctx where k = 'superadmin'));
with r as (
  update public.empresas set limite_credito_mxn = 999999999 returning 1
)
select is((select count(*) from r), 1::bigint, 'superadmin SÍ puede cambiar limite_credito_mxn');
select * from finish();
rollback;