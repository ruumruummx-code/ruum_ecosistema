# CredencialConductor

## Propósito

Presentar identificación del conductor certificado.

## Props y contrato

Fuente: [packages/ui/src/components/CredencialConductor.tsx:21](../../../packages/ui/src/components/CredencialConductor.tsx). Declaraciones extraídas del módulo; los atributos nativos heredados siguen React/HTML.

```tsx
export function CredencialConductor({
  nombreConductor,
  folioInterno,
  vigencia,
  fotoUrl,
  telefonoOperativo = "+52 55 1234 5678",
  nivelCertificacion = "Nivel 1 · Básico",
  className = ""
}: CredencialConductorProps) 

export interface CredencialConductorProps {
  nombreConductor: string;
  folioInterno: string;
  vigencia: string;
  fotoUrl?: string;
  telefonoOperativo?: string;
  nivelCertificacion?: string;
  qrValor?: string;
  className?: string;
}
```

## Uso correcto de API

```tsx
import { CredencialConductor } from "@ruum/ui";
<CredencialConductor nombreConductor="María" folioInterno="C-1" vigencia="31/12/2026" />
```

El consumidor aporta callbacks, datos y estado. Muestra completa ejecutable en [showcase.tsx](../showcase.tsx). API válida no implica que los defectos actuales estén corregidos.

## Uso incorrecto o incompleto

```tsx
<CredencialConductor nombreConductor="" folioInterno="" vigencia="" />
```

## Accesibilidad y limitaciones

Documento fuerza modo claro; no publicar valores operativos ficticios por defecto.

No se pasan className/style para corregir el componente base.

## Estados

default.

Hover/focus/focus-visible/active aplican cuando hay control visible. En contenedores, se ensayan sobre el hijo interactivo, no sobre la tarjeta. Disabled/loading/error solo aplican si el contrato los admite; no se inventan props para componentes estáticos.

**Veredicto técnico: conforme con condiciones.** Axe con infracciones: heading-order.

Acciones: [SD-REM-012](../remediaciones/SD-REM-012.md).

Condiciones:

- Co-revisión nominal de Diseño de Sistemas y aceptación de condiciones.
- Zoom nativo, tecnología asistiva y composición final pendientes.
- Tipografía y escalas: SD-REM-009.
- Adjudicar incomplete de axe: color-contrast.
- Resolver o justificar jerarquía de títulos en el consumidor.
- Adjudicar candidatos de recorte/desbordamiento, distinguiendo scroll intencionado.

## Evidencia

| Estado | Tema | Ancho | Modo | Captura | Reporte/árbol |
|---|---|---|---|---|---|
| default | dark | 1440 | responsive | [PNG](../capturas-base/CredencialConductor--default--dark--1440--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--dark--1440--responsive.json) |
| default | dark | 1440 | zoom-css-200 | [PNG](../capturas-base/CredencialConductor--default--dark--1440--zoom-css-200.png) | [JSON](../resultados-base/CredencialConductor--default--dark--1440--zoom-css-200.json) |
| default | dark | 320 | responsive | [PNG](../capturas-base/CredencialConductor--default--dark--320--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--dark--320--responsive.json) |
| default | dark | 390 | base | [PNG](../capturas-base/CredencialConductor--default--dark--390--base.png) | [JSON](../resultados-base/CredencialConductor--default--dark--390--base.json) |
| default | dark | 390 | zoom-css-200 | [PNG](../capturas-base/CredencialConductor--default--dark--390--zoom-css-200.png) | [JSON](../resultados-base/CredencialConductor--default--dark--390--zoom-css-200.json) |
| default | dark | 768 | responsive | [PNG](../capturas-base/CredencialConductor--default--dark--768--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--dark--768--responsive.json) |
| default | light | 1440 | responsive | [PNG](../capturas-base/CredencialConductor--default--light--1440--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--light--1440--responsive.json) |
| default | light | 1440 | zoom-css-200 | [PNG](../capturas-base/CredencialConductor--default--light--1440--zoom-css-200.png) | [JSON](../resultados-base/CredencialConductor--default--light--1440--zoom-css-200.json) |
| default | light | 320 | responsive | [PNG](../capturas-base/CredencialConductor--default--light--320--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--light--320--responsive.json) |
| default | light | 390 | base | [PNG](../capturas-base/CredencialConductor--default--light--390--base.png) | [JSON](../resultados-base/CredencialConductor--default--light--390--base.json) |
| default | light | 390 | zoom-css-200 | [PNG](../capturas-base/CredencialConductor--default--light--390--zoom-css-200.png) | [JSON](../resultados-base/CredencialConductor--default--light--390--zoom-css-200.json) |
| default | light | 768 | responsive | [PNG](../capturas-base/CredencialConductor--default--light--768--responsive.png) | [JSON](../resultados-base/CredencialConductor--default--light--768--responsive.json) |
