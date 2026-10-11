# Release: commits significativos, changelog y versionado

## Tipos de commit (obligatorio, hook `commit-msg`)

`scripts/validate-commit-msg.mjs` exige `<tipo>(<scope>): <descripción ≥8 chars>`:

| Tipo | Cuándo | Efecto en versión |
| ---- | ------ | ----------------- |
| `feat` | Nueva funcionalidad de usuario | **minor** |
| `fix` | Corrección de bug | **patch** |
| `perf` | Mejora de rendimiento | patch |
| `refactor` | Reestructura sin cambio de comportamiento | — (no publica) |
| `docs`, `test`, `ci`, `build`, `chore`, `style`, `revert` | Soporte | — |
| `!` (ej. `fix(api)!:`) | Cambio incompatible | **major** |

Scopes = nombre del workspace sin `@ruum/` (`conductor`, `usuario`, `admin`,
`api`, `shared`, `ui`, `supabase`, `native`, `ci`, `docs`…).
Malos ejemplos reales del historial: `refactor: recomendaciones auditoria
codebase N` (vago, sin scope). Buenos: `fix(conductor): corrige tipos en
tests del wizard de traslado`.

## Changelog

```bash
pnpm changelog                  # imprime lo no publicado desde el último tag v*
pnpm changelog -- --write --version v1.2.0   # antepone sección a CHANGELOG.md
```

Generado por `scripts/changelog.mjs` (testeado en
`tests/release/changelog.test.mjs`): agrupa por tipo, marca scopes,
resalta `!` y sugiere el bump. Sin tags `v*` usa todo el historial.

## Versionado y publicación

1. Fuente canónica de versión de producto: `config/app-version.json`
   (`NEXT_PUBLIC_APP_VERSION` la lee si falta en env; `RUUM_LOCAL_PRODUCTION`
   permite localhost en dev).
2. Elegir bump con la tabla (o el sugerido del changelog).
3. Actualizar `config/app-version.json` (+ `version` de los `package.json`
   afectados si aplica) en un commit `chore(release): vX.Y.Z`.
4. `pnpm changelog -- --write --version vX.Y.Z` y commitear `CHANGELOG.md`.
5. `git tag vX.Y.Z && git push --tags` (el deploy a Vercel/producción sigue al tag).
6. `NEXT_PUBLIC_APP_VERSION` nunca puede ser `0.0.1`/`ci` en producción
   (`validate-env.mjs` lo bloquea).
