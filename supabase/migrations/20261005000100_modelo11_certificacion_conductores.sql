-- Modelo 11 — Conductores certificados Ruum (Didit + MCE + niveles 1-3).
-- No rompe nivel_concer existente; añade nivel de servicio y auditoría MCE.

alter table public.conductores
  add column if not exists nivel_certificacion smallint not null default 1
    check (nivel_certificacion in (1,2,3)),
  add column if not exists identidad_validada boolean not null default false,
  add column if not exists licencia_validada boolean not null default false,
  add column if not exists licencia_vigente boolean not null default false,
  add column if not exists capacitacion_aprobada boolean not null default false,
  add column if not exists evaluacion_practica_aprobada boolean not null default false,
  add column if not exists prueba_manejo_aprobada boolean not null default false;

create table if not exists public.capacitaciones_conductor (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references public.conductores(id) on delete cascade,
  curso text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','reprobado')),
  puntaje numeric(5,2),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
alter table public.capacitaciones_conductor enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'conductor_ve_su_capacitacion') then
    create policy "conductor_ve_su_capacitacion" on public.capacitaciones_conductor for select
      using (exists (select 1 from public.conductores c where c.id = conductor_id and c.auth_user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_acceso_total_capacitaciones') then
    create policy "admin_acceso_total_capacitaciones" on public.capacitaciones_conductor for all using (public.es_admin());
  end if;
end $$;
