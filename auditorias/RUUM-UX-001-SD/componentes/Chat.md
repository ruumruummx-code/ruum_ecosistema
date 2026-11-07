# Chat

## Propósito

Mostrar conversación y enviar texto mediante callback.

## Props y contrato

Fuente: [packages/ui/src/components/Chat.tsx:28](../../../packages/ui/src/components/Chat.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Chat({ propio, mensajes, onEnviar, deshabilitado, mensajeDeshabilitado }: ChatProps) 

export interface MensajeChat {
  id: string;
  remitente: "usuario" | "conductor";
  contenido: string;
  enviado_en: string;
  pendiente?: boolean;
}

export interface ChatProps {
  /** Quién ve esta pantalla — alinea sus propios mensajes a la derecha, igual que cualquier chat. */
  propio: "usuario" | "conductor";
  mensajes: MensajeChat[];
  onEnviar: (contenido: string) => void | Promise<void>;
  deshabilitado?: boolean;
  mensajeDeshabilitado?: string;
}
```

## Uso correcto de API

```tsx
import { Chat } from "@ruum/ui";
<Chat propio="usuario" mensajes={mensajes} onEnviar={enviar} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Chat propio="usuario" mensajes={[]} onEnviar={() => {}} />
```

## Accesibilidad y limitaciones

Ejemplo incorrecto para producción: no confirma persistencia. Revisar nombre explícito, error y foco por instancia.

No se pasan className/style para corregir el componente base.

## Estados

default, disabled, empty, long-message, pending.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: label-title-only.

Acciones: [SD-REM-008](../remediaciones/SD-REM-008.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: aria-prohibited-attr.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Chat--default--dark--1440--responsive.png) | [JSON](../resultados-base/Chat--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Chat--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Chat--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Chat--default--dark--320--responsive.png) | [JSON](../resultados-base/Chat--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Chat--default--dark--390--base.png) | [JSON](../resultados-base/Chat--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Chat--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Chat--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Chat--default--dark--768--responsive.png) | [JSON](../resultados-base/Chat--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Chat--default--light--1440--responsive.png) | [JSON](../resultados-base/Chat--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Chat--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Chat--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Chat--default--light--320--responsive.png) | [JSON](../resultados-base/Chat--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Chat--default--light--390--base.png) | [JSON](../resultados-base/Chat--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Chat--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Chat--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Chat--default--light--768--responsive.png) | [JSON](../resultados-base/Chat--default--light--768--responsive.json) |
| disabled | dark | 390 | base | [PNG](../capturas-base/Chat--disabled--dark--390--base.png) | [JSON](../resultados-base/Chat--disabled--dark--390--base.json) |
| disabled | light | 390 | base | [PNG](../capturas-base/Chat--disabled--light--390--base.png) | [JSON](../resultados-base/Chat--disabled--light--390--base.json) |
| empty | dark | 390 | base | [PNG](../capturas-base/Chat--empty--dark--390--base.png) | [JSON](../resultados-base/Chat--empty--dark--390--base.json) |
| empty | light | 390 | base | [PNG](../capturas-base/Chat--empty--light--390--base.png) | [JSON](../resultados-base/Chat--empty--light--390--base.json) |
| long-message | dark | 390 | base | [PNG](../capturas-base/Chat--long-message--dark--390--base.png) | [JSON](../resultados-base/Chat--long-message--dark--390--base.json) |
| long-message | light | 390 | base | [PNG](../capturas-base/Chat--long-message--light--390--base.png) | [JSON](../resultados-base/Chat--long-message--light--390--base.json) |
| pending | dark | 390 | base | [PNG](../capturas-base/Chat--pending--dark--390--base.png) | [JSON](../resultados-base/Chat--pending--dark--390--base.json) |
| pending | light | 390 | base | [PNG](../capturas-base/Chat--pending--light--390--base.png) | [JSON](../resultados-base/Chat--pending--light--390--base.json) |

- dark · active: [captura](../capturas-base/estado-Chat--dark--active.png), [reporte](../resultados-base/estado-Chat--dark--active.json).

- dark · focus-visible: [captura](../capturas-base/estado-Chat--dark--focus-visible.png), [reporte](../resultados-base/estado-Chat--dark--focus-visible.json).

- dark · focus: [captura](../capturas-base/estado-Chat--dark--focus.png), [reporte](../resultados-base/estado-Chat--dark--focus.json).

- dark · hover: [captura](../capturas-base/estado-Chat--dark--hover.png), [reporte](../resultados-base/estado-Chat--dark--hover.json).

- light · active: [captura](../capturas-base/estado-Chat--light--active.png), [reporte](../resultados-base/estado-Chat--light--active.json).

- light · focus-visible: [captura](../capturas-base/estado-Chat--light--focus-visible.png), [reporte](../resultados-base/estado-Chat--light--focus-visible.json).

- light · focus: [captura](../capturas-base/estado-Chat--light--focus.png), [reporte](../resultados-base/estado-Chat--light--focus.json).

- light · hover: [captura](../capturas-base/estado-Chat--light--hover.png), [reporte](../resultados-base/estado-Chat--light--hover.json).
