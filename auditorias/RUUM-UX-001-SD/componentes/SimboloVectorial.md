# SimboloVectorial

## Propósito

Mostrar símbolo oficial como SVG.

## Props y contrato

Fuente: [packages/ui/src/components/LogoMarca.tsx:157](../../../packages/ui/src/components/LogoMarca.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function SimboloVectorial({
  tamano = 36,
  tema = "auto",
  colorDestino = "#00D1D1",
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & {
  tamano?: number;
  tema?: LogoTema;
  colorDestino?: string;
  className?: string;
}) 

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
import { SimboloVectorial } from "@ruum/ui";
<SimboloVectorial tamano={72} />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<button><SimboloVectorial /></button>
```

## Accesibilidad y limitaciones

Si es único contenido de una acción, el botón requiere nombre explícito.

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
- Adjudicar incomplete de axe: color-contrast.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/SimboloVectorial--default--dark--1440--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/SimboloVectorial--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/SimboloVectorial--default--dark--320--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/SimboloVectorial--default--dark--390--base.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/SimboloVectorial--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/SimboloVectorial--default--dark--768--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/SimboloVectorial--default--light--1440--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/SimboloVectorial--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/SimboloVectorial--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/SimboloVectorial--default--light--320--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/SimboloVectorial--default--light--390--base.png) | [JSON](../resultados-base/SimboloVectorial--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/SimboloVectorial--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/SimboloVectorial--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/SimboloVectorial--default--light--768--responsive.png) | [JSON](../resultados-base/SimboloVectorial--default--light--768--responsive.json) |
