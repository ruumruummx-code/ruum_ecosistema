-- Documentos complementarios de Cuenta. El INE conserva su pipeline validado.
create table public.documentos_cuenta_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('licencia', 'comprobante', 'constancia')),
  ruta text not null unique,
  estado text not null default 'en_revision' check (estado in ('en_revision', 'verificado', 'rechazado')),
  subido_en timestamptz not null default now(),
  unique (usuario_id, tipo)
);
alter table public.documentos_cuenta_usuario enable row level security;
revoke all on public.documentos_cuenta_usuario from public, anon, authenticated;
grant select on public.documentos_cuenta_usuario to authenticated;
grant all on public.documentos_cuenta_usuario to service_role;
create policy "usuario_consulta_sus_documentos_cuenta"
  on public.documentos_cuenta_usuario for select to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));

-- Sólo la función de carga escribe, después de validar sesión, perfil y archivo.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-cuenta', 'documentos-cuenta', false, 10485760,
  array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;
create policy "usuario_consulta_sus_archivos_cuenta"
  on storage.objects for select to authenticated
  using (bucket_id = 'documentos-cuenta' and (storage.foldername(name))[1] = (select auth.uid())::text);
