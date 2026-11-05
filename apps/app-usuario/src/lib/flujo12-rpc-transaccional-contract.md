# Contrato de RPC Transaccional y Control de Concurrencia Optimista (Flujo 12)
**Identificador**: `RUUM-CONTRATO-F12-RPC-TRANSACCIONAL`  
**Ticket**: `RUUM-USR-F12-001` (Condición Bloqueante CB-1)  
**Versión**: `1.0.0`  
**Fecha**: `2026-11-04`  
**Estado**: `APROBADO_EN_CONTRATO`

---

## 1. Contexto y Propósito

Anteriormente, la actualización de datos personales en la App Usuario (`DatosPersonales.tsx`) realizaba dos mutaciones separadas e independientes:
1. `actualizarPerfilUsuario()` para campos generales (`nombre`, `telefono`, `pais`, `estado`, `ciudad`, `colonia`, `calle`, `numero`, `codigo_postal`, `referencias`, `direccion_principal`).
2. `actualizarFechaNacimientoUsuario()` para `fecha_nacimiento`.

Esta separación causaba estados parciales inconsistentes si la segunda llamada fallaba (por validación de edad, interrupción de red o fallo en backend), informando al usuario un "guardado parcial" engañoso. Asimismo, no existía control de concurrencia optimista, permitiendo que dos pestañas o sesiones sobreescribieran silenciosamente los cambios del otro (*lost update*).

Este contrato formaliza la función RPC transaccional `usuario_actualiza_perfil_transaccional`, el bloqueo `FOR UPDATE`, el incremento de versión `version + 1`, el manejo del código `conflicto_version` (HTTP 409) y la integración con los flujos F1 (`sin_rol`) y F11 (DTOs filtrados).

---

## 2. Definición de la Función RPC Transaccional

### 2.1 Firma SQL (`public.usuario_actualiza_perfil_transaccional`)

```sql
create or replace function public.usuario_actualiza_perfil_transaccional(
  p_datos jsonb,
  p_version_esperada integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
```

### 2.2 Bloqueo y Transaccionalidad
- La función se ejecuta en una sola transacción PostgreSQL con nivel de aislamiento de transacción estándar.
- Ejecuta inmediatamente:
  ```sql
  select * into v_usuario from public.usuarios where id = v_usuario_id for update;
  ```
  Esto bloquea la fila del usuario exclusivamente durante la ejecución de la función, serializando escrituras concurrentes para el mismo usuario.
- Toda la mutación (campos de perfil, dirección y fecha de nacimiento) se ejecuta en un bloque atómico: o todos los campos se persisten con éxito o se ejecuta rollback completo.

---

## 3. Control de Concurrencia Optimista (Versión)

1. **Columna de Versión**: La tabla `public.usuarios` cuenta con la columna `version integer not null default 1`.
2. **Validación de Versión**:
   - Si `p_version_esperada` es proporcionada por el cliente y `v_usuario.version is distinct from p_version_esperada`, la función levanta de inmediato una excepción explícita:
     ```sql
     raise exception 'conflicto_version: El perfil fue modificado por otra sesión (versión actual %, esperada %)',
       v_usuario.version, p_version_esperada
       using errcode = 'P0001';
     ```
3. **Incremento Atómico**:
   - Al completar las validaciones de datos, la versión se incrementa automáticamente: `version = coalesce(v_usuario.version, 1) + 1`.
4. **Respuesta al Cliente**:
   - La RPC retorna un objeto JSON con:
     - `exito: true`
     - `version: v_nueva_version`
     - `usuario: <jsonb de los campos actualizados>`

### 3.1 Camino de Resolución y Acción de UI ante Conflicto (CB-1)
Ante un rechazo por `conflicto_version`:
1. **Acción de UI no destructiva**: La interfaz no se limita a mostrar un párrafo estático que deje varado al usuario.
2. **Botón de Sincronización In-Place**: Se despliega el control interactivo:
   `[Sincronizar versión más reciente y reintentar]` (`sincronizarDatosFrescos`).
3. **Flujo de Recuperación**:
   - Invoca `obtenerUsuarioActual(cliente)` para recuperar la fila más reciente en Postgres.
   - Sincroniza `version = usuarioFresco.version` en el estado local de React.
   - Actualiza los campos base del perfil y preserva los inputs que el usuario estuviera editando.
   - Limpia el mensaje de error de alerta (`setMensajeError(null)`) y remueve el estado de conflicto.
   - Emite feedback accesible en `role="status"`: *"Datos sincronizados con la versión más reciente del servidor (versión N). Ahora puedes volver a guardar."*.
   - Permite al usuario reenviar el formulario con la versión vigente sin recargar ciegamente la página completa (`router.refresh()`).

---

## 4. Validaciones Server-Side en la RPC

La RPC no confía en las validaciones del cliente e impone límites estrictos:
1. **Longitud de Cadenas**:
   - `nombre`: 1 a 120 caracteres.
   - `telefono`: máximo 20 caracteres (formato E.164 MX normalizado).
   - `pais`: máximo 60 caracteres.
   - `estado`: máximo 60 caracteres.
   - `ciudad`: máximo 80 caracteres.
   - `colonia`: máximo 80 caracteres.
   - `calle`: máximo 120 caracteres.
   - `numero`: máximo 30 caracteres.
   - `codigo_postal`: exactamente 5 dígitos (`^[0-9]{5}$`).
   - `referencias`: máximo 300 caracteres.
   - `direccion_principal`: máximo 500 caracteres.
2. **Edad Mínima**:
   - Si `fecha_nacimiento` está presente:
     - No puede ser futura (`fecha_nacimiento <= current_date`).
     - Requiere edad mínima de 18 años cumplidos calculados contra `current_date`:
       `age(current_date, v_fecha_nac) >= interval '18 years'`.
     - Si no cumple, genera excepción `edad_invalida: El usuario debe ser mayor de 18 años`.

---

## 5. Alineación con Otros Flujos Operativos

1. **Flujo 1 (Autenticación y `sin_rol`)**:
   - La función verifica que `auth.uid()` esté autenticado (`auth.uid() is null` -> excepción `no_autorizado`).
   - Admite usuarios con rol `sin_rol`, `personal` o cualquier rol operativo asignado, permitiendo actualizar datos personales básicos sin exigir rol avanzado.
2. **Flujo 11 (Cuenta y DTOs)**:
   - El payload retornado por la RPC respeta el DTO de perfil del Flujo 11, devolviendo únicamente campos de identidad y domicilio sin exponer RFC en bruto, VIN, o telemetría no solicitada.
