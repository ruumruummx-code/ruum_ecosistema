# MobileButton

## Propósito

Ejecutar una acción móvil con destino táctil amplio.

## Props y contrato

Fuente: [packages/ui/src/components/MobileButton.tsx:27](../../../packages/ui/src/components/MobileButton.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileButton({
  children,
  variant = "primary",
  stickyBottom = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = true,
  disabled,
  className = "",
  ...props
}: MobileButtonProps) 

export type MobileButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export interface MobileButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: MobileButtonVariant;
  stickyBottom?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}
```

## Uso correcto de API

```tsx
import { MobileButton } from "@ruum/ui";
<MobileButton>Enviar reporte</MobileButton>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileButton loading />
```

## Accesibilidad y limitaciones

El estado loading actual pierde el nombre; requiere remediación.

No se pasan className/style para corregir el componente base.

## Estados

danger, default, disabled, loading, quiet, secondary.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-003](../remediaciones/SD-REM-003.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| danger | dark | 390 | base | [PNG](../capturas-base/MobileButton--danger--dark--390--base.png) | [JSON](../resultados-base/MobileButton--danger--dark--390--base.json) |
| danger | light | 390 | base | [PNG](../capturas-base/MobileButton--danger--light--390--base.png) | [JSON](../resultados-base/MobileButton--danger--light--390--base.json) |
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileButton--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileButton--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileButton--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileButton--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileButton--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileButton--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileButton--default--dark--390--base.png) | [JSON](../resultados-base/MobileButton--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileButton--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileButton--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileButton--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileButton--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileButton--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileButton--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileButton--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileButton--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileButton--default--light--320--responsive.png) | [JSON](../resultados-base/MobileButton--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileButton--default--light--390--base.png) | [JSON](../resultados-base/MobileButton--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileButton--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileButton--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileButton--default--light--768--responsive.png) | [JSON](../resultados-base/MobileButton--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/MobileButton--disabled--dark--390--base.png) | [JSON](../resultados-base/MobileButton--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/MobileButton--disabled--light--390--base.png) | [JSON](../resultados-base/MobileButton--disabled--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/MobileButton--loading--dark--390--base.png) | [JSON](../resultados-base/MobileButton--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/MobileButton--loading--light--390--base.png) | [JSON](../resultados-base/MobileButton--loading--light--390--base.json) |
| quiet | dark | 390 | base | [PNG](../capturas-base/MobileButton--quiet--dark--390--base.png) | [JSON](../resultados-base/MobileButton--quiet--dark--390--base.json) |
| quiet | light | 390 | base | [PNG](../capturas-base/MobileButton--quiet--light--390--base.png) | [JSON](../resultados-base/MobileButton--quiet--light--390--base.json) |
| secondary | dark | 390 | base | [PNG](../capturas-base/MobileButton--secondary--dark--390--base.png) | [JSON](../resultados-base/MobileButton--secondary--dark--390--base.json) |
| secondary | light | 390 | base | [PNG](../capturas-base/MobileButton--secondary--light--390--base.png) | [JSON](../resultados-base/MobileButton--secondary--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-MobileButton--dark--active.png), [reporte](../resultados-base/estado-MobileButton--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-MobileButton--dark--focus-visible.png), [reporte](../resultados-base/estado-MobileButton--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-MobileButton--dark--focus.png), [reporte](../resultados-base/estado-MobileButton--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-MobileButton--dark--hover.png), [reporte](../resultados-base/estado-MobileButton--dark--hover.json).

- light · active: [captura](../capturas-base/estado-MobileButton--light--active.png), [reporte](../resultados-base/estado-MobileButton--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-MobileButton--light--focus-visible.png), [reporte](../resultados-base/estado-MobileButton--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-MobileButton--light--focus.png), [reporte](../resultados-base/estado-MobileButton--light--focus.json).

- light · hover: [captura](../capturas-base/estado-MobileButton--light--hover.png), [reporte](../resultados-base/estado-MobileButton--light--hover.json).
