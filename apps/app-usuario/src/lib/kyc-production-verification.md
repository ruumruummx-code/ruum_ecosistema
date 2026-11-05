# Verificación de Hipótesis de Producción y Defensas KYC — Flujo 5

Este documento consolida la verificación técnica formal de los controles de seguridad, integridad y resiliencia implementados en el Flujo 5 (Verificación de Identidad / KYC) de Ruum, validando en entorno de producción/staging las hipótesis emitidas en la auditoría estática.

---

## 1. RLS en Supabase Storage (`documentos-identidad`)

### Hipótesis Auditada:
El acceso a los documentos de identidad cargados manualmente está confinado por políticas de seguridad a nivel de fila (RLS) en Supabase Storage, impidiendo accesos cruzados (IDOR) entre usuarios y garantizando que solo el titular de la sesión pueda escribir en su prefijo.

### Verificación Técnica:
1. **Configuración del Bucket:**
   - Bucket: `documentos-identidad` (privado, `public = false`).
2. **Políticas RLS en `storage.objects`:**
   - Inserción (`INSERT`):
     ```sql
     (bucket_id = 'documentos-identidad' AND auth.uid()::text = (storage.foldername(name))[1])
     ```
   - Lectura (`SELECT`):
     ```sql
     (bucket_id = 'documentos-identidad' AND (
       auth.uid()::text = (storage.foldername(name))[1]
       OR (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'))
     ))
     ```
3. **Resultado de Prueba de Penetración Local/Staging:**
   - Petición con sesión de Usuario A intentando leer o sobreescribir `documentos-identidad/usuarioB/ine.jpg`: rechazada con `HTTP 403 Forbidden` / RLS Policy violation.
   - Veredicto: **CUMPLIDO**. El aislamiento multi-tenant por carpeta basada en `auth.uid()` es estricto.

---

## 2. Sello de Autorización Temporal (`documentos_identidad_storage_validados`)

### Hipótesis Auditada:
El registro en Storage no otorga acceso permanente sin validación; la Edge Function `validar-documento-identidad` valida los magic bytes (firmas binarias FF D8 FF para JPEG, 89 50 4E 47 para PNG, 25 50 44 46 para PDF) y emite un sello de autorización temporal con TTL de 10 minutos (600 s) para vincular el documento con la cuenta del usuario.

### Verificación Técnica:
1. **Mecanismo de Sellado:**
   - Al validar exitosamente el binario, se inserta un registro en `documentos_identidad_storage_validados` con columnas `(usuario_id, storage_path, sello_temporal, expira_en)`.
   - `expira_en` se calcula como `now() + interval '10 minutes'`.
2. **Validación de Expiración:**
   - Si el usuario demora más de 10 minutos entre la subida y la confirmación final de su perfil, el registro expira y el sello es invalidado.
   - Se ejecutó prueba con token expirado (`now() - interval '1 second'`), resultando en rechazo del proceso y obligando a una revalidación limpia.
3. **Veredicto:** **CUMPLIDO**. Se previene la reutilización de identificadores de almacenamiento caducados.

---

## 3. Firma Criptográfica HMAC-SHA256 en Webhook Didit

### Hipótesis Auditada:
El endpoint `/functions/v1/webhook-didit` valida de manera obligatoria la firma HMAC-SHA256 enviada por Didit en la cabecera HTTP (`x-didit-signature`), rechazando payloads no autenticados o alterados en tránsito.

### Verificación Técnica:
1. **Mecanismo de Verificación:**
   - La Edge Function recupera `DIDIT_WEBHOOK_SECRET` del gestor seguro de secretos de Supabase (`Deno.env.get("DIDIT_WEBHOOK_SECRET")`).
   - Calcula `crypto.subtle.sign("HMAC", key, rawBody)` y compara con `x-didit-signature` utilizando comparación de tiempo constante (`crypto.subtle.verify` / timing-safe) para mitigar ataques de temporización (timing attacks).
2. **Resiliencia y DLQ (RUUM-USR-F5-001 / CB-2):**
   - Si la firma es inválida: rechazo inmediato con `HTTP 401 Unauthorized`.
   - Si la firma es válida pero la base de datos o RPC falla: devuelve `HTTP 503 Service Unavailable` para que el motor de Didit reintente (hasta 5 reintentos).
   - A partir del quinto reintento consecutivo fallido: se registra el evento en `registro_auditoria` con tipo `webhook_didit_dlq`, se marca el estado como `error` y se devuelve `HTTP 200` para evacuar la cola de reintentos sin pérdida del rastro forense.
3. **Veredicto:** **CUMPLIDO**. Autenticidad e integridad garantizadas.

---

## 4. Nota de Rigor Criptográfico sobre Hashes en Telemetría y Logs

En cumplimiento estricto con los estándares de privacidad y seguridad unificados en los Flujos 3, 4 y 5:
1. **Algoritmo Unificado:** Todos los identificadores anonimizados/pseudonimizados en logs de telemetría utilizan **SHA-256 truncado a 32 caracteres hexadecimales** (`crypto.createHash('sha256').update(valor).digest('hex').slice(0, 32)`).
2. **Naturaleza Jurídica y Técnica:**
   - Constituye un mecanismo de **pseudonimización operacional** (RFC 4949 / Considerando 26 RGPD) diseñado para permitir trazabilidad y depuración de incidentes sin escribir identificadores personales o de sesión en texto plano.
   - **No es anonimización matemática fuerte:** Al aplicarse sobre identificadores con entropía limitada, no se asume como irreversibilidad absoluta frente a ataques de fuerza bruta de espacio reducido.
   - **No es control de seguridad:** El hash nunca es empleado como secreto de autenticación, token ni llave de acceso.
3. **Erradicación de MD5:** Ningún flujo operativo de la plataforma (incluyendo F5) utiliza algoritmos obsoletos (MD5, SHA-1) para telemetría ni propósitos operativos.
