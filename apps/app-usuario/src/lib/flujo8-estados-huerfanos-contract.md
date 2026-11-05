# Contrato de Estados, Huérfanos y Alineación Transversal (F10 / F13) — Flujo 8

**Ticket de Referencia**: RUUM-USR-F8-001  
**Condición Bloqueante**: CB-2  
**Módulo**: `@ruum/app-usuario` (Política de estados `estados-traslado-policy.ts`)  
**Fecha de Actualización**: 2026-11-04  

---

## 1. Problema Resuelto
1. **Fail-Open de clasificación**: La función `pestañaDeViaje` en `useGestionTraslados.ts` contenía como rama final `return "activos"`. Cualquier estado inesperado, anómalo o de fallo caía silenciosamente en la pestaña "En curso" (Activos), ocultando anomalías operativas.
2. **Pasaportes huérfanos sin traslado**: Si un pasaporte digital no tenía `traslado_id` asociado o no resolvía a un traslado en base de datos, el sistema renderizaba tarjetas incompletas, enlaces rotos hacia `/viajes/null` o comportamientos indeterminados.
3. **Desalineación transversal con F10 y F13**: Flujo 10 (acciones operativas como disputas y cancelaciones) y Flujo 13 (facturación fiscal) carecían de un contrato unificado para inhibir operaciones sobre traslados en estados corruptos o en verificación técnica.

---

## 2. Definición del Contrato

### 2.1 Fuente de Verdad Única de Plataforma (`estados-traslado-policy.ts`)
La tabla de verdad y clasificador en `estados-traslado-policy.ts` constituye la fuente de verdad canónica de toda la plataforma web de usuario para mapear los 34 estados del PRD §6:
1. **Cierre Operativo**: Si `cerrado_en` está presente o `estadoOperativo === 'closed'`, clasifica como `"finalizados"`.
2. **Tabla Canónica**: Se contrasta contra `MAPEO_ESTADOS_CANONICOS`.
3. **Fail-Closed**: Si el estado no está en el mapa, o es nulo/vacío:
   - Se emite un log estructurado `logStructuredWarn('estados-policy', 'estado_desconocido_fail_closed', ...)`.
   - Se retorna categóricamente `"en_revision"`.
   - **Invariante**: Un estado desconocido NUNCA clasifica como `"activos"`.

### 2.2 Tratamiento de Pasaportes Huérfanos
Evaluado mediante `evaluarConsistenciaPasaporte(pasaporteId, tieneTraslado, ...)`:
- Si `tieneTraslado === false`:
  - `esHuerfano = true`.
  - `categoria = "en_revision"`.
  - `etiquetaEstado = "En verificación técnica"`.
  - `requiereAtencionSoporte = true`.
  - Se registra telemetría estructurada `pasaporte_huerfano_detectado` con `pasaporteId` y `estado`.
  - En la interfaz (móvil y escritorio), el botón redirige al usuario a `/soporte?asunto=traslado_en_revision` con el texto "Atención técnica" o "Contactar soporte", eliminando enlaces rotos o errores 404/500.

### 2.3 Alineación Transversal con Flujo 10 (Acciones del Traslado)
Consumida mediante `puedeEjecutarAccionFlujo10(estado, estadoOperativo, cerradoEn, trasladoId)`:
- **Inhibición de Mutaciones**: Si un traslado está clasificado en `"en_revision"`, las acciones de cancelar, abrir disputa o reportar incidencia quedan estrictamente deshabilitadas.
- **Razón**: Si el estado es anómalo o técnico, una mutación operativa adicional podría agravar la inconsistencia de la saga. Se emite:
  > *"El traslado se encuentra en verificación técnica. Las acciones operativas están temporalmente suspendidas hasta su resolución por soporte."*

### 2.4 Alineación Transversal con Flujo 13 (Facturación Fiscal)
Consumida mediante `puedeFacturarFlujo13(estado, estadoOperativo, cerradoEn, trasladoId)`:
- **Requisito de Finalización**: Solo se permite la solicitud y timbrado de comprobante fiscal digital cuando `categoria === "finalizados"`.
- **Bloqueo en Revisión**: Si `categoria === "en_revision"`, la solicitud de factura fiscal se bloquea preventivamente:
  > *"Facturación fiscal temporalmente no disponible: el servicio se encuentra en verificación técnica."*
