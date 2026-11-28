# Matriz de Asignación y Gobernanza: Owners Fase 0 & Fase 1

**Fecha:** 2026-11-27  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata) / `RUUM-SEC-EPIC-001-CLOSE` (CLOSE-07)  
**Ticket:** `RUUM-SEC-001` (F0.0: Designar owners y realizar inventario de endpoints con service_role)  
**Estado:** Activo y Vinculante  

---

## 1. Mandato del Arquitecto de Plataforma (AP)

El **Arquitecto de Plataforma (AP)** asume la gobernanza formal de la arquitectura monorepo con las siguientes responsabilidades indelegables:
1. **Ownership de `packages/api` como Producto Interno:**  
   `@ruum/api` es la única interfaz autorizada entre las aplicaciones cliente y la capa de datos/servicios. Ninguna aplicación Next.js debe implementar lógica de negocio respaldada por `service_role` de forma dispersa. Toda mutación sensible debe ser expuesta a través de contratos tipados y auditados en este paquete.
2. **Gobernanza del Monorepo:**  
   Custodia de la configuración de Turborepo, coherencia de dependencias en `pnpm-workspace.yaml`, enforcement de las políticas de diseño y tokens (`pnpm check:estilos`) y arbitraje de fronteras de aislamiento entre aplicaciones (`app-usuario`, `app-conductor`, `panel-admin`).
3. **Aprobación de Arquitectura de Seguridad:**  
   Revisión y firma obligatoria de cambios en RLS, directivas de Content Security Policy (CSP), middleware y control de acceso basado en roles (RBAC).

---

## 2. Nomenclatura Oficial del Equipo

- **AP:** Arquitecto de Plataforma & Monorepo Lead
- **BS:** Backend Senior & Data Architect (PostgreSQL / Supabase DBA)
- **FS:** Frontend Senior & UI Architect (Next.js / React / Capacitor)
- **QA:** QA Lead & Security Test Automation Engineer
- **DO:** DevOps & SRE Lead (Vercel / Supabase Cloud / CI/CD)

---

## 3. Matriz de Owners por Sub-Ticket de Fase 0

| ID Ticket | Tarea / Área de Impacto | Owner | Rol / Especialidad | Responsabilidad Clave |
|---|---|:---:|---|---|
| **RUUM-SEC-001** | F0.0 — Inventario de Endpoints service_role | **AP** | Arquitectura de Plataforma | Auditoría de 46 endpoints y matriz de mitigación transitoria |
| **RUUM-SEC-002** | F0.4 — Grants Reales & Supabase Drift | **BS** | Data & Backend Senior | Clasificación canónica de 91 funciones SECURITY DEFINER |
| **RUUM-SEC-003** | F0.3 — Snapshot Tarifa Fail-Closed | **FS** | Core Frontend Usuario | Erradicación de fallback harcodeado, server-only y tests |
| **RUUM-SEC-004** | F0.5 — Endurecimiento Supabase Auth | **DO** | Infraestructura & Cloud | Activación HIBP, timeouts y TOTP en Dashboard Cloud |
| **RUUM-SEC-005** | F0.1 — Bloqueo de Endpoints en Middleware | **FS** | Frontend Usuario | Interceptación RBAC y 403 Forbidden para roles no autorizados |
| **RUUM-SEC-006** | F0.2 — Endurecimiento Proxy Mapbox | **FS** | Tech Lead App Usuario | Auth Guard 401, rate limit 10 req/min y decisión de producto |
| **RUUM-SEC-007** | F0.6 — Desactivar Debugging WebView | **FS** | Ingeniería Móvil Capacitor | `webContentsDebuggingEnabled: false` y sync en Android |
| **RUUM-SEC-008** | F0.7 — Handler CSP Report en Admin | **FS** | Frontend Panel Admin | Endpoint `/api/csp-report` con rate limit distribuido |

---

## 4. Asignaciones Críticas para Fase 1 (Kickoff 2026-11-30)

| Ticket F1 | Nombre de la Tarea | Owner | Insumo Canónico de Fase 0 | Fecha Límite |
|---|---|:---:|---|:---:|
| **RUUM-SEC-009** | F1.1: REVOKE Masivo de EXECUTE (91 funciones) | **BS** | [grants-reales-2026-11.md](grants-reales-2026-11.md) | 2026-12-04 |
| **RUUM-SEC-010** | F1.2: Enforcement AAL2 Admin en Middleware | **FS** | [supabase-auth-config-2026-11.md](supabase-auth-config-2026-11.md) | 2026-12-07 |
| **RUUM-SEC-011** | F1.3: Migración de Endpoints Sensibles a RLS/API | **AP** | [inventario-endpoints-service-role.md](inventario-endpoints-service-role.md) | 2026-12-11 |
| **RUUM-SEC-012** | F1.4: Sanitización de Esquema y Drift Local | **BS + DO** | [supabase-drift-2026-11.md](supabase-drift-2026-11.md) | 2026-12-14 |

---

## 5. Deudas Técnicas Aceptadas y Responsables de Seguimiento

- **RUUM-SEC-002b (Drift Check Completo `db diff --linked`):** Asignado a **DO** con fecha límite 2026-12-14.
- **RUUM-SEC-003-Vercel (Aprovisionamiento `TARIFA_SNAPSHOT_SECRET`):** Asignado a **DO** (Completado y verificado el 2026-11-27).
- **RUUM-SEC-014b (Pipeline de Release Android & Keystores en Fase 3):** Asignado a **FS + DO**.
