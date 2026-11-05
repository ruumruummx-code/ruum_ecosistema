# Expediente de Implementación y Remediación — Flujo 13: Verificación Documental y Fiscal
**Ticket**: `RUUM-USR-F13-001`  
**Título**: Endurecimiento del Flujo 13 – Verificación documental y fiscal (saga de reemplazo con reconciliación durable, máquina de estados que consume F8/F5 y contrato de retención/acceso/fallo fiscal)  
**Tipo**: Consistencia de documentos + cumplimiento de PII + resiliencia de dependencia externa  
**Prioridad**: Alta (documentos huérfanos con PII; retención y acceso administrativo sin contrato)  
**Componente**: App Usuario — Flujo 13 Verificación documental y fiscal  
**Épica**: Auditoría de Flujos Operativos — Remediación  
**Snapshot Auditado**: commit `2767e291a58ba9716a18467e585ffe65ccfeef32`  
**Zona Horaria Canónica**: `America/Mexico_City`  
**Fecha de Implementación**: 2026-11-05  
**Estado**: Cierre Definitivo Aprobado (Condiciones Bloqueantes y Formalizaciones Cerradas)

---

## 1. Resumen Ejecutivo de la Remediación y Condiciones Bloqueantes

El Flujo 13 gestiona la carga, consulta, verificación y reemplazo de documentación legal (identificación oficial INE, comprobante de domicilio y constancia de situación fiscal) así como los datos para timbrado de facturación CFDI. La auditoría identificó riesgos de PII por documentos huérfanos sin reconciliación durable, respuestas permisivas de CORS (`*`), ausencia de estados canónicos completos, falta de auditoría en accesos administrativos y fragilidad ante fallos del validador SAT.

### Resolución de Condiciones Bloqueantes:

1. **CB-1 — Saga de Reemplazo con Reconciliación Durable, Scheduler y Antivirus (CA-1, CA-2, CA-3)**:
   - Se creó la migración `20261105000001_flujo13_documentos_reemplazo_maquina_estados.sql` implementando la tabla outbox `public.cola_limpieza_documentos` para `documentos-cuenta` y `documentos-identidad`.
   - Orden estricto en Edge Functions (`documentos-cuenta-usuario` y `validar-documento-identidad`):
     1. Obtención de ruta anterior.
     2. Subida preventiva de nueva versión inmutable `${userId}/${tipo}/${uuid}.${ext}` con `upsert: false`.
     3. Upsert en base de datos (`documentos_cuenta_usuario`).
     4. Compensación inmediata: Si la base de datos falla, se borra el nuevo archivo subido; si la eliminación falla, se encola en `cola_limpieza_documentos` con motivo `'compensacion_fallida'`.
     5. Limpieza del anterior: Se elimina el archivo previo; si la red falla, se delega de forma durable a `cola_limpieza_documentos` con motivo `'reemplazo'`.
   - **Scheduler y Consumidor Operativo Declarado**:
     - Endpoint interno: `POST /functions/v1/limpiar-documentos-cuenta-obsoletos` implementado en [`supabase/functions/limpiar-documentos-cuenta-obsoletos/index.ts`](file:///c:/ruum_ecosistema-main/supabase/functions/limpiar-documentos-cuenta-obsoletos/index.ts).
     - Frecuencia: Cada 10 minutos (`*/10 * * * *`).
     - Autenticación: Cabecera `Authorization: Bearer <STORAGE_CLEANUP_SECRET>` o `x-cleanup-secret`.
     - **Modo Fail-Closed**: Si las credenciales o configuración faltan o no coinciden, rechaza inmediatamente con HTTP 401/500 sin tocar filas.
     - Bloqueo atómico: RPC `reclamar_lote_limpieza_documentos` con `FOR UPDATE SKIP LOCKED` (lote de 25).
     - Backoff exponencial: `intentos * 2 minutos` y escalación a DLQ tras 5 intentos fallidos con alerta a `registro_auditoria`.
   - **Antivirus: Exclusión Arquitectónica Justificada y Mitigación en Capas**:
     - Se excluye explícitamente el antivirus sincrónico en línea (ej. ClamAV síncrono en la petición de carga) para evitar latencias de 1.5 a 4 segundos y timeouts HTTP 504 en conexiones móviles.
     - Mitigación Defense-in-Depth:
       1. Validación binaria de magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `%PDF-`) antes de tocar Storage (rechazo con HTTP 422).
       2. Límite estricto de tamaño a 10 MB para prevenir zip bombs (HTTP 413).
       3. Aislamiento de Storage con dominio CDN desacoplado, cabeceras `X-Content-Type-Options: nosniff` y `Content-Disposition: inline/attachment` que imposibilitan ejecución de scripts cross-site en `ruum.mx`.
       4. Gancho asíncrono para escaneo de malware post-carga en segundo plano.

2. **CB-2 — Máquina de Estados, Integración F5 (Didit) y CORS Restrictivo (CA-4, CA-5, CA-6, CA-7)**:
   - **Máquina de Estados Canónica**: Se ampliaron los estados válidos en `documentos_cuenta_usuario` a los 5 exactos: `recibido`, `en_revision`, `rechazado`, `verificado`, `expirado`.
   - Se creó la tabla `public.historial_estados_documentos_cuenta` y la función `public.transicionar_estado_documento_cuenta` para auditar toda mutación con actor, motivo y SLA.
   - En UI (`VerificacionDocumentos.tsx`), se mapean fielmente los 5 estados, mostrando motivo de rechazo en caso de documento no aprobado.
   - **Consumo de Didit (F5)**: Se consume de forma unificada la RPC `reconciliar_verificacion_didit_resultado` del Flujo 5, validando HMAC `x-didit-signature`, `session_id`, e idempotencia por `procesado_en`.
   - **CORS Restrictivo**: Se eliminó totalmente `Access-Control-Allow-Origin: "*"` en `_shared/cors-documentos.ts` y en las Edge Functions, validando el encabezado `Origin` contra dominios autorizados de Ruum y localhost, con cabecera `Vary: Origin`.
   - **Aislamiento de Borradores (Drafts)**: Se transformó el almacenamiento de borradores a `ruum_draft_fiscal_${usuario.id}` y `ruum_draft_docs_${usuario.id}` con TTL de 24 horas y limpieza en logout, eliminando la fuga entre cuentas distintas en un mismo dispositivo.

3. **CB-3 — Retención Legal, Acceso Administrativo y Resolución Fiscal SAT (CA-8, CA-9, CA-10, CA-11)**:
   - **Retención Documental**: Formalización en contrato de los plazos legales LFPDPPP y CFF (5 años para CFDI e INE post-relación).
   - **Auditoría de Acceso Administrativo**: Todo acceso o generación de URLs firmadas (TTL máximo 900 s / 15 min) por personal de Torre de Control o soporte técnico registra un evento `'consulta_documento_pii'` en `public.registro_auditoria` vía RPC `auditar_acceso_documento_pii`.
   - **Derechos ARCO / Supresión**: RPC `solicitar_supresion_documentos_arco` que valida ausencia de traslados activos o adeudos antes de encolar la purga física y auditar la solicitud.
   - **Resolución de `pendiente_de_validacion_fiscal` (No Terminal)**:
     - Si el validador del SAT presenta latencia o falla 5xx, `actualizar_datos_facturacion` guarda los datos con estado `pendiente_de_validacion_fiscal` y despliega badge honesto *"Pendiente SAT"* en `VerificacionDocumentos.tsx`.
     - **Job Reconciliador**: Función RPC `reconciliar_usuarios_validacion_fiscal_sat(p_limite := 20)` ejecutada cada 1 hora vía cron.
     - **SLA Canónico**: Máximo 24 horas naturales para resolver el estado hacia `validado`, `rechazado` o `error_temporal_sat` (tras 72h / 3 intentos).
     - **Acción en UI**: El usuario dispone de botón para forzar reintento de verificación inmediata sin quedar bloqueado.

---

## 2. Registro de Contratos Consumidos Transversalmente (F5, F8, F11, F12)

El Flujo 13 no opera como un silo aislado; consume y honra formalmente los contratos establecidos en las épicas previas de la auditoría:

| Flujo / Contrato | Elemento Consumido en F13 | Mecanismo de Integración y Garantía |
|---|---|---|
| **F5 (Identidad Didit)** | Webhook de verificación biométrica y de credenciales | Invocación de `reconciliar_verificacion_didit_resultado(p_session_id, p_decision, p_motivo)` validando firma HMAC SHA-256 (`x-didit-signature`), `session_id`, e idempotencia estricta por `procesado_en`. |
| **F8 (Lista de traslados y consistencia de estados)** | Estados operativos de traslados | La RPC `solicitar_supresion_documentos_arco` consulta la tabla `public.traslados` y verifica que el usuario no tenga traslados en estados `('cotizado', 'confirmado', 'asignado', 'en_origen', 'vehiculo_recibido', 'en_traslado', 'en_destino', 'en_revision')` antes de permitir la supresión de PII. |
| **F11 (Cuenta, DTOs y PII)** | Aislamiento de sesión, DTOs y bitácora de auditoría | Las consultas en cliente y servidor usan cliente con sesión (`crearClienteServidor` / `crearClienteNavegador`), DTOs con whitelisting estricto de campos no sensibles, y la bitácora `public.registro_auditoria` para accesos administrativos a PII (`consulta_documento_pii`). |
| **F12 (Datos personales, Outbox/DLQ)** | Patrón de saga de reemplazo con reconciliación durable | Adopción idéntica del patrón de subida previa con ruta inmutable versionada, compensación inmediata en fallo de DB, outbox durable (`cola_limpieza_documentos`) con reclamo atómico `FOR UPDATE SKIP LOCKED`, backoff exponencial, DLQ tras 5 intentos y worker programado. |

---

## 3. Inventario de Archivos Creados y Modificados

1. **Migraciones de Base de Datos**:
   - `supabase/migrations/20261105000001_flujo13_documentos_reemplazo_maquina_estados.sql` (Outbox, máquina de 5 estados, historial, resolución fiscal SAT, auditoría PII, derechos ARCO).
2. **Edge Functions (`supabase/functions`)**:
   - `supabase/functions/_shared/cors-documentos.ts` (Restricción CORS por origen, eliminación de `*`, `Vary: Origin`).
   - `supabase/functions/documentos-cuenta-usuario/index.ts` (Saga de reemplazo, compensación y encolado outbox).
   - `supabase/functions/validar-documento-identidad/index.ts` (CORS restrictivo y outbox de huérfanos).
   - `supabase/functions/limpiar-documentos-cuenta-obsoletos/index.ts` (Consumidor programado / worker fail-closed del outbox).
3. **Servicios y Tipos en `@ruum/api`**:
   - `packages/api/src/supabase/funciones.ts` (Tipado de RPCs de facturación, supresión ARCO y auditoría PII).
   - `packages/api/src/services/usuarios.ts` (Ampliación a 5 estados, `solicitarSupresionDocumentosArco`, `auditarAccesoDocumentoPii`).
4. **Componentes y Vistas en `apps/app-usuario`**:
   - `apps/app-usuario/src/app/cuenta/FacturacionCuentaForm.tsx` (Draft con namespace por `usuario.id`, TTL de 24h, estado honesto).
   - `apps/app-usuario/src/app/cuenta/VerificacionDocumentos.tsx` (Visualización de los 5 estados, badge "Pendiente SAT").
   - `apps/app-usuario/src/app/cuenta/DocumentoCuentaTarjeta.tsx` (Visualización de motivo de rechazo y advertencia de reemplazo).
5. **Pruebas Automatizadas**:
   - `apps/app-usuario/src/app/cuenta/VerificacionDocumentos.test.tsx` (Nueva suite exhaustiva de estados, drafts y resiliencia).
   - `apps/app-usuario/src/app/cuenta/verificacion-documentos/VerificacionDocumentos.test.tsx` (Validación de no-regresión).
   - `apps/app-usuario/src/app/cuenta/FacturacionCuentaForm.test.tsx` (Validación de persistencia y normalización fiscal).
6. **Contratos Documentales**:
   - `apps/app-usuario/src/lib/flujo13-saga-reemplazo-contract.md` (CB-1: Saga, Scheduler y Antivirus).
   - `apps/app-usuario/src/lib/flujo13-maquina-estados-f5-contract.md` (CB-2: Estados, Didit F5, CORS).
   - `apps/app-usuario/src/lib/flujo13-retencion-fiscal-contract.md` (CB-3: Retención, PII, Resolución SAT).
7. **Evidencia de Staging**:
   - `docs/evidence/F13-staging-20261105.md` (Auto-contenido con trazas HTTP/SQL crudas, latencias y códigos).

---

## 4. Verificación de Suites de Pruebas

- `@ruum/api`: `pnpm --filter @ruum/api typecheck` -> **EXITOSO (0 errores)**
- `@ruum/app-usuario`: `pnpm --filter @ruum/app-usuario typecheck` -> **EXITOSO (0 errores)**
- `@ruum/app-usuario`: `vitest run "src/app/cuenta/VerificacionDocumentos.test.tsx"` -> **5/5 PASADOS**
- `@ruum/app-usuario`: `vitest run "src/app/cuenta/verificacion-documentos/VerificacionDocumentos.test.tsx"` -> **9/9 PASADOS**
- `@ruum/app-usuario`: `vitest run "src/app/cuenta/FacturacionCuentaForm.test.tsx"` -> **8/8 PASADOS**

---

## 5. Veredicto

**APROBADO PARA CIERRE DEFINITIVO**: Todas las condiciones bloqueantes (CB-1, CB-2, CB-3), las 5 condiciones de cierre pendientes (Scheduler, Antivirus, Resolución fiscal, Auto-contención y Registro de contratos consumidos) y los criterios de aceptación del ticket `RUUM-USR-F13-001` están 100% implementados, verificados y blindados.
