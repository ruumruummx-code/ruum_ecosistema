# Icono

## Propósito

Mostrar un glifo decorativo reutilizable.

## Props y contrato

Fuente: [packages/ui/src/components/Icono.tsx:33](../../../packages/ui/src/components/Icono.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function Icono({ nombre, d, className = "size-5", strokeWidth = 1.8, style }: IconoProps) 

export type NombreIcono = keyof typeof SENDAS_ICONO;

interface IconoProps {
  /** Glifo del registro compartido. */
  nombre?: NombreIcono;
  /** Senda libre (migración de wrappers `Icono({d})` locales). */
  d?: string;
  className?: string;
  strokeWidth?: number | string;
  style?: CSSProperties;
}
```

## Uso correcto de API

```tsx
import { Icono } from "@ruum/ui";
<Button>Volver<Icono nombre="atras" /></Button>
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<button><Icono nombre="atras" /></button>
```

## Accesibilidad y limitaciones

aria-hidden: no aporta nombre al control contenedor.

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

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/Icono--default--dark--1440--responsive.png) | [JSON](../resultados-base/Icono--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/Icono--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/Icono--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/Icono--default--dark--320--responsive.png) | [JSON](../resultados-base/Icono--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/Icono--default--dark--390--base.png) | [JSON](../resultados-base/Icono--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/Icono--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/Icono--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/Icono--default--dark--768--responsive.png) | [JSON](../resultados-base/Icono--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/Icono--default--light--1440--responsive.png) | [JSON](../resultados-base/Icono--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/Icono--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/Icono--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/Icono--default--light--320--responsive.png) | [JSON](../resultados-base/Icono--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/Icono--default--light--390--base.png) | [JSON](../resultados-base/Icono--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/Icono--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/Icono--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/Icono--default--light--768--responsive.png) | [JSON](../resultados-base/Icono--default--light--768--responsive.json) |
