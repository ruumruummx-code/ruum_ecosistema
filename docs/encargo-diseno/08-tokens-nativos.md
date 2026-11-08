# 08 · Tokens nativos (Kotlin y Swift)

**Depende de:** paso 02. **Rama:** `feat/diseno-08-tokens-nativos`.

## Objetivo
Que `Tokens.kt` y `Tokens.swift` coincidan con la fuente de verdad decidida en el paso 02, **generados y no editados a mano**.

## Alcance verificado
`design-system/tokens/`: `tokens.json`, `tokens.css`, `tokens.ts`, `Tokens.kt`, `Tokens.swift`. La app conductor incluye un shell Android en `apps/app-conductor/android` (Capacitor).

## Qué hacer
1. Buscar si existe un script que genere los archivos desde `tokens.json` (revisar `package.json` raíz y `design-system/README.md`).
2. Si existe, regenerar; si no, **avisar** y proponer el script mínimo, sin inventarlo en silencio.
3. Confirmar quién consume `Tokens.kt` y `Tokens.swift` (si nadie, solo mantenerlos sincronizados).

## Criterios de aceptación
- [ ] Los cinco archivos de `design-system/tokens/` tienen los **mismos valores** (verificado con una comparación de valores, adjuntada al PR).
- [ ] Los archivos generados llevan su encabezado de "generado, no editar" y no hay cambios manuales.
- [ ] El shell Android compila (`./gradlew assembleDebug` en `apps/app-conductor/android`) si el entorno lo permite; si no, se indica que no se pudo verificar.
- [ ] Ninguna pantalla web cambia de aspecto.
- [ ] Se documenta en `design-system/README.md` cómo regenerar los tokens.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 08. Averigua cómo se generan Tokens.kt, Tokens.swift y
tokens.ts desde tokens.json. Si existe el script, úsalo; si no, avísame y propón uno
sin ejecutarlo. Entrégame una comparación de valores entre los cinco archivos antes y
después, y qué consume cada uno.
```
