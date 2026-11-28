# Configuración y Guía de Endurecimiento: Supabase Auth (Noviembre 2026)

**Fecha de Última Revisión:** 2026-11-27  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata) / `RUUM-SEC-EPIC-001-CLOSE`  
**Ticket:** `RUUM-SEC-004` (F0.5: Activar HIBP + MFA admins + timeouts de sesión en Supabase Cloud)  
**Proyectos objetivo:**
- **Producción:** `asmzetwwwugaoowiukdv` (`ruum_ecosistema`)
- **Staging:** `ytqhzrbmiczzwzzuzgbq`
- **Local (IaC):** `supabase/config.toml`

---

## 1. Tabla Canónica de Valores Reales Configurados (CLOSE-04)

**Fecha de Captura:** 2026-11-27T10:15:00Z  
**Método de Verificación:** Supabase Cloud Management API & Dashboard

| Parámetro Técnico | Valor Previo (Default GoTrue) | **Valor Real Configurado (Fase 0)** | Estado / Impacto de Seguridad | Ubicación en Supabase Cloud |
|---|---|:---:|---|---|
| `leaked_password_protection_enabled` | `false` (Warning Advisor) | **`true` (Activo)** | HIBP habilitado en registro/login | `Auth` -> `Providers` -> `Email` |
| `totp.enroll_enabled` / `verify` | `false` | **`true` (Activo)** | Infraestructura TOTP disponible | `Auth` -> `Multi-factor` -> `TOTP` |
| `jwt_exp` (Access Token TTL) | 3600 s (1 hora) | **`1800` s (30 minutos)** | Ventana reducida de token robado | `Auth` -> `Sessions` -> *JWT Expiry* |
| `refresh_token_rotation_enabled` | `true` | **`true` (Activo)** | Rotación de refresco forzada | `Auth` -> `Sessions` -> *Token Rotation* |
| `refresh_token_reuse_interval` | 10 s | **`10` s** | Intervalo de gracia para rotación | `Auth` -> `Sessions` -> *Reuse Interval* |
| `inactivity_timeout` / `sessions_inactivity` | Inactivo (o 604800s default) | **`28,800` s (8 horas)** | Cierre de sesión por inactividad | `Auth` -> `Sessions` -> *Inactivity* |
| `timebox` / `sessions_timebox` | Inactivo | **`86,400` s (24 horas)** | Límite absoluto de sesión | `Auth` -> `Sessions` -> *Timebox* |

> [!NOTE]
> **Resolución de Discrepancia entre Reportes Preliminares:**  
> La discrepancia identificada entre el reporte preliminar (que citaba 3600s de JWT, 86400s de inactividad o 604800s de refresh) y el reporte F0.5 responde a que los primeros reflejaban los valores por defecto de la instancia antes de la mitigación. Los valores de la columna **"Valor Real Configurado (Fase 0)"** son la **única fuente canónica y final** aplicada en producción y staging, corroborada en los archivos de evidencia:
> - Producción: [timeouts-prod.json](evidencias/2026-11/timeouts-prod.json)
> - Staging: [timeouts-staging.json](evidencias/2026-11/timeouts-staging.json)

---

## 2. Aclaración del Estado Real de MFA de Administradores (CLOSE-05)

### La Verdad Técnica de la Plataforma
1. **Capacidades nativas de GoTrue / Supabase Cloud:**  
   Supabase Auth no provee un conmutador en Dashboard para exigir MFA de forma condicional basándose en roles de PostgreSQL (ej. rol `admins`). La activación en Dashboard (`mfa_totp_enroll_enabled: true`) es **global para todo el proyecto**, permitiendo que cualquier usuario enrolado verifique su factor pero sin forzarlo automáticamente en el login primario.
2. **Nivel de Aseguramiento (AAL):**  
   Supabase clasifica las sesiones en:
   - `aal1`: Autenticación con contraseña o enlace mágico.
   - `aal2`: Autenticación de segundo factor (TOTP verificado).

### Resolución de la Contradicción y Alcance Real de F0.5
Para evitar ambigüedades en el dictamen de Gate G0, se establece la **Opción B**:
> **Dictamen de Criterio:**  
> **F0.5 NO cierra el criterio "MFA obligatoria para admins".**  
> F0.5 cierra con éxito la **habilitación de infraestructura TOTP en Cloud** y la **apertura de la ventana de gracia de 7 días (24–30 nov)** para que los operadores enrolen su autenticador.  
> El criterio de **MFA obligatoria por rol** se difiere formalmente a la **Fase 1 (Ticket RUUM-SEC-010 / F1.2)**, donde se implementará la verificación estricta de `AAL2` en el middleware de Next.js (`apps/panel-admin/src/middleware.ts`).

### Mecanismo de Enforcement Asignado a F1.2 (RUUM-SEC-010):
En `apps/panel-admin/src/middleware.ts`:
```typescript
// En F1.2 (RUUM-SEC-010): Redirección forzada si no cuenta con AAL2
const { data: aal } = await cliente.auth.mfa.getAuthenticatorAssuranceLevel();
if (aal.currentLevel !== "aal2") {
  return NextResponse.redirect(new URL("/login/mfa", request.url));
}
```

---

## 3. Evidencias Verificadas en Repositorio

- **HIBP en Producción:** [hibp-prod.json](evidencias/2026-11/hibp-prod.json)
- **HIBP en Staging:** [hibp-staging.json](evidencias/2026-11/hibp-staging.json)
- **Timeouts de Sesión en Producción:** [timeouts-prod.json](evidencias/2026-11/timeouts-prod.json)
- **Timeouts de Sesión en Staging:** [timeouts-staging.json](evidencias/2026-11/timeouts-staging.json)

---

## 4. Guía Paso a Paso para Operador de Supabase Cloud

### Paso 1: Activar HIBP (Protección contra contraseñas filtradas)
1. Iniciar sesión en [Supabase Dashboard](https://supabase.com/dashboard).
2. Seleccionar el proyecto `ruum_ecosistema` (`asmzetwwwugaoowiukdv` o `ytqhzrbmiczzwzzuzgbq`).
3. Ir a **Authentication** -> **Providers** -> **Email**.
4. Activar el toggle **"Protect against leaked passwords using HaveIBeenPwned"**.
5. Clic en **Save**.

### Paso 2: Activar MFA (App Authenticator TOTP)
1. En el mismo panel, ir a **Authentication** -> **Multi-Factor**.
2. En la sección **App Authenticator (TOTP)**, marcar **Enable TOTP**.
3. Asegurar que **Max Enrolled Factors** sea al menos `10`.
4. Clic en **Save**.

### Paso 3: Configurar Timeouts de Sesión
1. Ir a **Authentication** -> **Sessions**.
2. Establecer:
   - **JWT Expiry Limit**: `1800` (30 minutos).
   - **Enable Refresh Token Rotation**: Marcado (ON).
   - **Refresh Token Reuse Interval**: `10` segundos.
   - **Inactivity Timeout**: `28800` (8 horas).
   - **Timebox**: `86400` (24 horas).
3. Clic en **Save**.

### Paso 4: Verificación con Security Advisor
Ejecutar desde terminal vinculada:
```bash
supabase db advisors --type security --level info
```
**Criterio de éxito:** El warning `auth_leaked_password_protection` ya no figura en el reporte.
