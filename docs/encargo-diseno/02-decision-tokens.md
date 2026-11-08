# 02 · Decisión de tokens (humano decide)

**Depende de:** paso 01 aprobado. **Rama:** `feat/diseno-02-tokens`.

## Objetivo
Dejar **una sola fuente de verdad** de tokens. Hoy hay discrepancias comprobadas en el código.

## Hallazgos verificados
| Tema | Dónde | Detalle |
|---|---|---|
| Dos copias de tokens | `packages/ui/src/styles/tokens.css` (807 líneas, la que importan las apps) y `design-system/tokens/tokens.css` (165 líneas) | No coinciden. Ejemplo: Teal Deep `#008B8B` vs `#007575`. |
| Azul de acción distinto | `apps/app-conductor/src/app/globals.css` | `--conductor-action: #0057d9` (claro) y `#4d94ff` (oscuro); otros archivos usan `#0066FF`. |
| Colores fijos | `apps/app-conductor/src/app/viajes/[id]/evidencia/page.tsx` | ~25 hexadecimales sin token (se tratan en el paso 03). |

## Decisiones que debes tomar (marca una)
- [ ] **A.** Fuente de verdad = `packages/ui/src/styles/tokens.css`; sincronizar `design-system/tokens/*` desde ella.
- [ ] **B.** Fuente de verdad = `design-system/tokens/tokens.json`; regenerar el resto.
- [ ] El azul de acción de la app conductor: **mantener `#0057d9`** (más contraste) / **unificar a `#0066FF`**.
- [ ] Teal Deep: `#008B8B` / `#007575`.

## Qué hacer
1. Que Claude Code genere un **informe de diferencias** entre las copias (solo lectura) y lo revises.
2. Con tu decisión, aplicar los cambios mínimos para que todas las copias coincidan.
3. Si hay un script que genere `Tokens.kt`, `Tokens.swift` y `tokens.ts` desde `tokens.json`, usarlo; si no existe, avisar.

## Criterios de aceptación
- [ ] Existe un informe de diferencias antes de cualquier cambio, aprobado por ti.
- [ ] Tras el cambio, `tokens.css` de ambas ubicaciones y `tokens.json` tienen **los mismos valores** (verificable con un `diff` de valores).
- [ ] Ninguna pantalla cambia de aspecto salvo lo decidido (comparar capturas antes/después de: lista de viajes, "En curso", evidencias y login).
- [ ] El contraste de botón y texto sigue ≥ 4.5:1 en claro y oscuro con el valor elegido.
- [ ] `pnpm typecheck`, `pnpm lint` y `pnpm build` de las tres apps en verde.

## Fuera de alcance
Crear tokens nuevos, renombrar tokens, tocar componentes.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 02. Haz solo la FASE 1 del paso 02: genera un informe
de solo lectura con todas las diferencias de valores entre packages/ui/src/styles/tokens.css,
design-system/tokens/tokens.css, tokens.json y apps/app-conductor/src/app/globals.css.
No cambies archivos. Termina con las opciones A y B y una recomendación argumentada.
Espera mi decisión.
```
