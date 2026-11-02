create table public.tickets_soporte (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  traslado_id uuid references public.traslados(id) on delete set null,
  motivo text not null check (char_length(btrim(motivo)) between 3 and 120),
  descripcion text not null check (char_length(btrim(descripcion)) between 10 and 1000),
  estado text not null default 'abierto' check (estado in ('abierto', 'resuelto')),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz,
  resuelto_por uuid references auth.users(id) on delete set null
);
create index tickets_soporte_propietario_idx on public.tickets_soporte(auth_user_id, creado_en desc);
create index tickets_soporte_estado_idx on public.tickets_soporte(estado, creado_en desc);
create index tickets_soporte_traslado_idx on public.tickets_soporte(traslado_id) where traslado_id is not null;
create index tickets_soporte_resuelto_por_idx on public.tickets_soporte(resuelto_por) where resuelto_por is not null;
alter table public.tickets_soporte enable row level security;
revoke all on public.tickets_soporte from public, anon, authenticated;
grant select on public.tickets_soporte to authenticated;
grant insert (id, traslado_id, motivo, descripcion) on public.tickets_soporte to authenticated;
grant update (estado) on public.tickets_soporte to authenticated;
create policy tickets_soporte_lectura on public.tickets_soporte for select to authenticated
  using (auth_user_id = (select auth.uid()) or public.es_admin());
create policy tickets_soporte_creacion on public.tickets_soporte for insert to authenticated
  with check (auth_user_id = (select auth.uid()) and exists (
    select 1 from public.usuarios u where u.auth_user_id = (select auth.uid())
    and (tickets_soporte.traslado_id is null or exists (
      select 1 from public.traslados t where t.id = tickets_soporte.traslado_id and t.usuario_id = u.id
    ))
  ));
create policy tickets_soporte_atencion_admin on public.tickets_soporte for update to authenticated
  using (public.es_admin()) with check (public.es_admin());
create function public.tickets_soporte_marcar_resolucion() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    new.resuelto_en := case when new.estado = 'resuelto' then now() else null end;
    new.resuelto_por := case when new.estado = 'resuelto' then auth.uid() else null end;
  end if;
  return new;
end;
$$;
revoke all on function public.tickets_soporte_marcar_resolucion() from public, anon, authenticated;
create trigger tickets_soporte_resolucion before update on public.tickets_soporte
  for each row execute function public.tickets_soporte_marcar_resolucion();
