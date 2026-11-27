begin;
select plan(15);

-- ============================================================================
-- Setup
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a',       gen_random_uuid()),
  ('user_b',       gen_random_uuid()),
  ('admin_comp',   gen_random_uuid()),
  ('superadmin',   gen_random_uuid()),
  ('vehiculo',     gen_random_uuid()),
  ('traslado',     gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt50.test' from _ctx
where k in ('user_a', 'user_b', 'admin_comp', 'superadmin');

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k in ('user_a', 'user_b');

insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k, 'compliance'::rol_admin_operativo from _ctx
where k = 'admin_comp';

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
values (
  (select v from _ctx where k = 'vehiculo'),
  (select v from _ctx where k = 'user_a'),
  'sedan', 'Nissan', 'Versa', 2024
);

insert into public.traslados (
  id, usuario_id, vehiculo_id, clave_idempotencia, contacto_entrega_nombre,
  contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad
) values (
  (select v from _ctx where k = 'traslado'),
  (select v from _ctx where k = 'user_a'),
  (select v from _ctx where k = 'vehiculo'),
  gen_random_uuid(), 'Entrega', '5500000001', 'Recepción', '5500000002',
  'Origen', 'CDMX', 'Destino', 'Toluca'
);

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
    jsonb_build_object(
      'sub', p_auth_id,
      'role', 'authenticated',
      'app_metadata', jsonb_build_object('role', 'superadmin')
    )::text, true);
end;
$$;

set local role authenticated;

-- ============================================================================
-- Tests 1-2: Aislamiento SELECT
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));

select is(
  (select count(*) from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_b')),
  0::bigint, 'user_a no ve user_b');

select is(
  (select count(*) from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a')),
  1::bigint, 'user_a ve su propio registro');

-- ============================================================================
-- Test 3: UPDATE propio (nombre no sensible)
-- ============================================================================
with r as (
  update public.usuarios set nombre = 'Alice Updated'
  where auth_user_id = (select v from _ctx where k = 'user_a') returning 1
)
select is((select count(*) from r), 1::bigint, 'user_a puede actualizar su nombre');

-- ============================================================================
-- Tests 4-5: Exception del trigger en columnas sensibles
-- ============================================================================
do $$ begin
  begin
    update public.usuarios set rol = 'titular_empresa'::rol_usuario
    where auth_user_id = (select v from _ctx where k = 'user_a');
    raise exception 'NO debió permitir cambiar rol';
  exception when others then
    if sqlerrm not like '%No puedes modificar rol%' then raise; end if;
  end;
end $$;
select is(true, true, 'user_a NO puede cambiar rol');

do $$ begin
  begin
    update public.usuarios set tipo_cuenta = 'empresa'
    where auth_user_id = (select v from _ctx where k = 'user_a');
    raise exception 'NO debió permitir cambiar tipo_cuenta';
  exception when others then
    if sqlerrm not like '%No puedes modificar tipo_cuenta%' then raise; end if;
  end;
end $$;
select is(true, true, 'user_a NO puede cambiar tipo_cuenta');

-- ============================================================================
-- Test 6: UPDATE de user_b bloqueado por RLS
-- ============================================================================
with r as (
  update public.usuarios set nombre = 'hack'
  where auth_user_id = (select v from _ctx where k = 'user_b') returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a no puede modificar user_b');

-- ============================================================================
-- Test 7: Compliance lee ambos
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));

select is(
  (select count(*) from public.usuarios
   where auth_user_id in (select v from _ctx where k in ('user_a','user_b'))),
  2::bigint, 'compliance lee ambos usuarios');

-- ============================================================================
-- Test 8: Compliance NO puede cambiar rol (trigger)
-- ============================================================================
do $$ begin
  begin
    update public.usuarios set rol = 'titular_empresa'::rol_usuario
    where auth_user_id = (select v from _ctx where k = 'user_a');
    raise exception 'NO debió permitir a compliance cambiar rol';
  exception when others then
    if sqlerrm not like '%No puedes modificar rol%' then raise; end if;
  end;
end $$;
select is(true, true, 'compliance NO puede cambiar rol (bloqueado por trigger)');

-- ============================================================================
-- Test 9: Superadmin lee todos
-- ============================================================================
select pg_temp.actuar_como_superadmin((select v from _ctx where k = 'superadmin'));

select is(
  (select count(*) from public.usuarios
   where auth_user_id in (select v from _ctx where k in ('user_a','user_b'))),
  2::bigint, 'superadmin lee todos');

-- ============================================================================
-- Test 10: Superadmin SÍ puede cambiar rol
-- ============================================================================
with r as (
  update public.usuarios set rol = 'usuario_autorizado'::rol_usuario
  where auth_user_id = (select v from _ctx where k = 'user_a') returning 1
)
select is((select count(*) from r), 1::bigint, 'superadmin SÍ puede cambiar rol');

-- La vista de Inicio y Mis traslados conserva el aislamiento y el cálculo
-- sigue disponible para el servicio sin convertirse en una RPC de usuario.
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));
select is(
  (select to_jsonb(p)->>'traslado_id' from public.pasaporte_digital p
   where p.traslado_id = (select v from _ctx where k = 'traslado')),
  (select v::text from _ctx where k = 'traslado'), 'user_a lee el pasaporte propio completo');

select pg_temp.actuar_como((select v from _ctx where k = 'user_b'));
select is(
  (select to_jsonb(p)->>'traslado_id' from public.pasaporte_digital p
   where p.traslado_id = (select v from _ctx where k = 'traslado')),
  null::text, 'user_b no lee el pasaporte ajeno');

select ok(not has_function_privilege('authenticated',
  'public.calcular_pago_conductor(public.certificacion_conductor,numeric)', 'execute'),
  'authenticated no tiene EXECUTE en la RPC pública de cálculo');
select ok(not has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated no tiene acceso directo al esquema private');
select ok(has_function_privilege('service_role',
  'public.calcular_pago_conductor(public.certificacion_conductor,numeric)', 'execute'),
  'service_role conserva la RPC pública de cálculo');

select * from finish();
rollback;
