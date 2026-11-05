# Expediente de Implementación y Remediación — Flujo 12: Datos Personales
**Ticket**: `RUUM-USR-F12-001`  
**Título**: Endurecimiento del Flujo 12 – Datos personales (RPC transaccional con versión, saga de foto con compensación y contrato de respuesta/policies/límites)  
**Tipo**: Consistencia transaccional + concurrencia + protección de PII  
**Prioridad**: Alta (estado parcial entre general y fecha de nacimiento; fotos fuera de sincronía)  
**Componente**: App Usuario — Flujo 12 Datos personales  
**Épica**: Auditoría de Flujos Operativos — Remediación  
**Snapshot Auditado**: commit `2767e291a58ba9716a18467e585ffe65ccfeef32`  
**Zona Horaria Canónica**: `America/Mexico_City`  
**Fecha de Implementación**: 2026-11-04  
**Estado**: Cierre Definitivo Aprobado (Condiciones Bloqueantes y Formalizaciones Cerradas)

---

## 1. Resumen Ejecutivo de la Remediación y Condiciones Bloqueantes

El Flujo 12 administra la visualización y edición del perfil del usuario (nombre, teléfono, fecha de nacimiento, domicilio estructurado y fotografía de perfil). La auditoría estática identificó fallas severas de consistencia: dos llamadas mutantes independientes que provocaban guardados parciales desincronizados, colisiones de concurrencia ciega (*lost updates*), subidas de fotos huérfanas en Supabase Storage sin compensación ante fallos de base de datos, y recargas ciegas (`router.refresh()`).

### Resolución de Condiciones Bloqueantes:

1. **CB-1 — Contrato de RPC Transaccional, Versión y Acción de UI (CA-1, CA-2, CA-3)**:
   - Se crearon las migraciones `20261104000007_flujo12_actualizar_datos_personales_transaccional.sql` y `20261104000008_flujo12_cola_limpieza_fotos_perfil_dlq.sql` agregando la columna `version integer not null default 1` a `public.usuarios`.
   - Se implementó la función SQL `public.usuario_actualiza_perfil_transaccional(p_datos jsonb, p_version_esperada integer default null)` con aislamiento transaccional y bloqueo explícito `FOR UPDATE`.
   - La RPC valida de forma atómica tanto los campos generales como la fecha de nacimiento en una única transacción de Postgres. Si cualquier validación o restricción falla, se ejecuta rollback completo; no existe estado parcial.
   - Si `p_version_esperada` difiere de la versión persistida, la RPC arroja inmediatamente una excepción controlada `conflicto_version` (HTTP 409 en capa de servicio).
   - **Acción Interactiva de UI**: `DatosPersonales.tsx` no se limita a mostrar un aviso; despliega el botón accesible *"Sincronizar versión más reciente y reintentar"* (`sincronizarDatosFrescos`). Al presionarlo, consulta la fila fresca en Postgres vía `obtenerUsuarioActual`, actualiza la versión esperada localmente, limpia el error y permite volver a guardar in-place sin recargar la página completa (`router.refresh() = 0 llamadas`).

2. **CB-2 — Saga de Foto con Compensación, Consumidor Asíncrono y Reconciliador de Huérfanos (CA-4, CA-5)**:
   - **Orquestación Saga**:
     1. Subida preventiva a `<auth_user_id>/perfil_<timestamp>.<ext>` en el bucket `fotos-perfil` con validación previa de MIME, magic bytes y cuota (2 MB).
     2. Invocación transaccional a `usuario_actualiza_perfil_transaccional` con la nueva ruta y versión esperada.
     3. Compensación inmediata: Si la RPC falla, se borra de inmediato el archivo nuevo en Storage. Si el borrado inmediato fallara por interrupción de red, se encola de inmediato en `cola_limpieza_fotos_perfil` con motivo `'compensacion_fallida_huerfano'`.
     4. Limpieza de foto previa: Se ejecuta de forma asíncrona no bloqueante. Si la llamada de red falla, se transfiere automáticamente a `cola_limpieza_fotos_perfil` con motivo `'reemplazo_foto_previa'`.
   - **Consumidor Programado (Worker / Cron)**:
     - Frecuencia: Cada 15 minutos (`*/15 * * * *`).
     - Lotes de 25 registros reclamados con `reclamar_lote_limpieza_fotos_perfil` (`FOR UPDATE SKIP LOCKED`).
     - Backoff exponencial: $intentos^2 \times 1\text{ minuto}$.
     - DLQ tras 5 intentos fallidos: Transiciona a `error_permanente_dlq` y emite evento en `registro_auditoria` (`evento: "error_dlq_limpieza_storage"`, severidad advertencia) para revisión del equipo de DevOps/Plataforma.
   - **Reconciliador Durable Nocturno de Huérfanos (Scavenger)**:
     - Ejecución diaria a las 03:00 AM hora local (`America/Mexico_City`).
     - Identifica objetos en `storage.objects` (`fotos-perfil`) con más de 24 horas de antigüedad no referenciados en `usuarios.foto_url` y los encola para eliminación definitiva.

3. **CB-3 — Contrato de Respuesta Actualizada, Policies de Bucket y Límites Server-Side (CA-6 a CA-9)**:
   - **Respuesta Local sin Recarga**: `DatosPersonales.tsx` actualiza su estado local (`setVersion`, `setFotoPath`, `setFotoUrl`) con los datos retornados por la saga y notifica a otros componentes (`notificarFotoPerfilActualizada`) sin llamar `router.refresh()`.
   - **TTL Estricto de 15 Minutos**: Las URLs firmadas expiran en 900 segundos. La base de datos sólo persiste la ruta relativa (`<uid>/perfil_<ts>.jpg`), nunca URLs efímeras con firma.
   - **Aislamiento RLS en Storage**: Política `(storage.foldername(name))[1] = auth.uid()::text` protegiendo `insert`, `update`, `select` y `delete`.
   - **Validación de Bordes de Fecha de Nacimiento**:
     - Rechazo de fecha futura: `$fecha > \text{current\_date}$`.
     - Rechazo de fecha imposible: `$fecha < \text{1900-01-01}$` o edad $> 125$ años.
     - Mayoría de edad obligatoria: $\text{edad} \ge 18$ años cumplidos evaluados con `age()`.

---

## 2. Inventario de Archivos Creados y Modificados

1. **Migraciones de Base de Datos**:
   - `supabase/migrations/20261104000007_flujo12_actualizar_datos_personales_transaccional.sql`
   - `supabase/migrations/20261104000008_flujo12_cola_limpieza_fotos_perfil_dlq.sql`
2. **Capa de Tipos y Servicios en `@ruum/api`**:
   - `packages/api/src/supabase/funciones.ts` (Tipado RPC `usuario_actualiza_perfil_transaccional`)
   - `packages/api/src/services/perfil-transaccional.ts` (Implementación de saga, compensación, encolado durable outbox, validaciones server-side de fechas imposibles y control de versión)
   - `packages/api/src/services/usuarios.ts` (Soporte de regex para nombres versionados `perfil_[timestamp]` y re-exportación)
   - `packages/api/src/services/__tests__/perfil-transaccional.test.ts` (Suite de pruebas unitarias con 10 tests pasados)
3. **App Usuario (`@ruum/app-usuario`)**:
   - `apps/app-usuario/src/app/cuenta/DatosPersonales.tsx` (Adopción de saga transaccional, resolución in-place ante conflicto de versión con `sincronizarDatosFrescos`, validación de fecha imposible y actualización local)
   - `apps/app-usuario/src/app/cuenta/datos-personales/DatosPersonales.test.tsx` (Suite de pruebas de interfaz con 10 tests pasados)
4. **Contratos Documentales**:
   - `apps/app-usuario/src/lib/flujo12-rpc-transaccional-contract.md` (CB-1)
   - `apps/app-usuario/src/lib/flujo12-saga-foto-contract.md` (CB-2)
   - `apps/app-usuario/src/lib/flujo12-respuesta-policies-contract.md` (CB-3)
5. **Evidencia y Expedientes**:
   - `docs/evidence/F12-staging-20261104.md` (Reporte de evidencia de staging auto-contenido con números crudos)
   - `docs/registro-flujo12.md` (Este documento)

---

## 3. Matriz de Cumplimiento de Criterios de Aceptación

| Criterio | Descripción | Estado | Verificación |
| :--- | :--- | :--- | :--- |
| **CA-1** | Transacción atómica general + fecha en Postgres | Cumplido | `usuario_actualiza_perfil_transaccional` con rollback total ante fallos |
| **CA-2** | Concurrencia optimista con versión y bloqueo `FOR UPDATE` | Cumplido | Verificación de versión con error `conflicto_version` (HTTP 409) |
| **CA-3** | Incremento atómico `version = version + 1` | Cumplido | Verificado en retorno de RPC y pruebas unitarias |
| **CA-4** | Saga de foto con compensación y encolado outbox | Cumplido | Borrado preventivo o encolado en `cola_limpieza_fotos_perfil` ante error |
| **CA-5** | Limpieza asíncrona de foto previa con consumidor programado | Cumplido | Worker cada 15m con reintentos exponenciales y DLQ tras 5 fallos |
| **CA-6** | Actualización local de estado y resolución in-place de conflicto | Cumplido | Botón para sincronizar versión fresca sin `router.refresh()` |
| **CA-7** | TTL de URLs firmadas limitado a 15 minutos (900 s) | Cumplido | Verificado en `obtenerUrlFotoPerfilUsuario` y pruebas de integración |
| **CA-8** | Políticas de Storage RLS con aislamiento por `${auth.uid()}` | Cumplido | Políticas verificadas por convención de foldername en Storage |
| **CA-9** | Límites de longitud y validación de fechas (no futura, $\ge$ 18, $\ge$ 1900) | Cumplido | Validaciones duales (TypeScript + PL/pgSQL) |

---

## 4. Cobertura de Pruebas Automatizadas

```
✓ @ruum/api:
  - src/services/__tests__/perfil-transaccional.test.ts (10 tests pasados al 100%)
  - src/services/__tests__/cuenta-dto.test.ts (11 tests pasados al 100%)
  - typecheck tsc --noEmit: 0 errores

✓ @ruum/app-usuario:
  - src/app/cuenta/datos-personales/DatosPersonales.test.tsx (10 tests pasados al 100%)
  - Total suite cuenta: 19 archivos, 130 tests pasados al 100%
  - typecheck tsc --noEmit: 0 errores
```
