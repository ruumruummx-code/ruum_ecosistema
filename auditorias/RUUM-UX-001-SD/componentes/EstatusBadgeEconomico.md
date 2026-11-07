# EstatusBadgeEconomico

## Propósito

Nombrar el estado económico con estilo compartido.

## Props y contrato

Fuente: [packages/ui/src/components/EstatusBadgeEconomico.tsx:8](../../../packages/ui/src/components/EstatusBadgeEconomico.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function EstatusBadgeEconomico({ estatus, className = "" }: EstatusBadgeEconomicoProps) 

export interface EstatusBadgeEconomicoProps {
  estatus: EstatusEconomico;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { EstatusBadgeEconomico } from "@ruum/ui";
<EstatusBadgeEconomico estatus="pagado" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<EstatusBadgeEconomico estatus="desconocido" />
```

## Accesibilidad y limitaciones

No acredita pago efectivo; depende del dato recibido.

No se pasan className/style para corregir el componente base.

## Estados

confirmado, en_validacion, estimado, pagado, programado, rechazado, retenido, sin_calcular.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| confirmado | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--confirmado--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--confirmado--dark--390--base.json) |
| confirmado | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--confirmado--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--confirmado--light--390--base.json) |
| en_validacion | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--en_validacion--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--en_validacion--dark--390--base.json) |
| en_validacion | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--en_validacion--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--en_validacion--light--390--base.json) |
| estimado | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--estimado--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--estimado--dark--390--base.json) |
| estimado | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--estimado--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--estimado--light--390--base.json) |
| pagado | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--pagado--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--pagado--dark--390--base.json) |
| pagado | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--pagado--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--pagado--light--390--base.json) |
| programado | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--programado--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--programado--dark--390--base.json) |
| programado | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--programado--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--programado--light--390--base.json) |
| rechazado | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--rechazado--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--rechazado--dark--390--base.json) |
| rechazado | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--rechazado--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--rechazado--light--390--base.json) |
| retenido | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--retenido--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--retenido--dark--390--base.json) |
| retenido | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--retenido--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--retenido--light--390--base.json) |
| sin_calcular | dark | 1440 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--1440--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--1440--responsive.json) |
| sin_calcular | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--1440--zoom-css-200.json) |
| sin_calcular | dark | 320 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--320--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--320--responsive.json) |
| sin_calcular | dark | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--390--base.json) |
| sin_calcular | dark | 390 | zoom-css-200 | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--390--zoom-css-200.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--390--zoom-css-200.json) |
| sin_calcular | dark | 768 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--dark--768--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--dark--768--responsive.json) |
| sin_calcular | light | 1440 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--1440--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--1440--responsive.json) |
| sin_calcular | light | 1440 | zoom-css-200 | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--1440--zoom-css-200.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--1440--zoom-css-200.json) |
| sin_calcular | light | 320 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--320--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--320--responsive.json) |
| sin_calcular | light | 390 | base | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--390--base.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--390--base.json) |
| sin_calcular | light | 390 | zoom-css-200 | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--390--zoom-css-200.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--390--zoom-css-200.json) |
| sin_calcular | light | 768 | responsive | [PNG](../capturas-base/EstatusBadgeEconomico--sin_calcular--light--768--responsive.png) | [JSON](../resultados-base/EstatusBadgeEconomico--sin_calcular--light--768--responsive.json) |
