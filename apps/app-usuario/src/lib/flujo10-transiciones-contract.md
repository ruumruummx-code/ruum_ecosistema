# Contrato de Máquina de Transiciones de Estado (Flujo 10 - Acciones del Traslado)

## 1. Identificación y Objetivos
- **Ticket**: RUUM-USR-F10-001
- **Condición Bloqueante**: CB-2
- **Componente**: App Usuario — Flujo 10 Acciones del Traslado (`flujo10-transiciones-policy.ts`, `AceptarCotizacion.tsx`, `CancelarTraslado.tsx`, `DetallesPasaporte.tsx`)
- **Problema previo**: Falta de matriz formal de transiciones en acciones de usuario. Si el estado del traslado estaba en `en_revision` (F8) o en un estado fuera de ciclo (p. ej. `cancelado` o `completado`), no existía control uniforme client/server que impidiera ejecutar acciones mutuamente excluyentes o prohibidas.

---

## 2. Matriz Completa Estado × Acción (Cobertura Exhaustiva)

La siguiente matriz gobierna **todas las combinaciones posibles** de estados válidos del ciclo de vida y las acciones operativas del usuario en Flujo 10. Toda celda con **Rechazo** arroja `TransicionInvalidaFlujo10Error` con código `TRANSICION_NO_PERMITIDA` (o `ESTADO_EN_REVISION`) y emite telemetría estructurada `transicion_invalida_rechazada` sin mutar la base de datos.

| Estado del Traslado | Aceptar Cotización (`aceptar_cotizacion`) | Pagar Traslado (`pagar_traslado`) | Cancelar Traslado (`cancelar_traslado`) | Calificar Conductor (`calificar_conductor`) | Abrir Disputa (`abrir_disputa`) | Reportar Incidencia (`reportar_incidencia`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`solicitud_creada` / `borrador`** | ❌ **Rechazo**: Cotización aún no generada | ❌ **Rechazo**: No existe importe liquidable | ✅ **Permitido**: Cancelación libre (0% cargo) | ❌ **Rechazo**: Servicio no iniciado | ❌ **Rechazo**: Servicio no iniciado | ❌ **Rechazo**: Sin asignación operativa |
| **`cotizacion_generada`** | ✅ **Permitido**: Transiciona a `cotizacion_aceptada` | ❌ **Rechazo**: Debe aceptar cotización antes | ✅ **Permitido**: Cancelación libre (0% cargo) | ❌ **Rechazo**: Servicio no iniciado | ❌ **Rechazo**: No procede disputa pre-servicio | ❌ **Rechazo**: Sin conductor asignado |
| **`en_revision` (F8)** | 🛑 **Fail-Closed**: Bloqueado por auditoría | 🛑 **Fail-Closed**: Bloqueado por auditoría | 🛑 **Fail-Closed**: Bloqueado por auditoría | 🛑 **Fail-Closed**: Bloqueado por auditoría | 🛑 **Fail-Closed**: Bloqueado por auditoría | 🛑 **Fail-Closed**: Bloqueado por auditoría |
| **`cotizacion_aceptada` / `pago_pendiente`** | 🔄 **Idempotente**: Ya aceptada (no error) | ✅ **Permitido**: Procesa pago anticipado | ✅ **Permitido**: Cancelación (0% sin conductor) | ❌ **Rechazo**: Servicio no realizado | ❌ **Rechazo**: No procede disputa sin cobro/cierre | ❌ **Rechazo**: Sin viaje en curso |
| **`servicio_confirmado` / `pagado`** | 🔄 **Idempotente**: Servicio ya firme | 🔄 **Idempotente**: Pago ya acreditado | ✅ **Permitido**: Aplica penalización por tramos | ❌ **Rechazo**: Conductor aún no completa servicio | ❌ **Rechazo**: Usar cancelación o reporte | ❌ **Rechazo**: Esperar asignación en ruta |
| **`conductor_asignado` / `en_camino`** | ❌ **Rechazo**: Contrato ya firmado | 🔄 **Idempotente**: Pago ya cubierto | ✅ **Permitido**: Aplica penalización horaria (o 0% por demora) | ❌ **Rechazo**: Viaje no concluido | ❌ **Rechazo**: Se resuelve vía cancelación o soporte | ✅ **Permitido**: Reporta retraso o anomalía |
| **`conductor_en_punto_de_recoleccion`** | ❌ **Rechazo**: Operación en sitio | 🔄 **Idempotente**: Pago ya cubierto | ✅ **Permitido**: Aplica 100% penalización (o 0% por falla mecánica) | ❌ **Rechazo**: Viaje no concluido | ❌ **Rechazo**: Incidencia operativa | ✅ **Permitido**: Reporta anomalía física |
| **`traslado_en_curso` / `en_transito`** | ❌ **Rechazo**: Viaje activo | ❌ **Rechazo**: Sin cargos adicionales | ❌ **Rechazo**: Cancelación unilateral prohibida en ruta | ❌ **Rechazo**: Viaje aún no cerrado | ❌ **Rechazo**: Reportar vía incidencia en ruta | ✅ **Permitido**: Reporta desvío, auxilio o siniestro |
| **`servicio_cerrado` / `completado`** | ❌ **Rechazo**: Viaje concluido | 🔄 **Idempotente**: Liquidado | ❌ **Rechazo**: Servicio ya prestado | ✅ **Permitido**: Dentro de ventana 72h (+15m) | ✅ **Permitido**: Dentro de ventana 72h (+15m) | ❌ **Rechazo**: Utilizar disputa post-cierre |
| **`servicio_cancelado` / `cancelado`** | ❌ **Rechazo**: Registro cancelado | ❌ **Rechazo**: Registro cancelado | 🔄 **Idempotente**: Ya cancelado | ❌ **Rechazo**: Servicio no ejecutado | ✅ **Permitido**: Inconformidad con retención (72h) | ❌ **Rechazo**: Viaje no activo |
| **Estado desconocido o anómalo** | 🛑 **Fail-Closed**: Bloqueado categóricamente | 🛑 **Fail-Closed**: Bloqueado categóricamente | 🛑 **Fail-Closed**: Bloqueado categóricamente | 🛑 **Fail-Closed**: Bloqueado categóricamente | 🛑 **Fail-Closed**: Bloqueado categóricamente | 🛑 **Fail-Closed**: Bloqueado categóricamente |

---

## 3. Justificación de Estados Críticos

1. **`cancelar_traslado` en `traslado_en_curso`**:
   - Una vez que la unidad ha recibido el vehículo y está rodando sobre autopista o vía urbana, el usuario **no puede cancelar de manera unilateral e inmediata desde la app**, por seguridad vial y responsabilidad de custodia. Se rechaza con instrucción de contactar a soporte o reportar incidencia.
2. **`calificar_conductor` en cualquier estado distinto a `servicio_cerrado`**:
   - Para salvaguardar la objetividad de la reputación de conductores, no se permite calificar traslados cancelados, en proceso o nunca iniciados.
3. **`abrir_disputa` restringido a post-servicio y cancelación**:
   - Las disputas aplican únicamente sobre servicios concluidos (daños en unidad, cobros no reconocidos) o traslados cancelados con cargo de retención objetado. Durante el viaje se utiliza `reportar_incidencia`.
4. **Fail-Closed en `en_revision`**:
   - Un traslado en revisión se encuentra bajo arbitraje manual o investigación de seguridad. Ninguna mutación automática de cliente está autorizada.

---

## 4. Respuestas de Error y Códigos

Cuando una transición es rechazada, `exigirTransicionFlujo10` arroja:
- `error.codigo`: `"TRANSICION_NO_PERMITIDA"` o `"ESTADO_EN_REVISION"`.
- `error.accion`: Nombre de la acción intentada.
- `error.estadoActual`: Estado del traslado al momento del intento.
- `error.message`: Mensaje descriptivo humanizado para el usuario.
- Log emitido: `[app-usuario:flujo10/transiciones] transicion_invalida_rechazada`.
