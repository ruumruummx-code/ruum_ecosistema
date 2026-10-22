-- RT-67 — Una cuenta de rol `usuario` no puede leer, insertar ni actualizar las
-- tablas del conductor.
--
-- Contexto: el gate de rol del middleware de app-conductor es fail-open a
-- propósito (si `clasificarRolApp` falla por red, el conductor en ruta no debe
-- quedar bloqueado). Este test es lo que realmente respalda ese fail-open: si
-- una cuenta de rol `usuario` pudiera tocar las tablas del conductor, el
-- fail-open sería una vía de escalamiento.
--
-- Criterio de terminado: el test corre en CI (job `sql`: `supabase test db test`).

create extension if not exists pgtap with schema extensions;

begin;

select plan(16);

-- ── Fixtures ────────────────────────────────────────────────────────────────
-- raw_user_meta_data = '{}' evita el trigger de alta (que crea solicitudes) y
-- deja el escenario bajo control: una cuenta de rol usuario y una de rol conductor.
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('96700000-0000-4000-8000-000000000001','rt67-usuario@local.test',now(),'{}','{}',now(),now()),
  ('96700000-0000-4000-8000-000000000002','rt67-conductor@local.test',now(),'{}','{}',now(),now());

insert into public.usuarios(id,auth_user_id,tipo_cuenta,rol,estado_verificacion)
values (
  '96700000-0000-4000-8000-000000000101',
  '96700000-0000-4000-8000-000000000001',
  'personal','personal','verificado'
);

insert into public.conductores(id,auth_user_id,nombre,estado)
values (
  '96700000-0000-4000-8000-000000000201',
  '96700000-0000-4000-8000-000000000002',
  'Conductor RT-67','activo'
);

insert into public.preferencias_conductor(conductor_id,notificaciones_push)
values ('96700000-0000-4000-8000-000000000201', true);

insert into public.payouts_conductor(conductor_id,periodo_inicio,periodo_fin,monto_bruto,monto_neto)
values ('96700000-0000-4000-8000-000000000201', current_date - 30, current_date - 1, 1000, 1000);

insert into public.documentos_conductor(conductor_id,tipo,nombre_archivo,url,estado)
values (
  '96700000-0000-4000-8000-000000000201',
  'licencia_frente','licencia-rt67.jpg','rt67/licencia-rt67.jpg','en_revision'
);

-- ── 1. Una cuenta de rol usuario NO LEE tablas del conductor ────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub','96700000-0000-4000-8000-000000000001',true);

select is(
  (select count(*) from public.conductores)::int,
  0,
  'RT-67.1: la cuenta de rol usuario no lee public.conductores'
);

select is(
  (select count(*) from public.preferencias_conductor)::int,
  0,
  'RT-67.2: la cuenta de rol usuario no lee public.preferencias_conductor'
);

select is(
  (select count(*) from public.payouts_conductor)::int,
  0,
  'RT-67.3: la cuenta de rol usuario no lee public.payouts_conductor'
);

select is(
  (select count(*) from public.documentos_conductor)::int,
  0,
  'RT-67.4: la cuenta de rol usuario no lee public.documentos_conductor'
);

select is(
  (select count(*) from public.solicitudes_conductor)::int,
  0,
  'RT-67.5: la cuenta de rol usuario no lee public.solicitudes_conductor'
);

-- ── 2. Una cuenta de rol usuario NO INSERTA en tablas del conductor ─────────
select throws_ok(
  $$ insert into public.conductores(auth_user_id, nombre) values ('96700000-0000-4000-8000-000000000001'::uuid, 'Autoproclamado') $$,
  '42501', null,
  'RT-67.6: la cuenta de rol usuario no puede crear su propio perfil de conductor'
);

select throws_ok(
  $$ insert into public.preferencias_conductor(conductor_id) values ('96700000-0000-4000-8000-000000000201'::uuid) $$,
  '42501', null,
  'RT-67.7: la cuenta de rol usuario no inserta preferencias de otro conductor'
);

select throws_ok(
  $$ insert into public.payouts_conductor(conductor_id, periodo_inicio, periodo_fin, monto_bruto, monto_neto)
     values ('96700000-0000-4000-8000-000000000201'::uuid, current_date - 30, current_date - 1, 500, 500) $$,
  '42501', null,
  'RT-67.8: la cuenta de rol usuario no inserta pagos de conductor'
);

select throws_ok(
  $$ insert into public.documentos_conductor(conductor_id, tipo, nombre_archivo, url)
     values ('96700000-0000-4000-8000-000000000201'::uuid, 'licencia_frente', 'intruso.jpg', 'rt67/intruso.jpg') $$,
  '42501', null,
  'RT-67.9: la cuenta de rol usuario no inserta documentos de conductor'
);

-- ── 3. Una cuenta de rol usuario NO ACTUALIZA tablas del conductor ──────────
-- El UPDATE directo sobre public.conductores está revocado (RT-03): 42501.
select throws_ok(
  $$ update public.conductores set nombre = 'Manipulado' where id = '96700000-0000-4000-8000-000000000201'::uuid $$,
  '42501', null,
  'RT-67.10: la cuenta de rol usuario no actualiza public.conductores'
);

-- En el resto de tablas el RLS filtra la fila (0 filas afectadas, sin error).
update public.preferencias_conductor
   set notificaciones_push = false
 where conductor_id = '96700000-0000-4000-8000-000000000201';

update public.payouts_conductor
   set monto_neto = 999999
 where conductor_id = '96700000-0000-4000-8000-000000000201';

update public.documentos_conductor
   set estado = 'aprobado'
 where conductor_id = '96700000-0000-4000-8000-000000000201';

reset role;

-- Comprobado como superusuario: ninguna de esas mutaciones se aplicó.
select is(
  (select notificaciones_push from public.preferencias_conductor where conductor_id = '96700000-0000-4000-8000-000000000201'),
  true,
  'RT-67.11: las preferencias del conductor quedaron intactas'
);

select is(
  (select monto_neto from public.payouts_conductor where conductor_id = '96700000-0000-4000-8000-000000000201')::numeric,
  1000::numeric,
  'RT-67.12: el pago del conductor quedó intacto'
);

select is(
  (select estado from public.documentos_conductor where conductor_id = '96700000-0000-4000-8000-000000000201'),
  'en_revision',
  'RT-67.13: el documento del conductor quedó intacto'
);

-- ── 4. Control: el conductor legítimo sí opera sobre sus propias filas ──────
set local role authenticated;
select set_config('request.jwt.claim.sub','96700000-0000-4000-8000-000000000002',true);

select is(
  (select count(*) from public.conductores)::int,
  1,
  'RT-67.14: el conductor ve su propio registro'
);

select is(
  (select count(*) from public.preferencias_conductor)::int,
  1,
  'RT-67.15: el conductor ve sus preferencias'
);

select lives_ok(
  $$ update public.preferencias_conductor set notificaciones_push = false where conductor_id = '96700000-0000-4000-8000-000000000201' $$,
  'RT-67.16: el conductor puede actualizar sus propias preferencias'
);

reset role;

select * from finish();

rollback;
