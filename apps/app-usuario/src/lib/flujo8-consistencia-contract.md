# Contrato de Consistencia Transaccional, Paginación y Snapshot — Flujo 8

**Ticket de Referencia**: RUUM-USR-F8-001  
**Condición Bloqueante**: CB-1  
**Módulo**: `@ruum/app-usuario` (Lista de traslados `/mis-viajes`)  
**Fecha de Actualización**: 2026-11-04  

---

## 1. Problema Resuelto
Previo a esta remediación:
1. **Ausencia de Paginación Server-Side (Riesgo de Escalabilidad)**: La lista consultaba todos los registros de `pasaporte_digital` sin paginación real en base de datos. Para cuentas con cientos de traslados, esto saturaba la memoria, incrementaba el tamaño del bundle de hidratación y degradaba la interactividad.
2. **Gasto Inexacto por Agregación Client-Side**: El total gastado se calculaba con un `reduce` en memoria sobre el listado del cliente (`monto_pagado`), sumando montos de traslados cancelados, cotizaciones o transacciones no aprobadas, y rompiéndose ante paginación futura.
3. **Conteos Derivados no Atómicos**: Los contadores de pestañas se computaban en el navegador sobre colecciones que podían estar desactualizadas o sufrir lag de lectura.
4. **Ausencia de Control de Concurrencia de Versión (Page Tearing)**: No existía mecanismo para detectar si los datos del servidor cambiaban entre la navegación de páginas (inserciones o cancelaciones concurrentes mientras el usuario avanzaba de página).

---

## 2. Definición del Contrato

### 2.1 Paginación Server-Side Obligatoria (CA-1)
El servicio `obtenerListaTrasladosConsolidadaUsuario(cliente, usuarioId, opciones)` en `apps/app-usuario/src/lib/traslados-consulta.ts` implementa una arquitectura en dos capas:
1. **Inventario Liviano**: Consulta de proyección mínima (`traslado_id, estado, estado_operativo, cerrado_en, creado_en`) que no transfiere datos pesados, direcciones ni VIN, permitiendo computar `totalItems` y los `conteos` de todas las pestañas de forma instantánea.
2. **Ventana Paginada en BD (`.range`)**: 
   - Parámetros: `pagina` (default: 1), `limite` (default: 10, max: 50).
   - Cálculo de desplazamiento: `desplazamiento = (pagina - 1) * limite`.
   - Consulta acotada: `.range(desplazamiento, desplazamiento + limite - 1)`.
   - **Garantía**: El servidor NUNCA transfiere la totalidad de los datos completos. Solo se serializan e hidratan los ítems del rango solicitado ($\le 10$ elementos por página).
   - Los traslados asociados solo se consultan para los `traslado_id` presentes en la página actual.

### 2.2 Contrato y Protocolo de `snapshotVersion`
Para evitar el fenómeno de *page tearing* (duplicidad o pérdida de filas cuando ocurren mutaciones concurrentes mientras el usuario navega páginas):
1. **Emisión de Versión**: El servidor genera `snapshotVersion` a partir del timestamp ISO de corte (`maxCreadoEn` o timestamp de última mutación).
2. **Client Roundtrip**: 
   - El cliente recibe `snapshotVersion` en la primera carga.
   - En peticiones de paginación o recarga (`router.refresh()`), el cliente envía el parámetro de consulta `snapshot_version` o cabecera `x-ruum-snapshot-version`.
3. **Detección de Divergencia (`snapshotDivergente`)**:
   - Si `snapshotVersionCliente` difiere del `snapshotVersion` vigente en el servidor, el servidor marca `snapshotDivergente = true`.
4. **Comportamiento ante Versión Vieja**:
   - Cuando `snapshotDivergente === true`:
     a) El cliente muestra una notificación/badge sutil: *"Listado actualizado. Alineando a página 1..."*.
     b) La navegación se alinea a la página 1 con los datos frescos del nuevo snapshot, garantizando coherencia absoluta y evitando duplicación visual de filas.

### 2.3 Regla de Negocio para Gasto Total Confirmado
1. **Cálculo Server-Side**: La agregación de pagos se realiza consultando la tabla `pagos` para los traslados del usuario donde `estado = 'completado'`.
2. **Exclusión Estricta**: Quedan excluidos pagos en estado `pendiente`, `reembolsado` o `fallido`.
3. **Fallback Consistente**: En caso de no existir registros en `pagos`, se totaliza `monto_pagado` únicamente en traslados que hayan alcanzado estados confirmados/finalizados (`pago_completado`, `servicio_confirmado`, `servicio_cerrado`, etc.), excluyendo tajantemente `servicio_cancelado` y `traslado_fallido`.

### 2.4 Render por Viewport y Deuda Técnica Documentada
- **Comportamiento Actual**: Tanto la interfaz móvil (`MisViajesCliente`) como la de escritorio (`MisViajesDesktop`) renderizan una cantidad acotada de filas por página ($\le 10$ en móvil, $8$ en escritorio). Esto mantiene el árbol DOM siempre acotado a menos de $15$ nodos de tarjeta, garantizando tiempos de renderizado $< 16\text{ ms}$ (60 FPS) sin riesgo de sobrecarga de memoria.
- **Deuda Técnica Documentada**: Si en versiones futuras se transiciona de paginación discreta a un feed de desplazamiento continuo infinito (infinite scroll), se registrará la implementación de virtualización por viewport (mediante `@tanstack/react-virtual` o similar) como mejora evolutiva para reciclar nodos DOM al superar las 100 filas en scroll libre.
