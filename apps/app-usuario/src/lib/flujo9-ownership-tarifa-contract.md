# Contrato de Ownership, Anti-IDOR y Enmascaramiento de Tarifa (Flujo 9)
**Código:** RUUM-CTR-F9-003  
**Ticket asociado:** RUUM-USR-F9-001 (CB-3, T9, T10, T11; CA-7, CA-8, CA-9)  
**Fecha:** 2026-11-04  
**Dueño:** Seguridad y Plataforma / Control de Acceso (`apps/app-usuario`)  
**Estado:** Aprobado y Vigente  

---

## 1. Contexto y Objetivos de Seguridad
El Pasaporte Digital contiene información sensible (PII, nombres de conductor, cliente, fotos del vehículo, domicilios y registros financieros).
Este contrato formaliza las tres defensas en profundidad del endpoint `/api/viajes/[id]/pasaporte`:
1. Repetición estricta de Ownership / RLS (Defensa Anti-IDOR).
2. Enmascaramiento de tarifa bajo modelo *Fail-Closed*.
3. Prevención de artefactos corruptos o con PII parcial ante fallos.

---

## 2. Repetición de Ownership y Anti-IDOR (CA-7)

El endpoint `/api/viajes/[id]/pasaporte` NO confía únicamente en las reglas de vista de base de datos; implementa una doble verificación a nivel de aplicación:
1. **Validación Sintáctica de UUID:**
   - La cadena `id` debe cumplir el patrón estándar `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`.
   - Si no cumple, responde `404 Not Found` de inmediato.
2. **Autenticación Obligatoria:**
   - Se consulta `cliente.auth.getUser()`. Si no hay sesión válida, responde `401 Unauthorized`.
3. **Resolución de Perfil de Usuario:**
   - Se obtiene el `perfilId` del usuario mediante `obtenerUsuarioIdPorAuth(cliente, user.id)`.
4. **Verificación Estricta de Titularidad:**
   - Se evalúa: `datos.pasaporte.usuario_id === perfil`.
   - Si la condición no se cumple o el registro no existe:
     - **Respuesta:** `404 Not Found` unificado con cuerpo `{ "error": "Traslado no encontrado." }`.
     - **Regla Anti-IDOR:** Nunca se responde `403 Forbidden` ni se revela si el folio existe para otro usuario.

---

## 3. Enmascaramiento de Tarifa Fail-Closed (CA-8)

### 3.1 Política
La tarifa (cotización, precio final y desglose de pagos) solo es visible para el titular de la cuenta, titular de la empresa corporativa o un administrador del sistema.

### 3.2 Evaluación de Permisos
1. Se invoca la función RPC de base de datos:
   ```ts
   const { data: tienePermiso, error: rpcError } = await cliente.rpc(
     "puede_ver_tarifa_traslado",
     { p_usuario_id: datos.pasaporte.usuario_id }
   );
   ```
2. **Regla Fail-Closed:**
   - El indicador `puedeVerTarifa` solo es `true` si:
     - No ocurrió error de RPC (`!rpcError`).
     - El valor devuelto es estrictamente `data === true`.
   - Si ocurre una excepción de red, timeout, o fallo de base de datos en el bloque `try/catch`:
     - Se registra advertencia estructurada: `verificar_tarifa_fallido_fail_closed`.
     - `puedeVerTarifa` se fuerza a `false`.
3. **Comportamiento en el PDF:**
   - Si `puedeVerTarifa === false`:
     - Se omite por completo `p.precio_cotizado`, `p.precio_final` y `p.monto_pagado`.
     - Se omiten todos los registros del arreglo `datos.pagos`.
     - Se imprime una leyenda formal:  
       > *"Información tarifaria y de pagos reservada para el titular o no disponible."*

---

## 4. Comportamiento ante Fallo y Prevención de Fugas de PII (CA-9)

1. Si la generación del PDF falla en cualquier etapa previa a su completitud:
   - Se atrapa en el bloque `catch` del endpoint.
   - Si es saturación de semáforo: `503 Service Unavailable` con cabecera `Retry-After: 5`.
   - Si es fallo inesperado: `503 Service Unavailable` con `{ "error": "No pudimos generar el pasaporte completo." }`.
   - Cabecera: `Cache-Control: private, no-store`.
   - **Garantía:** No se transmite ningún flujo parcial de bytes PDF. El cliente nunca recibe un documento a medio renderizar con datos o PII inconsistentes.
