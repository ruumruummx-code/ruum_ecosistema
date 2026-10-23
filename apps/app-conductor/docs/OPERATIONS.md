# App Conductor: configuración y operación

Guía para configurar, desplegar y recuperar `@ruum/app-conductor`. La plantilla
de variables de la app es [`../.env.example`](../.env.example); esta guía aclara
qué valores son obligatorios, cuáles son secretos y cómo operar producción.

## Arquitectura y límites de confianza

```text
Web / Android (Capacitor WebView)
              │ HTTPS
              ▼
Next.js (App Router, middleware, route handlers)
        │                   │
        ▼                   ▼
@ruum/api              Sentry / Mapbox
        │
        ▼
Supabase Auth + Postgres/RLS + Storage privado + RPC
```

- `apps/app-conductor` es el cliente Next.js y BFF de la app del conductor.
  `@ruum/api` contiene acceso a datos y servicios; `@ruum/shared` aporta tipos,
  reglas y seguridad; `@ruum/ui` aporta componentes. Mantener el acceso a
  Supabase dentro de `@ruum/api`, conforme a `pnpm check:fronteras`.
- `src/middleware.ts` aplica CSP con nonce, valida la sesión con Supabase Auth
  y protege rutas. La verificación del rol puede fallar abierta por continuidad
  operativa; RLS y las políticas/RPC de Supabase siguen siendo el control de
  autorización para datos y mutaciones. Ante
  `conductor_role_verification_failed`, seguir
  [`SENTRY_ALERTS.md`](ops/SENTRY_ALERTS.md) y
  [`CONDUCTOR-ROLE-FAIL-OPEN.md`](../../../docs/runbooks/CONDUCTOR-ROLE-FAIL-OPEN.md).
- El bucket `evidencia` es privado. Persistir paths, nunca signed URLs; generar
  URLs temporales para lectura. La cola local de evidencia permite reintentar
  durante una sesión cargada, pero el shell Android carga el sitio remoto y
  necesita red para un arranque en frío.
- Android usa Capacitor/WebView (`capacitor.config.ts`) y por defecto apunta a
  `https://concer.ruumruum-moviliax.online`; `RUUM_CAPACITOR_SERVER_URL` permite
  cambiar el destino al generar el shell. El despliegue web actualiza el sitio
  remoto que ve la app instalada; no publica un APK nuevo.

## Variables de entorno

Configurar las variables en el ambiente de despliegue, no en archivos
versionados. Los valores `NEXT_PUBLIC_*` se incorporan al bundle del navegador:
solo deben contener valores deliberadamente públicos. `SUPABASE_ANON_KEY` es la
clave pública con RLS; jamás colocar `service_role` en la app.

| Variable | Requerida | Exposición / uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí en hosting | URL HTTPS del proyecto Supabase; cliente y servidor. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí en hosting | Clave pública anon/publishable, protegida por RLS. |
| `NEXT_PUBLIC_APP_URL` | Sí en hosting | URL HTTPS canónica de la app; redirects de autenticación. |
| `NEXT_PUBLIC_APP_VERSION` | Sí en hosting | SemVer que se muestra en telemetría; debe corresponder con `config/app-version.json`. |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Sí en hosting | Token público `pk.*` para mapas; limitarlo por URL/permisos en Mapbox. |
| `NEXT_PUBLIC_RUUM_AMBIENTE` | Recomendada | `production` o `staging`; contactos y reglas CSP/observabilidad. |
| `NEXT_PUBLIC_MAPBOX_STYLE_URL` | Opcional | Estilo personalizado de Mapbox. |
| `NEXT_PUBLIC_RUUM_SOPORTE_TELEFONO`, `NEXT_PUBLIC_RUUM_SOPORTE_CORREO`, `NEXT_PUBLIC_RUUM_EMERGENCIA_TELEFONO` | Opcionales | Contactos mostrados en la app; usar contactos oficiales solo en producción. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Sí en hosting | Par de Upstash para rate-limit distribuido. Alternativa compatible: `KV_REST_API_URL` + `KV_REST_API_TOKEN`. No mezclar pares incompletos. |
| `RUUM_ROLE_COOKIE_SECRET` | Recomendada en producción | Secreto servidor, mínimo 32 caracteres, para firmar cookie de rol con TTL; si falta, no cachea el rol y consulta en cada request. |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Según observabilidad | DSN de servidor y cliente, respectivamente; no son tokens de autenticación. |
| `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | Opcionales | Ambiente y muestreo de performance de Sentry. |
| `SENTRY_RELEASE`, `NEXT_PUBLIC_SENTRY_RELEASE` | Recomendada al desplegar | El mismo identificador en build/runtime; convención `ruum-conductor@<commit-sha>`. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_UPLOAD_SOURCE_MAPS` | Solo build con subida | Token de Sentry como secreto de CI; org/proyecto como variables protegidas. Activar el flag únicamente para el build que se desplegará. |
| `RUUM_CAPACITOR_SERVER_URL` | Solo si se cambia el destino Android | URL remota embebida al generar Capacitor; omitir para producción canónica. |

En producción, `scripts/validate-env.mjs app-conductor` exige las cinco
variables marcadas requeridas y un par completo de Redis (Upstash o KV). El
validador también exige HTTPS para URL de Supabase y de la app y token Mapbox
con prefijo `pk.`. Vercel ejecuta el build como entorno alojado, así que también
configurar Redis para Preview si se construye allí.

### Secretos y proveedores externos

- Guardar Redis, `RUUM_ROLE_COOKIE_SECRET` y `SENTRY_AUTH_TOKEN` en el gestor de
  secretos del hosting/CI. El token de Sentry debe limitarse a crear releases y
  subir artefactos. No ponerlos en `NEXT_PUBLIC_*`, `.env.example`, logs ni
  artifacts de Playwright.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` y el token `pk.*` de Mapbox son claves
  públicas. Nunca configurar una clave Supabase `service_role` en esta app.
- Las credenciales `DIDIT_*`, `SUPABASE_SERVICE_ROLE_KEY`, Resend, Twilio y FCM
  que pertenecen a Edge Functions/servicios se configuran en el proveedor de
  cada servicio, no en el runtime de `app-conductor`. Consultar
  `supabase/functions/.env.example` y el README del servicio.
- Para E2E, usar un proyecto y cuentas de prueba: `PLAYWRIGHT_E2E_CONDUCTOR_*`,
  `PLAYWRIGHT_SUPABASE_URL` y `PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY` son solo
  para setup de fixtures/test. La service-role de pruebas tampoco se debe
  exponer al navegador ni reutilizar en producción.

## Desarrollo y comprobaciones

Desde la raíz del monorepo, con Node 24 y pnpm 10:

```bash
pnpm install --frozen-lockfile
cp apps/app-conductor/.env.example apps/app-conductor/.env.local
pnpm --filter @ruum/app-conductor dev
```

Completar el `.env.local` con un proyecto Supabase de desarrollo. No copiar
credenciales reales de producción. Antes de promover cambios, los checks
apropiados están en CI; para una revisión local:

```bash
pnpm --filter @ruum/app-conductor validate:env
pnpm --filter @ruum/app-conductor typecheck
pnpm --filter @ruum/app-conductor test:coverage
pnpm --filter @ruum/app-conductor build
```

El build corre validación de entorno y `scripts/assert-csp.mjs`. La guía de
alertas de Sentry, la carga de source maps y la release está en
[`ops/SENTRY_ALERTS.md`](ops/SENTRY_ALERTS.md).

## Despliegue

La app se despliega como Next.js en Vercel. La configuración por app es
[`../vercel.json`](../vercel.json); la raíz del monorepo también define
[`../../../vercel.json`](../../../vercel.json). Antes de desplegar:

1. Verificar que el proyecto Vercel apunta al repositorio/commit correcto y
   aplica su configuración de monorepo. El comando de build de app es
   `pnpm --filter @ruum/app-conductor build` y la instalación usa
   `pnpm install --frozen-lockfile`.
2. Configurar en Production las variables obligatorias y el par Redis. Revisar
   que URLs sean HTTPS y pertenezcan al ambiente correcto. Configurar
   `NEXT_PUBLIC_RUUM_AMBIENTE=production`, contactos oficiales, DSN de Sentry y
   `RUUM_ROLE_COOKIE_SECRET`.
3. Para symbolication, crear en GitHub el secret `SENTRY_AUTH_TOKEN` y las
   variables `SENTRY_ORG`/`SENTRY_PROJECT`; el workflow solo habilita uploads
   en push a `main` cuando los tres valores están configurados. En el proveedor
   que construye la versión desplegada, activar `SENTRY_UPLOAD_SOURCE_MAPS`, y
   pasar el mismo `SENTRY_RELEASE`/`NEXT_PUBLIC_SENTRY_RELEASE` que se usará en
   runtime. Los source maps se eliminan del output después de subirlos.
4. Aplicar migraciones Supabase mediante el flujo aprobado del repositorio,
   antes del despliegue que dependa de ellas. Preferir migraciones aditivas y
   cambios compatibles con la versión actualmente desplegada; respaldar datos
   según el procedimiento operativo de la base.
5. Desplegar el commit y esperar a que Vercel informe estado **Ready**. No
   promover si el build falla, si el validador de entorno informa variables
   faltantes o si los checks de CI están rojos.
6. Smoke check en el deployment de destino: `GET /api/health` debe responder
   200 con `status: "ok"`; revisar login, carga del panel, rutas de viajes y
   logs. `/api/health` valida conexión a Supabase y devuelve 503 si falla.
   Confirmar en Sentry un evento de prueba controlado y que muestre el release
   esperado y stack trace simbolicado.
7. Promover/asignar el deployment validado al dominio de producción según el
   flujo de Vercel. Revisar errores, latencia, eventos de fallo de verificación
   de rol, respuestas 503 asociadas y rate-limit después de la promoción.

El workflow sintético externo corre cada cinco minutos; si falla, revisar su run
y aplicar [`ops/RUNBOOK_HEALTH.md`](ops/RUNBOOK_HEALTH.md). Configurar las
notificaciones de falla de Actions para el equipo on-call.

Para builds manuales, ejecutar desde la raíz con `NODE_ENV=production` y todas
las variables requeridas configuradas. No usar credenciales productivas en una
máquina de desarrollo. Para Android, el build de Capacitor conserva la URL
remota; un nuevo APK solo es necesario si se modificó configuración o código
nativo, no para publicar cambios web.

## Rollback e incidente

### Rollback de la app web

1. Si hay impacto a usuarios, detener la promoción y anotar hora, commit,
   release Sentry y síntomas. Consultar `/api/health`, logs de Vercel y alertas
   de Sentry para distinguir regresión de app de una caída de Supabase/Redis.
2. En Vercel, promover el deployment **Ready** anterior y conocido como bueno
   al dominio de producción. Verificar `/api/health` y los flujos críticos
   básicos después de la promoción. No reconstruir un commit anterior si se
   puede promover el artefacto ya validado.
3. Si es una variable mal configurada, corregirla en el ambiente Vercel y
   hacer un nuevo deployment; las variables de build `NEXT_PUBLIC_*` requieren
   rebuild. No imprimir secretos al diagnosticar.
4. Abrir seguimiento con commit/release afectado, impacto, detección,
   mitigación y responsable. Mantener vigilancia de alertas hasta recuperar
   operación estable.

### Cambios de base de datos

Revertir el deployment de Next.js no revierte migraciones Supabase. No ejecutar
un `down` destructivo ni restaurar un backup como respuesta automática. Si la
migración es compatible con el binario previo, revertir solo la app. Si no lo
es, detener el rollback de app y coordinar con el responsable de base de datos:
preparar una migración correctiva hacia delante, o seguir el procedimiento de
restauración aprobado con evaluación de pérdida de datos. Conservar evidencia
del estado de migraciones y proteger escrituras hasta resolver la
compatibilidad.

### Android/Capacitor

La WebView normalmente consume la app web remota, por lo que promover el
deployment anterior recupera la UI de los clientes instalados. Si el incidente
está en una versión nativa, detener la distribución del paquete defectuoso y
publicar una versión corregida mediante el canal de distribución Android; no
hay rollback remoto del binario ya instalado. Para arranque en frío sin red,
seguir el protocolo de Torre de Control descrito en el README y en la matriz
`tests/android/offline-startup-validation.md`.
