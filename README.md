# Ruum Ecosistema

Monorepo (pnpm + Turborepo) con las apps web de Ruum, paquetes compartidos
y Edge Functions de Supabase (Deno).

## Arranque local

Requisitos: **Node 24** (ver `.nvmrc`), **pnpm 10**, **Docker** y
**Supabase CLI** (`supabase --version`; `pnpm dlx supabase --version` sirve).

```bash
pnpm install --frozen-lockfile   # instala el workspace (Node 24, pnpm 10)
cp .env.example .env             # y completa valores (nunca secretos reales)
supabase start                   # Postgres + Auth + Storage locales
pnpm dev                         # turbo: levanta las 3 apps web
```

Puertos: **app-usuario → 3000**, **app-conductor → 3001**,
**panel-admin → 3002**. Alternativa con Docker:
`docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
(ver `README.Docker.md` para build/producción).

Base de datos local: `pnpm db:reset` (migraciones + `supabase/seed.sql`
sintético), `pnpm db:types` para regenerar
`packages/shared/src/types/supabase.ts`.

## Mapa de apps y paquetes

| Ruta | Qué es | Puerto |
| ---- | ------ | ------ |
| `apps/app-usuario` (`@ruum/app-usuario`, Next.js) | Web del pasajero: cotizar, pagar (Stripe), seguir traslados | 3000 |
| `apps/app-conductor` (`@ruum/app-conductor`, Next.js) | Web del conductor: registro, Didit, documentos, viajes, cuenta | 3001 |
| `apps/panel-admin` (`@ruum/panel-admin`, Next.js) | Torre de control: operaciones, verificación, finanzas, SLA | 3002 |
| `packages/api` (`@ruum/api`) | **Única vía de acceso a datos** desde las apps (frontera arquitectónica) | — |
| `packages/shared` (`@ruum/shared`) | Constantes, reglas, tipos Supabase, utils | — |
| `packages/ui` (`@ruum/ui`) | Design system React | — |
| `supabase/functions` | 14 Edge Functions en Deno para pagos, Didit, documentos, push y webhooks | — |
| `supabase/migrations` y `supabase/test/` | Esquema y suite pgTAP de aislamiento RLS y concurrencia | — |
| `design-system/` | Tokens, assets (`design-system/assets`) y docs de diseño | — |
| `docs/` | Runbooks (`docs/runbooks`) y QA (`docs/qa`) | — |
| `scripts/` | Checks de CI: fronteras, secretos, env, CSP, drift | — |

## Comandos

```bash
pnpm build | lint | typecheck      # turbo por workspace
pnpm test:unit                     # vitest en packages/*
pnpm --filter @ruum/app-usuario test:coverage  # ejemplo de cobertura por workspace
pnpm test:sql                       # Suite pgTAP en supabase/test/
pnpm test:sql:rls                   # Aislamiento y permisos por rol
pnpm test:sql:concurrencia          # Conflicto de escritura entre operadores
pnpm test:e2e:golden | test:piramide        # golden path / pirámide completa
pnpm check:fronteras               # 0 accesos directos a Supabase en apps/*
pnpm check:migrations              # convención de migraciones + sin datos de prueba
pnpm test:load                     # carga k6 de los flujos críticos de app-usuario
pnpm test:load:report              # misma prueba con reporte JSON en tests/load/resultados.json
pnpm scan:secrets                  # escaneo de secretos (bloqueante en CI)
pnpm audit:deps                    # pnpm audit --audit-level=high
pnpm validate:env                  # valida variables del workspace
pnpm check:supabase-security | check:supabase-drift
deno task check:functions          # typecheck del subconjunto enumerado en deno.json
deno task test:functions           # tests Deno (48)
```

El script `test:coverage` se define por workspace. Está disponible en
`@ruum/app-usuario`, `@ruum/app-conductor`, `@ruum/panel-admin` y `@ruum/ui`.

## Variables de entorno

- Raíz: copia `.env.example` → `.env`. Requeridas por app
  (`scripts/validate-env.mjs`, corre en `predev`/`prebuild`):
  - *conductor*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
  - *usuario* (lista completa en `requiredByApp["app-usuario"]`):
    - Públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
    - Privadas de servidor (Vercel, nunca `NEXT_PUBLIC_`): `SUPABASE_SERVICE_ROLE_KEY`
      (distinta de la anon key), `STRIPE_SECRET_KEY` (mismo modo test/live que la
      publicable), `MAPBOX_SECRET_TOKEN` (`sk.`), `PHONE_VERIFY_SECRET` (mínimo 32
      caracteres), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`.
    - En builds alojados además: Redis (`UPSTASH_REDIS_REST_URL` +
      `UPSTASH_REDIS_REST_TOKEN`, o `KV_REST_API_URL` + `KV_REST_API_TOKEN`) y, en
      producción de Vercel, `RUUM_STRIPE_MODE` (`live` por defecto).
    - Opcionales: `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (el CAPTCHA
      adaptativo de login/recuperación solo se exige con las dos), y la suspensión
      temporal del SMS `PHONE_VERIFICATION_SUSPENDED=true` +
      `PHONE_VERIFICATION_SUSPENDED_UNTIL` (fecha ISO; sin fecha o vencida, la
      verificación vuelve a exigirse). Sus espejos `NEXT_PUBLIC_…` deben coincidir.
  - *admin*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- En Vercel, configurar estas variables en los entornos donde se construye
  `app-usuario`; `PHONE_VERIFY_SECRET` no debe llevar el prefijo `NEXT_PUBLIC_`.
- Secretos servidor (Stripe, `SUPABASE_SERVICE_ROLE_KEY`, Didit, FCM): **solo**
  vía `supabase secrets set`, nunca `NEXT_PUBLIC_*` ni versionados.
  Ver `supabase/functions/.env.example` y cada `apps/*/.env.example`.
- La versión canónica es `config/app-version.json` (`1.0.0`).
- Regla de incidentes: ningún dump con datos reales se versiona
  (`datos_locales.sql` está en `.gitignore`); ver `SECURITY.md`.

## CI y despliegue

- CI de App Usuario (`.github/workflows/app-usuario.yml`): controles de
  seguridad y fronteras, lint, typecheck, build, E2E, cobertura, Lighthouse
  y pruebas SQL en Supabase local.
- Vercel: `vercel.json` raíz (headers + `turbo run build`) y uno por app
  (`apps/*/vercel.json`). La CSP la emite el `middleware.ts` de cada app.
