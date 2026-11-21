begin;
select plan(13);

-- ============================================================================
-- Setup
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a', gen_random_uuid()),
  ('user_b', gen_random_uuid()),
  ('cond_a', gen_random_uuid()),
  ('cond_b', gen_random_uuid()),
  ('admin_fin', gen_random_uuid()),
  ('admin_comp', gen_random_uuid()),
  ('admin_op', gen_random_uuid()),
  ('superadmin', gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt51.test' from _ctx;

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k in ('user_a', 'user_b');

insert into public.conductores (id, auth_user_id, nombre, estado)
select v, v, k, 'activo'::estado_conductor from _ctx
where k in ('cond_a', 'cond_b');

insert into public.datos_bancarios_conductor (id, conductor_id, titular_cuenta, banco, clabe, estado)
select gen_random_uuid(), v, 'Titular ' || k, 'BBVA', '012345678901234567',
  'en_revision'::estado_datos_bancarios_conductor
from _ctx where k in ('cond_a', 'cond_b');

insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k,
  case k
    when 'admin_fin'  then 'finanzas'::rol_admin_operativo
    when 'admin_comp' then 'compliance'::rol_admin_operativo
    when 'admin_op'   then 'operador'::rol_admin_operativo
  end
from _ctx where k like 'admin_%';

-- Vehículos (1 por usuario)
insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select gen_random_uuid(), u.id, 'sedan'::tipo_vehiculo, 'Test', 'Model', 2024
from public.usuarios u
where u.auth_user_id in (select v from _ctx where k in ('user_a','user_b'));

-- Traslados (1 por usuario)
insert into public.traslados (id, usuario_id, vehiculo_id, clave_idempotencia,
  contacto_entrega_nombre, contacto_entrega_telefono,
  contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad)
select gen_random_uuid(), u.id, v.id, gen_random_uuid(),
  'Entrega', '5500000001', 'Recepción', '5500000002',
  'Origen', 'CDMX', 'Destino', 'Toluca'
from public.usuarios u
join public.vehiculos v on v.usuario_id = u.id
where u.auth_user_id in (select v from _ctx where k in ('user_a','user_b'));

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
-- Test 1: finanzas ve 0 pagos al inicio
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_fin'));
select is(
  (select count(*) from public.pagos),
  0::bigint, 'finanzas ve 0 pagos al inicio');

-- ============================================================================
-- Insertar pago como postgres (setup)
-- ============================================================================
reset role;
insert into public.pagos (id, traslado_id, monto, momento, estado, metodo)
select gen_random_uuid(), t.id, 100, 'anticipado'::momento_pago, 'pendiente'::estado_pago, 'stripe'
from public.traslados t
where t.usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'))
limit 1;
set local role authenticated;

-- Reactivar JWT admin_fin (set local role authenticated no preserva)
select pg_temp.actuar_como((select v from _ctx where k = 'admin_fin'));

-- ============================================================================
-- Test 2: finanzas ve 1 pago tras insert
-- ============================================================================
select is(
  (select count(*) from public.pagos),
  1::bigint, 'finanzas ve 1 pago tras insert');

-- ============================================================================
-- Test 3: finanzas puede UPDATE estado
-- ============================================================================
with r as (
  update public.pagos set estado = 'completado'::estado_pago returning 1
)
select is((select count(*) from r), 1::bigint, 'finanzas SÍ puede cambiar estado de pago');

-- ============================================================================
-- Test 4: finanzas NO puede cambiar monto (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.pagos set monto = 999999;
    raise exception 'NO debió permitir cambiar monto';
  exception when others then
    if sqlerrm not like '%No puedes modificar monto de pago%' then raise; end if;
  end;
end $$;
select is(true, true, 'finanzas NO puede cambiar monto directamente');

-- ============================================================================
-- Test 5: compliance NO lee pagos
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.pagos),
  0::bigint, 'compliance NO puede leer pagos (sin pagos:leer)');

-- ============================================================================
-- Test 6: operador NO lee payouts
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_op'));
select is(
  (select count(*) from public.payouts_conductor),
  0::bigint, 'operador NO puede leer payouts');

-- ============================================================================
-- Test 7: cond_a ve sus propios datos bancarios
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'cond_a'));
select is(
  (select count(*) from public.datos_bancarios_conductor
   where conductor_id = (select id from public.conductores where auth_user_id = (select v from _ctx where k = 'cond_a'))),
  1::bigint, 'cond_a ve sus propios datos bancarios');

-- ============================================================================
-- Test 8: cond_a NO ve datos bancarios de cond_b
-- ============================================================================
select is(
  (select count(*) from public.datos_bancarios_conductor
   where conductor_id = (select id from public.conductores where auth_user_id = (select v from _ctx where k = 'cond_b'))),
  0::bigint, 'cond_a NO ve datos bancarios de cond_b');

-- ============================================================================
-- Test 9: compliance lee ambos datos bancarios
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.datos_bancarios_conductor),
  2::bigint, 'compliance lee ambos datos bancarios');

-- ============================================================================
-- Test 10: compliance puede cambiar estado
-- ============================================================================
with r as (
  update public.datos_bancarios_conductor set estado = 'verificada'::estado_datos_bancarios_conductor
  where conductor_id = (select id from public.conductores where auth_user_id = (select v from _ctx where k = 'cond_a'))
  returning 1
)
select is((select count(*) from r), 1::bigint, 'compliance SÍ puede aprobar datos bancarios');

-- ============================================================================
-- Test 11: compliance NO puede cambiar clabe (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.datos_bancarios_conductor set clabe = '999999999999999999'
    where conductor_id = (select id from public.conductores where auth_user_id = (select v from _ctx where k = 'cond_a'));
    raise exception 'NO debió permitir cambiar clabe';
  exception when others then
    if sqlerrm not like '%No puedes modificar clabe%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar clabe');

-- ============================================================================
-- Test 12: operador NO lee datos bancarios
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_op'));
select is(
  (select count(*) from public.datos_bancarios_conductor),
  0::bigint, 'operador NO puede leer datos bancarios');

-- ============================================================================
-- Test 13: superadmin lee pagos
-- ============================================================================
select pg_temp.actuar_como_superadmin((select v from _ctx where k = 'superadmin'));
select is(
  (select count(*) from public.pagos),
  1::bigint, 'superadmin lee pagos');

select * from finish();
rollback;