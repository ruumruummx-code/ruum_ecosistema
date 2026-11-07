# ButtonSecondary

## Propósito

Representar una acción de apoyo.

## Props y contrato

Fuente: [packages/ui/src/components/Buttons.tsx:40](../../../packages/ui/src/components/Buttons.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function ButtonSecondary({ children, street, className = "", ...props }: SystemButtonProps) 

interface SystemButtonProps extends Omit<ButtonProps, "variant"> {
  children: ReactNode;
  street?: boolean;
}
```

## Uso correcto de API

```tsx
import { ButtonSecondary } from "@ruum/ui";
<ButtonSecondary>Ver detalle</ButtonSecondary>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<ButtonSecondary> </ButtonSecondary>
```

## Accesibilidad y limitaciones

No sustituye un enlace con destino.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/ButtonSecondary--default--dark--1440--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonSecondary--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/ButtonSecondary--default--dark--320--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/ButtonSecondary--default--dark--390--base.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonSecondary--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/ButtonSecondary--default--dark--768--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/ButtonSecondary--default--light--1440--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonSecondary--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonSecondary--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/ButtonSecondary--default--light--320--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/ButtonSecondary--default--light--390--base.png) | [JSON](../resultados-base/ButtonSecondary--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonSecondary--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonSecondary--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/ButtonSecondary--default--light--768--responsive.png) | [JSON](../resultados-base/ButtonSecondary--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/ButtonSecondary--disabled--dark--390--base.png) | [JSON](../resultados-base/ButtonSecondary--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/ButtonSecondary--disabled--light--390--base.png) | [JSON](../resultados-base/ButtonSecondary--disabled--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/ButtonSecondary--loading--dark--390--base.png) | [JSON](../resultados-base/ButtonSecondary--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/ButtonSecondary--loading--light--390--base.png) | [JSON](../resultados-base/ButtonSecondary--loading--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-ButtonSecondary--dark--active.png), [reporte](../resultados-base/estado-ButtonSecondary--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-ButtonSecondary--dark--focus-visible.png), [reporte](../resultados-base/estado-ButtonSecondary--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-ButtonSecondary--dark--focus.png), [reporte](../resultados-base/estado-ButtonSecondary--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-ButtonSecondary--dark--hover.png), [reporte](../resultados-base/estado-ButtonSecondary--dark--hover.json).

- light · active: [captura](../capturas-base/estado-ButtonSecondary--light--active.png), [reporte](../resultados-base/estado-ButtonSecondary--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-ButtonSecondary--light--focus-visible.png), [reporte](../resultados-base/estado-ButtonSecondary--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-ButtonSecondary--light--focus.png), [reporte](../resultados-base/estado-ButtonSecondary--light--focus.json).

- light · hover: [captura](../capturas-base/estado-ButtonSecondary--light--hover.png), [reporte](../resultados-base/estado-ButtonSecondary--light--hover.json).
