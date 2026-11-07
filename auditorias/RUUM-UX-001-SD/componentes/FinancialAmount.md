# FinancialAmount

## Propósito

Presentar importe y estado económico sin inventar datos.

## Props y contrato

Fuente: [packages/ui/src/components/FinancialAmount.tsx:59](../../../packages/ui/src/components/FinancialAmount.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function FinancialAmount({
  amount,
  status,
  currency = "MXN",
  className = "",
  amountClassName = "",
  auxiliaryText,
  pendingText = "Importe por confirmar"
}: FinancialAmountProps) 

export type FinancialAmountStatus = EstadoEconomicoExplicito | "estimated" | "pending_confirmation";

export interface FinancialAmountProps {
  amount?: number | null;
  status: FinancialAmountStatus;
  currency?: "MXN" | string;
  className?: string;
  amountClassName?: string;
  auxiliaryText?: string;
  pendingText?: string;
}
```

## Uso correcto de API

```tsx
import { FinancialAmount } from "@ruum/ui";
<FinancialAmount status="sin_calcular" amount={null} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<FinancialAmount status="confirmado" amount={0} />
```

## Accesibilidad y limitaciones

El ejemplo incorrecto aplica cuando cero sustituye ausencia; cero real sí es válido.

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
| confirmado | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--confirmado--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--confirmado--dark--390--base.json) |
| confirmado | light | 390 | base | [PNG](../capturas-base/FinancialAmount--confirmado--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--confirmado--light--390--base.json) |
| en_validacion | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--en_validacion--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--en_validacion--dark--390--base.json) |
| en_validacion | light | 390 | base | [PNG](../capturas-base/FinancialAmount--en_validacion--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--en_validacion--light--390--base.json) |
| estimado | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--estimado--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--estimado--dark--390--base.json) |
| estimado | light | 390 | base | [PNG](../capturas-base/FinancialAmount--estimado--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--estimado--light--390--base.json) |
| pagado | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--pagado--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--pagado--dark--390--base.json) |
| pagado | light | 390 | base | [PNG](../capturas-base/FinancialAmount--pagado--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--pagado--light--390--base.json) |
| programado | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--programado--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--programado--dark--390--base.json) |
| programado | light | 390 | base | [PNG](../capturas-base/FinancialAmount--programado--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--programado--light--390--base.json) |
| rechazado | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--rechazado--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--rechazado--dark--390--base.json) |
| rechazado | light | 390 | base | [PNG](../capturas-base/FinancialAmount--rechazado--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--rechazado--light--390--base.json) |
| retenido | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--retenido--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--retenido--dark--390--base.json) |
| retenido | light | 390 | base | [PNG](../capturas-base/FinancialAmount--retenido--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--retenido--light--390--base.json) |
| sin_calcular | dark | 1440 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--1440--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--1440--responsive.json) |
| sin_calcular | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--1440--zoom-css-200.json) |
| sin_calcular | dark | 320 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--320--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--320--responsive.json) |
| sin_calcular | dark | 390 | base | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--390--base.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--390--base.json) |
| sin_calcular | dark | 390 | zoom-css-200 | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--390--zoom-css-200.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--390--zoom-css-200.json) |
| sin_calcular | dark | 768 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--dark--768--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--dark--768--responsive.json) |
| sin_calcular | light | 1440 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--1440--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--1440--responsive.json) |
| sin_calcular | light | 1440 | zoom-css-200 | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--1440--zoom-css-200.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--1440--zoom-css-200.json) |
| sin_calcular | light | 320 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--320--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--320--responsive.json) |
| sin_calcular | light | 390 | base | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--390--base.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--390--base.json) |
| sin_calcular | light | 390 | zoom-css-200 | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--390--zoom-css-200.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--390--zoom-css-200.json) |
| sin_calcular | light | 768 | responsive | [PNG](../capturas-base/FinancialAmount--sin_calcular--light--768--responsive.png) | [JSON](../resultados-base/FinancialAmount--sin_calcular--light--768--responsive.json) |
