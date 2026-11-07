# Aviso

## Propósito

Mostrar información, éxito, advertencia o error.

## Props y contrato

Fuente: [packages/ui/src/components/Aviso.tsx:34](../../../packages/ui/src/components/Aviso.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Aviso({ tono = "info", titulo, children, className = "" }: AvisoProps) 

export interface AvisoProps {
  tono?: "info" | "success" | "atencion" | "warning" | "danger" | "error";
  titulo?: string;
  children: ReactNode;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { Aviso } from "@ruum/ui";
<Aviso tono="danger">Revisa la solicitud.</Aviso>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<Aviso tono="danger" />
```

## Accesibilidad y limitaciones

Icono y texto evitan depender solo del color.

No se pasan className/style para corregir el componente base.

## Estados

atencion, danger, error, info, success, warning.

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
| atencion | dark | 390 | base | [PNG](../capturas-base/Aviso--atencion--dark--390--base.png) | [JSON](../resultados-base/Aviso--atencion--dark--390--base.json) |
| atencion | light | 390 | base | [PNG](../capturas-base/Aviso--atencion--light--390--base.png) | [JSON](../resultados-base/Aviso--atencion--light--390--base.json) |
| danger | dark | 390 | base | [PNG](../capturas-base/Aviso--danger--dark--390--base.png) | [JSON](../resultados-base/Aviso--danger--dark--390--base.json) |
| danger | light | 390 | base | [PNG](../capturas-base/Aviso--danger--light--390--base.png) | [JSON](../resultados-base/Aviso--danger--light--390--base.json) |
| error | dark | 390 | base | [PNG](../capturas-base/Aviso--error--dark--390--base.png) | [JSON](../resultados-base/Aviso--error--dark--390--base.json) |
| error | light | 390 | base | [PNG](../capturas-base/Aviso--error--light--390--base.png) | [JSON](../resultados-base/Aviso--error--light--390--base.json) |
| info | dark | 1440 | responsive | [PNG](../capturas-base/Aviso--info--dark--1440--responsive.png) | [JSON](../resultados-base/Aviso--info--dark--1440--responsive.json) |
| info | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Aviso--info--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Aviso--info--dark--1440--zoom-css-200.json) |
| info | dark | 320 | responsive | [PNG](../capturas-base/Aviso--info--dark--320--responsive.png) | [JSON](../resultados-base/Aviso--info--dark--320--responsive.json) |
| info | dark | 390 | base | [PNG](../capturas-base/Aviso--info--dark--390--base.png) | [JSON](../resultados-base/Aviso--info--dark--390--base.json) |
| info | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Aviso--info--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Aviso--info--dark--390--zoom-css-200.json) |
| info | dark | 768 | responsive | [PNG](../capturas-base/Aviso--info--dark--768--responsive.png) | [JSON](../resultados-base/Aviso--info--dark--768--responsive.json) |
| info | light | 1440 | responsive | [PNG](../capturas-base/Aviso--info--light--1440--responsive.png) | [JSON](../resultados-base/Aviso--info--light--1440--responsive.json) |
| info | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Aviso--info--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Aviso--info--light--1440--zoom-css-200.json) |
| info | light | 320 | responsive | [PNG](../capturas-base/Aviso--info--light--320--responsive.png) | [JSON](../resultados-base/Aviso--info--light--320--responsive.json) |
| info | light | 390 | base | [PNG](../capturas-base/Aviso--info--light--390--base.png) | [JSON](../resultados-base/Aviso--info--light--390--base.json) |
| info | light | 390 | zoom-css-200 | [PNG](../capturas-base/Aviso--info--light--390--zoom-css-200.png) | [JSON](../resultados-base/Aviso--info--light--390--zoom-css-200.json) |
| info | light | 768 | responsive | [PNG](../capturas-base/Aviso--info--light--768--responsive.png) | [JSON](../resultados-base/Aviso--info--light--768--responsive.json) |
| success | dark | 390 | base | [PNG](../capturas-base/Aviso--success--dark--390--base.png) | [JSON](../resultados-base/Aviso--success--dark--390--base.json) |
| success | light | 390 | base | [PNG](../capturas-base/Aviso--success--light--390--base.png) | [JSON](../resultados-base/Aviso--success--light--390--base.json) |
| warning | dark | 390 | base | [PNG](../capturas-base/Aviso--warning--dark--390--base.png) | [JSON](../resultados-base/Aviso--warning--dark--390--base.json) |
| warning | light | 390 | base | [PNG](../capturas-base/Aviso--warning--light--390--base.png) | [JSON](../resultados-base/Aviso--warning--light--390--base.json) |
