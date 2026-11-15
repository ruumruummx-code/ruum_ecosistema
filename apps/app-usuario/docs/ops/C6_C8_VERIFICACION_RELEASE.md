# App Usuario — Verificación de Sentry y smoke de Vercel

**14 de noviembre de 2026, Ciudad de México.** Proyecto Vercel `ruum-ecosistema-kcct`, equipo `ruumruumconductor`.

## C6 — Sentry en producción

La API de Vercel confirmó `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN` con destino `production`. También existen entradas para Preview. El JavaScript de `/login` en `3c8d90b` contiene el mismo DSN público que configura Vercel para producción. La entrega de eventos y la notificación por las reglas activas quedan pendientes de verificación. [Variables del proyecto](https://vercel.com/ruumruumconductor/ruum-ecosistema-kcct/settings/environment-variables).

Vercel identifica la organización y el proyecto de Sentry como `moviliax/ruum_ecosistema`. El runbook anterior menciona `ruum-usuario`. Con el token disponible, la API devolvió HTTP 403 al enumerar proyectos y HTTP 404 al consultar reglas para ambos nombres. Esos códigos dejan sin verificar las reglas y sus destinos. Hace falta acceso de solo lectura al proyecto o una exportación de las reglas activas.

Comparar los filtros de `app:app-usuario`, `alert:critical`, `alert_rule` y `event_type`, el entorno de producción y el destino de notificación contra los IDs definidos en `src/lib/sentry-alerts.ts`. El conjunto incluye Stripe, creación de traslado, callback de auth, Supabase, arranque, cotización, errores de petición y React Error Boundary. Registrar el ID de la regla o del conjunto de reglas que cubre cada evento, su estado y su acción. Las pruebas locales simulan el SDK.

## C8 — Smoke del commit solicitado

Vercel registra como `READY` el commit exacto `3c8d90b524e0ab620052af33d818a601f8e35cfe` en `dpl_Evg9muZPVBEaKMRtRTbFCrnCKNQb`, target Production. Se probó esa URL inmutable con acceso autenticado a Vercel. El dominio público apunta al deployment `dpl_GSKv6JgXDZzHDRgC7pviLMGiD6py`, commit `b8e15e5f391a75ac7174feee8ce28e201a6e14c1`. No se reasignaron dominios. [Deployment probado](https://vercel.com/ruumruumconductor/ruum-ecosistema-kcct/Evg9muZPVBEaKMRtRTbFCrnCKNQb).

| Ruta | Observación en Chromium | Pendiente |
| --- | --- | --- |
| `/login` | HTTP 200, correo y contraseña visibles | Iniciar sesión con la cuenta QA autorizada |
| `/registro` | HTTP 200, nombre y teléfono visibles | Completar el alta con identidad de prueba autorizada |
| `/viajes/nuevo` | HTTP 307 a `/login` con `next=/viajes/nuevo` | Cotizar con usuario QA verificado |
| `/viajes/[id]` | HTTP 307 a `/login` con `next` igual a la ruta solicitada | Abrir el traslado sintético de la cuenta QA y verificar pasaporte, evidencia y pagos |

Los recursos de la app desplegada identifican el Supabase de producción (`asmzetwwwugaoowiukdv`). Quedan pendientes la cuenta y el traslado sintético autorizados para el smoke autenticado.

## Rollback

**Ejecutor propuesto:** Manu (`ruumruummx-hub`, creador de los deployments), pendiente de confirmación. Antes de cualquier promoción, confirmar quién está de guardia, comprobar el destino del dominio y fijar el deployment estable anterior. El deployment actual `dpl_GSKv6JgXDZzHDRgC7pviLMGiD6py` figura como candidato de rollback en Vercel.

1. Ante una regresión crítica de login, registro, cotización o Pasaporte Digital tras promover, abrir el deployment estable anterior en Vercel y ejecutar **Instant Rollback**. Alternativa desde una CLI autenticada y vinculada al proyecto, `vercel rollback <URL-del-deployment-estable>`.
2. Confirmar que el dominio apunta al ID estable esperado y repetir el smoke de las rutas afectadas. Revisar errores de aplicación en Vercel y Sentry cuando estén disponibles.
3. Registrar hora, motivo, IDs, ejecutor y resultado. Si el candidato todavía está aislado en su URL inmutable, conservar el deployment que ya sirve el dominio público. [Procedimiento de Instant Rollback de Vercel](https://vercel.com/docs/instant-rollback).
