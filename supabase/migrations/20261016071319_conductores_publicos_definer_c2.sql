-- RT-65 / Fix C2: conductores_publicos debe volver a security_invoker=false.
--
-- Contexto: el pull 20261016071318 trajo de remoto
--   ALTER VIEW public.conductores_publicos SET (security_invoker=true)
-- (recomendación automática de Advisor aplicada fuera de banda).
-- Con invoker=true la vista corre con los permisos del llamador, por lo que
-- RLS de public.conductores (sin política permisiva para clientes, por diseño
-- C2) la deja vacía: el cliente autenticado ve 0 filas y
-- packages/api/src/transfers/pasaporte.ts:139,447 (lectura vía PostgREST como
-- authenticated) también queda vacío en producción. Lo demuestra
-- test/rt65_c2_c3_c4_seguridad_conductores_traslados_vehiculos.test.sql:129-134
-- (RT-65.8: have 0, want 1).
--
-- La vista expone solo 4 columnas sin PII (id, estado,
-- nivel_operativo_vigente, calificacion_promedio); ser "definer" (owner
-- postgres) es el mecanismo de acceso controlado. La tabla base sigue sin
-- SELECT amplio (revoke de 20261015033000) y el PII (telefono, curp, etc.)
-- nunca sale por esta vista. Advisor volverá a marcar security_definer_view
-- como WARN: aceptado conscientemente, la alternativa (policy permisiva en la
-- tabla) expondría el PII completo.

alter view public.conductores_publicos set (security_invoker = false);

-- Reafirmar superficie mínima (idempotente).
revoke all on public.conductores_publicos from public, anon;
grant select on public.conductores_publicos to authenticated, service_role;
revoke select on public.conductores from anon;

comment on view public.conductores_publicos is
  'Superficie pública intencional (4 columnas sin PII). security_invoker=false por diseño C2; no "corregir" a true sin reabrir RT-65.8.';
