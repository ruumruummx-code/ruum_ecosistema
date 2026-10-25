# Ruum Ecosistema - Technical Codebase Report

## Overview

This document provides a comprehensive technical review of the `ruum_ecosistema` monorepo, a Turborepo-based monorepo containing three Next.js applications and three shared packages.

**Repository**: `C:\Users\hecto\ecosistema\ruum_ecosistema`
**Build Tool**: Turborepo v2.11.10
**Package Manager**: pnpm v10.0.0
**Node Version**: ^24 (as per .nvmrc)
**Language**: TypeScript throughout

---

## 1. Repository Structure

```
ruum_ecosistema/
├─ apps/                    # Three Next.js applications
│   │ app-conductor/        # Driver/conductor experience
│   │ app-usuario/           # End-user application
│   │ panel-admin/           # Admin dashboard/torre de control
│├─ packages/               # Shared libraries
│   │ api/                   # Backend services & API routes
│   │ shared/                # Types, states, constants, utils
│   │ ui/                    # React component library
│├─ config/                  # Configuration files
│├─ scripts/                 # Automation scripts
│├─ supabase/                # Supabase setup
│└─ tests/                   # Test infrastructure
```

### 1.1 Apps

| App | Purpose | Tech Stack |
|-----|---------|------------|
| `@ruum/app-conductor` | Driver mobile/ web app | Next.js 15, React 19, Capacitor, Sentry |
| `@ruum/app-usuario` | End-user app | Next.js 15, React 19, Capacitor, Stripe, Mapbox |
| `@ruum/panel-admin` | Admin dashboard | Next.js 15, React 19, Mapbox, Lighthouse |

### 1.2 Packages

| Package | Purpose | Key Dependencies |
|---------|---------|------------------|
| `@ruum/api` | Backend services, RPC, Supabase operations | `@supabase/supabase-js`, `@upstash/redis`, `zod` |
| `@ruum/shared` | Types, states, constants, utilities | `zod`, vitest, typescript |
| `@ruum/ui` | React component library | react 19, next 15, storybook |

---

## 2. Architecture & Patterns

### 2.1 Shared-First Approach

The monorepo follows a strong shared-first paradigm:

- **`@ruum/shared`** is the foundation, exported via `src/index.ts` with sub-path exports:
  - `./types` - 23 type definitions (Usuario, Conductor, Empresa, SLA, etc.)
  - `./states` - State machine definitions (estados-traslado, estados-asignacion, etc.)
  - `./constants` - Enums and constants (categorias, métodos de pago, certificacion, etc.)
  - `./utils` - 36 utility functions (formateo, validación, SLA, CSV, etc.)
  - `./validacion` - Zod validation schemas
  - `./seguridad` - Security utilities
  - `./catalogos` - Catalog-related types
  - `./rules` - Business rules

- **`@ruum/ui`** provides consistent UI components across all apps:
  - 47+ React components (Button, Alert, Aviso, Card, Modal, etc.)
  - `useDialogAccesible` hook - unified accessible dialog pattern used across all apps
  - Design tokens in `tokens.css`
  - Storybook-ready components

- **`@ruum/api`** provides backend services:
  - 38 service modules (traslados, usuarios, vehiculos, conductores, etc.)
  - Typed Supabase client integration
  - Redis caching via @upstash/redis
  - Zod-based request validation

### 2.2 Next.js App Router

All three apps use Next.js 15.5.24 with the App Router pattern:

- `app/layout.tsx` - Root layout with nonce-injected scripts, accessibility bridges
- `app/page.tsx` - Page entries
- `app/global-error.tsx` - Error boundaries
- `app/loading.tsx` - Loading skeletons
- `app/error.tsx` - Error boundaries

### 2.3 Key Design Patterns

| Pattern | Description | Location |
|---------|-------------|----------|
| **Accessible Dialog** | `useDialogAccesible` hook unifies modal patterns (previously triplicated) | `@ruum/ui/src/components/useDialogAccesible.ts` |
| **TemaProvider** | Theme context with light/dark modes | All apps (`TemaProvider`) |
| **AppStateProvider** | Application state management | `app-usuario` `layout.tsx` |
| **Service Layer** | API services in `@ruum/api` separated by domain | `packages/api/src/services/` |
| **RPC Typed** | Typed Supabase RPC calls | `packages/api/src/supabase/funciones.ts` |
| **Offline-First** | Evidence sync for conductor app | `app-conductor` `SincronizadorEvidenciaOffline` |

### 2.4 State Management

- **Shared states** in `@ruum/shared/src/states/`:
  - `estados-traslado.ts` - Translado state machine
  - `estados-asignacion.ts` - Asignación state machine
  - `transiciones.ts` - State transitions
- **React Context** used in apps for localized state (ViajeActivoContext, AppStateProvider)

---

## 3. Database & Supabase Integration

The repository uses Supabase as the backend with a comprehensive typed database schema.

### 3.1 Database Tables (key ones)

- `usuarios` - User profiles with `tipo_cuenta`, `rol`, `estado_verificacion`
- `conductores` - Driver profiles with certification, ratings, status
- `traslados` - Trip/transit records with full audit trail
- `cotizaciones` - Quotes/pricing with Stripe integration
- `certificaciones_conductor` - Conductor certifications
- `documentos_conductor` - Document management
- `disputas` - Dispute management
- `auditoria_admin_seguridad` - Security audit log
- `configuracion_admin` - Admin configuration key-value store
- `claves_idempotencia` - Idempotency keys

### 3.2 Supabase Types

The `packages/api/src/supabase/client.ts` and `server-client.ts` generate types from the full database schema (800+ lines). Key types include:

- `Database["public"]["Tables"]["tablename"]["Row"]`
- `Database["public"]["Enums"]["enumname"]`
- Typed RPC functions

### 3.3 Real-time

- `@ruum/api/src/services/realtime-services.test.ts` - Real-time event handling
- Supabase subscriptions used for live updates

---

## 4. Key Application Flows

### 4.1 User Onboarding (app-usuario)

1. **Registro** → **ConsentimientoTerminos** (via `ConsentimientoTerminosWall` component)
2. **Términos accepted** → `registrarConsentimientoUsuario` API call
3. **Onboarding flow** with steps
4. **Viajes** creation and tracking

### 4.2 Admin Dashboard (panel-admin)

1. **Login** → Role-based access (`GuardRutaRol`)
2. **Monitoring**: Alertas SLA, Metricas-Registro, Reportes
3. **Gestión**: Conductores, Empresas, Usuarios, Tarifas
4. **Masivos**: Carga masiva de traslados, cotizaciones

### 4.3 Conductor App (app-conductor)

1. **Trip activation** via `ViajeActivoContext`
2. **Location tracking** via `useDriverLocationTracking`
3. **Offline evidence sync** via `SincronizadorEvidenciaOffline`
4. **Push notifications** via `PushNotificationsBootstrap`
5. **Modal/c dialog patterns** via `useDialogAccesible`

---

## 5. API & Service Architecture

### 5.1 API Service Modules (`packages/api/src/services/`)

Each service module corresponds to a domain:

| Module | Description |
|--------|-------------|
| `traslados.ts` | Core trip creation and management |
| `conductores.ts` | Driver CRUD and status management |
| `usuarios.ts` | User management |
| `vehiculos.ts` | Vehicle registry |
| `cotizaciones.ts` | Quoting with policy policies |
| `facturacion.ts` | Billing/invoicing |
| `auditoria.ts` | Audit logging |
| `realtime-services.ts` | Real-time event handling |
| `operaciones.ts` | Operations management |
| `incidencias.ts` | Incident reporting |
| `disputas.ts` | Dispute handling |
| `sla.ts` | Service Level Agreement tracking |

### 5.2 RPC Functions (`packages/api/src/supabase/funciones.ts`)

Typed RPC wrapper for Supabase stored functions, used by service modules for complex operations.

### 5.3 Validation

- All API inputs validated via **Zod** schemas in `@ruum/shared/src/validacion/`
- `esquemaPayloadCrearTraslado` - Core translocation payload validation
- `validar-documentos.ts`, `validar-imagen.ts` - Document validation
- `validar-destino-seguro.ts` - Safe destination validation

---

## 6. UI Component Library (`@ruum/ui`)

### 6.1 Component Categories

| Category | Components |
|----------|-----------|
| **Buttons** | Button, Buttons (variants: primary, secondary, quiet, danger, emergency) |
| **Notifications** | Alert, Aviso, BannerDemo, StatusChip, SelloConductor |
| **Layout** | MobileShell, MobileHeader, MobileBottomSheet, MobileCard, MobileButton, MobileRow |
| **Data Display** | EmptyState, Card, FinancialAmount, PassportCard, DriverEarning |
| **Forms** | Field, TextInputUppercaseBridge, ConsentimientoTerminos |
| **Navigation** | Navigation, NextOperationalAction, MapaEstatico |
| **Accessibility** | useDialogAccesible, estados-visual, estados-ui |

### 6.2 Design Tokens

- `packages/ui/src/styles/tokens.css` - CSS variables for colors, spacing, typography, elevations
- Consistent theming across all apps via `TemaProvider`
- Brand colors: Navy (`#08182E`), Teal (`#0066FF`), Surface variants

### 6.3 Accessibility

- `useDialogAccesible` provides:
  - Native `<dialog>` with `showModal()`
  - Focus trap (Tab/Shift+Tab cycle)
  - Initial focus management
  - Escape key handling
  - Focus restoration on close
  - ARIA attributes (`aria-modal`, `aria-labelledby`, `aria-describedby`)
- Previously triplicated across apps, now centralized

---

## 7. Testing Strategy

### 7.1 Test Framework

- **Vitest 3.2.6** - Unit and component tests
- **Playwright 1.51.1 - 1.64.1** - E2E and accessibility tests
- **Artillery/K6** - Load testing
- **Axe Core** - Accessibility automation

### 7.2 Test Suites

| Suite | Scope |
|-------|-------|
| `test:unit` | Vitest unit tests across packages |
| `test:e2e:real` | Playwright real E2E (panel-admin) |
| `test:e2e:usuario` | Playwright usuario E2E |
| `test:a11y:real` | Playwright accessibility tests |
| `test:load` | K6/Artillery load tests |
| `test:sql` | Supabase SQL tests |
| `test:piramide` | Full test pipeline (unit + sql + e2e golden) |

### 7.3 Coverage

- Vitest coverage configured in all packages
- `@vitest/coverage-v8` reporter used
- Specific coverage thresholds per package

---

## 8. Configuration & DevOps

### 8.1 Turborepo Configuration (`turbo.json`)

```json
{
  "ui": "stream",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
```

### 8.2 Package Managers

- `pnpm` v10.0.0 with strict overrides
- 90+ dependency overrides in `package.json` for compatibility
- Node engine: `>=24 <25`

### 8.3 Scripts & Automation

Key scripts in `package.json`:

| Script | Purpose |
|--------|---------|
| `cp:generar` | Generate postal code files |
| `validate:env` | Environment validation per app |
| `assert:csp` | CSP assertion |
| `check:fronteras`, `check:migrations` | Boundary/migration checks |
| `scan:secrets` | Secret scanning |
| `audit:deps` | Dependency auditing |
| `changelog` | Changelog generation |

### 8.4 Environment Configuration

- Per-app `.env.*` files (`.env`, `.env.example`, `.env.production.example`, etc.)
- `scripts/validate-env.mjs` validates environments before build/dev
- CSP assertions via `scripts/assert-csp.mjs`

### 8.5 Supabase

- `supabase start/stop/restart` for local development
- `supabase db push` for migrations
- `supabase gen types` for type generation
- Security checks: `check:supabase-security`, `check:supabase-drift`

---

## 9. Observability & Monitoring

- **Sentry** (`@sentry/nextjs`) - Error tracking in all apps
- **Upstash Redis** - Caching and feature flags
- **Mapbox GL** - Maps integration (3.26.0 - 3.33.0)
- **Lighthouse** (`lhci autorun`) - Performance audits
- **Custom instrumentation** (`instrumentation-client.ts`, `instrumentation.ts`)

---

## 10. Security Considerations

- **Secret scanning** via `scan:secrets.mjs`
- **Supabase security checks** (`check:supabase-security`, `check:supabase-drift`)
- **RPC cast validation** (`check:rpc-casts`)
- **CSP assertions** (`assert-csp.mjs`)
- **HTTPS enforcement** and nonce-based script injection
- **XSS protection** via careful HTML handling
- **Password strength validation** (`fortaleza-password.ts`, `requisitos-password.ts`)

---

## 11. Known Technical Debt & Areas for Improvement

1. **Dialog pattern duplication** - Previously had three duplicated `showModal` + focus trap blocks across apps, now partially resolved via `useDialogAccesible` but some legacy code may remain.

2. **Over 90 pnpm overrides** - Many dependencies have overrides for compatibility; review if still needed.

3. **CSP management** - Multiple `assert-csp.mjs` scripts and `.env.production.example` CSP configurations; ensure consistency.

4. **Feature flag infrastructure** - `@ruum/api/src/feature-flags` exists; verify usage consistency.

5. **Offline sync complexity** - `SincronizadorEvidenciaOffline` in conductor app is complex; test coverage should be verified.

6. **Type coverage** - Supabase types are extensive (800+ lines) but may not cover all edge cases; consider generating from actual DB schema.

7. **Tailwind CSS v4** - New syntax used (`@tailwindcss/postcss: ^4.0.0`); ensure all apps compatible.

8. **Node 24** - Very recent Node version; verify all dependencies officially support it.

---

## 12. Build & Run Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode with Turbo |
| `pnpm build` | Build all packages/apps |
| `pnpm lint` | Lint all code |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:e2e:golden` | E2E golden tests |

---

## 13. Conclusion

The `ruum_ecosistema` monorepo demonstrates a well-structured, shared-first architecture with:

- **Strong code sharing** across three applications via `@ruum/shared` and `@ruum/ui`
- **Consistent React 19 + Next.js 15** stack
- **Comprehensive Supabase integration** with typed database access
- **Accessibility-first UI** with centralized dialog patterns
- **Robust testing** across unit, E2E, and load testing
- **Production-ready DevOps** with Turborepo, pnpm, and extensive automation

The codebase is mature and follows modern web patterns, with the main areas of focus being offline support for the conductor app, admin dashboard functionality, and user onboarding flows. The shared component library and type system provide a solid foundation for maintaining consistency across all touchpoints.

---
*Report generated on Sat Oct 24 2026*