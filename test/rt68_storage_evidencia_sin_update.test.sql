-- RT-68 — El bucket `evidencia` no admite UPDATE.
--
-- Con la cola de evidencia en insert-only (`upsert: false`), ningún flujo de la
-- app necesita actualizar un objeto ya subido: sobrescribir los bytes de una
-- evidencia registrada rompe la cadena de custodia. La policy de UPDATE sobre
-- la carpeta propia del conductor se elimina (migración
-- 20261022000000_quita_update_storage_evidencia).
--
-- Este test fija ese contrato: el conductor PUEDE subir a su carpeta y NO puede
-- actualizar un objeto existente (ni propio).

create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

-- ── Fixtures ────────────────────────────────────────────────────────────────
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('96800000-0000-4000-8000-000000000001','rt68-conductor@local.test',now(),'{}','{}',now(),now()),
  ('96800000-0000-4000-8000-000000000002','rt68-otro@local.test',now(),'{}','{}',now(),now());

-- Objeto ya subido por el conductor (lo que un cliente manipulado querría sobrescribir).
insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
values (
  'evidencia',
  '96800000-0000-4000-8000-000000000001/traslado-1/inicial/frente.jpg',
  '96800000-0000-4000-8000-000000000001'::uuid,
  '96800000-0000-4000-8000-000000000001',
  '{"eTag":"original"}'::jsonb
);

-- ── 1. Contrato declarativo: no queda policy de UPDATE sobre evidencia ─────
select is(
  (select count(*)::int
     from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'conductor_actualiza_su_evidencia_storage'),
  0,
  'RT-68.1: ya no existe la policy de UPDATE de la evidencia del conductor'
);

select is(
  (select count(*)::int
     from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'UPDATE'
      and (coalesce(qual, '') like '%''evidencia''%' or coalesce(with_check, '') like '%''evidencia''%')),
  0,
  'RT-68.2: ninguna policy de UPDATE aplica al bucket evidencia'
);

-- La política de INSERT en la carpeta propia sigue vigente.
select is(
  (select count(*)::int
     from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'conductor_sube_su_evidencia_storage'
      and cmd = 'INSERT'),
  1,
  'RT-68.3: el conductor sigue pudiendo subir a su propia carpeta'
);

-- ── 2. Comportamiento como authenticated (el conductor) ─────────────────────
-- Helper: ejecuta el UPDATE con las privileges del rol actual (authenticated)
-- y devuelve cuántas filas afectaron. Con RLS y sin policy de UPDATE, el
-- WHERE no encuentra filas: 0 afectadas y ninguna excepción.
create or replace function pg_temp.actualizar_objeto_evidencia(p_nombre text) returns integer as $$
declare
  v_count integer;
begin
  update storage.objects
     set metadata = '{"eTag":"manipulado"}'::jsonb
   where bucket_id = 'evidencia'
     and name = p_nombre;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql;

set local role authenticated;
select set_config('request.jwt.claim.sub','96800000-0000-4000-8000-000000000001',true);

-- Puede insertar un objeto nuevo en su propia carpeta.
select lives_ok(
  $$ insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
     values ('evidencia',
             '96800000-0000-4000-8000-000000000001/traslado-1/inicial/trasera.jpg',
             '96800000-0000-4000-8000-000000000001'::uuid,
             '96800000-0000-4000-8000-000000000001',
             '{"eTag":"nuevo"}'::jsonb) $$,
  'RT-68.4: el conductor puede insertar en su carpeta'
);

-- No puede insertar en la carpeta de otro conductor.
select throws_ok(
  $$ insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
     values ('evidencia',
             '96800000-0000-4000-8000-000000000002/traslado-9/inicial/frente.jpg',
             '96800000-0000-4000-8000-000000000002'::uuid,
             '96800000-0000-4000-8000-000000000002',
             '{"eTag":"ajeno"}'::jsonb) $$,
  '42501', null,
  'RT-68.5: el conductor no puede insertar en la carpeta de otro'
);

-- No puede ACTUALIZAR el objeto ya subido en su propia carpeta: sin policy de
-- UPDATE, RLS filtra la fila y el UPDATE afecta 0 objetos (no hay excepción:
-- el privilegio sigue concedido, lo que falta es la autorización).
select is(
  pg_temp.actualizar_objeto_evidencia('96800000-0000-4000-8000-000000000001/traslado-1/inicial/frente.jpg'),
  0,
  'RT-68.6: el conductor no puede actualizar un objeto ya subido en su carpeta'
);

reset role;

-- ── 3. El objeto original sigue intacto ────────────────────────────────────
select is(
  (select metadata->>'eTag' from storage.objects
    where bucket_id = 'evidencia'
      and name = '96800000-0000-4000-8000-000000000001/traslado-1/inicial/frente.jpg'),
  'original',
  'RT-68.7: los bytes/metadata de la evidencia registrada no cambiaron'
);

-- Las policies de UPDATE que quedan son las de las fotos de perfil (otra
-- superficie, con su propio contrato); ninguna toca la evidencia.
select is(
  (select count(*)::int
     from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'UPDATE'
      and policyname in ('usuario_actualiza_su_foto_perfil', 'conductor_actualiza_su_foto_perfil')),
  2,
  'RT-68.8: las policies de UPDATE de las fotos de perfil siguen intactas'
);

select * from finish();

rollback;
