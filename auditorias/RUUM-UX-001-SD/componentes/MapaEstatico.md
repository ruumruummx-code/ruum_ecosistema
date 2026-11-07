# MapaEstatico

## Propósito

Mostrar mapa o evidencia como imagen Next/Image.

## Props y contrato

Fuente: [packages/ui/src/components/MapaEstatico.tsx:22](../../../packages/ui/src/components/MapaEstatico.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function MapaEstatico({
  src,
  alt,
  className,
  sizes,
  eager,
  onLoad,
  style,
  width,
  height
}: MapaEstaticoProps) 

export interface MapaEstaticoProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  onLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
  style?: CSSProperties;
  /** Dimensiones fijas (miniaturas). Sin ellas usa `fill`: el padre debe ser `relative` con caja definida. */
  width?: number;
  height?: number;
}
```

## Uso correcto de API

```tsx
import { MapaEstatico } from "@ruum/ui";
<MapaEstatico src={urlMapa} alt="Ruta de CDMX a Puebla" width={240} height={120} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<MapaEstatico src={urlMapa} alt="" />
```

## Accesibilidad y limitaciones

fill necesita padre relative con dimensiones; optimización remota depende de Next config.

No se pasan className/style para corregir el componente base.

## Estados

default.

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
| default | dark | 1440 | responsive | [PNG](../capturas-base/MapaEstatico--default--dark--1440--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/MapaEstatico--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/MapaEstatico--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/MapaEstatico--default--dark--320--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/MapaEstatico--default--dark--390--base.png) | [JSON](../resultados-base/MapaEstatico--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/MapaEstatico--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/MapaEstatico--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/MapaEstatico--default--dark--768--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/MapaEstatico--default--light--1440--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/MapaEstatico--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/MapaEstatico--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/MapaEstatico--default--light--320--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/MapaEstatico--default--light--390--base.png) | [JSON](../resultados-base/MapaEstatico--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/MapaEstatico--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/MapaEstatico--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/MapaEstatico--default--light--768--responsive.png) | [JSON](../resultados-base/MapaEstatico--default--light--768--responsive.json) |
