# EstadoBadge

## Propósito

Representar el estado técnico como etiqueta humana.

## Props y contrato

Fuente: [packages/ui/src/components/EstadoBadge.tsx:19](../../../packages/ui/src/components/EstadoBadge.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function EstadoBadge({ estado, conTexto = true }: EstadoBadgeProps) 

export interface EstadoBadgeProps {
  estado: EstadoTraslado;
  /** Si es false, muestra solo el indicador de color sin el texto. */
  conTexto?: boolean;
}
```

## Uso correcto de API

```tsx
import { EstadoBadge } from "@ruum/ui";
<EstadoBadge estado="traslado_en_curso" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<EstadoBadge estado="traslado_en_curso" conTexto={false} />
```

## Accesibilidad y limitaciones

conTexto=false carece de equivalente accesible si es la única explicación del estado.

No se pasan className/style para corregir el componente base.

## Estados

conductor_asignado, pago_pendiente, servicio_cancelado, servicio_cerrado, solicitud_creada, traslado_en_curso, without-text.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-011](../remediaciones/SD-REM-011.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| conductor_asignado | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--conductor_asignado--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--conductor_asignado--dark--390--base.json) |
| conductor_asignado | light | 390 | base | [PNG](../capturas-base/EstadoBadge--conductor_asignado--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--conductor_asignado--light--390--base.json) |
| pago_pendiente | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--pago_pendiente--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--pago_pendiente--dark--390--base.json) |
| pago_pendiente | light | 390 | base | [PNG](../capturas-base/EstadoBadge--pago_pendiente--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--pago_pendiente--light--390--base.json) |
| servicio_cancelado | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--servicio_cancelado--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--servicio_cancelado--dark--390--base.json) |
| servicio_cancelado | light | 390 | base | [PNG](../capturas-base/EstadoBadge--servicio_cancelado--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--servicio_cancelado--light--390--base.json) |
| servicio_cerrado | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--servicio_cerrado--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--servicio_cerrado--dark--390--base.json) |
| servicio_cerrado | light | 390 | base | [PNG](../capturas-base/EstadoBadge--servicio_cerrado--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--servicio_cerrado--light--390--base.json) |
| solicitud_creada | dark | 1440 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--1440--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--1440--responsive.json) |
| solicitud_creada | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--1440--zoom-css-200.json) |
| solicitud_creada | dark | 320 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--320--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--320--responsive.json) |
| solicitud_creada | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--390--base.json) |
| solicitud_creada | dark | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--390--zoom-css-200.json) |
| solicitud_creada | dark | 768 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--dark--768--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--dark--768--responsive.json) |
| solicitud_creada | light | 1440 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--1440--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--1440--responsive.json) |
| solicitud_creada | light | 1440 | zoom-css-200 | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--1440--zoom-css-200.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--1440--zoom-css-200.json) |
| solicitud_creada | light | 320 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--320--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--320--responsive.json) |
| solicitud_creada | light | 390 | base | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--390--base.json) |
| solicitud_creada | light | 390 | zoom-css-200 | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--390--zoom-css-200.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--390--zoom-css-200.json) |
| solicitud_creada | light | 768 | responsive | [PNG](../capturas-base/EstadoBadge--solicitud_creada--light--768--responsive.png) | [JSON](../resultados-base/EstadoBadge--solicitud_creada--light--768--responsive.json) |
| traslado_en_curso | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--traslado_en_curso--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--traslado_en_curso--dark--390--base.json) |
| traslado_en_curso | light | 390 | base | [PNG](../capturas-base/EstadoBadge--traslado_en_curso--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--traslado_en_curso--light--390--base.json) |
| without-text | dark | 390 | base | [PNG](../capturas-base/EstadoBadge--without-text--dark--390--base.png) | [JSON](../resultados-base/EstadoBadge--without-text--dark--390--base.json) |
| without-text | light | 390 | base | [PNG](../capturas-base/EstadoBadge--without-text--light--390--base.png) | [JSON](../resultados-base/EstadoBadge--without-text--light--390--base.json) |
