# Acta de Aprobación de Gate G1 — Cierre Estructural de Seguridad

**Fecha de Emisión:** 2026-11-28  
**Proyecto:** Ruum Monorepo  
**Fase:** Fase 1 — Cierre estructural de seguridad  
**Epics Asociados:** `RUUM-SEC-009`, `RUUM-SEC-010`, `RUUM-SEC-011`, `RUUM-SEC-012`  
**Estado del Gate:** **APROBADO (PASS)**  

---

## 1. Resumen Ejecutivo

La **Fase 1 (Cierre estructural de seguridad)** ha concluido con éxito todos sus objetivos y entregables técnicos sin introducir regresiones en el monorepo. Todos los criterios de aceptación verificables han sido auditados y validados contra el código fuente, la suite de pruebas unitarias/de integración por roles y la infraestructura declarativa de Supabase.

---

## 2. Detalle de Entregables de la Fase 1

### F1.5 — Secretos y Validación de Entorno
- **Acciones:**
  - `TARIFA_SNAPSHOT_SECRET` agregado a las variables requeridas de `app-usuario` en `scripts/validate-env.mjs`.
  - Agregadas `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` a `requiredByApp["panel-admin"]`.
  - Guard estricto `SUPABASE_SERVICE_ROLE_KEY !== ANON_KEY` aplicado también a `panel-admin`.
  - Factory único de `service_role` centralizado en `@ruum/api/supabase/service-role.ts` con `import "server-only"`, tipado fuerte `Database` y guarda fail-closed contra la anon key.
  - Migración de clientes service role en `panel-admin` y `app-usuario` para delegar exclusivamente en el factory central.
  - `env.txt` retirado del tracking git (`git rm --cached env.txt`) y añadido a `.gitignore`.
- **Criterio Verificado:**
  - `validate-env.mjs` falla inmediatamente con exit code 1 si falta alguna variable obligatoria.
  - `git grep -l "SUPABASE_SERVICE_ROLE_KEY" -- "apps/*/src/**"` retorna únicamente archivos que contienen `import "server-only";`.
  - `git ls-files env.txt` devuelve vacío.

### F1.2 — RBAC de Middlewares Definitivo
- **Acciones:**
  - `packages/api/src/identity/usuarios.ts`: `clasificarRolApp` ampliado para consultar la tabla `admins` (retornando rol `"admin"`). Tipo unificado `RolApp = "usuario" | "conductor" | "admin" | "ninguno"`.
  - `packages/shared/src/seguridad/cookie-rol.ts`: `RolAppFirmable` actualizado con soporte de `"admin"`.
  - `apps/app-usuario/src/lib/guardia-rol-usuario.ts`: creado helper unificado `validarSesionYRolUsuario()` y `exigirRolUsuario()` para Route Handlers sensibles (`/api/cuenta/metodos-pago`, `/api/cuenta/telefono/verificar`, `/api/viajes`, `/api/viajes/masivos/*`).
  - Eliminado el allowlist temporal (`SENSITIVE_ENDPOINTS_ALLOWLIST`) de `app-usuario/src/middleware.ts` sin regresiones.
  - `apps/panel-admin/src/lib/roles-admin.ts` y `middleware.ts`: mapeo y validación de endpoints `/api/*` distinguiendo 401 (sin sesión) y 403 JSON (rol no autorizado según capacidades: `operador`, `supervisor`, `finanzas`, `compliance`, `direccion`).
  - `apps/app-conductor/src/middleware.ts`: denegación de rutas API y UI para usuarios que no sean conductores activos (403 JSON para `/api/*` y redirección a `/403` para UI).
- **Criterio Verificado:**
  - Suites completas de integración por rol pasando al 100%:
    * `apps/app-usuario/src/rbac-roles-integracion.test.ts` (16 pruebas).
    * `apps/app-usuario/src/lib/guardia-rol-usuario.test.ts` (6 pruebas).
    * `apps/panel-admin/src/rbac-roles-integracion.test.ts` (9 pruebas).
    * `apps/app-conductor/test/rbac-roles-integracion.test.ts` (10 pruebas).
  - Un administrador puro que intenta consumir endpoints de usuario o conductor recibe `403 Forbidden` JSON.

### F1.1 — REVOKE EXECUTE Gradual por Lotes (91 Funciones Canónicas)
- **Acciones:**
  - Con base en la matriz canónica `docs/grants-reales-2026-11.md`, se crearon 4 migraciones dedicadas ejecutadas mediante bucles dinámicos `DO $$` sobre `pg_proc` (`p.oid::regprocedure`):
    1. `20261123000001_f1_1_lote_1_admin_auditoria_revoke.sql`: 18 funciones de administración y auditoría revocadas de `anon` y `public`; asignadas a `service_role` y `authenticated` con verificación `es_admin()`.
    2. `20261123000002_f1_1_lote_2_operaciones_negocio_revoke.sql`: 26 funciones de negocio y clientes revocadas de `anon` y `public`; mantenidas en `authenticated` y `service_role`.
    3. `20261123000003_f1_1_lote_3_helpers_internos_triggers_revoke.sql`: 28 funciones internas, triggers y helpers de RLS revocadas de `public`, `anon` y `authenticated`.
    4. `20261123000004_f1_1_lote_4_colas_cron_sla_revoke.sql`: 19 funciones de colas, cron, SLA e idempotencia restringidas exclusivamente a `service_role`.
- **Criterio Verificado:**
  - Las 91 funciones quedaron formalmente desvinculadas de `anon`.
  - `pnpm check:migrations` valida 289 migraciones en estricto cumplimiento.

### F1.3 — Endurecimiento de Edge Functions
- **Acciones:**
  - `supabase/functions/_shared/cors-documentos.ts`: módulo CORS extendido con detección estricta de orígenes permitidos (`esOrigenPermitido`, `resolverOrigenPermitido`, `construirCabecerasCors`, `manejarCors`). Eliminación total del comodín `*`.
  - Sustitución de `*` por el validador restrictivo en las 6 funciones vulnerables:
    * `cancelar-traslado-usuario`
    * `crear-llamada-enmascarada`
    * `crear-payment-intent`
    * `iniciar-verificacion-didit`
    * `validar-documento-conductor`
    * `webhook-didit`
  - Sanitización de errores 500: se eliminaron filtraciones de mensajes internos de Twilio y Storage en `crear-llamada-enmascarada` y `validar-documento-conductor`.
  - Declaración de `[functions.crear-llamada-enmascarada]` añadida a `supabase/config.toml`.
  - Comparaciones de tiempo constante: implementado `timingSafeEqual` en `_shared/timing-safe.ts` y aplicado en los 5 crons/workers (`limpiar-documentos-cuenta-obsoletos`, `limpiar-documentos-identidad-obsoletos`, `reconciliar-pagos-stripe`, `reconciliar-verificaciones-didit`, `despachar-notificaciones-push`). 0 comparaciones `===`/`!==` en headers de autenticación secreta.
  - `deno.json`: `tasks["check:functions"]` actualizado para verificar las 15 Edge Functions del monorepo.
- **Criterio Verificado:**
  - `deno task check:functions` ejecutado y aprobado con 0 errores sobre las 15 funciones (15/15).
  - `deno task test:functions` (10 pruebas unitarias) verifica bloqueo HTTP 403 ante orígenes no permitidos y comportamiento fail-closed de `timingSafeEqual`.

### F1.4 — Migraciones de Storage y Realtime
- **Acciones:**
  - `20261123000005_f1_4_storage_vehiculos_y_realtime.sql`:
    * Creación de la tabla `public.documentos_vehiculo` con auditoría y RLS cerrado (acceso restringido a administradores vía `public.es_admin()`).
    * Configuración del bucket `documentos-vehiculo` como privado (`public = false`), límite de 10 MB y tipos mime restringidos.
    * Políticas RLS en `storage.objects` para SELECT, INSERT, UPDATE y DELETE restringidas exclusivamente a administradores autenticados.
    * Incorporación idempotente de `public.notificaciones_conductor` y `public.verificaciones_identidad_didit` a la publicación `supabase_realtime`.
  - `packages/api/src/vehicles/vehiculos.ts`: sustituido `getPublicUrl` por `createSignedUrl(path, 3600)`.
  - Nueva suite pgTAP `supabase/test/rt55_storage_documentos_vehiculo.test.sql` con 10 aserciones que cubren la privacidad del bucket, permisos RLS por rol y registro en Realtime.
- **Criterio Verificado:**
  - `@ruum/api` compila y tipa limpiamente (`tsc --noEmit` en verde).
  - Bucket y tablas completamente protegidos por RLS.

---

## 3. Matriz de Verificación del Gate G1

| Criterio de Gate G1 | Estado | Evidencia |
|---|:---:|---|
| **0 warnings anon sobre SECURITY DEFINER** | ✅ CUMPLIDO | 4 migraciones por lote (`20261123000001` - `20261123000004`) revocan `anon` de las 91 funciones canónicas de `docs/grants-reales-2026-11.md`. |
| **pnpm check:migrations & validate:env reproducible** | ✅ CUMPLIDO | `pnpm check:migrations` verde (289 archivos conformes). `pnpm validate:env workspace` verde. |
| **Endpoints /api/* con service_role verifican rol** | ✅ CUMPLIDO | Helper `guardia-rol-usuario.ts` en `app-usuario`; `puedeVerRuta()` en `panel-admin` devuelve 401/403 JSON; `app-conductor/src/middleware.ts` devuelve 403 JSON. |
| **deno check 15/15 y CORS allowlist cerrado** | ✅ CUMPLIDO | `deno task check:functions` cubre las 15 Edge Functions con exit code 0. 0 comodines `*` en cabeceras CORS. |
| **Revisión de timing safe en cron / headers secretos** | ✅ CUMPLIDO | 0 comparaciones `===`/`!==` en headers secretos; `timingSafeEqual` probado en 5 funciones cron. |
| **Zero regresiones en smoke tests / unit tests** | ✅ CUMPLIDO | Pruebas de integración RBAC en `app-usuario`, `panel-admin` y `app-conductor` en verde. `pnpm check:estilos` en verde. |

---

## 4. Dictamen Final

Habiéndose cumplido rigurosamente cada uno de los criterios técnicos y de seguridad establecidos en la especificación, se declara la **Fase 1 formalmente completada y cerrada con Gate G1 APROBADO**. El monorepo queda listo para avanzar a la **Fase 2 — Separación física y fortalecimiento de fronteras**.
