# Contrato de Saga y Compensación KYC — Flujo 5: Verificación de Identidad

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
