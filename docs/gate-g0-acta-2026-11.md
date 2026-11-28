# Acta Formal de Evaluación y Aprobación: Gate G0 (Fase 0)

**Fecha de Sesión del Comité:** 2026-11-27  
**Epic Evaluado:** `RUUM-SEC-EPIC-001` — Mitigación Inmediata de Exposición Activa  
**Repositorio:** `ruum-ruum` (Monorepo Ruum)  
**Entornos Auditados:** Supabase Cloud (`prod`: `asmzetwwwugaoowiukdv`, `staging`: `ytqhzrbmiczzwzzuzgbq`), Vercel (`ruum-app-usuario`), Aplicaciones móviles Capacitor Android.  
**Estado del Dictamen:** 🟢 **Aprobado con Deuda Documentada (Transición a Fase 1 Autorizada)**  

---

## 1. Estado de Ejecución de los 8 Sub-Tickets de Fase 0

El Comité revisó el estado de remediación en código, suites de pruebas automatizadas y configuraciones de nube:

| Sub-Ticket | Tarea | Owner | Estado de Cierre | Categoría de Cierre |
| :--- | :--- | :---: | :---: | :--- |
| **RUUM-SEC-001** | F0.0: Inventario de endpoints service_role | **AP** | ✅ Cerrado | **Limpio** — 46 endpoints inventariados en [inventario-endpoints-service-role.md](inventario-endpoints-service-role.md) y [fase-0-owners.md](fase-0-owners.md). |
| **RUUM-SEC-002** | F0.4: Grants reales y drift check | **BS** | ⚠️ Cerrado | **Con Deuda Documentada** — Clasificación canónica de 91 funciones terminada; `db diff --linked` diferido a [RUUM-SEC-002b](tickets/RUUM-SEC-002b.md) (DO, 2026-12-14). |
| **RUUM-SEC-003** | F0.3: Blindaje de tarifa-snapshot (fail-closed) | **FS** | ✅ Cerrado | **Limpio** — Fallback eliminado, server-only activo, 12 tests pasando y variable verificada en Vercel ([vercel-env-2026-11.md](vercel-env-2026-11.md)). |
| **RUUM-SEC-004** | F0.5: HIBP, MFA Admin y Timeouts en Supabase | **DO** | ⚠️ Cerrado | **Con Deuda Documentada** — HIBP y timeouts aplicados; enforcement obligatorio de MFA para admins diferido a F1.2 ([RUUM-SEC-010](supabase-auth-config-2026-11.md)). |
| **RUUM-SEC-005** | F0.1: Bloqueo RBAC sensible en middleware | **FS** | ✅ Cerrado | **Limpio** — 6 endpoints de app-usuario aislados (401/403) con suite de 7 tests pasando en [middleware-sensitive-endpoints.test.ts](../apps/app-usuario/src/middleware-sensitive-endpoints.test.ts). |
| **RUUM-SEC-006** | F0.2: Endurecimiento de proxy Mapbox /api/ruta | **FS** | 🔄 Cerrado | **Observaciones Resueltas** — Exige sesión (401), rate limit 10 req/min por usuario y decisión de mantener proxy temporal con caché en [decision-proxy-mapbox.md](decision-proxy-mapbox.md). |
| **RUUM-SEC-007** | F0.6: Desactivar WebView debugging en Android | **FS** | ⚠️ Cerrado | **Con Deuda Documentada** — Flag desactivada y assets sincronizados; hallazgo de pipeline móvil escalado a Fase 3 ([RUUM-SEC-014b](tickets/RUUM-SEC-014b.md)). |
| **RUUM-SEC-008** | F0.7: Resolver ceguera CSP en panel-admin | **FS** | ✅ Cerrado | **Limpio** — Endpoint `/api/csp-report` creado con rate limit distribuido y 7 tests unitarios pasando en [route.test.ts](../apps/panel-admin/src/app/api/csp-report/route.test.ts). |

---

## 2. Evidencias Verificadas en Repositorio

El Comité validó la autenticidad e integridad de los artefactos técnicos de evidencia archivados en el monorepo:
1. **Protección contra Contraseñas Filtradas (HIBP):**
   - Producción (`asmzetwwwugaoowiukdv`): [hibp-prod.json](evidencias/2026-11/hibp-prod.json) (`status: PASS`, sin warnings).
   - Staging (`ytqhzrbmiczzwzzuzgbq`): [hibp-staging.json](evidencias/2026-11/hibp-staging.json) (`status: PASS`).
2. **Timeouts Reales de Sesión en Supabase Cloud:**
   - Producción: [timeouts-prod.json](evidencias/2026-11/timeouts-prod.json) (`jwt_exp: 1800s`, `refresh_reuse: 10s`, `inactivity: 28800s`, `timebox: 86400s`).
   - Staging: [timeouts-staging.json](evidencias/2026-11/timeouts-staging.json).
3. **Aprovisionamiento Criptográfico en Vercel Prod:**
   - [vercel-tarifa-snapshot.json](evidencias/2026-11/vercel-tarifa-snapshot.json) y [vercel-env-2026-11.md](vercel-env-2026-11.md) (`TARIFA_SNAPSHOT_SECRET` configurada con 64 caracteres en entornos Production y Preview).

---

## 3. Clasificación Canónica de Lotes para F1.1 (RUUM-SEC-009)

Se certifica formalmente la matriz de **91 funciones SECURITY DEFINER** establecida en [grants-reales-2026-11.md](grants-reales-2026-11.md) como la **única fuente de verdad** para la ejecución del REVOKE masivo de permisos en Fase 1:

| Lote | Alcance Funcional | Cantidad | Destino Final del Grant | Acción en F1.1 |
|:---:|---|:---:|---|---|
| **Lote 1** | **Admin & Auditoría** | 18 | `service_role` exclusivo (o `authenticated` con check admin) | `REVOKE ... FROM anon, public;` |
| **Lote 2** | **Operaciones de Negocio** | 26 | `authenticated` (cliente/conductor) | `REVOKE ... FROM anon, public;` |
| **Lote 3** | **Helpers Internos / RLS / Triggers** | 28 | Interno de Motor PostgreSQL | `REVOKE ... FROM anon, authenticated, public;` |
| **Lote 4** | **Colas, Cron, SLA e Idempotencia** | 19 | `service_role` exclusivo | `REVOKE ... FROM anon, authenticated, public;` |
| **TOTAL** | | **91** | | |

---

## 4. Estado Real y Estrategia de MFA de Administradores

1. **Estado en Cloud (F0.5):** Capacidad TOTP activada a nivel global de proyecto (`totp.enroll_enabled = true`). Se encuentra vigente la ventana de gracia de 7 días (24–30 nov) para que los operadores inscriban su factor.
2. **Limitación de Plataforma:** Supabase Auth no soporta reglas condicionales de MFA por rol dentro de la consola.
3. **Estrategia Aprobada para Fase 1 (Ticket RUUM-SEC-010 / F1.2):**  
   El enforcement obligatorio de segundo factor para el rol `admins` no se confía a la consola de Supabase, sino que será ejecutado por `apps/panel-admin/src/middleware.ts` exigiendo nivel de aseguramiento `aal2`. Quien no lo cumpla será redirigido a `/login/mfa`.

---

## 5. Deudas Técnicas Aceptadas con Owner y Fecha Límite

El Comité aprueba la transición de fase aceptando expresamente las siguientes cuatro deudas técnicas debidamente acotadas:

1. **Ticket RUUM-SEC-002b:** Drift check exhaustivo con `db diff --linked` autenticado.  
   - **Owner:** DO (DevOps/SRE)  
   - **Fecha Límite:** 2026-12-14 (Bloquea a `RUUM-SEC-012` / F1.4).  
   - **Ficha Técnica:** [RUUM-SEC-002b.md](tickets/RUUM-SEC-002b.md).
2. **Ticket RUUM-SEC-003-Vercel:** Verificación continua de variables de entorno y pre-build CI.  
   - **Owner:** DO (DevOps/SRE)  
   - **Fecha Límite:** 2026-11-27 (Verificado y cerrado en [vercel-env-2026-11.md](vercel-env-2026-11.md)).
3. **Documento de Gobernanza de Owners:**  
   - **Owner:** AP (Arquitecto de Plataforma)  
   - **Fecha:** 2026-11-24 (Formalizado y mergeado en [fase-0-owners.md](fase-0-owners.md)).
4. **Ticket RUUM-SEC-014b:** Pipeline de release móvil Android, firma automatizada y Keystores en CI/CD.  
   - **Owner:** FS + DO  
   - **Fase de Ejecución:** Fase 3 (Mobile Hardening & Distribution).  
   - **Ficha Técnica:** [RUUM-SEC-014b.md](tickets/RUUM-SEC-014b.md).

---

## 6. Hallazgos que Trascienden el Epic (Seguridad Móvil)

El Comité tomó conocimiento formal del informe de escalamiento [escalamiento-comite-android-release-pipeline.md](escalamiento-comite-android-release-pipeline.md):
- **Diagnóstico:** Si bien la bandera `webContentsDebuggingEnabled: false` fue eliminada de los activos móviles compilados, las aplicaciones Android carecen de un release pipeline determinista en GitHub Actions y de gestión centralizada de llaves de firma de producción (`release.keystore`).
- **Resolución:** Se prohíbe la distribución externa de binarios compilados en máquinas locales y se incorpora formalmente el ticket `RUUM-SEC-014b` a la planificación de la Fase 3.

---

## 7. Insumos Canónicos Entregados para el Arranque de la Fase 1

La Fase 1 cuenta con insumos completos, auditados y libres de ambigüedad para su inicio el lunes 2026-11-30:
1. **Para F1.1 (REVOKE de 91 funciones):** Lista priorizada por lotes y scripts SQL base en [grants-reales-2026-11.md](grants-reales-2026-11.md) (Owner: BS).
2. **Para F1.2 (Enforcement MFA y RBAC en Middleware):** Especificación de validación AAL2 y endpoints en [supabase-auth-config-2026-11.md](supabase-auth-config-2026-11.md) (Owner: FS).
3. **Para F1.3 (Migración de Endpoints Sensibles):** Catálogo de 46 endpoints y contratos tipados en [inventario-endpoints-service-role.md](inventario-endpoints-service-role.md) (Owner: AP).
4. **Para F1.4 (Sanitización de Esquema Local):** Línea base de drifts en [supabase-drift-2026-11.md](supabase-drift-2026-11.md) (Owners: BS + DO).
5. **Decisión de Producto Mapbox:** Racional de conservación temporal del proxy `/api/ruta` con caching en [decision-proxy-mapbox.md](decision-proxy-mapbox.md).

---

## 8. Dictamen Final y Firmas

> ### 🏁 DICTAMEN: GATE G0 APROBADO CON DEUDA DOCUMENTADA
> Se certifica que los 5 vectores de exposición activa inmediata han sido neutralizados en código. La suite de pruebas de seguridad y estilos se encuentra al 100 % en verde (31/31 tests pasando, 0 violaciones de diseño). Las deudas técnicas han sido documentadas con owner y fecha estricta.  
> 
> **Se autoriza formalmente el inicio de la FASE 1 (Remediación Estructural) para el día 2026-11-30.**

### Firmas del Comité de Evaluación (2026-11-27):

```
__________________________________________
AP — Arquitecto de Plataforma & Monorepo Lead

__________________________________________
BS — Backend Senior & Data Architect

__________________________________________
FS — Frontend Senior & UI Architect

__________________________________________
DO — DevOps & SRE Lead

__________________________________________
QA — QA Lead & Security Test Automation
```
