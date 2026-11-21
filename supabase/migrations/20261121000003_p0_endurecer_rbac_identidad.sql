-- P0: Endurecer RLS en conductores y empresas
-- Bugs corregidos:
--   1. `admin_acceso_total_conductores` (ALL, with_check=NULL)
--      → admin con solo conductores:leer podía UPDATE/DELETE/INSERT
--   2. `proteger_campos_conductor` hace bypass a TODOS los admins (es_admin())
--      → cualquier admin podía cambiar nivel_certificacion, certificacion_pago,
--         calificacion_promedio, auth_user_id, curp, licencia_numero
--   3. `admin_acceso_total_empresas` (ALL, with_check=NULL)
--      → admin con solo empresas:leer podía modificar limite_credito_mxn,
--         credito_disponible_mxn, dias_credito, estado_operativo

begin;

-- ============================================================================
-- CONDUCTORES
-- ============================================================================
drop policy if exists "admin_acceso_total_conductores" on public.conductores;

create policy "admin_lee_conductores" on public.conductores
  for select to authenticated
  using (
    admin_tiene_permiso('conductores:leer')
    or admin_tiene_permiso('conductores:validar')
    or admin_tiene_permiso('conductores:sancionar')
  );

create policy "admin_actualiza_conductores" on public.conductores
  for update to authenticated
  using (admin_tiene_permiso('conductores:validar'))
  with check (admin_tiene_permiso('conductores:validar'));

-- INSERT/DELETE: sin policy → solo service_role / RPCs

-- Trigger complementario: bloquea columnas ultra-sensibles para admins no-superadmin.
-- NO bloquea estado/estado_expediente (RPCs de validación/sanción los actualizan).
create or replace function public.proteger_columnas_sensibles_conductor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
  if v_bypass then return new; end if;

  -- Solo aplica a admins. El conductor normal ya está cubierto por
  -- proteger_campos_conductor.
  if not public.es_admin() then return new; end if;

  if new.nivel_certificacion is distinct from old.nivel_certificacion then
    raise exception 'No puedes modificar nivel_certificacion';
  end if;
  if new.certificacion_pago is distinct from old.certificacion_pago then
    raise exception 'No puedes modificar certificacion_pago';
  end if;
  if new.calificacion_promedio is distinct from old.calificacion_promedio then
    raise exception 'No puedes modificar calificacion_promedio';
  end if;
  if new.traslados_completados is distinct from old.traslados_completados then
    raise exception 'No puedes modificar traslados_completados';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'No puedes modificar auth_user_id';
  end if;
  if new.curp is distinct from old.curp then
    raise exception 'No puedes modificar curp';
  end if;
  if new.licencia_numero is distinct from old.licencia_numero then
    raise exception 'No puedes modificar licencia_numero';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_columnas_sensibles_conductor on public.conductores;
create trigger proteger_columnas_sensibles_conductor
  before update on public.conductores
  for each row execute function public.proteger_columnas_sensibles_conductor();

-- ============================================================================
-- EMPRESAS
-- ============================================================================
drop policy if exists "admin_acceso_total_empresas" on public.empresas;

create policy "admin_lee_empresas" on public.empresas
  for select to authenticated
  using (
    admin_tiene_permiso('empresas:leer')
    or admin_tiene_permiso('empresas:gestionar')
  );

create policy "admin_actualiza_empresas" on public.empresas
  for update to authenticated
  using (admin_tiene_permiso('empresas:gestionar'))
  with check (admin_tiene_permiso('empresas:gestionar'));

create or replace function public.proteger_columnas_sensibles_empresa()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
  if v_bypass then return new; end if;

  -- Aplica a TODOS los no-superadmin (incluidos titulares de empresa).
  -- Cambios de crédito NUNCA van por UPDATE directo → solo RPCs service_role.
  if new.limite_credito_mxn is distinct from old.limite_credito_mxn then
    raise exception 'No puedes modificar limite_credito_mxn';
  end if;
  if new.credito_disponible_mxn is distinct from old.credito_disponible_mxn then
    raise exception 'No puedes modificar credito_disponible_mxn';
  end if;
  if new.dias_credito is distinct from old.dias_credito then
    raise exception 'No puedes modificar dias_credito';
  end if;
  if new.requiere_orden_compra is distinct from old.requiere_orden_compra then
    raise exception 'No puedes modificar requiere_orden_compra';
  end if;
  if new.estado_operativo is distinct from old.estado_operativo then
    raise exception 'No puedes modificar estado_operativo';
  end if;
  if new.estado_verificacion is distinct from old.estado_verificacion then
    raise exception 'No puedes modificar estado_verificacion';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_columnas_sensibles_empresa on public.empresas;
create trigger proteger_columnas_sensibles_empresa
  before update on public.empresas
  for each row execute function public.proteger_columnas_sensibles_empresa();

commit;