-- P0: Endurecer RLS en `usuarios`
-- Bugs corregidos:
--   1. `admin_acceso_total_usuarios` era FOR ALL con with_check=NULL
--      → cualquier admin con :leer podía INSERT/UPDATE/DELETE
--   2. `usuario_actualiza_su_registro` sin restricción de columnas
--      → cualquier usuario podía auto-escalar rol/tipo_cuenta/empresa_id/auth_user_id
-- Estrategia:
--   SELECT granular por permiso, UPDATE solo con :validar,
--   sin INSERT/DELETE desde cliente (solo service_role / RPCs),
--   trigger que bloquea columnas sensibles.

begin;

-- ============================================================================
-- 1. Eliminar policies peligrosas
-- ============================================================================
drop policy if exists "admin_acceso_total_usuarios" on public.usuarios;
drop policy if exists "usuario_actualiza_su_registro" on public.usuarios;

-- ============================================================================
-- 2. Recrear policies con permisos granulares
-- ============================================================================

-- SELECT: lectores y validadores ven usuarios
create policy "admin_lee_usuarios" on public.usuarios
  for select to authenticated
  using (
    admin_tiene_permiso('usuarios:leer')
    or admin_tiene_permiso('usuarios:validar')
  );

-- UPDATE: solo validadores. Columnas sensibles protegidas por trigger.
create policy "admin_actualiza_usuarios" on public.usuarios
  for update to authenticated
  using (admin_tiene_permiso('usuarios:validar'))
  with check (admin_tiene_permiso('usuarios:validar'));

-- UPDATE propio: el usuario puede actualizar su propia fila (columnas no sensibles).
-- El trigger bloquea columnas sensibles independientemente del rol.
create policy "usuario_actualiza_su_registro" on public.usuarios
  for update to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- INSERT/DELETE: sin policy para authenticated. Solo service_role (RPCs).
-- Superadmin sigue con acceso vía policy "Superadmin full privileges" existente.

-- ============================================================================
-- 3. Trigger para bloquear columnas sensibles en cualquier UPDATE
-- ============================================================================
create or replace function public.proteger_columnas_sensibles_usuario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
  if v_bypass then
    return new;
  end if;

  if new.rol is distinct from old.rol then
    raise exception 'No puedes modificar rol';
  end if;
  if new.tipo_cuenta is distinct from old.tipo_cuenta then
    raise exception 'No puedes modificar tipo_cuenta';
  end if;
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'No puedes modificar empresa_id';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'No puedes modificar auth_user_id';
  end if;
  if new.estado_cuenta is distinct from old.estado_cuenta then
    raise exception 'No puedes modificar estado_cuenta';
  end if;
  if new.metodo_pago_registrado is distinct from old.metodo_pago_registrado then
    raise exception 'No puedes modificar metodo_pago_registrado';
  end if;
  if new.traslados_completados_sin_incidencia is distinct from old.traslados_completados_sin_incidencia then
    raise exception 'No puedes modificar traslados_completados_sin_incidencia';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_columnas_sensibles_usuario on public.usuarios;
create trigger proteger_columnas_sensibles_usuario
  before update on public.usuarios
  for each row execute function public.proteger_columnas_sensibles_usuario();

commit;