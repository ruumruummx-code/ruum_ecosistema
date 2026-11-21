-- P0: Endurecer RLS en traslados, disputas, incidencias
-- Bugs corregidos:
--   1. `admin_acceso_total_traslados` (ALL, with_check=NULL)
--      → admin con Traslados:leer podía UPDATE/DELETE/INSERT.
--      `proteger_campos_traslado_conductor` bypassa con `es_admin()`, así que
--      admin con :leer podía cambiar precio_final, conductor_id, vehiculo_id.
--   2. `usuario_ve_y_abre_disputas_de_sus_traslados` y `conductor_*` (ALL)
--      → usuario/conductor podían UPDATE resolucion/estado de sus disputas
--      y auto-resolverlas a su favor. `validar_resolucion_disputa` solo valida
--      campos, no actor.
--   3. `conductor_administra_incidencias_de_sus_traslados` (ALL)
--      → conductor podía UPDATE severidad/estado de sus incidencias, evadiendo SLA.
--   4. `admin_acceso_total_incidencias` (ALL, with_check=NULL)
--      → admin con incidencias:leer podía UPDATE/DELETE.

begin;

-- ============================================================================
-- TRASLADOS
-- ============================================================================
drop policy if exists "admin_acceso_total_traslados" on public.traslados;

create policy "admin_lee_traslados" on public.traslados
  for select to authenticated
  using (
    admin_tiene_permiso('Traslados:leer')
    or admin_tiene_permiso('Traslados:gestionar')
  );

create policy "admin_actualiza_traslados" on public.traslados
  for update to authenticated
  using (admin_tiene_permiso('Traslados:gestionar'))
  with check (admin_tiene_permiso('Traslados:gestionar'));

-- INSERT: ya cubierto por usuario_crea_sus_traslados.
-- DELETE: sin policy → solo superadmin/service_role.

-- ============================================================================
-- DISPUTAS
-- ============================================================================
drop policy if exists "usuario_ve_y_abre_disputas_de_sus_traslados" on public.disputas;
drop policy if exists "conductor_ve_y_abre_disputas_de_sus_traslados" on public.disputas;
drop policy if exists "admin_acceso_total_disputas" on public.disputas;

-- Usuario: SELECT + INSERT de sus traslados. NO UPDATE, NO DELETE.
create policy "usuario_lee_disputas_de_sus_traslados" on public.disputas
  for select to authenticated
  using (traslado_id in (
    select t.id from public.traslados t
    join public.usuarios u on u.id = t.usuario_id
    where u.auth_user_id = auth.uid()
  ));

create policy "usuario_abre_disputas_de_sus_traslados" on public.disputas
  for insert to authenticated
  with check (traslado_id in (
    select t.id from public.traslados t
    join public.usuarios u on u.id = t.usuario_id
    where u.auth_user_id = auth.uid()
  ));

-- Conductor: SELECT + INSERT de sus traslados. NO UPDATE, NO DELETE.
create policy "conductor_lee_disputas_de_sus_traslados" on public.disputas
  for select to authenticated
  using (traslado_id in (
    select t.id from public.traslados t
    join public.conductores c on c.id = t.conductor_id
    where c.auth_user_id = auth.uid()
  ));

create policy "conductor_abre_disputas_de_sus_traslados" on public.disputas
  for insert to authenticated
  with check (traslado_id in (
    select t.id from public.traslados t
    join public.conductores c on c.id = t.conductor_id
    where c.auth_user_id = auth.uid()
  ));

-- Admin: SELECT granular + UPDATE solo con disputas:resolver.
create policy "admin_lee_disputas" on public.disputas
  for select to authenticated
  using (
    admin_tiene_permiso('disputas:leer')
    or admin_tiene_permiso('disputas:resolver')
  );

create policy "admin_resuelve_disputas" on public.disputas
  for update to authenticated
  using (admin_tiene_permiso('disputas:resolver'))
  with check (admin_tiene_permiso('disputas:resolver'));

-- ============================================================================
-- INCIDENCIAS
-- ============================================================================
drop policy if exists "conductor_administra_incidencias_de_sus_traslados" on public.incidencias;
drop policy if exists "admin_acceso_total_incidencias" on public.incidencias;

-- Conductor: SELECT + INSERT. NO UPDATE (evita evadir SLA), NO DELETE.
create policy "conductor_lee_incidencias_de_sus_traslados" on public.incidencias
  for select to authenticated
  using (traslado_id in (
    select t.id from public.traslados t
    join public.conductores c on c.id = t.conductor_id
    where c.auth_user_id = auth.uid()
  ));

create policy "conductor_reporta_incidencias_de_sus_traslados" on public.incidencias
  for insert to authenticated
  with check (
    reportada_por = 'conductor'::actor_reporte
    and traslado_id in (
      select t.id from public.traslados t
      join public.conductores c on c.id = t.conductor_id
      where c.auth_user_id = auth.uid()
    )
  );

-- Admin: SELECT + UPDATE granular.
create policy "admin_lee_incidencias" on public.incidencias
  for select to authenticated
  using (admin_tiene_permiso('incidencias:leer'));

create policy "admin_actualiza_incidencias" on public.incidencias
  for update to authenticated
  using (admin_tiene_permiso('Traslados:gestionar'))
  with check (admin_tiene_permiso('Traslados:gestionar'));

commit;