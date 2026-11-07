# ButtonPrimary

## Propósito

Representar el CTA principal del bloque.

## Props y contrato

Fuente: [packages/ui/src/components/Buttons.tsx:27](../../../packages/ui/src/components/Buttons.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function ButtonPrimary({ children, street, className = "", ...props }: SystemButtonProps) 

interface SystemButtonProps extends Omit<ButtonProps, "variant"> {
  children: ReactNode;
  street?: boolean;
}
```

## Uso correcto de API

```tsx
import { ButtonPrimary } from "@ruum/ui";
<ButtonPrimary onClick={continuar}>Aceptar</ButtonPrimary>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<ButtonPrimary aria-label="" />
```

## Accesibilidad y limitaciones

Comparte implementación de Button y su gradiente.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled, loading.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-001](../remediaciones/SD-REM-001.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/ButtonPrimary--default--dark--1440--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonPrimary--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/ButtonPrimary--default--dark--320--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/ButtonPrimary--default--dark--390--base.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonPrimary--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/ButtonPrimary--default--dark--768--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/ButtonPrimary--default--light--1440--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/ButtonPrimary--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/ButtonPrimary--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/ButtonPrimary--default--light--320--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/ButtonPrimary--default--light--390--base.png) | [JSON](../resultados-base/ButtonPrimary--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/ButtonPrimary--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/ButtonPrimary--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/ButtonPrimary--default--light--768--responsive.png) | [JSON](../resultados-base/ButtonPrimary--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/ButtonPrimary--disabled--dark--390--base.png) | [JSON](../resultados-base/ButtonPrimary--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/ButtonPrimary--disabled--light--390--base.png) | [JSON](../resultados-base/ButtonPrimary--disabled--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/ButtonPrimary--loading--dark--390--base.png) | [JSON](../resultados-base/ButtonPrimary--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/ButtonPrimary--loading--light--390--base.png) | [JSON](../resultados-base/ButtonPrimary--loading--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-ButtonPrimary--dark--active.png), [reporte](../resultados-base/estado-ButtonPrimary--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-ButtonPrimary--dark--focus-visible.png), [reporte](../resultados-base/estado-ButtonPrimary--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-ButtonPrimary--dark--focus.png), [reporte](../resultados-base/estado-ButtonPrimary--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-ButtonPrimary--dark--hover.png), [reporte](../resultados-base/estado-ButtonPrimary--dark--hover.json).

- light · active: [captura](../capturas-base/estado-ButtonPrimary--light--active.png), [reporte](../resultados-base/estado-ButtonPrimary--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-ButtonPrimary--light--focus-visible.png), [reporte](../resultados-base/estado-ButtonPrimary--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-ButtonPrimary--light--focus.png), [reporte](../resultados-base/estado-ButtonPrimary--light--focus.json).

- light · hover: [captura](../capturas-base/estado-ButtonPrimary--light--hover.png), [reporte](../resultados-base/estado-ButtonPrimary--light--hover.json).
