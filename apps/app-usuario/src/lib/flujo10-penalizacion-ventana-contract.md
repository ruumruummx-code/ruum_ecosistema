# Contrato de Penalizaciones, Ventana de 72h y Ownership (Flujo 10 - Acciones del Traslado)

## 1. Identificación y Objetivos
- **Ticket**: RUUM-USR-F10-001
- **Condición Bloqueante**: CB-3
- **Componente**: App Usuario — Flujo 10 Acciones del Traslado (`flujo10-transiciones-policy.ts`, `CancelarTraslado.tsx`, `packages/api/src/services/traslados.ts`, `packages/api/src/services/disputas.ts`, `packages/shared/src/rules/sla-disputas.ts`)
- **Problema previo**: Reglas de cancelación ambiguas, cálculo inexacto o sin soporte de excepciones formales (demora de conductor >45m o incidente mecánico), ausencia de zona horaria canónica explícita en la ventana de 72 horas para calificaciones y disputas, y falta de verificación repetida de ownership en cada mutación de usuario.

---

## 2. Contrato de Cancelación y Tramos de Penalización

El cálculo formal se ejecuta mediante `calcularPenalizacionCancelacionF10`:

| Estado de Asignación / Ventana Pre-Servicio | Porcentaje de Penalización | Reembolso al Usuario |
| :--- | :--- | :--- |
| **Sin conductor asignado** | **0%** | **100%** |
| Conductor asignado, **≥ 6 horas** previas | **20%** | **80%** |
| Conductor asignado, **4 horas a < 6 horas** | **35%** | **65%** |
| Conductor asignado, **2 horas a < 4 horas** | **50%** | **50%** |
| Conductor asignado, **< 2 horas** | **75%** | **25%** |
| **Conductor en sitio de origen / llegada** | **100%** | **0%** |

### Aritmética y Redondeo:
- Redondeo aritmético estándar a **2 decimales** (`Math.round((monto + Number.EPSILON) * 100) / 100`).

---

## 3. Protocolo de Acreditación de Excepciones Formales (Exoneración al 100%)

Existen dos excepciones formales que anulan cualquier penalización reduciendo la retención a **$0.00 MXN (0%)** y garantizando el reembolso del **100%**:

### 3.1. Excepción 1: Demora del Conductor > 45 Minutos (`retraso_conductor`)
- **Causal**: El conductor no se presentó en el punto de recolección dentro de los 45 minutos posteriores al horario pactado de inicio.
- **Validación**: Cotejo automático con la hora pactada (`hora_programada`) vs. timestamp actual y telemetría de arribo del conductor. Si no existe marca de llegada en sitio a los 45 minutos, se aplica exoneración inmediata al 100%.

### 3.2. Excepción 2: Falla Mecánica o de Seguridad Vehicular (`incidencia_mecanica`)
Para evitar abusos y cancelaciones fraudulentas de último momento argumentando desperfectos inexistentes, la exoneración cautelar del 100% exige cumplimiento estricto del protocolo probatorio definido en `validarAcreditacionFallaMecanica`:

#### Requisitos Probatorios Obligatorios:
1. **Canal A: Validación por Incidencia Previa en Torre de Control (`incidenciaPreviaId`)**:
   - Si el conductor o el despachador de torre de control ya levantaron previamente una incidencia de siniestro o falla mecánica en la plataforma (`incidencias.tipo = 'falla_mecanica'`), la excepción se considera **pre-acreditada de pleno derecho** y se exonera de forma instantánea al cancelar.
2. **Canal B: Declaración de Usuario con Evidencia Técnica en Tiempo Real**:
   - Si el reporte es iniciado por el usuario al cancelar la orden, la carga de la prueba requiere:
     a) **Descripción técnica detallada (`descripcion`)**: Explicación con un mínimo de **20 caracteres** precisando el fallo físico o funcional (ej. *"Fuga abundante de líquido de frenos con pedal suelto al arranque en frío"*). Descripciones ambiguas o telegráficas ("se rompió", "no prende") son rechazadas.
     b) **Evidencia fotográfica verificable (`fotosUrls`)**: Mínimo **1 URL de fotografía** legible subida al storage oficial de evidencias de RUUM, demostrando la avería, tablero de alertas o siniestro.
     c) **Geolocalización GPS (`ubicacionGps`)**: Coordenadas latitud/longitud del usuario al momento de la cancelación para verificar proximidad física con la ubicación del vehículo y del conductor asignado.

#### Comportamiento ante Evidencia Insuficiente:
- Si el usuario selecciona "Falla mecánica" pero omite la evidencia fotográfica o la descripción es menor a 20 caracteres:
  - La función `calcularPenalizacionCancelacionF10` **rechaza la exoneración automática** (`esExcepcion: false`).
  - Aplica la penalización correspondiente al tramo horario (ej. 75% o 100%).
  - Muestra al usuario el motivo específico del rechazo y le permite adjuntar las fotos o contactar a soporte para arbitraje manual posterior.

---

## 4. Contrato de Ventana de 72 Horas para Calificación y Disputas

1. **Zona Horaria Canónica**: `America/Mexico_City`.
2. **Momento de Inicio**: Fecha/hora formal de cierre del traslado (`cerrado_en`); en su defecto, fecha de última actualización del estado completado/finalizado (`actualizado_en`).
3. **Margen de Gracia Técnico**:
   - Duración base: **72.0 horas**.
   - Margen de gracia por sesgo de reloj NTP o latencia de red: **15 minutos (0.25 horas)** (`MARGEN_GRACIA_DISPUTA_HORAS`).
   - Límite absoluto estricto: **72.25 horas**.
4. **Comportamiento**:
   - `≤ 72.25 horas`: La acción (`calificar_conductor`, `abrir_disputa`) es **permitida**.
   - `> 72.25 horas`: **Rechazo explícito y fail-closed** con mensaje: *"La ventana de 72 horas para calificar o disputar este traslado ha expirado."*

---

## 5. Control de Acceso y Ownership Repetido en Cada Mutación (Anti-IDOR)

Para evitar brechas por ejecución directa contra APIs y RPCs, se aplica una doble barrera en la capa de aplicación previa a cualquier mutación:

1. **`aceptarCotizacionUsuario`**:
   - Verifica autenticación de sesión `getUser()`.
   - Consulta `traslados.usuario_id` y exige `traslado.usuario_id === authUserPerfilId`. Si difiere: error no autorizado / not found.
2. **`cancelarTraslado`**:
   - Verifica autenticación de sesión.
   - Exige pertenencia del traslado al usuario autenticado antes de calcular retenciones o invocar RPC.
3. **`crearCalificacion`**:
   - Verifica pertenencia estricta del traslado al usuario calificador.
   - Valida la ventana temporal de 72h + 15m.
4. **`abrirDisputa`**:
   - Verifica que el usuario que intenta registrar la disputa sea el titular del traslado (`traslado.usuario_id === usuarioId`) o el conductor asignado en su rol respectivo.
   - Rechaza con `403 Forbidden` / error de autorización si no coincide.
