# 05 · Resto del flujo del conductor

**Depende de:** pasos 01 y 04. **Rama:** `feat/diseno-05-flujo-conductor`.

## Objetivo
Extender la variante `minimal` de `TripStage` a las demás etapas y revisar las pantallas propias (verificación, cierre) con el mismo lenguaje.

## Alcance (archivos verificados en `apps/app-conductor/src/app/viajes/[id]/`)
`OpportunityDetailsView.tsx`, `TrasladoAsignadoDetails.tsx`, `DirigeteAOrigenDetails.tsx`, `LocalizarVehiculoDetails.tsx`, `IniciaTrayectoDetails.tsx`, `TripStatusSummary.tsx`, `CierreTrasladoDetails.tsx`, `cierre/*`, `incidencia/IncidenciaModal.tsx`, `TripDialog.tsx`.
Y la lista de viajes (`apps/app-conductor/src/app/viajes/`).

## Qué hacer
1. Pasar `minimal` a las etapas que usan `TripStage` (una por commit) y ajustar el CSS solo si hace falta.
2. Verificación del vehículo (VIN y placas): campos de subrayado, datos en IBM Plex Mono.
3. Cierre: resumen limpio con "Depósito programado" como cifra protagonista (solo con datos oficiales).
4. Incidencias y motivos de rechazo: listas simples de una columna con filas ≥ 56 px.

## Criterios de aceptación por pantalla

### Disponible / detalle de oferta (`OpportunityDetailsView`)
- [ ] Ruta origen → destino como protagonista; "Ganancia" visible y con el valor oficial (o "Por confirmar").
- [ ] Dos acciones: aceptar (principal) y rechazar (discreta). Rechazar pide uno de los 6 motivos existentes.
### Prepara la recogida (`TrasladoAsignadoDetails`, estado "Asignado")
- [ ] Un protagonista (punto de recogida), una acción principal.
### Ve al punto de recogida (`DirigeteAOrigenDetails`, "En camino al origen")
- [ ] Dirección grande, "Navegar" a un toque, confirmación de llegada como acción principal.
### En el origen / verificación (`LocalizarVehiculoDetails`)
- [ ] VIN y placas con campos de subrayado y fuente mono; validación con texto de error.
- [ ] Estados "Verificación del vehículo", "Registro inicial pendiente" y "En el origen" conservan su etiqueta.
### Recepción e inicio (`IniciaTrayectoDetails`)
- [ ] Siguen siendo **dos decisiones separadas** ("Confirmar recepción" → "Iniciar traslado") y una llamada por pulsación (lo prueba el e2e).
### Cierre (`CierreTrasladoDetails` y `cierre/*`)
- [ ] "Revisar y finalizar" lleva a `?cierre=1`; los estados terminales no muestran acciones de avance.
- [ ] Pantalla de éxito (`CierreExitoPantalla`) con resultado, pago como "Depósito programado" y una sola acción.
### Incidencia (`IncidenciaModal`)
- [ ] Hoja inferior con los 12 tipos de incidencia existentes, prioridad intacta, filas ≥ 56 px.
### Lista de viajes
- [ ] Pestañas Disponibles / Mis Traslados / Historial; grupos En curso, Próximos, Por cerrar con el glosario de marca.

## Criterios globales
- [ ] `stages.spec.ts` y `shell.spec.ts` en verde sin editar sus expectativas (solo se permite **agregar** pruebas).
- [ ] Verificación común del documento 00 en verde.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 05. Trabaja pantalla por pantalla en el orden del documento,
un commit por pantalla, solo presentación. Después de cada pantalla, corre los e2e de
apps/app-conductor y revisa los criterios en 320 y 390 px, claro, oscuro y modo calle.
No avances a la siguiente si algo falla. No modifiques expectativas de pruebas existentes.
```
