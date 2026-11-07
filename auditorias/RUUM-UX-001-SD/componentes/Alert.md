# Alert

## Propósito

Anunciar feedback con icono y texto.

## Props y contrato

Fuente: [packages/ui/src/components/Alert.tsx:36](../../../packages/ui/src/components/Alert.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Alert({ tono = "info", titulo, children, className = "" }: AlertProps) 

export type AlertTono = "success" | "error" | "warning" | "info";

export interface AlertProps {
  tono?: AlertTono;
  titulo?: string;
  children: ReactNode;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { Alert } from "@ruum/ui";
<Alert tono="error">No se pudo guardar.</Alert>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Alert tono="error" />
```

## Accesibilidad y limitaciones

Error usa alert; el resto status. No desaparecer antes de lectura.

No se pasan className/style para corregir el componente base.

## Estados

error, info, success, warning.

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
| error | dark | 390 | base | [PNG](../capturas-base/Alert--error--dark--390--base.png) | [JSON](../resultados-base/Alert--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/Alert--error--light--390--base.png) | [JSON](../resultados-base/Alert--error--light--390--base.json) |
| info | dark | 1440 | responsive | [PNG](../capturas-base/Alert--info--dark--1440--responsive.png) | [JSON](../resultados-base/Alert--info--dark--1440--responsive.json) |
| info | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Alert--info--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Alert--info--dark--1440--zoom-css-200.json) |
| info | dark | 320 | responsive | [PNG](../capturas-base/Alert--info--dark--320--responsive.png) | [JSON](../resultados-base/Alert--info--dark--320--responsive.json) |
| info | dark | 390 | base | [PNG](../capturas-base/Alert--info--dark--390--base.png) | [JSON](../resultados-base/Alert--info--dark--390--base.json) |
| info | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Alert--info--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Alert--info--dark--390--zoom-css-200.json) |
| info | dark | 768 | responsive | [PNG](../capturas-base/Alert--info--dark--768--responsive.png) | [JSON](../resultados-base/Alert--info--dark--768--responsive.json) |
| info | light | 1440 | responsive | [PNG](../capturas-base/Alert--info--light--1440--responsive.png) | [JSON](../resultados-base/Alert--info--light--1440--responsive.json) |
| info | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Alert--info--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Alert--info--light--1440--zoom-css-200.json) |
| info | light | 320 | responsive | [PNG](../capturas-base/Alert--info--light--320--responsive.png) | [JSON](../resultados-base/Alert--info--light--320--responsive.json) |
| info | light | 390 | base | [PNG](../capturas-base/Alert--info--light--390--base.png) | [JSON](../resultados-base/Alert--info--light--390--base.json) |
| info | light | 390 | zoom-css-200 | [PNG](../capturas-base/Alert--info--light--390--zoom-css-200.png) | [JSON](../resultados-base/Alert--info--light--390--zoom-css-200.json) |
| info | light | 768 | responsive | [PNG](../capturas-base/Alert--info--light--768--responsive.png) | [JSON](../resultados-base/Alert--info--light--768--responsive.json) |
| success | dark | 390 | base | [PNG](../capturas-base/Alert--success--dark--390--base.png) | [JSON](../resultados-base/Alert--success--dark--390--base.json) |
| success | light | 390 | base | [PNG](../capturas-base/Alert--success--light--390--base.png) | [JSON](../resultados-base/Alert--success--light--390--base.json) |
| warning | dark | 390 | base | [PNG](../capturas-base/Alert--warning--dark--390--base.png) | [JSON](../resultados-base/Alert--warning--dark--390--base.json) |
| warning | light | 390 | base | [PNG](../capturas-base/Alert--warning--light--390--base.png) | [JSON](../resultados-base/Alert--warning--light--390--base.json) |
