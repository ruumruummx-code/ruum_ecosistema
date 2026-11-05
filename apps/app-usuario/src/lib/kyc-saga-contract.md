# Contrato de Saga y Compensación KYC — Flujo 5: Verificación de Identidad
**Identificador**: `RUUM-CONTRATO-F5-KYC-SAGA`  
**Ticket**: `RUUM-USR-F5-001` (Condición Bloqueante CB-1)  
**Versión**: `1.1.0`  
**Fecha**: `2026-11-05`  
**Estado**: `APROBADO_EN_CONTRATO`

---

## 1. Contexto y Problema Resuelto (CB-1)
En el flujo histórico de carga manual de documentos para KYC (`VerificacionForm.tsx`), el cliente invocaba `actualizarPerfilUsuario` primero para persistir el domicilio del usuario en `public.usuarios` y, posteriormente, `subirDocumentoIdentidad` para transferir la imagen/PDF al bucket `documentos-identidad`.

Si la carga del documento fallaba (por rechazo de magic bytes, tamaño excesivo, cuota o interrupción de red), el perfil de usuario ya había sido mutado permanentemente en la base de datos con un domicilio actualizado pero sin ningún documento de identidad cargado ni asociado. Esto generaba un estado inconsistente en la base de datos y dejaba perfiles desalineados con respecto al estado canónico de verificación (`pendiente` / `en_revision`).

---

## 2. Contrato de la Saga Manual de Dos Fases

### Secuencia Obligatoria de Ejecución:
1. **Fase 1 (Carga y Validación Binaria del Documento):**
   - El cliente invoca en primer lugar `subirDocumentoIdentidad(cliente, archivo)`.
   - Se validan magic bytes en cliente y en servidor mediante la Edge Function `validar-documento-identidad`.
   - El archivo se almacena en el bucket privado `documentos-identidad` (`auth.uid()/*`) y se registra en `documentos_identidad_storage_validados` con estado `en_revision`.
   - Si la Fase 1 falla (por rechazo binario, validación de tipo o fallo de red):
     - La transacción se detiene inmediatamente.
     - **Invariante de Consistencia:** `actualizarPerfilUsuario` **nunca** es ejecutado. La tabla `public.usuarios` no experimenta ninguna mutación.
     - El archivo permanece seleccionado en la UI para permitir que el usuario corrija o reintente la carga sin pérdida de contexto.

2. **Fase 2 (Persistencia Atómica del Domicilio):**
   - Una vez confirmada la subida y validación del documento (`documentoSubidoExitoso = true`), la UI procede automáticamente a registrar el domicilio completo mediante `actualizarPerfilUsuario`.
   - Se validan los 5 campos obligatorios: calle, número, colonia, código postal (5 dígitos) y estado.
   - Si la Fase 2 es exitosa:
     - El flujo concluye en estado `en_revision`.
     - Se notifica al usuario el éxito de la recepción de su documentación.

---

## 3. Manejo de Fallo Parcial y Estado Intermedio Explícito

Si la Fase 1 (documento) es exitosa pero la Fase 2 (domicilio) experimenta un fallo transitorio de red o error de servidor:
1. **No se revierte el documento:** El documento ya fue validado criptográficamente y reside en aislamiento seguro en el bucket privado bajo la carpeta del usuario.
2. **Activación de Estado Intermedio:**
   - La aplicación pasa al estado `falloDomicilioParcial = true`.
   - Se mantiene `documentoSubidoExitoso = true`.
   - La interfaz despliega un aviso claro e instructivo:
     > *"Tu documento de identidad fue recibido y validado, pero ocurrió un problema al guardar tu domicilio. Haz clic en 'Reintentar guardar domicilio' sin necesidad de volver a subir tu documento."*
   - El botón de acción cambia su etiqueta dinámicamente a: **`Reintentar guardar domicilio`**.
3. **Mecanismo de Reintento Idempotente:**
   - Al pulsar el botón de reintento, el manejador detecta `documentoSubidoExitoso === true` y **omite por completo la llamada a `subirDocumentoIdentidad`**.
   - Se reintenta exclusivamente la mutación de `actualizarPerfilUsuario`.
   - Si el usuario decide deliberadamente seleccionar un nuevo archivo de identificación, el estado intermedio se invalida (`documentoSubidoExitoso = false`, `falloDomicilioParcial = false`), reiniciando la saga desde la Fase 1.

---

## 4. Matriz de Estados de la Saga

| Estado de la Máquina | `documentoSubidoExitoso` | `falloDomicilioParcial` | `enviado` | Acción Permitida / Comportamiento |
| :--- | :---: | :---: | :---: | :--- |
| **Inicial** | `false` | `false` | `false` | Selección de documento y captura de domicilio |
| **Fallo en Doc (Fase 1)** | `false` | `false` | `false` | Perfil intacto; reintento completo desde Fase 1 |
| **Fallo en Domicilio (Fase 2)** | `true` | `true` | `false` | Doc preservado; reintento exclusivo de Fase 2 |
| **Completado Exitoso** | `true` | `false` | `true` | UI confirmada; registro en `en_revision` |

---

## 5. Garantía de Invariantes
- **Invariante 1 (No domicilios huérfanos sin documento):** Jamás existirá un usuario con domicilio actualizado por flujo manual si la subida y validación del documento no fue exitosa.
- **Invariante 2 (No duplicidad de almacenamiento en reintentos):** En caso de fallo transitorio al guardar domicilio, no se vuelven a subir copias redundantes del archivo de identidad al bucket de Supabase Storage.
- **Invariante 3 (Aislamiento de identidad):** En ningún momento del flujo manual o digital se muta `usuarios.correo_facturacion`, preservando la separación estricta de dominios de facturación e identidad.

---

## 6. Reconciliación de Huérfanos Residuales de la Saga (Outbox y Scavenger)

Si el usuario completa exitosamente la Fase 1 (archivo subido y registrado en `documentos_identidad_storage_validados`), pero abandona la sesión, cierra el navegador o la Fase 2 falla permanentemente sin reintento:

1. **Ventana de Gracia Operativa (24 horas)**:
   - Se mantiene el archivo disponible en el bucket `documentos-identidad` durante 24 horas naturales para que el usuario pueda retomar la sesión y completar su domicilio sin requerir una nueva carga.
2. **Reconciliador Scavenger Nocturno**:
   - **Frecuencia:** Diaria a las 03:00 AM hora local (`America/Mexico_City`).
   - **Algoritmo:** Identifica en `documentos_identidad_storage_validados` registros con `expira_en < now() - interval '24 hours'` cuya ruta no se encuentre asociada en `public.usuarios.doc_identidad_url`.
   - **Reutilización del Patrón Outbox (F12/F13):**
     - La ruta huérfana se inserta en `public.cola_limpieza_documentos` con motivo `'expiracion'`.
     - El consumidor programado de limpieza (`limpiar-documentos-cuenta-obsoletos`) reclama el lote mediante `reclamar_lote_limpieza_documentos` (`FOR UPDATE SKIP LOCKED`) y efectúa la eliminación física en Storage.
3. **Erradicación de PII Abandonada:** Cero acumulación indefinida de identificaciones en la nube sin un usuario verificado vinculado.

---

## 7. Antivirus: Declaración y Exclusión Arquitectónica Justificada

### 7.1 Exclusión Explícita del Escáner Sincrónico
Se excluye formalmente la ejecución de un motor antivirus sincrónico (ej. ClamAV síncrono en línea) en el endpoint de subida `validar-documento-identidad`:
- **Justificación:** La inspección síncrona en archivos de hasta 10 MB genera una latencia añadida de 1.5 a 4.0 segundos, provocando caídas de socket en redes móviles 3G/4G y timeouts HTTP 504.

### 7.2 Mitigación Defense-in-Depth en 4 Capas
La protección contra amenazas se garantiza mediante controles arquitectónicos en capas:
1. **Validación Binaria Estricta de Magic Bytes**:
   - Cabeceras verificadas byte a byte en memoria antes de transferir a Storage:
     - JPEG: `0xFF 0xD8 0xFF`
     - PNG: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
     - PDF: `0x25 0x50 0x44 0x46` (`%PDF-`)
   - Cualquier archivo ejecutable o script renombrado (`.exe`, `.sh`, `.php`, macros) es descartado con HTTP 422.
2. **Límite Estricto de Tamaño**:
   - Cuota de 10 MB acotada por `leerFormularioLimitado` (HTTP 413 si excede) que impide bombas de descompresión (zip bombs).
3. **Aislamiento de Storage y Servido No Ejecutable**:
   - Bucket privado `documentos-identidad` con RLS estricto (`auth.uid()`).
   - Servido mediante URLs firmadas con TTL de 900 s (15 min) y cabeceras `X-Content-Type-Options: nosniff` y `Content-Disposition: inline/attachment` desde dominio CDN aislado, anulando el riesgo de XSS en el origen `ruum.mx`.
4. **Hook Asíncrono para Escaneo de Fondo**:
   - Integración desacoplada para análisis posterior con AWS GuardDuty Malware Protection / VirusTotal API. Si se detecta una amenaza, el registro se marca como `'rechazado'` y se encola para destrucción inmediata en el outbox.
