# RUUM-UX-008 · Informe de implementación y cierre técnico

Fecha: 6 de noviembre de 2026. Estado: implementado y verificado en componente; listo para reauditoría. La liberación P2 requiere decisión explícita de Producto.

## Resultado

La confirmación inline recibe foco como grupo nombrado y descrito. Una región `status` persistente anuncia su apertura de forma cortés. Al mantener el viaje, el foco vuelve a «Cancelar viaje». Durante el envío se conserva el panel y se deshabilitan ambos botones. Un bloqueo síncrono con ref impide múltiples llamadas antes del render; tras éxito, el botón de inicio queda deshabilitado mientras se refresca el detalle. Los errores reciben foco, se anuncian y permiten reintentar o mantener el viaje.

Se conserva el motivo, la penalización previa y el mensaje de irreversibilidad. No se modificaron colores, reglas financieras, servicio API ni región del mapa.

## Criterios de aceptación

| Criterio | Resultado y evidencia |
|---|---|
| AC-1 | Cumple en fixture de navegador: Enter abre el grupo, que recibe foco en 390 y 1440 px. |
| AC-2 | `role=status`, `aria-live=polite`, `aria-atomic=true` sobre región siempre montada; grupo con nombre y descripción asociados. Decisión técnica: anuncio cortés para una transición solicitada, sin urgencia que justifique `alert`. |
| AC-3 | Penalización calculada visible antes de abrir y dentro del panel, más advertencia de irreversibilidad. Capturas inicial/confirmación. |
| AC-4 | Enter sobre «No, mantener» devuelve foco al botón de inicio en ambos anchos. |
| AC-5 | Prueba unitaria: dos activaciones, una llamada pendiente; navegador: un fallo seguido de tres activaciones de reintento, dos llamadas totales. Botones bloqueados durante envío y apertura bloqueada tras éxito. Protección de cliente, sin afirmar idempotencia de servidor. |
| AC-6 | Nombres accesibles verificados; Tab: confirmar → mantener. Axe `button-name`, `aria-valid-attr`, `aria-valid-attr-value`: cero infracciones. |
| AC-7 | Axe `color-contrast`: cero infracciones en el bloque, ambos anchos. Estilos originales y tokens compartidos conservados. |
| AC-8 | Nota técnica: árbol accesible y foco verificados con Chromium. No se ejecutó una sesión de NVDA/VoiceOver; no se certifica anuncio hablado ni comportamiento en dispositivo físico. |
| AC-9 | Propietario HManuel, Administración e Innovación Digital; fecha 6/11/2026. Ver DECISION-PRODUCTO.md. |

## Validación

- Node 24.13.0.
- Vitest del componente: 6/6 pruebas aprobadas, incluidas las tres existentes de bloqueo/soporte.
- TypeScript de app-usuario: aprobado (`pnpm --filter @ruum/app-usuario typecheck`).
- ESLint de los dos archivos modificados: aprobado, sin errores ni advertencias.
- Chromium: ambos anchos, teclado, error, reintento y bloqueo tras éxito aprobados. Reporte completo en navegador.json.
- Capturas revisadas: confirmación móvil conserva jerarquía y ambos botones caben en el ancho evaluado.

## Alcance de la evidencia y pendientes

La fixture compila el componente real con React, componentes UI y CSS de la aplicación. Simula navegación y API; usa el cálculo real de penalización y las políticas de transición. No representa una prueba integral del detalle autenticado, de persistencia de cancelación ni del mapa. La prueba de integración del detalle y la revisión con tecnología de asistencia quedan para la reauditoría y gate de liberación. No se declara certificación integral de accesibilidad.

La primera ejecución de la fixture detectó CSS incompleto del harness (no incluía las fuentes de paquetes/ui). Se corrigió el generador para incluirlas; no fue necesario alterar colores del producto. El reporte adjunto corresponde a la ejecución corregida.

## Reproducción y archivos

1. `pnpm --filter @ruum/app-usuario exec vitest run "src/app/viajes/[id]/CancelarTraslado.test.tsx"`
2. `node docs/remediacion-ux008/generar-fixture.cjs`
3. `node docs/remediacion-ux008/verificar-navegador.cjs`

- correccion.diff: revisión de código.
- navegador.json: axe, árbol accesible y resultados por ancho.
- EVIDENCIA.html: capturas de estado inicial, confirmación y resultado.
- DECISION-PRODUCTO.md: registro del mensaje y propietario.

Recomendación de cierre: aceptar implementación técnica y solicitar reauditoría UX-08; no confundir con autorización de salida.
