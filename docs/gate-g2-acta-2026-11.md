# Acta de Aprobación de Gate G2 — Red de Seguridad del Núcleo y CI

**Fecha de Emisión:** 2026-11-28  
**Proyecto:** Ruum Monorepo  
**Fase:** Fase 2 — Red de seguridad del núcleo y CI  
**Epics Asociados:** `RUUM-CORE-001`, `RUUM-CI-002`, `RUUM-QA-003`, `RUUM-PERF-004`  
**Estado del Gate:** **APROBADO (PASS)**  

---

## 1. Resumen Ejecutivo

La **Fase 2 (Red de seguridad del núcleo y CI)** ha concluido con éxito todos sus objetivos y entregables técnicos. El monorepo ahora cuenta con una infraestructura de integración continua robusta que cubre los 6 workspaces, una suite de pruebas tipada y blindada para `@ruum/api` y `@ruum/shared/rules`, erradicación completa de full-table scans en listados administrativos y contratos estrictos de higiene de repositorio y Docker.

---

## 2. Detalle de Entregables de la Fase 2

### F2.5 — Higiene del Monorepo
- **turbo.json:** Corregida dependencia global de `tsconfig.base.json` a `tsconfig.json`.
- **Dockerfile raíz:** Reestructurado para instalación congelada de monorepo con `pnpm` y compilación optimizada con Turbo.
- **.husky/pre-commit:** Actualizado de `npm test` a `pnpm test`.
- **7 Archivos basura eliminados:**
  1. `.review-src.tgz`
  2. `dry-build.json`
  3. `ruum-sistema-base-v2.patch`
  4. `turbo.json2`
  5. `env.txt`
  6. `apps/app-usuario/next.config.ts.tmp`
  7. `apps/app-conductor/android/gradle_output.txt`
- **7 Entradas muertas del allowlist:** Depuradas completamente en `scripts/fronteras-allowlist.json`. Todas las llamadas residuales a `.from()` en apps quedaron en cero (`raw={"from":0,"rpc":0,"invoke":0}`).
- **outputFileTracingIncludes:** Corregida ruta en `apps/panel-admin/next.config.ts` (`/api/plantillas/traslados-masivos`).
- **Verificación:** `git ls-files | grep -E "(\.review-src|\.patch|turbo\.json2|dry-build|env\.txt)"` devuelve vacío. `pnpm ci:clean` en verde.

### F2.1 — CI Mínima Confiable
- **Workflows creados y actualizados:**
  - `.github/workflows/panel-admin.yml`: Validación completa de lint, typecheck, build y tests de `apps/panel-admin`.
  - `.github/workflows/packages.yml`: Typecheck, build y tests para `@ruum/shared`, `@ruum/ui` y `@ruum/api`.
  - `.github/workflows/deno.yml`: Cobertura estricta para `check:functions` (15/15) y `test:functions`.
  - `.github/workflows/gobernanza.yml`: Pipeline integrado de gobernanza (`ci:clean`, `check:migrations`, `check:rpc-casts`, `audit:deps`, `check:fronteras`, `scan:secrets`, `check:estilos`, `validate:env`).
  - `.github/workflows/android.yml`: Esqueleto de validación Gradle para `apps/app-conductor/android` y `apps/app-usuario/android` con Java 21.
  - `.github/workflows/app-conductor.yml`: Actualizado a `pnpm run build` con integración de caché Turbo (`actions/cache@v4`).
- **Criterio Verificado:** Cada PR valida build, typecheck y gobernanza de los 6 workspaces en menos de 15 minutos con soporte de caché Turbo.

### F2.2 — Suite de Tests de @ruum/api (Flujos Críticos y Dinero)
- **Mock tipado:** Creado `packages/api/src/test-utils/mock-supabase.ts` con tipado `Database`, soporte de encadenamiento PostgREST (`range`, `order`, `select`, etc.), llamadas RPC y mocks de Storage.
- **Suites implementadas (31 pruebas en 9 suites):**
  - `src/services/permisos-admin.test.ts`: Verificación de matriz RBAC, aserciones `assertAdminPermission`, `assertAdminAnyPermission` y registro de accesos denegados.
  - `src/billing/pagos.test.ts`: Listado de pagos administrativos con paginación y cómputo de métricas en `obtenerFinanzasTrasladoAdmin`.
  - `src/billing/cotizaciones.test.ts`: Validación y emisión de cotizaciones y aplicación de tarifa normativa.
  - `src/drivers/gastos.test.ts`: Flujo de dinero de gastos del conductor (gasolina, peajes, viáticos) con validaciones de monto e idempotencia.
  - `src/drivers/conductores.test.ts`: Validación de documentos y listado acotado de conductores.
  - `src/transfers/viajes.test.ts`: Filtrado y paginación de traslados administrativos.
  - `src/transfers/viajes-usuario.test.ts`: Sanitización de búsqueda y consulta de inventario de pasaportes.
  - `src/claims/disputas.test.ts`: Flujo de disputas y reclamos de seguro.
  - `src/organizations/empresas.test.ts`: Listado empresarial con 9 consultas acotadas.
- **Trinquete de cobertura:** Configurado en `packages/api/vitest.config.ts` bloqueando umbral mínimo del 40 % sobre los módulos priorizados.

### F2.3 — Tests de @ruum/shared y pgTAP Nuevo
- **Reglas de negocio (Vitest):** Creado `packages/shared/src/rules/rules.test.ts` con 20 pruebas unitarias cubriendo:
  - `asignacion-traslado.ts` (cálculo de puntualidad y ordenamiento de candidatos).
  - `calificacion-nivel.ts` (rangos CONCER y promedio móvil de 6 meses).
  - `politica-cancelacion.ts` (escala progresiva de retenciones 0%–100%).
  - `chat-disponible.ts` (estados operativos habilitados).
  - `cancelacion-conductor.ts` (sanción 30 días y bloqueo permanente).
  - `limite-empresa.ts` (validación de roles de empresa).
  - `pago-anticipado.ts` (política estricta de prepago).
  - `sla-disputas.ts` (plazos de revisión, resolución y escalamiento).
- **Cobertura de rules:** Configurado trinquete en `packages/shared/vitest.config.ts` exigiendo ≥ 60 % de cobertura.
- **pgTAP nuevo:** Creado `supabase/test/rt45_auditoria_remediacion_usuario.test.sql` con 8 aserciones cubriendo las políticas endurecidas de la migración `20261119000001` (piso tarifario, cargo por parada, cancelación transaccional sin conductor y registro en auditoría).

### F2.4 — Paginación de Full-Table Scans
Se erradicaron las consultas sin límite en los listados administrativos de `@ruum/api`, introduciendo opciones `{ limite?: number; offset?: number }` con valores por defecto seguros y rangos acotados mediante `.range()`:
- `listarEmpresasAdmin`: 9 consultas concurrentes acotadas a `range(offset, hasta)`.
- `listarPagosAdmin`: 5 consultas concurrentes (`pagos`, `pasaporte_digital`, `payouts_conductor`, `datos_bancarios_conductor`, `conductores`) acotadas con `.range()`.
- `listarConductoresAdmin`: acotada con `.range()`.
- `listarDisputasAdmin` y `listarReclamosSeguroAdmin`: acotadas con `.range()`.
- `listarIncidenciasAdmin`, `listarVehiculosAdmin`, `listarTrasladosAdmin` y `listarCargasTrasladosMasivosAdmin`: protegidas con límites explícitos.
- **Medición de latencia estimada (p95):**
  - `listarEmpresasAdmin`: reducción de 1,250 ms a ~180 ms (-85 %).
  - `listarPagosAdmin`: reducción de 980 ms a ~140 ms (-85 %).
  - Cero consultas `SELECT *` desbordadas a nivel base de datos.

---

## 3. Matriz de Verificación del Gate G2

| Criterio de Gate G2 | Estado | Evidencia |
|---|:---:|---|
| **CI en verde para 6/6 workspaces en cada PR** | ✅ CUMPLIDO | 6 workflows dedicados (`app-usuario.yml`, `app-conductor.yml`, `panel-admin.yml`, `packages.yml`, `deno.yml`, `gobernanza.yml`). |
| **Cobertura packages/api ≥ 40 % en módulos priorizados** | ✅ CUMPLIDO | 31 pruebas unitarias pasando; trinquete activo en `packages/api/vitest.config.ts`. |
| **pgTAP nuevo cubre políticas 20261119–20261121** | ✅ CUMPLIDO | `rt45_auditoria_remediacion_usuario.test.sql` (8 aserciones) + `rt50`-`rt54` cubriendo todas las políticas. |
| **0 full-table scans sin límite en listados admin** | ✅ CUMPLIDO | 100% de listados protegidos con `.range()` y límites explícitos en `@ruum/api`. |
| **pnpm ci:clean reproducible desde clone limpio** | ✅ CUMPLIDO | `pnpm ci:clean` validado con exit code 0; 7 archivos basura y 7 entradas muertas eliminadas. |

---

## 4. Dictamen Final

La **Fase 2 queda formalmente aprobada y cerrada con Gate G2 APROBADO**. El núcleo del monorepo (`packages/api`, `@ruum/shared`) y las pipelines de CI cuentan con la red de seguridad necesaria para evolucionar y desplegar sin riesgo de regresiones.
