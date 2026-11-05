# Registro de Remediación — Flujo 8 (Lista de Traslados)

**Ticket**: RUUM-USR-F8-001  
**Título**: Endurecimiento del Flujo 8 – Lista de traslados (consistencia de lista/conteos/gasto, contrato de estados y huérfanos, zona horaria, DTO mínimo y ownership en detalle)  
**Estado**: Implementado, Verificado y Cerrado  
**Fecha de Ejecución**: 2026-11-04  

---

## 1. Resumen Ejecutivo
Se implementó y completó la totalidad de las condiciones de cierre del Flujo 8 (Lista de traslados):
1. **CB-1 / CA-1 (Paginación Server-Side y Consistencia)**: Implementado `obtenerListaTrasladosConsolidadaUsuario` server-side con paginación real mediante `.range(desplazamiento, desplazamiento + limite - 1)`. El cliente ya no descarga la totalidad de los datos. Se definió e implementó el contrato de `snapshotVersion` y detección de `snapshotDivergente`.
2. **CB-2 (Contrato de Estados, Huérfanos y Alineación F10/F13)**: Creada la política `estados-traslado-policy.ts` como fuente única de verdad. Fail-closed categórico a `en_revision`. Los pasaportes huérfanos se auditan y enrutan a soporte. Se formalizó la alineación con F10 (`puedeEjecutarAccionFlujo10`) y F13 (`puedeFacturarFlujo13`) para suspender acciones y facturación sobre traslados en verificación técnica.
3. **CB-3 (Zona Horaria, DTO Mínimo y Ownership)**: Definida `America/Mexico_City` como zona canónica con declaración formal de estabilidad sin DST (Decreto Ley 2022). Implementado `ViajeListaDTO` con minimización de PII. Blindado el acceso a `/viajes/[id]` mediante verificación de perfil contra sesión autenticada en combinación con RLS de PostgreSQL.

---

## 2. Matriz de Tareas y Criterios de Aceptación

| Tarea / Criterio | Descripción | Estado | Evidencia |
| :--- | :--- | :--- | :--- |
| **CB-1 / CA-1** | Paginación server-side con `.range` (evita traer todo al cliente) | **Cerrado** | `traslados-consulta.ts`, prueba en `traslados-consulta.test.ts` |
| **CB-1 / CA-2, CA-3** | Gasto confirmado server-side (`pagos.completado`) y conteos atómicos | **Cerrado** | `traslados-consulta.ts`, `page.tsx` |
| **CB-1 (Documental)** | Contrato de uso, invalidación y roundtrip de `snapshotVersion` | **Cerrado** | `flujo8-consistencia-contract.md` |
| **CB-2 / CA-4, CA-5** | Fail-closed de estados a `en_revision` y contrato de huérfanos | **Cerrado** | `estados-traslado-policy.ts`, pruebas unitarias |
| **CB-2 (Transversal)**| Alineación transversal con Flujo 10 y Flujo 13 | **Cerrado** | `estados-traslado-policy.ts`, `flujo8-estados-huerfanos-contract.md` |
| **CB-3 / CA-6** | Zona horaria `America/Mexico_City` y estabilidad DST (Decreto Ley 2022) | **Cerrado** | `zona-horaria-traslados.ts`, pruebas unitarias |
| **CB-3 / CA-7** | DTO mínimo `ViajeListaDTO` con minimización de PII | **Cerrado** | `traslados-consulta.ts` |
| **CB-3 / CA-9** | Ownership estricto y confirmación de RLS en `/viajes/[id]` (defensa en profundidad) | **Cerrado** | `page.tsx`, `flujo8-dto-timezone-contract.md` |
| **CA-10** | Cobertura de pruebas unitarias y typecheck | **Cerrado** | 49 pruebas pasando, 0 errores en TypeScript |

---

## 3. Archivos Modificados y Creados
- `apps/app-usuario/src/lib/estados-traslado-policy.ts` (NUEVO)
- `apps/app-usuario/src/lib/estados-traslado-policy.test.ts` (NUEVO)
- `apps/app-usuario/src/lib/zona-horaria-traslados.ts` (NUEVO)
- `apps/app-usuario/src/lib/zona-horaria-traslados.test.ts` (NUEVO)
- `apps/app-usuario/src/lib/traslados-consulta.ts` (NUEVO)
- `apps/app-usuario/src/lib/traslados-consulta.test.ts` (NUEVO)
- `apps/app-usuario/src/lib/flujo8-consistencia-contract.md` (NUEVO)
- `apps/app-usuario/src/lib/flujo8-estados-huerfanos-contract.md` (NUEVO)
- `apps/app-usuario/src/lib/flujo8-dto-timezone-contract.md` (NUEVO)
- `apps/app-usuario/src/app/mis-viajes/useGestionTraslados.ts` (MODIFICADO)
- `apps/app-usuario/src/app/mis-viajes/useGestionTraslados.test.ts` (MODIFICADO)
- `apps/app-usuario/src/app/mis-viajes/page.tsx` (MODIFICADO)
- `apps/app-usuario/src/app/mis-viajes/MisViajesCliente.tsx` (MODIFICADO)
- `apps/app-usuario/src/app/mis-viajes/MisViajesDesktop.tsx` (MODIFICADO)
- `apps/app-usuario/src/app/mis-viajes/VisualesTraslado.tsx` (MODIFICADO)
- `apps/app-usuario/src/app/viajes/[id]/page.tsx` (MODIFICADO)
- `docs/evidence/F8-staging-20261104.md` (NUEVO)
- `docs/registro-flujo8.md` (NUEVO)
