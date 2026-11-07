# DriverEarning

## Propósito

Presentar ganancia oficial o pendiente del conductor.

## Props y contrato

Fuente: [packages/ui/src/components/DriverEarning.tsx:5](../../../packages/ui/src/components/DriverEarning.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function DriverEarning(props: DriverEarningProps) 

export type DriverEarningProps = FinancialAmountProps;
```

## Uso correcto de API

```tsx
import { DriverEarning } from "@ruum/ui";
<DriverEarning status="sin_calcular" amount={null} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<DriverEarning status="pagado" amount={0} />
```

## Accesibilidad y limitaciones

No usar cero como sustituto de ausencia. Reutiliza FinancialAmount.

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
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| confirmado | dark | 390 | base | [PNG](../capturas-base/DriverEarning--confirmado--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--confirmado--dark--390--base.json) |
| confirmado | light | 390 | base | [PNG](../capturas-base/DriverEarning--confirmado--light--390--base.png) | [JSON](../resultados-base/DriverEarning--confirmado--light--390--base.json) |
| en_validacion | dark | 390 | base | [PNG](../capturas-base/DriverEarning--en_validacion--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--en_validacion--dark--390--base.json) |
| en_validacion | light | 390 | base | [PNG](../capturas-base/DriverEarning--en_validacion--light--390--base.png) | [JSON](../resultados-base/DriverEarning--en_validacion--light--390--base.json) |
| estimado | dark | 390 | base | [PNG](../capturas-base/DriverEarning--estimado--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--estimado--dark--390--base.json) |
| estimado | light | 390 | base | [PNG](../capturas-base/DriverEarning--estimado--light--390--base.png) | [JSON](../resultados-base/DriverEarning--estimado--light--390--base.json) |
| pagado | dark | 390 | base | [PNG](../capturas-base/DriverEarning--pagado--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--pagado--dark--390--base.json) |
| pagado | light | 390 | base | [PNG](../capturas-base/DriverEarning--pagado--light--390--base.png) | [JSON](../resultados-base/DriverEarning--pagado--light--390--base.json) |
| programado | dark | 390 | base | [PNG](../capturas-base/DriverEarning--programado--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--programado--dark--390--base.json) |
| programado | light | 390 | base | [PNG](../capturas-base/DriverEarning--programado--light--390--base.png) | [JSON](../resultados-base/DriverEarning--programado--light--390--base.json) |
| rechazado | dark | 390 | base | [PNG](../capturas-base/DriverEarning--rechazado--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--rechazado--dark--390--base.json) |
| rechazado | light | 390 | base | [PNG](../capturas-base/DriverEarning--rechazado--light--390--base.png) | [JSON](../resultados-base/DriverEarning--rechazado--light--390--base.json) |
| retenido | dark | 390 | base | [PNG](../capturas-base/DriverEarning--retenido--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--retenido--dark--390--base.json) |
| retenido | light | 390 | base | [PNG](../capturas-base/DriverEarning--retenido--light--390--base.png) | [JSON](../resultados-base/DriverEarning--retenido--light--390--base.json) |
| sin_calcular | dark | 1440 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--1440--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--1440--responsive.json) |
| sin_calcular | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--1440--zoom-css-200.json) |
| sin_calcular | dark | 320 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--320--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--320--responsive.json) |
| sin_calcular | dark | 390 | base | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--390--base.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--390--base.json) |
| sin_calcular | dark | 390 | zoom-css-200 | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--390--zoom-css-200.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--390--zoom-css-200.json) |
| sin_calcular | dark | 768 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--dark--768--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--dark--768--responsive.json) |
| sin_calcular | light | 1440 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--light--1440--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--1440--responsive.json) |
| sin_calcular | light | 1440 | zoom-css-200 | [PNG](../capturas-base/DriverEarning--sin_calcular--light--1440--zoom-css-200.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--1440--zoom-css-200.json) |
| sin_calcular | light | 320 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--light--320--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--320--responsive.json) |
| sin_calcular | light | 390 | base | [PNG](../capturas-base/DriverEarning--sin_calcular--light--390--base.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--390--base.json) |
| sin_calcular | light | 390 | zoom-css-200 | [PNG](../capturas-base/DriverEarning--sin_calcular--light--390--zoom-css-200.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--390--zoom-css-200.json) |
| sin_calcular | light | 768 | responsive | [PNG](../capturas-base/DriverEarning--sin_calcular--light--768--responsive.png) | [JSON](../resultados-base/DriverEarning--sin_calcular--light--768--responsive.json) |
