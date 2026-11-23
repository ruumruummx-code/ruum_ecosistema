# Acta de Cierre Formal — Gate G3 (Fase 3: Consistencia Tipada y Móvil)

**Fecha:** 2026-11-22  
**Estado del Gate:** APROBADO (PASS)  
**Alcance:** Monorepo Ruum (6 workspaces: `@ruum/shared`, `@ruum/api`, `@ruum/ui`, `@ruum/app-usuario`, `@ruum/app-conductor`, `@ruum/panel-admin`).

---

## 1. Resumen Ejecutivo

Habiendo ejecutado la totalidad de las actividades comprendidas en la **Fase 3 — Consistencia tipada y móvil** (`F3.3`, `F3.1`, `F3.2`), se certifica el cumplimiento riguroso de todos los criterios de aceptación y aprobación correspondientes al **Gate G3**.

El monorepo cuenta con tipado estricto unificado, configuración de empaquetado optimizada en el panel administrativo, cero alias físicos a código fuente de paquetes, un trinquete activo sobre conversiones de tipos `as unknown as`, build y empaquetado release para plataformas Android / Capacitor con versionado centralizado y esquemas de firma reproducible en CI.

---

## 2. Verificación de Criterios de Aceptación del Gate G3

| Criterio Gate G3 | Estado | Evidencia Verificada |
| :--- | :---: | :--- |
| **`pnpm lint` en verde en 6/6 workspaces** | **APROBADO** | `turbo run lint` ejecutado con éxito en 6/6 workspaces sin errores. |
| **`pnpm build` en verde en 6/6 workspaces** | **APROBADO** | `turbo run build` exitoso en 6/6 workspaces (`@ruum/shared`, `@ruum/api`, `@ruum/ui`, `@ruum/app-usuario`, `@ruum/app-conductor`, `@ruum/panel-admin`). |
| **0 path aliases físicos hacia `packages/*/src`** | **APROBADO** | `git grep -I "@@" apps/ packages/` = 0 coincidencias. Todas las dependencias resuelven limpiamente vía package manager y exports package.json. |
| **Baseline de `as unknown as` registrada y trinquete activo** | **APROBADO** | `node scripts/check-rpc-casts.mjs` verifica `BASELINE_UNKNOWN_AS = 192` (actual: 191) y `BASELINE_TOTAL = 46` (actual: 46), bloqueando regresiones. |
| **Build release Android firmado reproducible desde CI para ambas apps** | **APROBADO** | `.github/workflows/android.yml` configurado con firma release, extracción dinámica de `app-version.json` (`versionCode: 10000`), deep links `assetlinks.json` y `appUrlOpen` en bootstraps. |
| **Headers y optimización de `panel-admin` verificados** | **APROBADO** | `poweredByHeader: false`, `compress: true`, `optimizePackageImports`, y `outputFileTracingIncludes` hacia rutas existentes (`traslados-masivos`). |

---

## 3. Detalle de Implementaciones por Acción

### F3.3: Headers y Configuración Panel Admin
- **Archivo:** `apps/panel-admin/next.config.ts`
- **Configuraciones:**
  - `poweredByHeader: false` (remueve encabezado de divulgación del framework).
  - `compress: true` (compresión gzip/brotli automática).
  - `transpilePackages: ["@ruum/shared", "@ruum/ui", "@ruum/api"]`.
  - `optimizePackageImports: ["lucide-react", "@ruum/ui", "@ruum/shared"]`.
  - Corrección de `outputFileTracingIncludes`: reemplazada la ruta inexistente `viajes-masivos` por `/api/plantillas/traslados-masivos` y `/api/codigos-postales/[prefijo]`.
- **Refactorización asociada:** Corrección de tipo TS2367 en `apps/panel-admin/src/lib/roles-admin.ts`.

### F3.1: Tipado y ESLint Unificados
- **Configuración TSConfig:**
  - `packages/shared/tsconfig.json` actualizado a `"module": "ESNext"`, `"moduleResolution": "bundler"`.
  - Retiro de aliases no estándar y verificación de resolución en exports de paquetes.
- **Trinquete de Casts:**
  - `scripts/check-rpc-casts.mjs` reforzado con validación bidireccional:
    - `never/any`: línea base 46 (actual 46).
    - `as unknown as`: línea base 192 (actual 191).
- **Scripts de Monorepo:**
  - Script `"lint"` unificado e integrado en `turbo.json` para cobertura de los 6 workspaces.

### F3.2: Android / Capacitor
- **Configuración de Gradle & Versiones:**
  - `apps/app-usuario/android/app/build.gradle`: lectura dinámica de `config/app-version.json` parseada con `JsonSlurper` para inyectar `versionCode = 10000` y `versionName`. Soporte condicional para `signingConfigs.release` con `RUUM_ANDROID_KEYSTORE_PATH` y activación de `minifyEnabled true`.
  - `apps/app-conductor/android/app/build.gradle`: unificación de endpoints remotos a `https://concer.ruumruum-moviliax.online` eliminando discrepancias con `www.concer.`.
- **Deep Links & Capacitor App:**
  - Generación de `assetlinks.json` en `apps/app-conductor/public/.well-known/assetlinks.json` y `apps/app-usuario/public/.well-known/assetlinks.json`.
  - Módulos `DeepLinksBootstrap.tsx` integrados en los layout raíces de ambas apps móviles escuchando `App.addListener("appUrlOpen")`.
  - Scripts `"cap:sync": "cap sync android"` incorporados en los `package.json` de ambas apps.
  - Workflow de CI `.github/workflows/android.yml` con empaquetado release Gradle para ambas arquitecturas.

---

## 4. Estado de las Suites de Validación y Gobernanza

1. **`node scripts/check-fronteras.mjs`**: 0 violaciones, 0 excepciones en allowlist.
2. **`node scripts/check-rpc-casts.mjs`**: OK (46 casts `never/any`, 191 casts `unknown as`).
3. **`node scripts/check-estilos-ui.mjs`**: Línea base respetada (5672 estilos línea base).
4. **`node scripts/scan-secrets.mjs`**: 0 secretos detectados.
5. **`node scripts/verify-clean-ci.mjs`**: Contrato de instalación limpia validado.
6. **`deno task check:functions`**: 15/15 Edge Functions validadas sin errores de tipo.
7. **`pnpm test` (Unit / Integration suites)**:
   - `@ruum/shared`: 5/5 passed.
   - `@ruum/ui`: 12/12 passed.
   - `@ruum/app-conductor`: 10/10 passed.
   - `@ruum/app-usuario`: `layout-no-scroll.test.tsx` (4/4 passed).

---

## 5. Dictamen y Conclusión

Se declara formalmente **APROBADO** el **Gate G3**. El proyecto cuenta con una base sólida de tipos, empaquetado Android productivo, consistencia en middleware/headers y gobernanza automatizada.
