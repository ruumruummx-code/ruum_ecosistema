# ButtonText

## Propósito

Representar una acción de menor prioridad.

## Props y contrato

Fuente: [packages/ui/src/components/Buttons.tsx:56](../../../packages/ui/src/components/Buttons.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function ButtonText({
  children,
  conChevron = false,
  className = "",
  ...props
}: SystemButtonProps & { conChevron?: boolean }) 

interface SystemButtonProps extends Omit<ButtonProps, "variant"> {
  children: ReactNode;
  street?: boolean;
}
```

## Uso correcto de API

```tsx
import { ButtonText } from "@ruum/ui";
<ButtonText conChevron>Consultar</ButtonText>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<ButtonText><Icono nombre="atras" /></ButtonText>
```

## Accesibilidad y limitaciones

Un icono decorativo solo no da nombre al botón.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled, loading.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/ButtonText--default--dark--1440--responsive.png) | [JSON](../resultados-base/ButtonText--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonText--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonText--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/ButtonText--default--dark--320--responsive.png) | [JSON](../resultados-base/ButtonText--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/ButtonText--default--dark--390--base.png) | [JSON](../resultados-base/ButtonText--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonText--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonText--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/ButtonText--default--dark--768--responsive.png) | [JSON](../resultados-base/ButtonText--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/ButtonText--default--light--1440--responsive.png) | [JSON](../resultados-base/ButtonText--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonText--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonText--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/ButtonText--default--light--320--responsive.png) | [JSON](../resultados-base/ButtonText--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/ButtonText--default--light--390--base.png) | [JSON](../resultados-base/ButtonText--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonText--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonText--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/ButtonText--default--light--768--responsive.png) | [JSON](../resultados-base/ButtonText--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/ButtonText--disabled--dark--390--base.png) | [JSON](../resultados-base/ButtonText--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/ButtonText--disabled--light--390--base.png) | [JSON](../resultados-base/ButtonText--disabled--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/ButtonText--loading--dark--390--base.png) | [JSON](../resultados-base/ButtonText--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/ButtonText--loading--light--390--base.png) | [JSON](../resultados-base/ButtonText--loading--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-ButtonText--dark--active.png), [reporte](../resultados-base/estado-ButtonText--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-ButtonText--dark--focus-visible.png), [reporte](../resultados-base/estado-ButtonText--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-ButtonText--dark--focus.png), [reporte](../resultados-base/estado-ButtonText--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-ButtonText--dark--hover.png), [reporte](../resultados-base/estado-ButtonText--dark--hover.json).

- light · active: [captura](../capturas-base/estado-ButtonText--light--active.png), [reporte](../resultados-base/estado-ButtonText--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-ButtonText--light--focus-visible.png), [reporte](../resultados-base/estado-ButtonText--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-ButtonText--light--focus.png), [reporte](../resultados-base/estado-ButtonText--light--focus.json).

- light · hover: [captura](../capturas-base/estado-ButtonText--light--hover.png), [reporte](../resultados-base/estado-ButtonText--light--hover.json).
