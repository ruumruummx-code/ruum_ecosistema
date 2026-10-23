# UX-CND-02 — Auditoría operativa

Fecha: 23 de octubre de 2026. Viewport principal: 320 × 568, Chromium.

Validación: 11/11 casos operativos aprobados después de la revisión visual, 24/24 pruebas unitarias de lógica operativa, build y tipos correctos. La ejecución completa previa de UI aprobó 26/26 casos. Lint sin errores, con avisos existentes en otros componentes de viajes.

## Resultado del refinamiento

El layout de `/viajes/[id]` conserva el shell global y utiliza un contenedor de desplazamiento interno. La barra de seguridad permanece arriba y la acción principal de cada etapa permanece abajo, junto con el estado y los errores de la acción. Los diálogos nativos conservan el foco, permiten Escape y restauran el control que los abrió.

| Vista o estado | Comprobación |
| --- | --- |
| Oferta y asignación | Solicitud de asignación o inicio del camino al origen accesibles al desplazar todo el contenido. |
| Camino al origen | Llegada al origen y navegación rápida disponibles simultáneamente. |
| Verificación en origen | Continuar inspección visible sin buscar el botón al final de la ficha. |
| Traslado en curso | Llegada al destino disponible junto con los accesos rápidos. |
| Cierre | Confirmación de entrega en diálogo con acciones fuera del contenido desplazable. |
| Carga | Indicador de carga con regreso, soporte y emergencia disponibles. El fixture mantiene la respuesta pendiente hasta capturar el estado. |
| Error del traslado y de evidencia | Reintento y ayuda inmediatos, sin desplazamiento de la raíz. |
| Evidencia | Guardar borrador, avance al requisito pendiente y progreso visibles; conservar el kilometraje al abrir y cerrar soporte. |
| Detalles | Panel del vehículo y retorno al paso operativo con la barra de seguridad visible. |
| Gastos y reporte | Formularios desplazables con registro/envío separados del contenido y por encima del teclado. |
| Emergencia y soporte | Contactos visibles, texto sin solapamientos, cierre por Escape y restauración del foco. |

## Hallazgos corregidos

- La cabecera de evidencia tenía su propio `min-h-screen` y reserva inferior; se convirtió en cabecera fluida.
- La acción de etapa quedaba en tarjetas largas; ahora utiliza el dock operativo compartido.
- Las acciones rápidas y los botones de evidencia/cierre ocupaban el mismo borde inferior; ahora participan del mismo marco.
- El teclado podía cubrir el formulario o el siguiente paso; el marco y los diálogos siguen `visualViewport`, incluyendo desplazamiento y cambio de altura.
- El diálogo de emergencia podía comprimir sus filas y desbordar la descripción del 911; las filas conservan su altura de contenido y desplazan el cuerpo del diálogo.
- Los pasos de evidencia no mostraban sus nombres en móvil; ahora conservan nombres visibles y accesibles.
- El acceso de soporte rápido de la cabecera de evidencia no tenía acción; ahora abre los contactos configurados.

## Reproducción y evidencia

Con Node 24, desde la raíz:

```sh
pnpm --filter @ruum/app-conductor test:e2e:operational
pnpm --filter @ruum/app-conductor test:e2e:ui
```

`driver-operational.spec.ts` comprueba la posición, el hit-testing con `elementFromPoint`, el foco y la ausencia de scroll raíz incluso al intentar desplazar `window`. Simula alturas de teclado de 320 y 284 píxeles sobre el viewport base. Las capturas de teclado se recortan al área visible simulada.

Las capturas se generan en `apps/app-conductor/test-results/driver-operational-*/`: `estado.png`, `carga.png`, `error.png`, `error-evidencia.png`, `detalles.png`, `soporte.png`, `emergencia.png`, `evidencia.png`, `evidencia-teclado.png`, `gastos-teclado.png` y `reporte-teclado.png`. El job de UI existente las incluye en sus artefactos de Playwright.

La API y las identidades son fixtures locales, incluyendo los errores deliberados de carga. El teclado es simulado mediante `visualViewport`; esta auditoría no certifica la cámara ni el teclado nativo en dispositivos físicos.

Capturas de la ejecución final (se regeneran al ejecutar la suite):

- [Carga](../test-results/driver-operational-carga-y-9216f-lida-emergencia-y-reintento-chromium/carga.png)
- [Emergencia](../test-results/driver-operational-estado--0453e--accesibles-sin-scroll-raíz-chromium/emergencia.png)
- [Evidencia con teclado simulado](../test-results/driver-operational-evidenc-27e9d-eclado-y-retorno-de-soporte-chromium/evidencia-teclado.png)
- [Reporte con teclado simulado](../test-results/driver-operational-gastos--66f1b-iente-paso-sobre-el-teclado-chromium/reporte-teclado.png)
