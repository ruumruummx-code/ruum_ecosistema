# 00 · Contexto y reglas (leer antes de cualquier paso)

Este conjunto de documentos guía a Claude Code para llevar las tres superficies de `ruum_ecosistema` a un estilo **minimalista, limpio y casi sin texto**, preservando los tokens y la lógica actuales.

## Cómo usar estos documentos
1. Copia la carpeta al repo como `docs/encargo-diseno/`.
2. En la raíz: `claude`. Pídele que lea `AGENTS.md` y este archivo.
3. Trabaja **un documento por sesión o rama**, en orden. No avances hasta que todos los criterios del paso estén en verde y tú los hayas revisado.

Prerrequisitos: Node 24 (ver `.nvmrc`), `pnpm install` en la raíz y una rama por paso (`feat/diseno-0N-...`).

## Reglas que no se negocian
- **No cambiar valores de tokens** salvo en el paso 02 y con tu confirmación. Usar variables existentes (`--conductor-*`, `--ruum-*`, `--font-mono`), nunca hexadecimales nuevos.
- **No tocar lógica ni estados.** Los 34 estados y sus transiciones viven en `packages/shared/src/states`; la base de datos manda. El cambio es solo visual.
- **No inventar datos.** Si un dato no existe en el modelo (ETA o kilómetros restantes en vivo, por ejemplo), no se muestra.
- **Conservar textos, roles y `aria-label`.** Las pruebas e2e dependen de ellos (`apps/app-conductor/tests/interface/stages.spec.ts`, `shell.spec.ts`).
- Un solo botón principal por bloque. El color nunca va solo: siempre texto o icono.
- Glosario de marca: "Disponible", "En curso", "Registro del vehículo", "Depósito programado", "Reportar un problema".
- Preferir **variantes en `packages/ui`** o clases de módulo CSS antes que copias por app.
- Un commit pequeño por cambio, con mensaje `feat(conductor): ...` / `feat(usuario): ...` / `feat(panel): ...`.

## Verificación común (aplica a TODAS las pantallas de cada paso)
Cada pantalla debe cumplir, además de sus criterios propios:

- [ ] Se ve bien en **320×568** y **390×844** (app móvil) o **1280×720 y 1440×900** (panel).
- [ ] Correcta en **modo claro y oscuro**.
- [ ] Conductor: correcta con **modo calle activado y desactivado**.
- [ ] **Sin scroll de página** en móvil (solo el cuerpo de la pantalla se desplaza) y sin desbordes horizontales.
- [ ] La acción principal queda visible y alcanzable; en conductor mide **≥ 56 px** de alto.
- [ ] Todo elemento interactivo tiene **foco visible** y área táctil ≥ 44 px (≥ 48 px en conductor).
- [ ] Contraste de texto **≥ 4.5:1** (3:1 en texto grande) en ambos modos.
- [ ] **Cero hexadecimales nuevos** (`git diff | grep -E "#[0-9A-Fa-f]{6}"` solo debe mostrar líneas que se eliminan).
- [ ] Textos, roles y `aria-label` existentes **intactos**.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:a11y` y `pnpm test:e2e` (con `--filter` de la app) **en verde**.

## Referencias
Prototipos HTML en `docs/prototipos/` (`sistema-de-diseno-ruum.html`, `flujo-conductor-minimal.html`, `usuario-y-panel-minimal.html`). Son referencia de **composición y jerarquía**, no de valores: se hicieron con `design-system/tokens`, que difiere de los tokens reales de la app.

## Índice
| Paso | Documento | Quién decide |
|---|---|---|
| 01 | Validar la pantalla "En curso" | Tú revisas |
| 02 | Decisión de tokens | **Tú decides** |
| 03 | Evidencias: migrar a tokens | Claude Code |
| 04 | Evidencias: estilo minimalista | Claude Code |
| 05 | Resto del flujo del conductor | Claude Code |
| 06 | App usuario | Claude Code |
| 07 | Panel admin | Claude Code |
| 08 | Tokens nativos (Kotlin y Swift) | Claude Code |
