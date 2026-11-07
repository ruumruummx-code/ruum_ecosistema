# Button

## Propósito

Ejecutar una acción con variante semántica.

## Props y contrato

Fuente: [packages/ui/src/components/Button.tsx:43](../../../packages/ui/src/components/Button.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Button({ variant = "primary", icon, loading = false, disabled, className = "", children, ...props }: ButtonProps) 

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "emergency";

export type ButtonIcon = "arrow" | "check" | "warning" | "phone" | "send" | "none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ButtonIcon;
  loading?: boolean;
  children: ReactNode;
}
```

## Uso correcto de API

```tsx
import { Button } from "@ruum/ui";
<Button onClick={continuar}>Continuar</Button>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Button />
```

## Accesibilidad y limitaciones

Conservar nombre durante loading; confirmar acciones destructivas en el consumidor.

No se pasan className/style para corregir el componente base.

## Estados

danger-default, danger-disabled, danger-loading, emergency-default, emergency-disabled, emergency-loading, primary-default, primary-disabled, primary-loading, quiet-default, quiet-disabled, quiet-loading, secondary-default, secondary-disabled, secondary-loading.

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
| danger-default | dark | 390 | base | [PNG](../capturas-base/Button--danger-default--dark--390--base.png) | [JSON](../resultados-base/Button--danger-default--dark--390--base.json) |
| danger-default | light | 390 | base | [PNG](../capturas-base/Button--danger-default--light--390--base.png) | [JSON](../resultados-base/Button--danger-default--light--390--base.json) |
| danger-disabled | dark | 390 | base | [PNG](../capturas-base/Button--danger-disabled--dark--390--base.png) | [JSON](../resultados-base/Button--danger-disabled--dark--390--base.json) |
| danger-disabled | light | 390 | base | [PNG](../capturas-base/Button--danger-disabled--light--390--base.png) | [JSON](../resultados-base/Button--danger-disabled--light--390--base.json) |
| danger-loading | dark | 390 | base | [PNG](../capturas-base/Button--danger-loading--dark--390--base.png) | [JSON](../resultados-base/Button--danger-loading--dark--390--base.json) |
| danger-loading | light | 390 | base | [PNG](../capturas-base/Button--danger-loading--light--390--base.png) | [JSON](../resultados-base/Button--danger-loading--light--390--base.json) |
| emergency-default | dark | 390 | base | [PNG](../capturas-base/Button--emergency-default--dark--390--base.png) | [JSON](../resultados-base/Button--emergency-default--dark--390--base.json) |
| emergency-default | light | 390 | base | [PNG](../capturas-base/Button--emergency-default--light--390--base.png) | [JSON](../resultados-base/Button--emergency-default--light--390--base.json) |
| emergency-disabled | dark | 390 | base | [PNG](../capturas-base/Button--emergency-disabled--dark--390--base.png) | [JSON](../resultados-base/Button--emergency-disabled--dark--390--base.json) |
| emergency-disabled | light | 390 | base | [PNG](../capturas-base/Button--emergency-disabled--light--390--base.png) | [JSON](../resultados-base/Button--emergency-disabled--light--390--base.json) |
| emergency-loading | dark | 390 | base | [PNG](../capturas-base/Button--emergency-loading--dark--390--base.png) | [JSON](../resultados-base/Button--emergency-loading--dark--390--base.json) |
| emergency-loading | light | 390 | base | [PNG](../capturas-base/Button--emergency-loading--light--390--base.png) | [JSON](../resultados-base/Button--emergency-loading--light--390--base.json) |
| primary-default | dark | 1440 | responsive | [PNG](../capturas-base/Button--primary-default--dark--1440--responsive.png) | [JSON](../resultados-base/Button--primary-default--dark--1440--responsive.json) |
| primary-default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Button--primary-default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Button--primary-default--dark--1440--zoom-css-200.json) |
| primary-default | dark | 320 | responsive | [PNG](../capturas-base/Button--primary-default--dark--320--responsive.png) | [JSON](../resultados-base/Button--primary-default--dark--320--responsive.json) |
| primary-default | dark | 390 | base | [PNG](../capturas-base/Button--primary-default--dark--390--base.png) | [JSON](../resultados-base/Button--primary-default--dark--390--base.json) |
| primary-default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Button--primary-default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Button--primary-default--dark--390--zoom-css-200.json) |
| primary-default | dark | 768 | responsive | [PNG](../capturas-base/Button--primary-default--dark--768--responsive.png) | [JSON](../resultados-base/Button--primary-default--dark--768--responsive.json) |
| primary-default | light | 1440 | responsive | [PNG](../capturas-base/Button--primary-default--light--1440--responsive.png) | [JSON](../resultados-base/Button--primary-default--light--1440--responsive.json) |
| primary-default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Button--primary-default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Button--primary-default--light--1440--zoom-css-200.json) |
| primary-default | light | 320 | responsive | [PNG](../capturas-base/Button--primary-default--light--320--responsive.png) | [JSON](../resultados-base/Button--primary-default--light--320--responsive.json) |
| primary-default | light | 390 | base | [PNG](../capturas-base/Button--primary-default--light--390--base.png) | [JSON](../resultados-base/Button--primary-default--light--390--base.json) |
| primary-default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Button--primary-default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Button--primary-default--light--390--zoom-css-200.json) |
| primary-default | light | 768 | responsive | [PNG](../capturas-base/Button--primary-default--light--768--responsive.png) | [JSON](../resultados-base/Button--primary-default--light--768--responsive.json) |
| primary-disabled | dark | 390 | base | [PNG](../capturas-base/Button--primary-disabled--dark--390--base.png) | [JSON](../resultados-base/Button--primary-disabled--dark--390--base.json) |
| primary-disabled | light | 390 | base | [PNG](../capturas-base/Button--primary-disabled--light--390--base.png) | [JSON](../resultados-base/Button--primary-disabled--light--390--base.json) |
| primary-loading | dark | 390 | base | [PNG](../capturas-base/Button--primary-loading--dark--390--base.png) | [JSON](../resultados-base/Button--primary-loading--dark--390--base.json) |
| primary-loading | light | 390 | base | [PNG](../capturas-base/Button--primary-loading--light--390--base.png) | [JSON](../resultados-base/Button--primary-loading--light--390--base.json) |
| quiet-default | dark | 390 | base | [PNG](../capturas-base/Button--quiet-default--dark--390--base.png) | [JSON](../resultados-base/Button--quiet-default--dark--390--base.json) |
| quiet-default | light | 390 | base | [PNG](../capturas-base/Button--quiet-default--light--390--base.png) | [JSON](../resultados-base/Button--quiet-default--light--390--base.json) |
| quiet-disabled | dark | 390 | base | [PNG](../capturas-base/Button--quiet-disabled--dark--390--base.png) | [JSON](../resultados-base/Button--quiet-disabled--dark--390--base.json) |
| quiet-disabled | light | 390 | base | [PNG](../capturas-base/Button--quiet-disabled--light--390--base.png) | [JSON](../resultados-base/Button--quiet-disabled--light--390--base.json) |
| quiet-loading | dark | 390 | base | [PNG](../capturas-base/Button--quiet-loading--dark--390--base.png) | [JSON](../resultados-base/Button--quiet-loading--dark--390--base.json) |
| quiet-loading | light | 390 | base | [PNG](../capturas-base/Button--quiet-loading--light--390--base.png) | [JSON](../resultados-base/Button--quiet-loading--light--390--base.json) |
| secondary-default | dark | 390 | base | [PNG](../capturas-base/Button--secondary-default--dark--390--base.png) | [JSON](../resultados-base/Button--secondary-default--dark--390--base.json) |
| secondary-default | light | 390 | base | [PNG](../capturas-base/Button--secondary-default--light--390--base.png) | [JSON](../resultados-base/Button--secondary-default--light--390--base.json) |
| secondary-disabled | dark | 390 | base | [PNG](../capturas-base/Button--secondary-disabled--dark--390--base.png) | [JSON](../resultados-base/Button--secondary-disabled--dark--390--base.json) |
| secondary-disabled | light | 390 | base | [PNG](../capturas-base/Button--secondary-disabled--light--390--base.png) | [JSON](../resultados-base/Button--secondary-disabled--light--390--base.json) |
| secondary-loading | dark | 390 | base | [PNG](../capturas-base/Button--secondary-loading--dark--390--base.png) | [JSON](../resultados-base/Button--secondary-loading--dark--390--base.json) |
| secondary-loading | light | 390 | base | [PNG](../capturas-base/Button--secondary-loading--light--390--base.png) | [JSON](../resultados-base/Button--secondary-loading--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Button--dark--active.png), [reporte](../resultados-base/estado-Button--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Button--dark--focus-visible.png), [reporte](../resultados-base/estado-Button--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Button--dark--focus.png), [reporte](../resultados-base/estado-Button--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Button--dark--hover.png), [reporte](../resultados-base/estado-Button--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Button--light--active.png), [reporte](../resultados-base/estado-Button--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Button--light--focus-visible.png), [reporte](../resultados-base/estado-Button--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Button--light--focus.png), [reporte](../resultados-base/estado-Button--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Button--light--hover.png), [reporte](../resultados-base/estado-Button--light--hover.json).
