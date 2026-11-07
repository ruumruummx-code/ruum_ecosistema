# Modal

## Propósito

Presentar una decisión modal con cierre.

## Props y contrato

Fuente: [packages/ui/src/components/Modal.tsx:47](../../../packages/ui/src/components/Modal.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  estado = "default",
  className = "",
  descripcionId,
}: ModalProps) 

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  estado?: "default" | "loading" | "error";
  className?: string;
  /** ID accesible opcional para descripción complementaria (aria-describedby). */
  descripcionId?: string;
}
```

## Uso correcto de API

```tsx
import { Modal } from "@ruum/ui";
<Modal abierto={abierto} onCerrar={cerrar} titulo="Confirmar"><Button onClick={cerrar}>Mantener</Button></Modal>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Modal abierto onCerrar={() => {}} titulo="" />
```

## Accesibilidad y limitaciones

API válida no garantiza conformidad: falta contención y restauración de foco; revisar contenido largo.

No se pasan className/style para corregir el componente base.

## Estados

default, error, loading, long-content.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-002](../remediaciones/SD-REM-002.md), [SD-REM-006](../remediaciones/SD-REM-006.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Modal--default--dark--1440--responsive.png) | [JSON](../resultados-base/Modal--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Modal--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Modal--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Modal--default--dark--320--responsive.png) | [JSON](../resultados-base/Modal--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Modal--default--dark--390--base.png) | [JSON](../resultados-base/Modal--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Modal--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Modal--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Modal--default--dark--768--responsive.png) | [JSON](../resultados-base/Modal--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Modal--default--light--1440--responsive.png) | [JSON](../resultados-base/Modal--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Modal--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Modal--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Modal--default--light--320--responsive.png) | [JSON](../resultados-base/Modal--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Modal--default--light--390--base.png) | [JSON](../resultados-base/Modal--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Modal--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Modal--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Modal--default--light--768--responsive.png) | [JSON](../resultados-base/Modal--default--light--768--responsive.json) |
| error | dark | 390 | base | [PNG](../capturas-base/Modal--error--dark--390--base.png) | [JSON](../resultados-base/Modal--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/Modal--error--light--390--base.png) | [JSON](../resultados-base/Modal--error--light--390--base.json) |
| loading | dark | 390 | base | [PNG](../capturas-base/Modal--loading--dark--390--base.png) | [JSON](../resultados-base/Modal--loading--dark--390--base.json) |
| loading | light | 390 | base | [PNG](../capturas-base/Modal--loading--light--390--base.png) | [JSON](../resultados-base/Modal--loading--light--390--base.json) |
| long-content | dark | 390 | base | [PNG](../capturas-base/Modal--long-content--dark--390--base.png) | [JSON](../resultados-base/Modal--long-content--dark--390--base.json) |
| long-content | light | 390 | base | [PNG](../capturas-base/Modal--long-content--light--390--base.png) | [JSON](../resultados-base/Modal--long-content--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Modal--dark--active.png), [reporte](../resultados-base/estado-Modal--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Modal--dark--focus-visible.png), [reporte](../resultados-base/estado-Modal--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Modal--dark--focus.png), [reporte](../resultados-base/estado-Modal--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Modal--dark--hover.png), [reporte](../resultados-base/estado-Modal--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Modal--light--active.png), [reporte](../resultados-base/estado-Modal--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Modal--light--focus-visible.png), [reporte](../resultados-base/estado-Modal--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Modal--light--focus.png), [reporte](../resultados-base/estado-Modal--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Modal--light--hover.png), [reporte](../resultados-base/estado-Modal--light--hover.json).
