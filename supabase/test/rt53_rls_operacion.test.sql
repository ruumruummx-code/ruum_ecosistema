begin;
select plan(16);

-- ============================================================================
-- Setup (igual que antes)
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a',     gen_random_uuid()),
  ('user_b',     gen_random_uuid()),
  ('cond_a',     gen_random_uuid()),
  ('admin_comp', gen_random_uuid()),
  ('admin_sup',  gen_random_uuid()),
  ('admin_fin',  gen_random_uuid()),
  ('superadmin', gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt53.test' from _ctx;

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k in ('user_a', 'user_b');

insert into public.conductores (id, auth_user_id, nombre, estado)
select v, v, k, 'activo'::estado_conductor from _ctx
where k = 'cond_a';

insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k,
  case k
    when 'admin_comp' then 'compliance'::rol_admin_operativo
    when 'admin_sup'  then 'supervisor'::rol_admin_operativo
    when 'admin_fin'  then 'finanzas'::rol_admin_operativo
  end
from _ctx where k like 'admin_%';

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select gen_random_uuid(), u.id, 'sedan'::tipo_vehiculo, 'Test', 'Model', 2024
from public.usuarios u
where u.auth_user_id = (select v from _ctx where k = 'user_a');

insert into public.traslados (id, usuario_id, vehiculo_id, conductor_id, clave_idempotencia,
  contacto_entrega_nombre, contacto_entrega_telefono,
  contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad)
select gen_random_uuid(), u.id, v.id, c.id, gen_random_uuid(),
  'Entrega', '5500000001', 'Recepción', '5500000002',
  'Origen', 'CDMX', 'Destino', 'Toluca'
from public.usuarios u
join public.vehiculos v on v.usuario_id = u.id
join public.conductores c on c.auth_user_id = (select v from _ctx where k = 'cond_a')
where u.auth_user_id = (select v from _ctx where k = 'user_a');

insert into public.disputas (id, traslado_id, abierta_por, tipo, estado, descripcion)
select gen_random_uuid(), t.id, 'usuario'::abierta_por_actor,
  'dano_no_reconocido'::tipo_disputa, 'abierta'::estado_disputa, 'Disputa de prueba'
from public.traslados t
where t.usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'));

insert into public.incidencias (id, traslado_id, tipo, momento, severidad, estado, reportada_por, descripcion)
select gen_random_uuid(), t.id, 'dano_previo_relevante'::tipo_incidencia,
  'durante_traslado'::momento_incidencia, 'medium', 'abierta',
  'usuario'::actor_reporte, 'Incidencia de prueba'
from public.traslados t
where t.usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'));

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
-- TRASLADOS (1-4)
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'admin_fin'));
select is(
  (select count(*) from public.traslados),
  1::bigint, 'finanzas lee traslados (Traslados:leer)');

-- Finanzas NO tiene Traslados:gestionar → UPDATE filtrado por RLS → 0 filas
with r as (
  update public.traslados set contacto_entrega_nombre = 'hack' returning 1
)
select is((select count(*) from r), 0::bigint, 'finanzas NO puede UPDATE traslados (solo :leer)');

-- Supervisor SÍ tiene Traslados:gestionar. Update no-op para no romper tests posteriores.
select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));
with r as (
  update public.traslados set contacto_entrega_nombre = 'Updated' returning 1
)
select is((select count(*) from r), 1::bigint, 'supervisor SÍ puede UPDATE traslados (Traslados:gestionar)');

select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));
select is(
  (select count(*) from public.traslados where usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'))),
  1::bigint, 'user_a ve su traslado');

-- ============================================================================
-- DISPUTAS (5-9)
-- ============================================================================
select is(
  (select count(*) from public.disputas),
  1::bigint, 'user_a ve su disputa');

with r as (
  update public.disputas set estado = 'resuelta'::estado_disputa returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a NO puede auto-resolver su disputa (RLS)');

-- compliance NO tiene disputas:leer en la matrix → 0 disputas
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.disputas),
  0::bigint, 'compliance NO ve disputas (sin disputas:leer)');

-- supervisor SÍ tiene disputas:leer y disputas:resolver
select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));
select is(
  (select count(*) from public.disputas),
  1::bigint, 'supervisor ve disputas (disputas:leer)');

with r as (
  update public.disputas set estado = 'en_revision'::estado_disputa returning 1
)
select is((select count(*) from r), 1::bigint, 'supervisor SÍ puede UPDATE disputas (disputas:resolver)');

-- ============================================================================
-- INCIDENCIAS (10-15)
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'cond_a'));
select is(
  (select count(*) from public.incidencias),
  1::bigint, 'cond_a ve incidencias de su traslado');

with r as (
  update public.incidencias set estado = 'resuelta' returning 1
)
select is((select count(*) from r), 0::bigint, 'cond_a NO puede UPDATE incidencias');

with r as (
  delete from public.incidencias returning 1
)
select is((select count(*) from r), 0::bigint, 'cond_a NO puede DELETE incidencias');

select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.incidencias),
  1::bigint, 'compliance (incidencias:leer) ve incidencias');

with r as (
  update public.incidencias set estado = 'cerrada' returning 1
)
select is((select count(*) from r), 0::bigint, 'compliance NO puede UPDATE incidencias');

select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));
with r as (
  update public.incidencias set estado = 'cerrada' returning 1
)
select is((select count(*) from r), 1::bigint, 'supervisor SÍ puede UPDATE incidencias');

-- ============================================================================
-- SUPERADMIN (16)
-- ============================================================================
select pg_temp.actuar_como_superadmin((select v from _ctx where k = 'superadmin'));
select is(
  (select count(*) from public.traslados),
  1::bigint, 'superadmin lee traslados');

select * from finish();
rollback;