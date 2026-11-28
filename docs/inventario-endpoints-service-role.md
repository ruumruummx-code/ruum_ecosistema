# Inventario de Endpoints y Uso de `service_role`

**Fecha:** 2026-11-22  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata)  
**Ticket:** `RUUM-SEC-001` (F0.0: Designar owners + inventariar endpoints con service_role)  
**Estado:** Propuesto para Aprobación  

---

## 1. Resumen Ejecutivo y Matriz de Riesgo

El Informe Técnico de Arquitectura (2026-11-22) evidenció un vector de riesgo crítico:
> En `apps/app-usuario/src/middleware.ts`, las rutas bajo `/api/**` fueron excluidas de `RUTAS_PROTEGIDAS_USUARIO`. Dado que las 3 aplicaciones (`app-usuario`, `app-conductor`, `panel-admin`) comparten el mismo proyecto de Supabase Auth, **un conductor autenticado (con JWT válido emitido por Supabase Auth) puede realizar llamadas a los endpoints de `/api/**` de `app-usuario`**. Si el endpoint no valida explícitamente el rol de la aplicación y ejecuta mutaciones o consultas con `service_role`, se produce un **bypass de aislamiento RBAC entre aplicaciones**.

Este inventario audita el 100 % de los Route Handlers de las 3 aplicaciones (46 endpoints en total):
- **`app-usuario`**: 30 route handlers (29 en `/api/**` + 1 en `/auth/callback`).
- **`panel-admin`**: 12 route handlers en `/api/**`.
- **`app-conductor`**: 4 route handlers en `/api/**` (+ 1 en `/auth/callback`).

### Resumen de Hallazgos

| Aplicación | Total Endpoints | Usa `service_role` | Requiere Sesión (`getUser`) | Valida Rol Aplicación | Sensibles (Requieren Bloqueo F0.1) |
|---|---:|---:|---:|---:|---:|
| **`app-usuario`** | 30 | **8** | 16 | **0** | **6** |
| **`panel-admin`** | 12 | **5** | 1 | **10** (vía `tienePermisoAdmin`) | **0** (Ya protegidos por RBAC admin) |
| **`app-conductor`** | 4 | **0** | 1 | 0 | **0** |

---

## 2. Mapa de Owners Designados

Para la gobernanza de las remediaciones de Fase 0 y Fase 1, se establecen los siguientes propietarios (ver desglose nominal completo y mandato formal en [fase-0-owners.md](fase-0-owners.md)):

| Dominio / Módulo | Owner Designado | Rol | Responsabilidad en Fase 0 |
|---|---|---|---|
| **Arquitectura Principal & Monorepo** | Arquitecto Principal (AP) | Governance / SecOps | Aprobación del inventario, revisión de PRs de mitigación (`F0.1` - `F0.4`), Gate G0. |
| **App Usuario (API & Core)** | Lead Tech App Usuario | Owner `apps/app-usuario` | Implementación del guard de rol en endpoints sensibles (`F0.1`), ajuste del proxy Mapbox (`F0.2`), saneamiento de `tarifa-snapshot.ts` (`F0.3`). |
| **Panel Admin (Torre & Backoffice)** | Lead Tech Panel Admin | Owner `apps/panel-admin` | Creación de `/api/csp-report` (`F0.5`), verificación de endpoints `admin-auth`. |
| **App Conductor & Mobile** | Lead Tech Conductor / Mobile | Owner `apps/app-conductor` & Capacitor | Saneamiento de `webContentsDebuggingEnabled` en Android (`F0.4-Mobile`). |

---

## 3. Inventario Completo: `apps/app-usuario` (30 Endpoints)

### 3.1 Endpoints Sensibles con `service_role` (🔴 Requieren Bloqueo Inmediato en F0.1)

Estos endpoints ejecutan lógica con privilegios elevados (`service_role`), verifican sesión (`auth.getUser()`), pero **NO validan que el llamador tenga rol `usuario`**. Un conductor autenticado puede invocarlos con su token de sesión.

| Ruta del Endpoint | Métodos | Uso de `service_role` | Verificación de Sesión (`getUser`) | Verificación de Rol Actual | Clasificación | Owner | Detalle del Riesgo |
|---|---|:---:|:---:|:---:|---|---|---|
| `/api/cuenta/metodos-pago` | `GET`, `POST` | **Sí** (vía `billetera-server.ts`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Crítico:** Crea o asocia un `customer` de Stripe y adjunta `PaymentMethods` en `billetera_clientes_stripe` usando `service_role`. Un conductor podría enrolar tarjetas o manipular billetera en el contexto de cliente. |
| `/api/cuenta/telefono/verificar` | `POST` | **Sí** (directo vía `crearClienteServicio`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Crítico:** Ejecuta `serviceRole.auth.admin.updateUserById(user.id, { user_metadata: { telefono_verificado: true } })`. Permite a un conductor marcarse arbitrariamente teléfono verificado en Supabase Auth. |
| `/api/viajes` | `POST` (`GET` usa cliente usuario) | **Sí** (en `POST` vía `cotizacion-individual-servidor.ts`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Alto:** Emite cotizaciones individuales persistidas con `service_role` mediante la RPC `servidor_cotizar_traslado_individual`. Un conductor podría generar cotizaciones y registros de traslado como pasajero. |
| `/api/viajes/masivos/validate` | `POST` | **Sí** (vía `validarFilasServidor`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Medio-Alto:** Consume catálogo de códigos postales y valida filas para cargas masivas con `service_role`. Debe restringirse exclusivamente a cuentas `usuario`. |
| `/api/viajes/masivos/cotizar` | `POST` | **Sí** (vía `clienteMasivoServicio`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Alto:** Persiste checkouts masivos y cotizaciones en base de datos con `service_role`. |
| `/api/viajes/masivos/pendientes` | `GET`, `DELETE` | **Sí** (vía `clienteMasivoServicio`) | Sí | **No** | 🔴 **Sensible (Bloqueo F0.1)** | Lead Tech App Usuario | **Medio-Alto:** Consulta y cancela checkouts masivos sin cobro utilizando `service_role`. |

### 3.2 Endpoints `internal` protegidos por Cron Secret (🟢 No Sensibles al Bypass de Conductor)

| Ruta del Endpoint | Métodos | Uso de `service_role` | Verificación de Sesión (`getUser`) | Mecanismo de Auth | Clasificación | Owner | Justificación |
|---|---|:---:|:---:|---|---|---|---|
| `/api/internal/viajes/reconcile` | `GET` | **Sí** | No | `autorizarCron(req)` (`Bearer CRON_SECRET` o `VIAJES_RECONCILIADOR_SECRET` con `timingSafeEqual`) | 🟢 **No sensible (Internal)** | Lead Tech App Usuario | Requiere secreto compartido del cron de infraestructura. Conductor no tiene acceso. |
| `/api/internal/masivos/reconcile` | `GET` | **Sí** | No | `autorizarCron(req)` (`Bearer CRON_SECRET` o `VIAJES_RECONCILIADOR_SECRET` con `timingSafeEqual`) | 🟢 **No sensible (Internal)** | Lead Tech App Usuario | Requiere secreto compartido del cron de infraestructura. |

### 3.3 Endpoints con Sesión de Usuario sin `service_role` (🟡 Revisar / Endurecer en Fase 1)

Operan con el cliente de sesión `crearClienteServidor()`. RLS en Postgres aisla los datos, pero deben validar rol `usuario` en Fase 1 para higiene arquitectónica.

| Ruta del Endpoint | Métodos | Uso de `service_role` | `getUser` | Rol Validado | Clasificación | Owner |
|---|---|:---:|:---:|:---:|---|---|
| `/api/viajes/masivos/estado` | `GET` | **No** (usa sesión; lee checkout masivo) | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/viajes/masivos/geocode` | `POST` | **No** | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/viajes/[id]/estado-pago` | `GET` | **No** (solo lectura de traslado asignado/usuario) | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/viajes/[id]/pasaporte` | `GET` | **No** (genera PDF; valida permiso tarifa vía RLS/RPC) | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/verificacion/didit/iniciar` | `POST` | **No** (invoca Edge Function `iniciar-verificacion-didit`) | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/traslados/resumen` | `GET` | **No** | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/soporte` | `POST` | **No** | Sí | No | 🟡 Revisar (Fase 1) | Lead Tech App Usuario |
| `/api/recovery/verify` | `GET` | **No** | Sí | No | 🟢 No sensible | Lead Tech App Usuario |

### 3.4 Endpoints Públicos o de Autenticación / Infraestructura (🟢 No Sensibles)

| Ruta del Endpoint | Métodos | Uso de `service_role` | Requiere Sesión | Clasificación / Mecanismo de Seguridad | Owner |
|---|---|:---:|:---:|---|---|
| `/api/auth/login` | `POST` | No | No (Público) | 🟢 No sensible (Rate limit 5/min IP + device + Turnstile + CSRF) | Lead Tech App Usuario |
| `/api/auth/signup` | `POST` | No | No (Público) | 🟢 No sensible (Rate limit 3/10min + CSRF) | Lead Tech App Usuario |
| `/api/auth/verify-otp` | `POST` | No | No (Público) | 🟢 No sensible (Rate limit 5/5min + CSRF) | Lead Tech App Usuario |
| `/api/auth/resend` | `POST` | No | No (Público) | 🟢 No sensible (Rate limit 3/10min + CSRF) | Lead Tech App Usuario |
| `/api/auth/phone-verify/send` | `POST` | No | No (Público) | 🟢 No sensible (Twilio Verify + Rate limit) | Lead Tech App Usuario |
| `/api/auth/phone-verify/verify` | `POST` | No | No (Público) | 🟢 No sensible (Twilio Verify OTP check) | Lead Tech App Usuario |
| `/api/recovery/request` | `POST` | No | No (Público) | 🟢 No sensible (Rate limit IP/email + CSRF) | Lead Tech App Usuario |
| `/api/recovery/clear` | `POST`, `DELETE` | No | No (Público) | 🟢 No sensible (Limpia cookie de recovery) | Lead Tech App Usuario |
| `/api/csrf` | `GET` | No | No (Público) | 🟢 No sensible (Emite token CSRF) | Lead Tech App Usuario |
| `/api/csp-report` | `POST` | No | No (Público) | 🟢 No sensible (Colector de telemetría CSP) | Lead Tech App Usuario |
| `/api/catalogos/sat` | `GET` | No | No (Público) | 🟢 No sensible (Catálogo público de sólo lectura) | Lead Tech App Usuario |
| `/api/ubicaciones` | `POST` | No | No (Público) | 🟢 No sensible (Autocomplete geocoding sin secreto) | Lead Tech App Usuario |
| `/api/ruta` | `POST` | No | **No (Anónimo)** | 🔴 **Sensible (RUUM-SEC-006 / F0.2)**: Consume `MAPBOX_SECRET_TOKEN` sin sesión. Requiere exigir auth en F0.2. | Lead Tech App Usuario |

---

## 4. Inventario: `apps/panel-admin` (12 Endpoints)

Todos los endpoints que utilizan `service_role` residen en `/api/admin-auth/*` y están protegidos por el helper server-side `tienePermisoAdmin(cliente, permiso)`.

| Ruta del Endpoint | Métodos | Uso de `service_role` | Verificación de Permiso / Rol | Clasificación | Owner |
|---|---|:---:|---|---|---|
| `/api/admin-auth/correo-conductor` | `GET` | **Sí** (`getUserById`) | Exige `conductores:leer` | 🟢 No sensible (Protegido por RBAC Admin) | Lead Tech Panel Admin |
| `/api/admin-auth/estado-acceso` | `POST` | **Sí** (`updateUserById` - ban/unban) | Exige `usuarios:validar` o `conductores:sancionar` | 🟢 No sensible (Protegido por RBAC Admin) | Lead Tech Panel Admin |
| `/api/admin-auth/invitar-admin` | `POST` | **Sí** (`createUser`, `updateUserById`) | Exige `capacidades:administrar` + `auth.getUser()` | 🟢 No sensible (Protegido por RBAC Admin) | Lead Tech Panel Admin |
| `/api/admin-auth/invitar-conductor` | `POST` | **Sí** (`createUser`) | Exige `conductores:validar` | 🟢 No sensible (Protegido por RBAC Admin) | Lead Tech Panel Admin |
| `/api/admin-auth/invitar-usuario` | `POST` | **Sí** (`createUser`) | Exige `usuarios:validar` | 🟢 No sensible (Protegido por RBAC Admin) | Lead Tech Panel Admin |
| `/api/auditoria` | `GET` | No | Exige `auditoria:leer` | 🟢 No sensible | Lead Tech Panel Admin |
| `/api/exportaciones/metricas-registro`| `GET` | No | Exige `conductores:leer` + `exportaciones:crear` | 🟢 No sensible | Lead Tech Panel Admin |
| `/api/exportaciones/pagos` | `GET` | No | Exige `pagos:exportar` + `pagos:leer` + `exportaciones:crear`| 🟢 No sensible | Lead Tech Panel Admin |
| `/api/exportaciones/vehiculos` | `GET` | No | Exige `vehiculos:leer` + `exportaciones:crear` | 🟢 No sensible | Lead Tech Panel Admin |
| `/api/observabilidad` | `GET` | No | Infra health-check RPC Supabase | 🟢 No sensible | Lead Tech Panel Admin |
| `/api/codigos-postales/[prefijo]` | `GET` | No | Lectura de catálogo estático JSON | 🟢 No sensible | Lead Tech Panel Admin |
| `/api/plantillas/traslados-masivos` | `GET` | No | Descarga de plantilla estática Excel | 🟢 No sensible | Lead Tech Panel Admin |

---

## 5. Inventario: `apps/app-conductor` (4 Endpoints)

| Ruta del Endpoint | Métodos | Uso de `service_role` | Verificación de Sesión | Clasificación | Owner |
|---|---|:---:|---|---|---|
| `/api/csp-report` | `GET`, `POST` | No | No (Público) | 🟢 No sensible | Lead Tech Conductor |
| `/api/health` | `GET` | No | No (Público infra probe) | 🟢 No sensible | Lead Tech Conductor |
| `/api/recovery/clear` | `POST`, `DELETE`| No | No (Limpia cookie recovery) | 🟢 No sensible | Lead Tech Conductor |
| `/api/recovery/verify` | `GET` | No | Sí (`auth.getUser()`) | 🟢 No sensible | Lead Tech Conductor |

---

## 6. Plan de Mitigación Inmediata (Conexión con RUUM-SEC-005 / F0.1)

Para los **6 endpoints sensibles identificados en `app-usuario`**, se aprueba la siguiente estrategia de mitigación inmediata para el sub-ticket `RUUM-SEC-005 (F0.1)`:

1. **Crear helper de guardia estricta en `apps/app-usuario/src/lib/guardia-rol-usuario.ts`**:
   ```typescript
   import { User } from "@supabase/supabase-js";
   import { NextResponse } from "next/server";
   import { clasificarRolApp } from "@ruum/api/identity";
   import { crearClienteServidor } from "@/lib/supabase-server";

   export async function exigirRolUsuario(user: User): Promise<NextResponse | null> {
     const cliente = await crearClienteServidor();
     const rol = await clasificarRolApp(cliente, user.id);
     if (rol === "conductor") {
       return NextResponse.json(
         { error: "Acceso denegado: cuenta no autorizada para operar en la app de pasajeros." },
         { status: 403 }
       );
     }
     return null;
   }
   ```
2. **Aplicar la guardia en los 6 endpoints sensibles**:
   - `/api/cuenta/metodos-pago`
   - `/api/cuenta/telefono/verificar`
   - `/api/viajes` (en método `POST`)
   - `/api/viajes/masivos/validate`
   - `/api/viajes/masivos/cotizar`
   - `/api/viajes/masivos/pendientes`
3. **Criterio de éxito de F0.1**: Si un usuario autenticado clasificado como `conductor` realiza un request a cualquiera de estos 6 endpoints, el servidor responde inmediatamente con `403 Forbidden` en JSON, impidiendo cualquier ejecución con `service_role`.

---

## 7. Dictamen y Aprobaciones Requeridas

- [x] **Inventario técnico exhaustivo completado**: 46 endpoints analizados en código fuente.
- [x] **Endpoints sensibles categorizados**: 6 endpoints con `service_role` vulnerables al bypass de conductor.
- [ ] **Aprobación del Arquitecto Principal (AP)**: Pendiente de firma.
- [ ] **Aprobación del Lead Tech / Owner de App Usuario**: Pendiente de firma.
