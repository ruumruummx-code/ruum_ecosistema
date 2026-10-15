# Ruum Ecosistema

Monorepo (pnpm + Turborepo) con las apps web de Ruum, paquetes compartidos,
Edge Functions de Supabase (Deno) y la app Android nativa del conductor.

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
| `apps/app-conductor-native` (`@ruum/app-conductor-native`) | Android nativo (Kotlin). Ver decisión abajo | — |
| `packages/api` (`@ruum/api`) | **Única vía de acceso a datos** desde las apps (frontera arquitectónica) | — |
| `packages/shared` (`@ruum/shared`) | Constantes, reglas, tipos Supabase, utils | — |
| `packages/ui` (`@ruum/ui`) | Design system React | — |
| `supabase/functions` | Edge Functions Deno: pagos, Didit, documentos, push, webhooks | — |
| `supabase/migrations` + `test/` | Esquema y 53 pruebas pgTAP | — |
| `design-system/` | Tokens, assets (`design-system/assets`) y docs de diseño | — |
| `docs/` | Runbooks (`docs/runbooks`) y QA (`docs/qa`) | — |
| `scripts/` | Checks de CI: fronteras, secretos, env, CSP, drift | — |

## Comandos

```bash
pnpm build | lint | typecheck      # turbo por workspace
pnpm test:unit                     # vitest en packages/*
pnpm test:coverage                  # coverage por workspace (ui, panel-admin, conductor, usuario)
pnpm test:sql                      # pgTAP: supabase test db test (53 archivos)
pnpm test:sql:rls | test:sql:concurrencia   # subconjuntos
pnpm test:e2e:golden | test:piramide        # golden path / pirámide completa
pnpm check:fronteras               # 0 accesos directos a Supabase en apps/*
pnpm check:migrations              # convención de migraciones + sin datos de prueba
pnpm check:native                  # controles estáticos de la app Android (sin SDK)
pnpm scan:secrets                  # escaneo de secretos (bloqueante en CI)
pnpm audit:deps                    # pnpm audit --audit-level=high
pnpm validate:env                  # valida variables del workspace
pnpm check:supabase-security | check:supabase-drift
deno task check:functions          # typecheck de las 9 Edge Functions
deno task test:functions           # tests Deno (48)
```

## Variables de entorno

- Raíz: copia `.env.example` → `.env`. Requeridas por app
  (`scripts/validate-env.mjs`, corre en `predev`/`prebuild`):
  - *conductor*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
  - *usuario*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `PHONE_VERIFY_SECRET` (privada, mínimo
    32 caracteres en builds alojados)
  - *admin*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- En Vercel, configurar estas variables en los entornos donde se construye
  `app-usuario`; `PHONE_VERIFY_SECRET` no debe llevar el prefijo `NEXT_PUBLIC_`.
- Secretos servidor (Stripe, `SUPABASE_SERVICE_ROLE_KEY`, Didit, FCM): **solo**
  vía `supabase secrets set`, nunca `NEXT_PUBLIC_*` ni versionados.
  Ver `supabase/functions/.env.example` y cada `apps/*/.env.example`.
- La versión canónica es `config/app-version.json` (`1.0.0`).
- Regla de incidentes: ningún dump con datos reales se versiona
  (`datos_locales.sql` está en `.gitignore`); ver `SECURITY.md`.

## Decisión sobre la app nativa (`apps/app-conductor-native`)

Conviven dos clientes del conductor y es deliberado:

- **`apps/app-conductor` (web, Next.js + Capacitor)**: canal principal y el que
  publica hoy. Comparte `@ruum/api`, `@ruum/shared` y `@ruum/ui` con el resto
  del ecosistema.
- **`apps/app-conductor-native` (Kotlin, Compose + `supabase-kt`)**: apuesta
  nativa en construcción para push, telemetría y operación en campo.
  Conserva el `applicationId` de release para migrar el canal de
  distribución en el futuro; el variant `debug` usa sufijo `.native.debug`
  para coexistir instalado junto a la app actual.

Comandos: `pnpm android:native:build|lint|test`
(delegan en `scripts/gradle.mjs` → Gradle wrapper; el caché `.gradle-temp/`
está ignorado). Requiere Android SDK (`local.properties` a partir de
`local.properties.example`). Detalle en `apps/app-conductor-native/README.md`.

## CI y despliegue

- CI (`.github/workflows/ci.yml`): install frozen → lint → typecheck →
  unit → fronteras → migrations → release → native → secrets → audit →
  SQL (Supabase local) → Deno.
- Vercel: `vercel.json` raíz (headers + `turbo run build`) y uno por app
  (`apps/*/vercel.json`). La CSP la emite el `middleware.ts` de cada app.
