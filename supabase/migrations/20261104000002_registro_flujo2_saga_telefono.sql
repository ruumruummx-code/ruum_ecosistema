-- RUUM-USR-F2-001
-- Preflight explícito: la migración se detiene antes de crear el índice si hay
-- teléfonos duplicados normalizados. No borra ni fusiona cuentas de forma
-- automática; el merge debe ser aprobado por Operaciones y conservar auditoría.
do $$
declare v_duplicados integer;
begin
  select count(*) into v_duplicados
  from (
    select right(regexp_replace(telefono, '\D', '', 'g'), 10)
    from public.usuarios
    where nullif(regexp_replace(telefono, '\D', '', 'g'), '') is not null
    group by right(regexp_replace(telefono, '\D', '', 'g'), 10)
    having count(*) > 1
  ) d;
  if v_duplicados > 0 then
    raise exception 'F2-001: existen % teléfonos duplicados; ejecutar el plan de deduplicación antes del índice.', v_duplicados;
  end if;
end $$;

create unique index if not exists usuarios_telefono_normalizado_uq
  on public.usuarios ((right(regexp_replace(telefono, '\D', '', 'g'), 10)))
  where nullif(regexp_replace(telefono, '\D', '', 'g'), '') is not null;

comment on index public.usuarios_telefono_normalizado_uq is
  'F2-001: unicidad por los últimos 10 dígitos; requiere preflight de duplicados y merge aprobado.';

-- Saga Auth -> perfil: la inserción de usuarios ocurre dentro del trigger
-- canónico y es atómica con auth.users. Esta tabla deja evidencia durable de
-- perfiles pendientes para reconciliar cualquier fallo parcial histórico.
create table if not exists public.registro_saga_auth (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  estado text not null check (estado in ('perfil_creado', 'perfil_pendiente', 'reconciliacion_requerida')),
  intentos integer not null default 0,
  ultimo_error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.registro_saga_auth enable row level security;
revoke all on public.registro_saga_auth from public, anon, authenticated;

create or replace function public.registrar_estado_saga_auth()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.registro_saga_auth(auth_user_id, estado)
  values (
    new.id,
    case when exists (select 1 from public.usuarios where auth_user_id = new.id)
      then 'perfil_creado' else 'perfil_pendiente' end
  )
  on conflict (auth_user_id) do update set
    estado = excluded.estado,
    actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists registrar_estado_saga_auth on auth.users;
create trigger registrar_estado_saga_auth
after insert on auth.users
for each row execute function public.registrar_estado_saga_auth();

comment on table public.registro_saga_auth is
  'F2-001: evidencia durable Auth->perfil. Los estados pendientes requieren reconciliación administrativa; nunca se resuelven desde un GET.';
