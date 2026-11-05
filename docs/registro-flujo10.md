# Expediente de Implementación y Remediación — Flujo 10: Acciones del Traslado

- **Ticket**: RUUM-USR-F10-001
- **Componente**: App Usuario — Flujo 10 Acciones del Traslado
- **Fecha**: 2026-11-04
- **Estado**: Cerrado Definitivo (Condiciones de Cierre Cumplidas)
- **Condiciones Bloqueantes Atendidas**: CB-1, CB-2, CB-3
- **Criterios de Aceptación Cumplidos**: CA-1 al CA-10
- **Zona Horaria Canónica**: `America/Mexico_City`

---

## 1. Resumen Ejecutivo de la Remediación y Condiciones de Cierre

El Flujo 10 controla las mutaciones del ciclo de vida del traslado: aceptación de cotización, pago con tarjeta o transferencia, cancelación, calificación del conductor, apertura de disputas y reporte de incidencias.

### Resolución de Condiciones de Cierre:
1. **Comportamiento posterior al estado honesto (CB-1)**:
   - Resuelto en código y contrato. Cuando la UI entra en `conciliacion_pendiente` (>18s), el estado **no es terminal**.
   - Se mantiene un **polling pasivo en segundo plano cada 10s**.
   - El canal WebSocket de **Supabase Realtime** permanece activo escuchando eventos de la fila en base de datos.
   - El usuario cuenta con el botón interactivo **"Comprobar estado ahora"**.
   - Se añade aviso explícito de que el reconciliador durable despachará notificación por correo electrónico y push al confirmarse.
   - Enlace directo a `/soporte?motivo=pago_en_conciliacion`.
   - **Invariante**: Se garantiza que la pantalla **NUNCA** revierte al formulario de pago ni muestra "Pago pendiente" con importe a cobrar.

2. **Rate limit del endpoint `estado-pago` (CB-1)**:
   - Se integró `rateLimitConVentana` con clave `uid:${user.id}:pago:${id}` sobre Upstash Redis.
   - Límite fijado en **30 peticiones por minuto**, suficiente para el polling exponencial (4 req/18s) y el polling pasivo (6 req/min), mientras protege la infraestructura contra abusos. Retorna HTTP 429 con `Retry-After`.

3. **Matriz Estado × Acción Completa (CB-2)**:
   - Se documentó la matriz bidimensional completa en `flujo10-transiciones-contract.md` cubriendo todos los estados conocidos del ciclo (`solicitud_creada`, `cotizacion_generada`, `en_revision`, `cotizacion_aceptada`, `servicio_confirmado`, `conductor_asignado`, `en_punto_de_recoleccion`, `traslado_en_curso`, `servicio_cerrado`, `servicio_cancelado`, `desconocido`) frente a todas las acciones de usuario.
   - Se agregaron aserciones en pruebas unitarias verificando rechazos específicos entre estados válidos y acciones no autorizadas.

4. **Acreditación de Excepción por Falla Mecánica (CB-3)**:
   - Se formalizó la función `validarAcreditacionFallaMecanica` y la interfaz `EvidenciaFallaMecanica`.
   - Para exonerar una penalización de cancelación al 0% bajo causal mecánica, se exige:
     a) Incidencia previa generada por torre de control o conductor (`incidenciaPreviaId`), o bien
     b) Declaración de usuario con descripción técnica (mínimo 20 caracteres), al menos 1 fotografía de la avería/unidad (`fotosUrls`), y geolocalización GPS (`ubicacionGps`).
   - Si la evidencia no cumple los requisitos, la exoneración cautelar es denegada y se aplica la penalización horaria estándar.

5. **Auto-contención de la Evidencia de Staging**:
   - `docs/evidence/F10-staging-20261104.md` contiene datos crudos completos: respuestas HTTP JSON, números precisos de penalización ($1,250.50 MXN), payloads de excepciones mecánicas y de demora, headers de rate limit y trazas de tiempo de la ventana de 72h con margen de gracia de 15 min.

---

## 2. Cobertura de Pruebas Automatizadas

```
✓ apps/app-usuario:
  - src/lib/flujo10-transiciones-policy.test.ts (14 tests)
  - src/app/viajes/[id]/PagoTraslado.test.tsx (4 tests)
  - src/app/api/viajes/[id]/estado-pago/route.test.ts (8 tests)
  - src/app/viajes/[id]/CancelarTraslado.test.tsx (3 tests)
  - src/app/viajes/[id]/DetallesPasaporte.test.tsx (6 tests)
  Total: 35 tests pasados en apps/app-usuario.

✓ packages/api:
  Total: 351 tests pasados en 50 archivos.

✓ packages/shared:
  Total: 312 tests pasados en 44 archivos.
```
