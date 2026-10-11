# Política de seguridad — Ruum Ecosistema

## Versiones soportadas

| Versión | Soporte |
| ------- | ------- |
| 1.0.x (`config/app-version.json`) | :white_check_mark: Recibe parches de seguridad |
| < 1.0.0 | :x: Sin soporte |

La versión canónica vive en `config/app-version.json` (`NEXT_PUBLIC_APP_VERSION`
la lee de ahí si no está en el entorno; ver `scripts/validate-env.mjs`).

## Reportar una vulnerabilidad

- **No abras un issue público** con detalles explotables.
- Escríbenos por el canal privado del equipo (correo del mantenedor o mensaje
  directo en el workspace compartido) con: descripción, impacto estimado,
  pasos de reproducción y, si existe, PoC.
- Confirmamos recepción en **48 h hábiles** e informamos el plan (parche,
  mitigación o rechazo justificado) en **7 días naturales**.
- Aceptada: se corrige en rama privada, se publica el parche y se reconoce al
  reportante (salvo que pida anonimato). Rechazada: se explica el motivo.

## Secretos y credenciales

- **Nunca** se versionan `.env`, `service_role keys`, claves de Stripe/Didit/
  FCM ni contraseñas. Solo plantillas `*.example` con placeholders
  (`CHANGE_ME`, `your-*`, `sk_test_your_*`).
- `pnpm scan:secrets` (CI + `tests/security/scan-secrets.test.mjs`) bloquea
  JWTs `service_role`, claves `sk_live_*`, `whsec_*`, `re_*` y contraseñas
  E2E reales. Las passwords de prueba solo viajan por la variable
  `SCAN_DENIED_PASSWORDS`, nunca hardcodeadas.
- Incidente de referencia: `datos_locales.sql` (dump con `auth.users` real)
  se eliminó del índice y del disco, se ignoró en `.gitignore` y quedó
  pendiente su purga del historial con `git filter-repo` + rotación de la
  credencial afectada. La regla es: **dump local con datos reales jamás se
  versiona**; la semilla reproducible es `supabase/seed.sql` (sintética).

## Postura Supabase

- RLS activo en todas las tablas de dominio; las apps web acceden a datos
  **solo vía `@ruum/api`** (`node scripts/check-fronteras.mjs` lo impone en
  CI; las únicas excepciones son Storage/offline/health documentadas en
  `scripts/fronteras-allowlist.json`).
- Escrituras privilegiadas solo vía RPC `SECURITY DEFINER` o Edge Functions
  con `SUPABASE_SERVICE_ROLE_KEY` (configurada con `supabase secrets set`,
  nunca en código ni en `NEXT_PUBLIC_*`).
- Claves por ambiente: local (`supabase start`), staging y producción con
  proyectos separados; `SUPABASE_URL` debe ser `https://` fuera de local
  (`scripts/validate-env.mjs` lo valida).

## Dependencias

- `pnpm audit --audit-level=high` corre en CI (`pnpm audit:deps`); los
  `overrides` de seguridad viven en `package.json` → `pnpm.overrides` con
  comentario de alcance.
- El package manager es **pnpm** (`pnpm-lock.yaml` + `--frozen-lockfile` en
  CI y Docker). `package-lock.json`/`yarn.lock` están prohibidos por
  `.gitignore`.
- Edge Functions (Deno): `deno task check:functions` y
  `deno task test:functions` corren en CI.

## Superficie web

- Headers de seguridad (HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` con allowlist de Didit) + CSP con
  nonce por request en `src/middleware.ts` de cada app. `scripts/assert-csp.mjs`
  lo verifica en `prebuild`.
- Telemetría/errores (Sentry) con scrub de PII y secretos (ver
  `sentry.*.config.ts` e `instrumentation.ts` de cada app).
