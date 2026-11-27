# Sistema base v2 — cómo se construyen las pantallas

> Capa de componentes y tokens semánticos sobre la marca Ruum (patrón shadcn/ui).
> La marca no cambia: colores, tipografía Inter y reglas de accesibilidad siguen
> viniendo de `packages/ui/src/styles/tokens.css` (Libro de Marca V2.1).
> Pantalla de referencia: `apps/app-usuario/src/app/mis-viajes`.

## Por qué existe

En noviembre de 2026 la app usuario tenía unos 2,900 colores escritos a mano (750 distintos),
23 tamaños de letra, unos 20 radios y pantallas con una versión móvil y otra de escritorio
separadas. Los tokens existían, pero no se usaban porque había demasiados nombres para lo
mismo y faltaban componentes. Esta capa resuelve las dos cosas y un candado en CI impide
volver atrás.

## Reglas

1. **Una pantalla = un componente responsivo.** Se diseña en 390 px y se amplía con
   `sm: md: lg: xl:`. Prohibido crear `…Desktop.tsx` / `…Mobile.tsx` para el contenido.
   El marco de navegación (barra inferior / barra lateral) lo pone `page.tsx`.
2. **Componentes de `@ruum/ui/base`.** Nada de `<button>`, `<input>`, `<select>` o tarjetas
   con estilos propios si existe el componente.
3. **Color: solo clases `*-ui-*`.** Prohibidos hex, `rgb()`, la paleta de Tailwind
   (`slate-500`, `blue-600`…) y `dark:` (el tema lo resuelve la capa `ui-*`).
4. **Tipografía: escala de Tailwind.** `text-xs` (12) · `text-sm` (14) · `text-base` (16) ·
   `text-lg` (18) · `text-xl` (20) · `text-2xl` (24) · `text-3xl` (30). Prohibido `text-[13px]`.
   Mínimo 12 px; cuerpo 14–16 px; campos de formulario 16 px (evita el zoom de iOS).
5. **Radios:** `rounded-md` (botones, campos) · `rounded-lg` (tarjetas) · `rounded-xl`
   (hojas) · `rounded-full` (insignias, filtros). Prohibido `rounded-[22px]`.
6. **Un botón principal por bloque** (`<Button>` sin variante). El resto: `secondary`,
   `outline`, `ghost` o `link`.
7. **Estados con texto.** `<Badge>` siempre lleva etiqueta; el color nunca va solo.

`pnpm check:estilos` (en CI) aplica las reglas 3–5: las zonas migradas deben tener cero
infracciones y el resto de la app no puede empeorar respecto a su línea base.

## Tokens semánticos (`packages/ui/src/styles/base.css`)

| Clase | Uso | Claro / oscuro |
|---|---|---|
| `bg-ui-bg` | Fondo de la pantalla | gris muy claro / navy profundo |
| `bg-ui-card` | Tarjetas, hojas, campos | blanco / navy |
| `bg-ui-muted` | Rellenos suaves, skeleton, hover | gris claro / navy elevado |
| `text-ui-fg` · `text-ui-fg-muted` | Texto principal · secundario | navy · gris azulado |
| `border-ui-line` · `border-ui-line-strong` | Bordes de tarjeta · separadores marcados | navy al 11 % · 22 % |
| `border-ui-field` | Borde de campos (contraste ≥ 3:1) | `--ruum-border-strong` / `--ruum-border-input` |
| `bg-ui-brand` · `text-ui-on-brand` | Acción principal | azul acción |
| `bg-ui-brand-soft` · `text-ui-brand-soft-fg` | Acción secundaria, insignia informativa | azul tenue |
| `ui-success` · `ui-warning` · `ui-danger` · `ui-neutral` (+ `-soft`) | Estados | tokens de estado de marca |
| `ring-ui-ring` | Anillo de foco | `--ruum-focus-ring` |
| `shadow-ui-sm` · `shadow-ui-md` | Elevación | — |

Para un color nuevo: se agrega primero a `tokens.css` (con paridad en `tokens.json`) y luego
su alias aquí. Nunca un hex en una pantalla.

## Componentes (`import { … } from "@ruum/ui/base"`)

| Componente | Para qué |
|---|---|
| `Button` | Variantes `primary` (default), `secondary`, `outline`, `ghost`, `danger`, `link`; tamaños `sm`, `md`, `lg`, `icon`, `icon-sm`. `asChild` para envolver `<Link>`. |
| `Badge` | Estado con `tone`: `neutral`, `info`, `success`, `warning`, `danger`, `outline`; `dot`. |
| `Card` (+ `Header`, `Title`, `Description`, `Content`, `Footer`) | Contenedor estándar. |
| `Input`, `InputConIcono`, `NativeSelect`, `Label` | Formularios. `NativeSelect` usa el selector del sistema en móvil. |
| `ChipGroup` | Filtro de selección única con conteo y teclado (flechas, Inicio, Fin). |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Pestañas accesibles (Radix). |
| `Sheet` | Hoja inferior en móvil y diálogo centrado desde 640 px, sobre `<dialog>` nativo (compatible con la CSP: no inyecta estilos). |
| `StatGroup`, `Stat` | Indicadores en una sola tarjeta con divisores. |
| `PageHeader` | Título de pantalla + acciones, igual en todos los tamaños. |
| `MarcoPantalla` | Marco a alto completo con scroll interno (sustituye a `MobileShell`). `variant` `compact`/`wide`, `navInferiorVisible` deja hueco a la barra inferior. |
| `EmptyState`, `Skeleton` | Vacíos y carga. |
| `useMediaQuery` | Solo para comportamiento (p. ej. abrir panel vs. navegar). El aspecto se resuelve con CSS. |
| `cn` | Combinar clases resolviendo conflictos. |

Iconos: `lucide-react` (no dibujar SVG a mano).

## Trampas conocidas

- **`globals.css` heredado gana a Tailwind.** Sus reglas están fuera de `@layer`, así que
  superan a cualquier utilidad. Ejemplos: `input { font-size: 16px }` y su propio `.sr-only`
  (rompe `lg:not-sr-only`). Si una clase "no aplica", busca primero en `globals.css`. Al
  migrar una pantalla, borra sus reglas de `globals.css`.
- **El scroll de `MarcoPantalla` no respeta su `padding-bottom`.** La holgura para la barra
  inferior va dentro del contenido:
  `pb-[calc(var(--user-mobile-nav-height,5rem)+1.5rem)] lg:pb-8`.
- **La página monta el contenido dos veces** (marco móvil oculto en `lg`, marco de escritorio
  oculto debajo). Usa `useId()` para los `id` y no dupliques efectos con efectos secundarios
  (ver `autoActualizar` en `MisTraslados`). Unificar el marco es el siguiente paso.

## Receta para migrar una pantalla

Ver `docs/encargo-diseno/09-migrar-pantalla-a-base-v2.md`.


## Aplicación conductor

Conductor usa la misma capa `@ruum/ui/base`, los mismos tokens `ui-*` y la
misma tipografía que Usuario. Su diseño es móvil: referencia de 390 px,
compatibilidad con 320 px y un único marco de hasta 440 px incluso en ventanas
amplias. Conserva la navegación inferior; no necesita pantallas ni una barra
lateral de escritorio.

- `ConductorScreen` reserva la cabecera, el teclado y la navegación; el contenido
  se desplaza dentro de la pantalla. Los controles mantienen al menos 48 px de
  altura y los campos de texto, 16 px. Las acciones en modo calle conservan 56 px.
- Formularios y acciones usan `Input`, `NativeSelect` y `Button` de la base.
  Los filtros de Traslados usan `ChipGroup`, con navegación por teclado, y los
  estados vacíos usan `EmptyState`. Los títulos comparten `PageHeader`.
- `Card asChild` permite conservar elementos como `article` al aplicar la tarjeta
  compartida. Los estados de los adaptadores operativos usan `Badge` con texto.
- `conductor-theme.css` contiene alias de compatibilidad hacia la base compartida.
  No define una paleta ni sobrescribe los tokens `--ruum-*`.
- `pnpm check:estilos` incluye Conductor. Las zonas de presentación migradas
  tienen cero estilos sueltos; los colores de metadatos y respuestas HTML
  independientes conservan su línea base explícita.


## Panel admin (Torre de Control)

El panel usa la misma capa `@ruum/ui/base`, los tokens `ui-*` y la tipografía
Inter (IBM Plex Mono para folios, placas y VIN) de Usuario y Conductor. Su
diseño es de **escritorio**: referencia de 1280 a 1920 px, contenedor
`.admin-page-shell` de hasta 1600 px y sin versión móvil propia (por debajo de
1024 px queda la navegación compacta existente).

- Marco: barra lateral fija y colapsable (`BarraLateral`, superficie
  `bg-ui-card`; el ítem activo se marca con `bg-ui-brand-soft` y peso
  semibold), barra superior con ruta de navegación y acciones globales
  (`BarraSuperiorAdmin`) y contenido con desplazamiento de la ventana.
- `globals.css` no define paleta: importa `tokens.css` y `base.css` y solo
  conserva el contenedor de página y las clases estructurales de tabla
  (`.admin-table-card`, `.admin-table-scroll`). Claro y oscuro los resuelve la
  capa `ui-*` a partir de `data-theme`.
- Los envoltorios del panel delegan en la base: `AdminButton` → `Button`
  (`secondary` → `outline`, `quiet` → `ghost`), `AdminBadge` → `Badge`,
  `AdminPanel` → `Card`, `AdminLoadingState` → `Skeleton`. Las pantallas nuevas
  importan directamente de `@ruum/ui/base` e iconos de `lucide-react`.
- Un panel que debe verse oscuro en ambos temas (p. ej. el panel de marca del
  acceso) usa `data-theme="dark"` en su contenedor en lugar de colores fijos.
- El mapa (Mapbox) lee los colores de `--ui-success`, `--ui-brand`,
  `--ui-danger`, `--ui-fg-muted`, `--ui-fg` y `--ui-card` en tiempo de ejecución.
- `pnpm check:estilos` incluye `apps/panel-admin/src` como zona migrada
  completa: cero hex, paleta de Tailwind, `text-[N]`, `rounded-[N]` y `dark:`.
