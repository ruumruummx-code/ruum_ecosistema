# Migraciones Supabase — convención y baseline

## Convención única de nombres

```
YYYYMMDDHHMMSS_slug_en_snake_case.sql
```

- La genera `supabase migration new <slug>` (timestamp UTC, 14 dígitos).
- El slug describe el cambio de esquema, en minúsculas y `snake_case`.
- **Prohibido** en slugs (ver `scripts/check-migrations.mjs`):
  `fixture`, `e2e`, `seed`, `dummy`, `mock` y los tokens `test`/`tests`.
  ("prueba" sí está permitido: es vocabulario de producto,
  p. ej. `modo_prueba_supervisada`.)
- Las versiones deben ser estrictamente crecientes: nunca reutilizar ni
  reordenar un timestamp.

## Baseline v1 (congelado)

- Historia hasta `20261010000100` verificada **local == remoto** el 2026-10-11
  (`supabase migration list`, proyecto enlazado). **No editar, borrar ni
  renombrar versiones aplicadas**: rompería `db push` en todos los ambientes
  (requeriría `supabase migration repair` coordinado).
- `20260807061826_remote_schema.sql` es un snapshot correctivo intermedio
  (`db pull`): DDL de reparación aplicado en su posición, informativo.
- Excepciones congeladas (documentadas en el guard, no repetir):
  - `20260904040000_fixture_conductor_e2e.sql` (renombrado sin espacios;
    **misma versión**, sin repair) y
    `20260907013042_make_conductor_e2e_fixture_idempotent.sql`: crean
    `preparar_conductor_e2e()`, usado por
    `apps/app-conductor/tests/global-setup.ts`. Nuevos helpers E2E van a
    `tests/e2e/fixtures/`, aplicados por el harness, **nunca** aquí.
  - 3 cleanups con `DELETE` top-level (reparaciones una sola vez):
    `..._versionado_documentos_identidad`,
    `..._llegada_destino_excepcion_rpc_no_global`,
    `..._llegada_destino_solo_traslado_en_curso`.

## Qué puede (y no puede) haber en una migración

- **Sí**: DDL, RLS/policies, funciones/triggers/RPC (sus `INSERT` internos son
  lógica de negocio, no datos), `GRANT`/`REVOKE`, y seeds operativos de
  referencia idempotentes (buckets de Storage, tablas de transiciones,
  catálogos, políticas, backfills `INSERT..SELECT` sobre datos existentes).
  Las tablas permitidas están allowlistadas en el guard: una tabla nueva
  exige actualizarlo deliberadamente.
- **No**: filas de prueba, usuarios/conductores/traslados de ejemplo, fixtures
  E2E, `DELETE`/`TRUNCATE`/`COPY` de datos. Datos de prueba → `test/`
  (fixtures transaccionales pgTAP); semilla local reproducible →
  `supabase/seed.sql` (sintética, nunca PII real).

## Squash futuro

Solo coordinado: `supabase db dump --schema-only` como nueva migración
baseline + `supabase migration repair` en local, linked y staging el mismo
día. Fuera de eso, la historia solo crece por el final.
