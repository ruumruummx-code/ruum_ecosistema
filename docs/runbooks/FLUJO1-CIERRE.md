# Cierre de condiciones RUUM-USR-F1-001

## CB-1 — barrido de lectura pura y transición de rol

La prueba `apps/app-usuario/test/flujo1-lecturas-puras.test.ts` inspecciona el
servicio `obtenerUsuarioActual`, la landing y `/inicio`: ninguna lectura puede
usar `insert`, `update`, `upsert`, `delete`, crear perfil o asignar el rol
`conductor`.

Contrato de transición: `sin_rol` es un estado de mínimo privilegio. La única
transición permitida a conductor es la solicitud y aprobación del expediente de
verificación documental y fiscal del **Flujo 13**, mediante sus RPC/controles
de autorización. Ni un GET, ni metadata de Auth, ni la landing pueden ejecutar
esa transición.

Ejecución local:

```text
pnpm --dir apps/app-usuario exec vitest run test/flujo1-lecturas-puras.test.ts
```

## CB-2 — staging

La migración es:
`supabase/migrations/20261104000001_descubrimiento_rol_minimo_privilegio.sql`.

El proyecto actualmente enlazado es `asmzetwwwugaoowiukdv` (`ruum_ecosistema`),
pero el repositorio no lo identifica como staging. Antes de escribir se debe
confirmar el ref autorizado y ejecutar:

```text
pnpm exec supabase db push --linked
pnpm exec supabase test db test/rt42_rls_admin_roles.test.sql
pnpm --dir apps/app-usuario exec vitest run src/middleware.test.ts test/certificacion-autenticacion-sesion.test.ts
```

La regresión debe comprobar: `/inicio` protegido, `/soporte` público, ausencia
de datos ajenos, RLS aplicado para `usuarios`/`pasaporte_digital` y ausencia de
rutas huérfanas. `supabase migration list` confirmó que ambas migraciones F1
están pendientes en el proyecto enlazado; no se aplicaron por la ambigüedad del
ambiente.

## CB-3 / CA-5 — claims y rendimiento

La gobernanza localizable está en [`docs/claims/README.md`](../claims/README.md)
y la versión se publica desde `apps/app-usuario/src/lib/public-claims.ts`.

La métrica reproducible se genera con:

```text
node apps/app-usuario/scripts/medir-flujo1-resumen.mjs
```

El benchmark compara 100 filas sin límite ni foto diferida contra el resumen de
6 filas y cero fotos en el camino crítico. Es una métrica sintética de payload y
serialización, no una medición RUM. El cierre de CA-5 requiere capturar además
TTFB/LCP p50 y p95 en staging antes/después con la misma red y dispositivo.
