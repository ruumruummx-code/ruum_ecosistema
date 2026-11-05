# Verificación de Hipótesis de Producción (RUUM-USR-F4-001 / T10)

En cumplimiento de la tarea **T10** y el criterio de aceptación **CA-8**, se verificaron en el código base y configuración las hipótesis técnicas señaladas en el informe de auditoría:

| Hipótesis Auditada | Configuración en Producción | Estado Verificado | Evidencia de Código |
| :--- | :--- | :--- | :--- |
| **Cookie de Recuperación** | Nombre: `ruum_rec_usuario`<br>Ruta: `/`<br>Flags: `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV !== "development"` | **Confirmado (Cumple)** | `@ruum/shared/utils`: `COOKIE_RECOVERY_USUARIO`, `opcionesCookieRecovery()` en `/auth/callback/route.ts` y `/api/recovery/clear/route.ts`. |
| **TTL de Autorización Temporal** | `MAX_AGE_RECOVERY_S = 15 * 60` (900 segundos / 15 minutos). Ventana corta que mitiga abandono de pantalla. | **Confirmado (Cumple)** | `@ruum/shared/utils/recovery.ts:22`. La cookie expira en 15 minutos independientemente del TTL de 60m del token de Supabase. |
| **Aislamiento de Identidad (RLS / Auth)** | `auth.users.email` es el único destino de recuperación. `usuarios.correo_facturacion` está estrictamente aislado para facturación CFDI. | **Confirmado (Cumple)** | `@ruum/api/services/usuarios.ts:515-550`. Prohibido el uso de `correo_facturacion` en flujos de identidad de acceso. |
| **Storage en Flujo 4** | El flujo de recuperación no escribe ni lee objetos en Supabase Storage (a diferencia de verificación de identidad). | **Confirmado (Cumple)** | No hay interacción con buckets de Storage en el Flujo 4. |
| **Rate Limit Durable sobre Redis** | Emplea Upstash Redis con claves `rl:recovery-*` y TTL garantizado mediante `SET NX EX`. | **Confirmado (Cumple)** | `src/lib/csp-rate-limit.ts:110-125`. En producción no degrada silenciosamente a memoria (fail-closed seguro). |
| **Mitigación CGNAT** | Clave compuesta (IP + cuenta/email + dispositivo) con umbrales diferenciados. | **Confirmado (Cumple)** | `src/lib/recovery-policy.ts` y endpoints `/api/recovery/request`, `/api/recovery/verify` y `/api/recovery/clear`. |
| **Pseudonimización de Telemetría** | Atributo `emailHash` unificado estrictamente como SHA-256 truncado a 32 hex (`hashIdentificador`). Sin uso de MD5 ni PII en claro. | **Confirmado (Cumple)** | `src/lib/recovery-policy.ts:38`, `docs/registro-flujo4.md` y telemetría estructurada en `/api/recovery/request`. |
