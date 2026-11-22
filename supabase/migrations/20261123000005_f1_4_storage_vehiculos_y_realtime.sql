-- F1.4 — Bucket documentos-vehiculo, RLS y Realtime (RUUM-SEC-012)
-- Crea tabla public.documentos_vehiculo con auditoría y RLS cerrado

create table if not exists public.documentos_vehiculo (
  id              uuid primary key default gen_random_uuid(),
  vehiculo_id     uuid not null references public.vehiculos(id) on delete cascade,
  tipo            text not null check (tipo in ('tarjeta_circulacion', 'seguro', 'verificacion', 'permiso_especial')),
  url             text not null,
  nombre_archivo  text,
  tamano_bytes    bigint,
  mime_type       text,
  creado_en       timestamptz not null default now()
);

create index if not exists documentos_vehiculo_vehiculo_id_idx
  on public.documentos_vehiculo(vehiculo_id);

alter table public.documentos_vehiculo enable row level security;

revoke all on public.documentos_vehiculo from public, anon;
grant select, insert, update, delete on public.documentos_vehiculo to authenticated;
grant select, insert, update, delete on public.documentos_vehiculo to service_role;

drop policy if exists "admin_acceso_total_documentos_vehiculo" on public.documentos_vehiculo;
create policy "admin_acceso_total_documentos_vehiculo"
  on public.documentos_vehiculo for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Bucket documentos-vehiculo (privado, tamaño máx 10 MB, tipos permitidos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-vehiculo',
  'documentos-vehiculo',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[];

-- RLS en storage.objects para el bucket documentos-vehiculo (acceso restringido a administradores)
drop policy if exists "admin_lee_documentos_vehiculo_storage" on storage.objects;
drop policy if exists "admin_inserta_documentos_vehiculo_storage" on storage.objects;
drop policy if exists "admin_actualiza_documentos_vehiculo_storage" on storage.objects;
drop policy if exists "admin_elimina_documentos_vehiculo_storage" on storage.objects;

create policy "admin_lee_documentos_vehiculo_storage"
  on storage.objects for select to authenticated
  using (bucket_id = 'documentos-vehiculo' and public.es_admin());

create policy "admin_inserta_documentos_vehiculo_storage"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-vehiculo' and public.es_admin());

create policy "admin_actualiza_documentos_vehiculo_storage"
  on storage.objects for update to authenticated
  using (bucket_id = 'documentos-vehiculo' and public.es_admin())
  with check (bucket_id = 'documentos-vehiculo' and public.es_admin());

create policy "admin_elimina_documentos_vehiculo_storage"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentos-vehiculo' and public.es_admin());

-- Integración de Realtime en tablas críticas operativas
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones_conductor'
    ) then
      alter publication supabase_realtime add table public.notificaciones_conductor;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'verificaciones_identidad_didit'
    ) then
      alter publication supabase_realtime add table public.verificaciones_identidad_didit;
    end if;
  end if;
end $$;
