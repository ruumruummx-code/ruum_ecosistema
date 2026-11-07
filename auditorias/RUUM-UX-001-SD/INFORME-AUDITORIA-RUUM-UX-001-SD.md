# RUUM-UX-001-SD · Auditoría del sistema de diseño

Ejecución: 6–7 de noviembre de 2026, America/Mexico_City. Revisión y hashes de las fuentes auditadas: inventario.json.

**Veredicto global: NO CONFORME. RUUM-UX-GATE permanece bloqueado.** La auditoría técnica fue ejecutada; el ticket no se declara cerrado ni sustituye la firma de Diseño de Sistemas.

El detalle y los recuentos finales están en [VEREDICTOS.md](VEREDICTOS.md) y [resumen.json](resumen.json). Se documentaron 58 componentes y cinco utilidades públicas; cada componente tiene un veredicto y una ficha de uso. Se generaron 12 tickets locales de remediación con responsable funcional. La aceptación y asignación nominal deben formalizarlas los equipos responsables.

## Evidencia

- 205 muestras/variantes ejecutables de componentes y consumidores de hooks.
- Casos base y responsive en 320, 390, 768 y 1440 px, en light y dark explícitos.
- Zoom CSS 200 % a 390 y 1440 px: aproximación de layout, no certificación de zoom nativo del navegador.
- Capturas y reportes axe por muestra; hover, focus, focus-visible y active sobre controles visibles. Disabled, loading y error cuando el contrato los admite.
- Árbol accesible por muestra en los reportes base, con roles y nombres; comprobaciones específicas de teclado y composición en interacciones.json y comprobaciones-dirigidas.json.
- 180 tokens únicos, valores calculados en ambos temas, 56 pares semánticos y 729 comparaciones de aptitud de color/superficie. Inventario de familias, escala tipográfica, pesos, line-height, espaciado, radios y elevación.
- 31 pruebas existentes de @ruum/ui aprobadas y typecheck del paquete aprobado con Node 24.13.0. Esas pruebas no detectan todos los defectos de navegador encontrados.
- Sin cambios en implementaciones de packages/ui, configuración de Turbo ni dependencias.

El [visor de evidencia](INDICE.html) permite filtrar casos y abrir capturas, reportes y fichas.

## Hallazgos principales

1. Contraste insuficiente en usos de tokens base: blanco/gradiente CTA llega a **4,145:1**, blanco/danger oscuro a **2,750:1** y route-action/route-soft claro a **4,218:1**. Los pares de borde se juzgan a 3:1. Los controles disabled se registran por separado debido a su exención normativa.
2. `Modal` no contiene Tab/Shift+Tab ni devuelve foco al cerrar desde dentro. Con texto largo el cierre queda fuera del viewport: la muestra dirigida registra su coordenada vertical por encima de la pantalla. Su comentario declara atrapamiento que la implementación no realiza.
3. `MobileButton` pierde el nombre accesible al cargar: sustituye el texto por un spinner `aria-hidden`.
4. `Input`, `Select` y `Textarea` sin `id/name` duplican IDs: las dos etiquetas se asocian al primer control y el segundo queda sin nombre. Ayuda/error tienen asociaciones incompletas.
5. `MobileRow` y `NextOperationalAction` permiten activar con Enter enlaces deshabilitados. `aria-disabled` y `pointer-events` no implementan por sí solos el bloqueo de teclado.
6. `Tabs` no mueve foco con flecha derecha. Debe completar el patrón de pestañas o adoptar una semántica de filtros coherente con el comportamiento.
7. Existen discrepancias entre nombres visibles y accesibles, truncado y condiciones de tipografía, foco y composición que requieren revisión. No se ocultan mediante overrides de las apps.

Ver [los veredictos por componente](VEREDICTOS.md) y [las remediaciones](remediaciones/SD-REM-001.md). Los componentes sin infracciones automáticas quedan **conformes con condiciones**, no certificados: requieren co-revisión, adjudicación de incompletos y revisión de integración. `heading-order` se registra como condición contextual cuando depende del título del consumidor. Las alertas de logotipos requieren adjudicar las exenciones normativas que realmente correspondan; no se borraron del reporte.

## Criterios de aceptación

| Criterio | Estado |
|---|---|
| SD-AC-1 | Inventario y medición entregados; no todos los usos cumplen contraste. |
| SD-AC-2 | Matriz y capturas de estados aplicables entregadas; defectos de foco y nombre documentados. |
| SD-AC-3 | Roles, árboles, teclado y axe ejecutados; **no cumple cero infracciones**. |
| SD-AC-4 | Cuatro anchos y proxy de zoom ejecutados; defectos y revisiones registrados. Zoom nativo y dispositivo físico pendientes. |
| SD-AC-5 | 58 fichas con propósito, props, estados, ejemplos, accesibilidad y limitaciones disponibles en el repositorio; showcase ejecutable. Publicación externa y aceptación de SD no realizadas. |
| SD-AC-6 | Inventario entregado; ausencia de compensaciones que enmascaren defectos **no acreditada**. Justificaciones nominales pendientes. |
| SD-AC-7 | Veredictos explícitos y tickets locales de remediación entregados. |

## Método y límites

Se importaron exclusivamente el paquete base y sus tokens. Tailwind compila las fuentes reales de packages/ui. `@theme static` evita descartar variables no utilizadas; no modifica valores. No se importaron estilos de app-usuario ni se pasaron `className/style` a componentes para corregirlos. El host solo aporta padding externo, rótulos y un área mínima para captura. No hay un override de familia tipográfica para ocultar variables de fuente sin resolver.

Next/Link es real. El adaptador de interop de Next/Image reexporta la implementación `Image` instalada, sin sustituirla por otra etiqueta. Las imágenes de marca proceden de los assets locales reales. El mapa usa una imagen de prueba con `alt`; no se prueba optimización remota ni servicios de mapas.

Las muestras cubren estados representativos y variantes registradas, no el producto cartesiano de todas las props posibles. Hover/focus/active se capturan sobre un control visible; en contenedores corresponden al hijo interactivo. Los estados sin API equivalente son no aplicables. `useDialogAccesible` nativo pasó entrada, contención bidireccional, Escape y retorno; no se transfiere ese resultado a `Modal`, que usa otra implementación.

Axe conserva `violations` e `incomplete` por muestra. Incomplete no equivale a aprobado. El análisis geometry marca candidatos de desbordamiento/recorte: deben revisarse contenedores de scroll y visibilidad intencionada. No toda coordenada fuera del viewport demuestra una infracción. El campo `focus.notObscured` mide contención en el viewport; no prueba por sí solo ausencia de oclusión por overlays y requiere revisión de composición para WCAG 2.4.11. La min-width global de 320 px causa desplazamiento bajo el proxy en anchos efectivos menores: se registra como exigencia interna del ticket, sin atribuir automáticamente cada caso a WCAG 1.4.10. El proxy a 1440 px aporta también un ancho efectivo por encima de ese mínimo.

El análisis de overrides cubre importaciones nombradas de @ruum/ui y redeclaraciones CSS de tokens conocidos. No resuelve todas las propagaciones, wrappers, imports namespace ni CSS externo, y no demuestra ausencia global de overrides. Cada candidato conserva justificación y veredicto preliminar; no se inventaron aprobaciones nominales.

No se ejecutaron NVDA/VoiceOver, pruebas en dispositivo físico, entrega de mensajes, tiempos de atención, pago real ni llamada real. La matriz utiliza Chromium y no constituye certificación multiexplorador. Los puntos del chat sobre rechazo de envío y foco entre dos instancias proceden de revisión de código y requieren reproducción adicional, identificada en SD-REM-008.

## Dependencias y cierre

UX-002/005/010/011 **no se liberan** de su condición de SD mediante este informe. UX-007/008/009 conservan sus pendientes de integración, tecnología asistiva y operación. En particular, esta auditoría no certifica la composición completa de InicioDesktop ni la entrega del correo de InformacionSoporte.

La co-revisión sigue pendiente en [CO-REVISION.md](CO-REVISION.md): faltan propietario nominal, fecha y aceptación explícita de condiciones. No se reutiliza una aprobación de Producto de otro ticket como firma de Diseño de Sistemas. Los tickets de remediación se guardan en el repositorio; no se crearon incidencias en un gestor externo.

Una limpieza concurrente eliminó la primera evidencia en docs. Se regeneró en `auditorias/RUUM-UX-001-SD`, ubicación aceptada por el usuario. Los directorios `resultados` y `capturas` sin sufijo son diagnósticos preliminares. La evidencia final referenciada utiliza **resultados-base y capturas-base**.

## Reproducción

1. `node auditorias/RUUM-UX-001-SD/inventariar.cjs`
2. `node auditorias/RUUM-UX-001-SD/construir-showcase.cjs`
3. `node auditorias/RUUM-UX-001-SD/auditar-navegador.cjs`
4. `node auditorias/RUUM-UX-001-SD/auditar-interacciones.cjs`
5. `node auditorias/RUUM-UX-001-SD/auditar-casos-dirigidos.cjs`
6. `node auditorias/RUUM-UX-001-SD/auditar-tokens.cjs`
7. `node auditorias/RUUM-UX-001-SD/auditar-disabled.cjs`
8. `node auditorias/RUUM-UX-001-SD/inventariar-overrides.cjs`
9. `python auditorias/RUUM-UX-001-SD/generar-informe.py`
10. `python auditorias/RUUM-UX-001-SD/generar-inventarios.py`
11. `python auditorias/RUUM-UX-001-SD/generar-visor.py`

Para una nueva revisión, generar evidencia en carpetas nuevas o apartar la anterior. El runner reutiliza reportes existentes: no mezclar hashes de fuentes en un mismo set. Para ejecutar el showcase, iniciar servidor.cjs y abrir la URL localhost impresa seguida de `/showcase.html?interactive=1`. El visor de evidencia funciona como archivo local sin fetch de JSON.

## Referencias

[W3C: contraste mínimo y exención disabled](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) · [W3C: contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) · [W3C: patrón de diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
