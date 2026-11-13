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
