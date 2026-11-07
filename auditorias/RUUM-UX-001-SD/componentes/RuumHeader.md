# RuumHeader

## Propósito

Presentar marca, rol y acciones de soporte/notificaciones.

## Props y contrato

Fuente: [packages/ui/src/components/RuumHeader.tsx:79](../../../packages/ui/src/components/RuumHeader.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function RuumHeader({
  rol = "usuario",
  notificacionesCount = 0,
  onNotificaciones,
  onSoporte,
  accionIzquierda,
  hrefLogo = "/",
  className = "",
}: RuumHeaderProps) 

export type RolHeader = "conductor" | "usuario";

export interface RuumHeaderProps {
  /**
   * Rol de la aplicación. Define la etiqueta que se muestra debajo del nombre
   * de la marca: `"conductor"` para Ruum Ruum Conductor y `"Usuario"` para
   * Ruum Ruum Usuario.
   */
  rol?: RolHeader;
  /** Cantidad de notificaciones pendientes. Si es mayor a 0 se muestra el punto de alerta. */
  notificacionesCount?: number;
  /** Acción del botón de notificaciones (campana). */
  onNotificaciones?: () => void;
  /** Acción del botón de soporte/ayuda (audífonos). */
  onSoporte?: () => void;
  /** Acción adicional colocada a la izquierda del branding (p. ej. menú del conductor). */
  accionIzquierda?: ReactNode;
  /** Destino del logotipo (por defecto "/" — inicio de la app). */
  hrefLogo?: string;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { RuumHeader } from "@ruum/ui";
<RuumHeader rol="usuario" onSoporte={abrirSoporte} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<RuumHeader rol="usuario" onSoporte={undefined} />
```

## Accesibilidad y limitaciones

Ejemplo incorrecto si se requiere ofrecer soporte: omisión retira acción. Revisar nombre del enlace de marca.

No se pasan className/style para corregir el componente base.

## Estados

default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: no conforme.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-011](../remediaciones/SD-REM-011.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/RuumHeader--default--dark--1440--responsive.png) | [JSON](../resultados-base/RuumHeader--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/RuumHeader--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/RuumHeader--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/RuumHeader--default--dark--320--responsive.png) | [JSON](../resultados-base/RuumHeader--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/RuumHeader--default--dark--390--base.png) | [JSON](../resultados-base/RuumHeader--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/RuumHeader--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/RuumHeader--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/RuumHeader--default--dark--768--responsive.png) | [JSON](../resultados-base/RuumHeader--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/RuumHeader--default--light--1440--responsive.png) | [JSON](../resultados-base/RuumHeader--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/RuumHeader--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/RuumHeader--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/RuumHeader--default--light--320--responsive.png) | [JSON](../resultados-base/RuumHeader--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/RuumHeader--default--light--390--base.png) | [JSON](../resultados-base/RuumHeader--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/RuumHeader--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/RuumHeader--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/RuumHeader--default--light--768--responsive.png) | [JSON](../resultados-base/RuumHeader--default--light--768--responsive.json) |
