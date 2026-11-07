# TextInputUppercaseBridge

## Propósito

Normalizar texto permitido preservando exclusiones.

## Props y contrato

Fuente: [packages/ui/src/components/TextInputUppercaseBridge.tsx:61](../../../packages/ui/src/components/TextInputUppercaseBridge.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function TextInputUppercaseBridge() 


```

## Uso correcto de API

```tsx
import { TextInputUppercaseBridge } from "@ruum/ui";
<><TextInputUppercaseBridge /><Field etiqueta="Nombre completo" /></>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<input data-ruum-uppercase="on" type="email" />
```

## Accesibilidad y limitaciones

No visual. Validar IME, cursor y exclusiones de identificadores; no garantiza normalización del backend.

No se pasan className/style para corregir el componente base.

## Estados

default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--1440--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--320--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--390--base.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--dark--768--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--1440--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--320--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--390--base.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/TextInputUppercaseBridge--default--light--768--responsive.png) | [JSON](../resultados-base/TextInputUppercaseBridge--default--light--768--responsive.json) |

- dark · active: [captura](../capturas-base/estado-TextInputUppercaseBridge--dark--active.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-TextInputUppercaseBridge--dark--focus-visible.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-TextInputUppercaseBridge--dark--focus.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-TextInputUppercaseBridge--dark--hover.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--dark--hover.json).

- light · active: [captura](../capturas-base/estado-TextInputUppercaseBridge--light--active.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-TextInputUppercaseBridge--light--focus-visible.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-TextInputUppercaseBridge--light--focus.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--light--focus.json).

- light · hover: [captura](../capturas-base/estado-TextInputUppercaseBridge--light--hover.png), [reporte](../resultados-base/estado-TextInputUppercaseBridge--light--hover.json).
