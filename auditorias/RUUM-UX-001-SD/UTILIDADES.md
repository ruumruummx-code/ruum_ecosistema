# Utilidades e integración

useDialogAccesible, useRuumTheme y useStreetMode se montan mediante consumidores mínimos en el showcase. indiceEtapaActual y estadoVisualDesdeTecnico se cubren por las pruebas existentes de mapeos y estados. Los helpers no reciben un veredicto visual como si fueran DOM.

Veredicto de utilidades: conforme con condiciones de integración y co-revisión; no es aceptación formal.

useDialogAccesible pasó entrada, contención bidireccional, Escape y retorno de foco en la muestra de dialog nativo, en ambos temas. No se extrapola a Modal, que utiliza otra implementación. Los hooks de tema/calle se montan y recorren con teclado; no se certifican persistencia completa entre sesiones, concurrencia entre proveedores ni dispositivos físicos.

TextInputUppercaseBridge se documenta como componente de integración sin DOM propio: la muestra incorpora campos y comprueba mayúsculas de nombre y preservación del correo. IME, cursor y casos lingüísticos ampliados quedan sujetos a integración.

## indiceEtapaActual

Fuente: packages/ui/src/components/etapas.ts:80.

```tsx
export function indiceEtapaActual(estado: EstadoTraslado): number 

export interface EtapaTraslado {
  id: string;
  etiqueta: string;
  estados: EstadoTraslado[];
}
```

## estadoVisualDesdeTecnico

Fuente: packages/ui/src/components/status-mapping.ts:16.

```tsx
export function estadoVisualDesdeTecnico(tecnico: string): EstadoVisualTraslado 

export type EstadoVisualTraslado =
  | "solicitado"
  | "cotizacion-confirmada"
  | "pendiente-conductor"
  | "conductor-asignado"
  | "evidencia-inicial-completa"
  | "en-ruta"
  | "entrega-confirmada"
  | "cerrado"
  | "evidencia-pendiente"
  | "incidente-abierto"
  | "cancelado"
  | "pago-detenido";
```

## useStreetMode

Fuente: packages/ui/src/components/StreetMode.tsx:12.

```tsx
export function useStreetMode(trasladoActivo: boolean) 


```

## useRuumTheme

Fuente: packages/ui/src/components/Theme.tsx:39.

```tsx
export function useRuumTheme() 

export type RuumTheme = "light" | "dark";

export type RuumThemeMode = "auto" | RuumTheme;
```

## useDialogAccesible

Fuente: packages/ui/src/components/useDialogAccesible.ts:26.

```tsx
export function useDialogAccesible({
  abierto = true,
  focoInicial,
  alCancelar,
}: OpcionesDialogAccesible = {}) 

export interface OpcionesDialogAccesible {
  /** Mostrar el diálogo. Por defecto true (montar = abrir). */
  abierto?: boolean;
  /** Elemento que recibe el foco inicial (p. ej. cerrar o checkbox). */
  focoInicial?: RefObject<HTMLElement | null>;
  /** Cancel nativo (ESC): se hace preventDefault y se delega aquí. */
  alCancelar?: () => void;
}
```

