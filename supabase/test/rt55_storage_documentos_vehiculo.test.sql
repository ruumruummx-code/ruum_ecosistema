begin;
select plan(10);

-- ============================================================================
-- RT-55: Bucket documentos-vehiculo, RLS y Realtime (F1.4)
-- ============================================================================

-- 1. Verificar privacidad y límites del bucket documentos-vehiculo
select is(
  (select public from storage.buckets where id = 'documentos-vehiculo'),
  false,
  'Bucket documentos-vehiculo es estrictamente privado (public = false)'
);

select is(
  (select file_size_limit from storage.buckets where id = 'documentos-vehiculo'),
  10485760::bigint,
  'Bucket documentos-vehiculo tiene límite de 10 MB'
);

-- ============================================================================
-- Setup de usuarios, conductor, admin y vehículo
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a',    gen_random_uuid()),
  ('cond_a',    gen_random_uuid()),
  ('admin_sup', gen_random_uuid()),
  ('vehiculo',  gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt55.test' from _ctx where k <> 'vehiculo';

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k = 'user_a';

insert into public.conductores (id, auth_user_id, nombre, estado)
select v, v, k, 'activo'::estado_conductor from _ctx
where k = 'cond_a';

insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k, 'supervisor'::rol_admin_operativo from _ctx
where k = 'admin_sup';

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select (select v from _ctx where k = 'vehiculo'), u.id, 'sedan'::tipo_vehiculo, 'Nissan', 'Versa', 2024
from public.usuarios u
where u.auth_user_id = (select v from _ctx where k = 'user_a');

grant select on _ctx to authenticated;

create function pg_temp.actuar_como(p_auth_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', p_auth_id, 'role', 'authenticated')::text, true);
end;
$$;

set local role authenticated;

-- 2. Usuario común NO puede insertar en documentos_vehiculo
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));

select throws_ok(
  $$
  insert into public.documentos_vehiculo (vehiculo_id, tipo, url, nombre_archivo)
  values ((select v from _ctx where k = 'vehiculo'), 'tarjeta_circulacion', 'https://ejemplo.com/doc.pdf', 'tarjeta.pdf');
  $$,
  '42501',
  null,
  'Usuario normal NO puede insertar en documentos_vehiculo por RLS'
);

-- 3. Conductor NO puede insertar en documentos_vehiculo
select pg_temp.actuar_como((select v from _ctx where k = 'cond_a'));

select throws_ok(
  $$
  insert into public.documentos_vehiculo (vehiculo_id, tipo, url, nombre_archivo)
  values ((select v from _ctx where k = 'vehiculo'), 'seguro', 'https://ejemplo.com/seguro.pdf', 'seguro.pdf');
  $$,
  '42501',
  null,
  'Conductor NO puede insertar en documentos_vehiculo por RLS'
);

-- 4. Admin SÍ puede insertar y consultar en documentos_vehiculo
select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));

insert into public.documentos_vehiculo (vehiculo_id, tipo, url, nombre_archivo)
values ((select v from _ctx where k = 'vehiculo'), 'tarjeta_circulacion', 'https://ejemplo.com/doc.pdf', 'tarjeta.pdf');

select is(
  (select count(*) from public.documentos_vehiculo),
  1::bigint,
  'Admin SÍ puede insertar en documentos_vehiculo'
);

-- 5. Usuario normal NO ve registros de documentos_vehiculo creados por admin
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));

select is(
  (select count(*) from public.documentos_vehiculo),
  0::bigint,
  'Usuario normal NO puede leer documentos_vehiculo'
);

-- 6. Storage RLS: Usuario común NO puede insertar en bucket documentos-vehiculo
select throws_ok(
  $$
  insert into storage.objects (id, bucket_id, name, owner)
  values (gen_random_uuid(), 'documentos-vehiculo', 'test/tarjeta.pdf', (select v from _ctx where k = 'user_a'));
  $$,
  '42501',
  null,
  'Usuario normal NO puede insertar objetos en storage.objects para documentos-vehiculo'
);

-- 7. Storage RLS: Admin SÍ puede insertar en bucket documentos-vehiculo
select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));

insert into storage.objects (id, bucket_id, name, owner)
values (gen_random_uuid(), 'documentos-vehiculo', 'test/tarjeta.pdf', (select v from _ctx where k = 'admin_sup'));

select is(
  (select count(*) from storage.objects where bucket_id = 'documentos-vehiculo'),
  1::bigint,
  'Admin SÍ puede insertar objetos en storage.objects para documentos-vehiculo'
);

-- ============================================================================
-- 8 & 9. Realtime Publication Verification
-- ============================================================================
set local role postgres;

select is(
  (select count(*) from pg_publication_tables
   where pubname = 'supabase_realtime'
     and schemaname = 'public'
     and tablename = 'notificaciones_conductor'),
  1::bigint,
  'Tabla notificaciones_conductor agregada a publicación supabase_realtime'
);

select is(
  (select count(*) from pg_publication_tables
   where pubname = 'supabase_realtime'
     and schemaname = 'public'
     and tablename = 'verificaciones_identidad_didit'),
  1::bigint,
  'Tabla verificaciones_identidad_didit agregada a publicación supabase_realtime'
);

select * from finish();
rollback;
