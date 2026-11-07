# SD-REM-007 · Implementado; gate manual pendiente

Fecha: 2026-11-07. Node 24.13.0, React 19 y Chromium/Playwright.

## Patrón adoptado

Opción A para navegación: `span role="link" aria-disabled="true"`, sin `href`, `tabIndex`, `target`, manejadores ni adaptadores montados. El rol aporta nombre y estado al árbol accesible y no añade activación nativa. No se depende de `pointer-events`. Las acciones sin navegación conservan `button disabled` y exponen `aria-disabled`.

Se conserva la navegación habilitada, incluido enlace externo y los adaptadores `enlaceComponente` y `linkComponent`. Los CTA deshabilitados no usan estilos de interacción habilitada. No se modificaron tokens ni dependencias. Se conservaron los cambios previos del workspace y se sustituyó la mitigación previa de MobileRow por el patrón A.

## Verificación reproducible

Desde la raíz del repositorio:

```
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/verificar.cjs
pnpm --filter @ruum/ui build
pnpm --filter @ruum/ui test
```

- Build de UI aprobado; suite completa: 42 pruebas aprobadas, incluidas tres regresiones nuevas en `disabled-links.test.tsx`.
- Cinco enlaces deshabilitados: MobileRow nativo y ambos adaptadores, CTA principal y secundario externo. Adicionalmente un botón de fila nativo deshabilitado.
- Tab desde «Alternar disponibilidad» salta todos los controles bloqueados y llega a «Fin de recorrido»; Shift+Tab regresa al inicio. Enter y Space físicos desde el final no producen navegación ni acciones.
- Cada span rechaza foco programático. Se despachan además keydown/keyup de Enter y Space y click directamente sobre cada destino; no cambia la URL, no hay callbacks ni ventanas abiertas. Estos eventos sintéticos complementan la comprobación física de Tab; no representan una sesión de lector de pantalla.
- Al habilitar: Tab enfoca el enlace de fila; Enter navega por fila, ambos adaptadores y CTA principal. Enter y Space activan el botón de acción. Al deshabilitar otra vez se retiran los enlaces activables.
- Axe: cero violaciones de `aria-allowed-attr`, `button-name` y `link-name`. El alcance es el formulario de prueba, no una auditoría integral de la aplicación.
- `arbol-deshabilitado.yml`: nombres de los enlaces con `[disabled]`.
- `resultados.json`: atributos, eventos probados, resultados axe y regresión habilitada.
- `deshabilitado-light.png` y `deshabilitado-dark.png`: componentes reales compartidos con CSS generado desde tokens actuales. Son capturas del harness, no de una ruta autenticada de app-usuario.

Revisión react-best-practices: ramas declarativas sin efectos ni listeners globales, sin dependencias nuevas; los adaptadores solo se montan en estado habilitado. La fixture usa contadores locales al navegador para detectar acciones.

## Gate NVDA/VoiceOver

**Pendiente: sesión real no realizada. No declarar cierre total.** El árbol accesible automático confirma nombre/estado, pero no certifica su anuncio por un lector concreto.

Servir con `node auditorias/RUUM-UX-001-SD/servidor.cjs` y abrir `/remediacion-SD-REM-007/formulario.html` en la URL emitida. Con NVDA/VoiceOver, recorrer los enlaces en modo lectura: comprobar etiqueta y anuncio deshabilitado, intentar activar y confirmar ausencia de acción. Validar Tab/Shift+Tab y rehabilitación. Registrar sistema, lector/versión, navegador y anuncios observados.

Contrato de composición: no anidar controles interactivos en el contenido React de una fila; disponer las acciones independientes como filas separadas. No se certifican manejadores de activación añadidos por ancestros de consumidores externos.
