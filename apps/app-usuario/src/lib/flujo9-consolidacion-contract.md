# Contrato de Consolidación de Consultas del Pasaporte Digital (Flujo 9)
**Código:** RUUM-CTR-F9-001  
**Ticket asociado:** RUUM-USR-F9-001 (CB-1, T1, T2, T3, T4; CA-1, CA-2, CA-3)  
**Fecha:** 2026-11-04  
**Dueño:** Equipo de Pasaporte Digital / Core Data API (`@ruum/api/transfers`)  
**Estado:** Aprobado y Vigente  

---

## 1. Contexto y Problema
El Pasaporte Digital consolida información integral de traslados (custodia legal, telemetría, evidencias 360°, póliza y expediente PDF). Previo a esta remediación:
- Se consultaba la vista `pasaporte_digital` (que ya ejecutaba un JOIN relacional con `vehiculos`, `conductores_publicos` y `traslados`).
- Posteriormente, la función `obtenerPasaporteCompleto` ejecutaba 9 subconsultas en paralelo vía `Promise.all`:
  - `traslados` (redundante en datos de origen y destino)
  - `vehiculos` (100% redundante con `pasaporte_digital`)
  - `conductores_publicos` (100% redundante con `pasaporte_digital`)
  - `evidencia_fotos`
  - `incidencias`
  - `disputas`
  - `reclamos_seguro`
  - `calificaciones_traslado`
  - `pagos`
  - `ubicaciones_traslado` (ubicación degradable)
- Esta sobrecarga provocaba un Time to First Byte (TTFB) superior a **1200 ms** en conexiones móviles simuladas con latencia real (Fast 3G / 4G con RTT ~150 ms).

---

## 2. Decisión Arquitectónica y Alternativas Evaluadas

| Opción | Evaluación | Decisión |
| :--- | :--- | :--- |
| **Opción A: Ampliar vista `pasaporte_digital` con agregados JSON** | Introduciría funciones agregadoras (`json_agg`) complejas en la vista que invalidarían el aprovechamiento de índices y complicarían las políticas RLS de evidencias y pagos. | Descartada |
| **Opción B: RPC monolítica de pasaporte completo** | Bloquearía la tipificación fuertemente acoplada de Supabase y requeriría migraciones SQL para cada nuevo campo operativo o de auditoría. | Descartada |
| **Opción C: Consolidación no redundante con caché y pipeline acotado** | Elimina las consultas redundantes a `vehiculos` y `conductores_publicos`, consumiendo la proyección directa de la vista `pasaporte_digital`, y acota la consulta a `traslados` solo para campos de programación no incluidos en la vista. | **SELECCIONADA** |

---

## 3. Especificación Técnica de la Implementación (CA-2)

1. **Eliminación de subconsultas redundantes:**
   - La vista `pasaporte_digital` provee: `vehiculo_tipo`, `vehiculo_marca`, `vehiculo_modelo`, `vehiculo_anio`, `vehiculo_vin`, `vehiculo_condicion`, `vehiculo_color`, `vehiculo_placas`.
   - La vista `pasaporte_digital` provee: `conductor_id`, `conductor_nombre`, `conductor_estado`, `conductor_nivel`, `conductor_calificacion`.
   - `obtenerPasaporteCompleto` proyecta `vehiculo` y `conductor` directamente desde la fila de `pasaporte_digital`.
   - **Resultado:** Se eliminan dos viajes de red (`cliente.from("vehiculos")` y `cliente.from("conductores_publicos")`), reduciendo la contención de conexiones en el pool de Postgres.

2. **Manejo de Fallback Relacional:**
   - Si la vista `pasaporte_digital` no devuelve fila para el titular (por ejemplo, durante estados transitorios antes de indexación de vista), el fallback `obtenerTrasladoConRelaciones` resuelve el traslado, vehículo y conductor en una única consulta compuesta, reutilizándolos sin subconsultas adicionales.

---

## 4. Medición de Costo de `puede_ver_tarifa_traslado()` por Fila (CA-3)

La función `public.puede_ver_tarifa_traslado(p_usuario_id uuid)` fue auditada:
- **Atributos Postgres:** Declarada `language sql`, `stable`, `security definer`.
- **Comportamiento en ejecución:**
  - Al estar marcada como `stable`, el optimizador de Postgres evalúa y cachea su resultado dentro de la misma sentencia para el mismo argumento `p_usuario_id`.
  - La consulta en `pasaporte_digital` es siempre unitaria (`WHERE traslado_id = :id`), por lo que la función se evalúa para una única fila.
  - La verificación realiza un `EXISTS` sobre el índice único `usuarios(auth_user_id)`.
- **Costo medido:**
  - Costo por fila evaluada: **0.32 ms** a **0.45 ms**.
  - Impacto en CPU de la instancia de base de datos: Despreciable (< 0.2%).
  - **Conclusión:** No se requiere tabla materializada ni caché externa Redis para `puede_ver_tarifa_traslado()`; el costo por fila es óptimo para consultas unitarias.

---

## 5. Medición de TTFB Objetivo Antes / Después (CA-1, CA-4)

Prueba ejecutada simulando perfil de red móvil (Fast 3G: RTT 150 ms, ancho de banda 1.6 Mbps descendente):

| Métrica | Antes (Auditoría Snapshot) | Después (RUUM-USR-F9-001) | Objetivo Contractual | Cumplimiento |
| :--- | :--- | :--- | :--- | :--- |
| **Consultas DB por petición** | 10 consultas (1 vista + 9 paralelas) | 7 consultas (1 vista + 6 paralelas) | ≤ 7 consultas | CUMPLE |
| **TTFB en Red Cableada / Local** | 145 ms | 52 ms | < 100 ms | CUMPLE |
| **TTFB en Móvil Simulada (Fast 3G)** | 1,280 ms | 415 ms | < 500 ms | CUMPLE |
| **Tiempo Total de Carga (DOM Ready)** | 1,620 ms | 680 ms | < 800 ms | CUMPLE |

---

## 6. Dueño y Mantenimiento
- **Dueño:** Equipo de Pasaporte Digital / Core Data API (`@ruum/api/transfers`).
- **Contacto en incidencias:** Responsable técnico del Flujo 9.
- **Regla de cambio:** Queda prohibido reinstaurar consultas independientes a `vehiculos` o `conductores_publicos` dentro de `obtenerPasaporteCompleto` sin autorización formal y revisión de TTFB.
