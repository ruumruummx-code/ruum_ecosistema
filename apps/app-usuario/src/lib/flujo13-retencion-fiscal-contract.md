# Contrato de Retención Documental, Acceso Administrativo y Resiliencia Fiscal (Flujo 13)
**Identificador**: `RUUM-CONTRATO-F13-RETENCION-FISCAL`  
**Ticket**: `RUUM-USR-F13-001` (Condición Bloqueante CB-3)  
**Versión**: `1.1.0`  
**Fecha**: `2026-11-05`  
**Estado**: `APROBADO_EN_CONTRATO`

---

## 1. Política Legal de Retención de Documentos

Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y el Código Fiscal de la Federación (CFF, Art. 30), se establecen los plazos de conservación documental:

| Tipo de Documento | Base Legal | Plazo de Retención Activa | Disposición Final |
|---|---|---|---|
| **Identificación Oficial (INE/Pasaporte)** | Prevención de fraude y LFPDPPP | Vigencia del contrato + 5 años posteriores al último traslado | Borrado seguro físico de Storage y purgación de hash |
| **Comprobante de Domicilio** | Validación de residencia contractual | Vigencia del contrato o hasta reemplazo por versión más reciente | Purgación automática del archivo reemplazado vía Outbox |
| **Constancia de Situación Fiscal (CSF)** | CFF Art. 30 (contabilidad y emisión CFDI) | 5 años contados a partir de la emisión de la última factura CFDI | Bloqueo de consulta y eliminación tras prescripción fiscal |

---

## 2. Auditoría Estricta de Acceso Administrativo a PII

Cualquier consulta, visualización o generación de URL firmada de documentos con PII por parte del personal de Torre de Control o soporte técnico está estrictamente auditada:

1. **Vigencia de URLs Firmadas**:
   - TTL máximo inmutable de **900 segundos (15 minutos)**.
   - Prohibido el almacenamiento o re-compartición de URLs firmadas en correos, tickets o sistemas externos.
2. **Registro Obligatorio en Bitácora**:
   - Todo acceso administrativo ejecuta la RPC `public.auditar_acceso_documento_pii`:
     - `evento`: `'consulta_documento_pii'`
     - `actor`: `'admin'` (con ID del administrador)
     - `usuario_objetivo_id`: ID del usuario titular del documento
     - `datos`: `{ documento_id, tipo_documento, justificacion, timestamp }`
     - `ip`: Dirección IP del operador

---

## 3. Ejercicio de Derechos ARCO y Supresión Documental

El usuario puede solicitar en cualquier momento la supresión de sus documentos mediante la RPC `public.solicitar_supresion_documentos_arco(p_tipo_documento)`:

1. **Candados de Integridad Operativa**:
   - La RPC verifica que el usuario **no tenga traslados activos** (`cotizado`, `confirmado`, `asignado`, `en_origen`, `vehiculo_recibido`, `en_traslado`, `en_destino`, `en_revision`).
   - Si existen operaciones activas, la solicitud es rechazada de manera atómica con mensaje explicativo.
2. **Eliminación Física Asíncrona**:
   - Si no existen impedimentos, la referencia relacional es eliminada y la ruta de Storage es encolada en `public.cola_limpieza_documentos` con motivo `'solicitud_arco'`.
   - Se emite un evento auditable `'solicitud_supresion_arco'` con el conteo de artefactos encolados.

---

## 4. Resiliencia ante Fallos Externos del SAT / PAC y Resolución de `pendiente_de_validacion_fiscal`

Los servicios externos de validación del SAT y Proveedores Autorizados de Certificación (PAC) presentan latencia variable y ventanas de indisponibilidad. Para evitar bloqueos en la experiencia del usuario y garantizar que `pendiente_de_validacion_fiscal` nunca sea un estado terminal percibido:

### 4.1 Captura No Bloqueante (Graceful Fallback)
- Si la llamada al validador del SAT responde con timeout o error 5xx, el sistema **no rechaza la captura de datos fiscales**.
- Los datos se guardan atómicamente con `estado_validacion_fiscal = 'pendiente_de_validacion_fiscal'`.
- El usuario recibe confirmación de datos guardados y ve en UI el badge honesto *"Pendiente SAT"*.

### 4.2 Job Reconciliador Programado (Worker / Cron)
1. **Mecanismo Operativo**:
   - Invocación horaria (`0 * * * *`) vía `pg_cron` o función programada interna.
   - Ejecuta la RPC `public.reconciliar_usuarios_validacion_fiscal_sat(p_limite := 20)` con bloqueo `FOR UPDATE SKIP LOCKED`.
2. **SLA Canónico de Resolución**:
   - **SLA máximo: <= 24 horas naturales** para resolver el estado `pendiente_de_validacion_fiscal`.
3. **Máquina de Resolución**:
   - **Transición a `validado`**: Si el RFC está activo en el padrón del SAT y coincide con el código postal y régimen fiscal capturados.
   - **Transición a `rechazado`**: Si el RFC es inexistente, revocado o cancelado ante el SAT. Se registra el motivo del rechazo en auditoría y se notifica al usuario para corregir su RFC.
   - **Transición a `error_temporal_sat`**: Si tras 3 reintentos consecutivos (máximo 72 horas) el servicio del SAT continúa inaccesible, se escala a Torre de Control para validación manual contra la Constancia de Situación Fiscal (PDF) subida por el usuario.

### 4.3 Acción de Reintento / Consulta en UI
- Si el usuario requiere emisión inmediata de factura y el SAT ya restableció su disponibilidad, puede presionar el botón *"Verificar estado fiscal"* en la hoja de facturación o re-guardar sus datos para forzar una consulta síncrona inmediata sin esperar el próximo ciclo del cron.

### 4.4 Materialización vs. Consulta en Vivo
- Los datos fiscales validados y la constancia se materializan en PostgreSQL (`usuarios` y `documentos_cuenta_usuario`).
- La emisión de cotizaciones y traslados consume los datos materializados locales validados, eliminando dependencias de red síncronas bloqueantes en el momento de crear o cobrar un traslado.
