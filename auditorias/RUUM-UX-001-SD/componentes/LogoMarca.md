# LogoMarca

## Propósito

Mostrar una variante oficial de la marca.

## Props y contrato

Fuente: [packages/ui/src/components/LogoMarca.tsx:239](../../../packages/ui/src/components/LogoMarca.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function LogoMarca({
  variante = "horizontal",
  tema = "auto",
  tamano,
  mostrarRespaldo = false,
  mostrarDescriptor = true,
  descriptor = "DRIVEAWAY SERVICE",
  subtitulo,
  color = "signal",
  className = ""
}: LogoMarcaProps) 

export type LogoVariante = "horizontal" | "vertical" | "simbolo" | "avatar" | "sello" | "version-navy";

export type LogoTema = "oscuro" | "claro" | "monocromatico" | "auto";

export interface LogoMarcaProps {
  /**
   * Variante gráfica del logotipo (Libro de marca, `ruum-ruum-versiones-marca.png`):
   * - "horizontal": símbolo + Ruum Ruum + DRIVEAWAY SERVICE. B2B / contratos / web / encabezados.
   * - "vertical": símbolo arriba + nombre + firma. Portadas / carteles.
   * - "simbolo": solo monograma RR con swoosh turquesa + pin. Avatar / app-icon / favicon.
   * - "avatar": símbolo sobre superficie clara, radio ≈24%. WhatsApp / redes / perfiles.
   * - "sello": anillo CONDUCTOR CERTIFICADO RUUM RUUM + símbolo. Solo certificación vigente.
   * - "version-navy": lockup blanco sobre navy. Solo piezas institucionales sobre oscuro.
   *
   * Mínimos: símbolo 32px · horizontal sin firma 96px · con firma 160px ·
   * sello 72px · avatar 48px. Área de seguridad = x (altura R) por lado.
   */
  variante?: LogoVariante;
  /**
   * Contraste:
   * - "auto": adapta navy→blanco según `[data-theme]` (por defecto).
   * - "oscuro": fuerza versión clara (para fondos oscuros / navy).
   * - "claro": fuerza versión navy (para fondos claros).
   * - "monocromatico": un solo tono neutro.
   */
  tema?: LogoTema;
  /** Alto objetivo en px del lockup. La firma corta solo se muestra ≥160px. */
  tamano?: number;
  /** Respaldo 'by MoviliaX' (documentos formales). */
  mostrarRespaldo?: boolean;
  /** Firma corta oficial. Por defecto 'DRIVEAWAY SERVICE'. */
  mostrarDescriptor?: boolean;
  /** Texto personalizado para la firma (por defecto 'DRIVEAWAY SERVICE'). */
  descriptor?: string;
  /** Subtítulo o lema adicional. */
  subtitulo?: string;
  /** Color de apoyo para el pin (compatibilidad; por defecto teal gráfico). */
  color?: "signal" | "route" | "control";
  className?: string;
  /** Conservado por compatibilidad; el símbolo oficial no usa progreso. */
  progreso?: number;
}
```

## Uso correcto de API

```tsx
import { LogoMarca } from "@ruum/ui";
<LogoMarca variante="horizontal" tema="auto" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<LogoMarca variante="version-navy" tema="claro" />
```

## Accesibilidad y limitaciones

Respetar fondos y mínimos de marca; revisar exenciones de contraste solo cuando correspondan.

No se pasan className/style para corregir el componente base.

## Estados

avatar, horizontal, sello, simbolo, version-navy, vertical.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: ninguna en las muestras.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| avatar | dark | 390 | base | [PNG](../capturas-base/LogoMarca--avatar--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--avatar--dark--390--base.json) |
| avatar | light | 390 | base | [PNG](../capturas-base/LogoMarca--avatar--light--390--base.png) | [JSON](../resultados-base/LogoMarca--avatar--light--390--base.json) |
| horizontal | dark | 1440 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--dark--1440--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--1440--responsive.json) |
| horizontal | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/LogoMarca--horizontal--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--1440--zoom-css-200.json) |
| horizontal | dark | 320 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--dark--320--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--320--responsive.json) |
| horizontal | dark | 390 | base | [PNG](../capturas-base/LogoMarca--horizontal--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--390--base.json) |
| horizontal | dark | 390 | zoom-css-200 | [PNG](../capturas-base/LogoMarca--horizontal--dark--390--zoom-css-200.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--390--zoom-css-200.json) |
| horizontal | dark | 768 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--dark--768--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--dark--768--responsive.json) |
| horizontal | light | 1440 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--light--1440--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--1440--responsive.json) |
| horizontal | light | 1440 | zoom-css-200 | [PNG](../capturas-base/LogoMarca--horizontal--light--1440--zoom-css-200.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--1440--zoom-css-200.json) |
| horizontal | light | 320 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--light--320--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--320--responsive.json) |
| horizontal | light | 390 | base | [PNG](../capturas-base/LogoMarca--horizontal--light--390--base.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--390--base.json) |
| horizontal | light | 390 | zoom-css-200 | [PNG](../capturas-base/LogoMarca--horizontal--light--390--zoom-css-200.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--390--zoom-css-200.json) |
| horizontal | light | 768 | responsive | [PNG](../capturas-base/LogoMarca--horizontal--light--768--responsive.png) | [JSON](../resultados-base/LogoMarca--horizontal--light--768--responsive.json) |
| sello | dark | 390 | base | [PNG](../capturas-base/LogoMarca--sello--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--sello--dark--390--base.json) |
| sello | light | 390 | base | [PNG](../capturas-base/LogoMarca--sello--light--390--base.png) | [JSON](../resultados-base/LogoMarca--sello--light--390--base.json) |
| simbolo | dark | 390 | base | [PNG](../capturas-base/LogoMarca--simbolo--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--simbolo--dark--390--base.json) |
| simbolo | light | 390 | base | [PNG](../capturas-base/LogoMarca--simbolo--light--390--base.png) | [JSON](../resultados-base/LogoMarca--simbolo--light--390--base.json) |
| version-navy | dark | 390 | base | [PNG](../capturas-base/LogoMarca--version-navy--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--version-navy--dark--390--base.json) |
| version-navy | light | 390 | base | [PNG](../capturas-base/LogoMarca--version-navy--light--390--base.png) | [JSON](../resultados-base/LogoMarca--version-navy--light--390--base.json) |
| vertical | dark | 390 | base | [PNG](../capturas-base/LogoMarca--vertical--dark--390--base.png) | [JSON](../resultados-base/LogoMarca--vertical--dark--390--base.json) |
| vertical | light | 390 | base | [PNG](../capturas-base/LogoMarca--vertical--light--390--base.png) | [JSON](../resultados-base/LogoMarca--vertical--light--390--base.json) |
