# MobileHeader

## Propósito

Encabezar una pantalla móvil con retorno opcional.

## Props y contrato

Fuente: [packages/ui/src/components/MobileHeader.tsx:31](../../../packages/ui/src/components/MobileHeader.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MobileHeader({
  titulo,
  subtitulo,
  enlaceAtras,
  onAtras,
  etiquetaAtras = "Regresar",
  accionDerecha,
  conBorde = true,
  className = "",
}: MobileHeaderProps) 

export interface MobileHeaderProps {
  titulo: string;
  subtitulo?: string;
  enlaceAtras?: string;
  onAtras?: () => void;
  etiquetaAtras?: string;
  accionDerecha?: ReactNode;
  conBorde?: boolean;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { MobileHeader } from "@ruum/ui";
<MobileHeader titulo="Mis traslados" onAtras={volver} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MobileHeader titulo="" />
```

## Accesibilidad y limitaciones

Texto largo se trunca sin alternativa visible completa en el componente.

No se pasan className/style para corregir el componente base.

## Estados

default, long-label.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-006](../remediaciones/SD-REM-006.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/MobileHeader--default--dark--1440--responsive.png) | [JSON](../resultados-base/MobileHeader--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileHeader--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileHeader--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MobileHeader--default--dark--320--responsive.png) | [JSON](../resultados-base/MobileHeader--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MobileHeader--default--dark--390--base.png) | [JSON](../resultados-base/MobileHeader--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MobileHeader--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MobileHeader--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MobileHeader--default--dark--768--responsive.png) | [JSON](../resultados-base/MobileHeader--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MobileHeader--default--light--1440--responsive.png) | [JSON](../resultados-base/MobileHeader--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MobileHeader--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MobileHeader--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MobileHeader--default--light--320--responsive.png) | [JSON](../resultados-base/MobileHeader--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MobileHeader--default--light--390--base.png) | [JSON](../resultados-base/MobileHeader--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MobileHeader--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MobileHeader--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MobileHeader--default--light--768--responsive.png) | [JSON](../resultados-base/MobileHeader--default--light--768--responsive.json) |
| long-label | dark | 390 | base | [PNG](../capturas-base/MobileHeader--long-label--dark--390--base.png) | [JSON](../resultados-base/MobileHeader--long-label--dark--390--base.json) |
| long-label | light | 390 | base | [PNG](../capturas-base/MobileHeader--long-label--light--390--base.png) | [JSON](../resultados-base/MobileHeader--long-label--light--390--base.json) |
