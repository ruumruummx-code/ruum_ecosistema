# OPS-003 — Sentry Alerts — App Conductor

> **Objetivo:** Detectar `error rate >1%`, `p95 LCP >2.5s`, `csp-report flood`, `health down`.

## Alertas a configurar en Sentry (proyecto `ruum-conductor`)

### 1) Error Rate — Crash / ErrorBoundary
- **Metric:** `events` where `level:error`
- **Condition:** `count > 50 in 5m` OR `error rate > 1% of sessions` (si hay session replay)
- **Filter:** `release:ruum-conductor@*` AND `environment:production|staging`
- **Action:** Slack `#alertas-conductor` + PagerDuty (si prod)
- **Owner:** Frontend

### 2) Performance — LCP
- **Metric:** `transactions` where `transaction.op: pageload` p95(LCP)
- **Threshold:** `p95 > 2500ms for 10m`
- **Filter:** `transaction:/panel`, `/viajes/[id]`, `/viajes/[id]/evidencia`
- **Action:** Slack + ticket Jira `PERF`

### 3) CSP Report Flood
- **Metric:** `events` where `logger:csp-report` OR `transaction:/api/csp-report`
- **Condition:** `count > 10/min for 5m`
- **Action:** Slack `#secops` — indica regresión CSP (ej. style-src sin nonce)
- **Runbook:** Revisar `CSP_DEUDA_P2.md`, `scripts/assert-csp.mjs`

### 4) Health Down
- **Uptime/sintético:** workflow externo [`Uptime app-conductor`](../../../../.github/workflows/conductor-healthcheck.yml), cada 5m y manual. Consulta `CONDUCTOR_HEALTHCHECK_URL` (default `https://concer.ruumruum-moviliax.online/api/health`), timeout de 10s y un reintento.
- **Condición:** HTTP 2xx, JSON válido, `status=ok` y `checks.supabase.status=ok`; un segundo fallo termina el workflow con error.
- **Acción:** configurar notificaciones de fallo del workflow para el on-call; abrir el enlace al run, hacer recheck manual y seguir el runbook.
- **Runbook:** [`docs/ops/RUNBOOK_HEALTH.md`](RUNBOOK_HEALTH.md).

### 5) Offline Sync Stuck
- **Metric:** `recordOperationalEvent` where `type: sync_failure | evidence_stuck`
- **Condition:** `count > 5 in 15m`
- **Filter:** `extra.scope: evidencia|offline`
- **Action:** Slack `#conductor-ops`

### 6) Fallo al verificar rol de conductor — fail-closed
- **Evento/métrica:** `conductor_role_verification_failed` (cada fallo de `clasificarRolApp` tras 2 reintentos en el middleware). La petición protegida recibe HTTP 503; el middleware registra un evento estructurado en Vercel Logs y trata de persistirlo en `eventos_operativos_app`.
- **Dimensiones:** `ambito=app-conductor`, `pathname`, `motivo` (código corto) y `version_app`. No agregar ID de usuario, cookies ni tokens. El evento no incluye campo de ambiente; ejecutar el monitor contra la BD del ambiente que se alerta y filtrar `environment=production` en Vercel Logs.
- **Ventana y umbral:** contar filas/eventos de los últimos 5 minutos; **warning con 1 o más**, **page a Seguridad + on-call con 3 o más**. Agrupar por versión/ruta para distinguir una caída general de un endpoint aislado.
- **Fuente principal:** monitor SQL ejecutado cada minuto con conexión de solo lectura autorizada para consultar eventos operativos:

  ```sql
  select count(*)::int as fallos_5m,
         max(creado_en) as ultimo_fallo
  from public.eventos_operativos_app
  where tipo = 'conductor_role_verification_failed'
    and detalle->>'ambito' = 'app-conductor'
    and creado_en >= now() - interval '5 minutes';
  ```

  Alertar cuando `fallos_5m >= 1`; elevar a page cuando `fallos_5m >= 3`. Si el RPC de telemetría no persiste el evento, activar la misma regla en Vercel Logs buscando el JSON `event` exacto; el log se emite antes de intentar persistirlo.
- **Acción:** usar [`docs/runbooks/CONDUCTOR-ROLE-FAIL-OPEN.md`](../../../docs/runbooks/CONDUCTOR-ROLE-FAIL-OPEN.md). Mantener alerta activa hasta 30 minutos sin fallos y completar las comprobaciones de autorización/RLS.
- **Owner:** Seguridad + backend de identidad.

## Configuración código

- `sentry.client.config.ts` / `sentry.server.config.ts` ya filtran PII (`sendDefaultPii:false`, `beforeSend` con `FORBIDDEN=/curp|clabe|.../`)
- `src/lib/observability.ts:recordOperationalEvent` hace `rpc:registrar_evento_operativo_app` + mirror a `window.Sentry.captureMessage` si existe
- `src/app/api/health/route.ts` expone `status:ok|degraded|down` + latencia Supabase

## Releases y source maps

- El identificador es `SENTRY_RELEASE`; si no se define, se usa `ruum-conductor@${NEXT_PUBLIC_APP_VERSION}`. Configurarlo con el mismo valor en el build y en el runtime (recomendado: `ruum-conductor@<commit-sha>`).
- En CI/hosting, guardar `SENTRY_AUTH_TOKEN` como secreto de acceso restringido a crear releases y subir artefactos. Configurar `SENTRY_ORG` y `SENTRY_PROJECT` (slug `ruum-conductor`) como variables protegidas. Nunca incluir el token en `.env.example`, logs o archivos versionados.
- Para el build de producción que se va a desplegar, activar `SENTRY_UPLOAD_SOURCE_MAPS=true`. `withSentryConfig` genera y sube los mapas para ese release; después los elimina del artefacto. `hideSourceMaps` evita servirlos públicamente. Sin credenciales/flag, el build no intenta subirlos.
- La configuración de despliegue debe inyectar el mismo release en `SENTRY_RELEASE` (servidor) y `NEXT_PUBLIC_SENTRY_RELEASE` (cliente), además de `SENTRY_DSN` (servidor) y `NEXT_PUBLIC_SENTRY_DSN` (cliente). Ambiente va en `SENTRY_ENVIRONMENT`/`NEXT_PUBLIC_RUUM_AMBIENTE`.

En GitHub Actions: crear el secret `SENTRY_AUTH_TOKEN` y las variables `SENTRY_ORG` y `SENTRY_PROJECT`; limitar la publicación de mapas al build de despliegue de producción. En Vercel/hosting, definir las mismas variables para el ambiente Production. El build E2E de PR no debe subir releases.

## Verificación local

```bash
pnpm --filter @ruum/app-conductor build
curl -s http://localhost:3001/api/health | jq
# {"status":"ok","version":"1.0.0","checks":{"supabase":{"status":"ok"}}}

node scripts/assert-csp.mjs
pnpm scan:secrets
```
