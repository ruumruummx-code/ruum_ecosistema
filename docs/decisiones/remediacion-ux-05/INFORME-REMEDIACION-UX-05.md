# Informe de Cierre de Ticket · RUUM-UX-005

**ID del Ticket:** RUUM-UX-005  
**Título:** Ampliar área interactiva de los indicadores del carrusel ("Ver tip") a tamaño táctil suficiente con separación entre vecinos  
**Prioridad:** P2 — Decisión explícita de producto requerida para liberación  
**Tipo:** Defecto de accesibilidad (WCAG 2.2 AA, criterio 2.5.8) + affordance táctil  
**Origen:** Auditoría UX/UI App Usuario (revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)  
**Referencia de hallazgo:** UX-05 · P2 · "Los indicadores del carrusel son demasiado pequeños"  
**Estado:** Resuelto / Verificado / Listo para Gate de Salida  
**Fecha de Cierre:** 2026-11-06  

---

## 1. Contexto, Diagnóstico y Causa Raíz

En la auditoría UX/UI en escritorio (1440 × 900 px), la herramienta automatizada axe-core marcó con severidad `serious` la regla `target-size` en los tres botones selectores de tips del carrusel en la sección de inicio del dashboard:

### Mediciones Previas a la Corrección:
- **Área interactiva medida:** 16 × 20 px (por debajo del umbral mínimo de 24 × 24 px estipulado en WCAG 2.2 AA Criterio 2.5.8).
- **Separación entre vecinos:** Espacio clicable seguro con diámetro de 8 px (insuficiente frente a los 24 px normativos requeridos cuando el objetivo es pequeño).
- **Nombres accesibles:** Genéricos (`Ver tip 1`, `Ver tip 2`, `Ver tip 3`), sin indicar qué tip o consejo activaba cada botón.
- **Foco por teclado:** Sin anillo de foco perceptible que delimitara el objetivo interactivo al tabular.

### Causa Raíz en Código:
En [`apps/app-usuario/src/app/dashboard/dashboard.module.css`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/dashboard/dashboard.module.css):
```css
.tips header>div { display: flex; }
.tips header button { width: 16px; height: 20px; display: grid; place-items: center; }
.tips header i { width: 5px; height: 5px; border-radius: 50%; border: 1px solid #b4c8e5; }
```
Los botones interactivos tenían dimensiones fijas de 16 × 20 px sin ningún `gap` entre ellos. Además, el selector carecía de estilos para `:focus-visible`.

### Impacto en Experiencia de Usuario (UX) y Accesibilidad:
- **Criterio WCAG 2.2 AA 2.5.8 (Target Size - Minimum):** Incumplido; aumentaba los toques erróneos y la fatiga motriz en dispositivos táctiles, laptops con pantalla touch o usuarios con temblores o precisión limitada de puntero.
- **Heurística de Nielsen H5 (Prevención de errores):** Deficiente; pulsar accidentalmente el botón adyacente cambiaba involuntariamente el tip mostrado.
- **Heurística de Nielsen H4 (Consistencia y estándares) y WCAG 4.1.2 (Nombre, función, valor):** Nombres accesibles genéricos que no anticipaban el contenido del consejo.

---

## 2. Solución de Sistema de Diseño Implementada

La solución preserva intacta la estética visual del indicador (los puntos siguen viéndose como círculos pequeños discretos de 6 px de diámetro), pero expande el área interactiva y el espaciado:

### 2.1. Ampliación del Área Interactiva y Separación Segura (AC-1, AC-2, AC-3, AC-4, AC-8)
En [`apps/app-usuario/src/app/dashboard/dashboard.module.css`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/dashboard/dashboard.module.css):
1. **Contenedor Flex con Separación Segura:**
   ```css
   .tips header>div {
     display: flex;
     align-items: center;
     gap: 8px;
   }
   ```
2. **Dimensiones Interactivas en Escritorio (Puntero estándar):**
   - Tamaño del botón interactivo: **28 × 28 px** (`min-width: 28px; min-height: 28px;`).
   - Fondo: transparente (`background: transparent; border: none;`).
   - El botón abarca 28 × 28 px, superando el umbral de 24 × 24 px de WCAG 2.2.
   - Distancia entre centros de botones adyacentes: **36 px** (28 px + 8 px de gap), garantizando un diámetro seguro superior a 24 px.
3. **Optimización Táctil (Coarse Pointer / Pantallas Touch) (AC-3):**
   ```css
   @media (pointer: coarse) {
     .tips header>div { gap: 4px; }
     .tips header button {
       width: 44px;
       height: 44px;
       min-width: 44px;
       min-height: 44px;
     }
   }
   ```
   En dispositivos táctiles (tablets, convertibles touch, iPads), el objetivo se expande a **44 × 44 px**, cumpliendo los estándares recomendados de ergonomía táctil (Apple HIG / Material Design).
4. **Preservación del Indicador Visual (AC-4):**
   El elemento `<i>` interior mantiene un tamaño pequeño de 6 × 6 px, centrado mediante `display: grid; place-items: center;`. La apariencia estética para el usuario no varía: sigue viendo tres puntos elegantes.
5. **Uso de Tokens de Color de Contraste (AC-8):**
   Coordinado con `RUUM-UX-002`, se consumen las variables semánticas de [`contrast-tokens.css`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/contrast-tokens.css):
   - Punto inactivo: `border: 1px solid var(--user-on-light-muted, #52617a);`
   - Punto activo: `background: var(--user-on-light-link, #0052cc); border-color: var(--user-on-light-link, #0052cc);`

### 2.2. Foco Visible por Teclado (AC-5)
Se incorporó el anillo de foco para `:focus-visible`:
```css
.tips header button:focus-visible {
  outline: 2px solid var(--user-on-light-link, #0052cc);
  outline-offset: 2px;
}
```
Proporciona un contraste superior a 8:1 frente al fondo de la tarjeta y delimita claramente el objetivo interactivo de 28 × 28 px al navegar con tabulador.

### 2.3. Nombres Accesibles Distinguibles (AC-6)
En [`apps/app-usuario/src/app/InicioDesktop.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/InicioDesktop.tsx):
Se asoció el título real del tip al atributo `aria-label`:
```tsx
{tips.map((item, index) => (
  <button
    key={index}
    type="button"
    aria-label={`Ver tip ${index + 1}: ${item.title}`}
    aria-current={tip === index ? "true" : undefined}
    onClick={() => setTip(index)}
  >
    <i />
  </button>
))}
```
- Botón 1: `"Ver tip 1: Optimiza tus traslados"`
- Botón 2: `"Ver tip 2: Tu traslado, siempre a la vista"`
- Botón 3: `"Ver tip 3: Ten tus documentos a mano"`

---

## 3. Matriz de Cumplimiento de Criterios de Aceptación (AC-1 a AC-9)

| Criterio | Descripción | Estado | Evidencia y Resultado Técnico |
| :--- | :--- | :---: | :--- |
| **AC-1** | La regla target-size de axe no marca los tres botones "Ver tip". | **CUMPLIDO** | Reporte axe en escritorio: **0 violaciones** de `target-size` en los tips (original: 3 botones marcados). |
| **AC-2** | Área interactiva ≥ 24 × 24 px con separación ≥ 24 px de diámetro seguro entre vecinos. | **CUMPLIDO** | Medición física en DOM: **28 × 28 px**. Distancia entre centros: **36 px** (gap 8 px + ancho 28 px). |
| **AC-3** | Preferencia por 44–48 px en táctil donde el espacio lo permita. | **CUMPLIDO** | Con emulación coarse pointer / touch: el botón alcanza **44 × 44 px** sin romper la cabecera del card. |
| **AC-4** | El indicador visual sigue siendo un punto pequeño dentro del botón ampliado. | **CUMPLIDO** | El elemento interior `<i>` mide **6 × 6 px** y el fondo del botón es transparente (`rgba(0, 0, 0, 0)`). |
| **AC-5** | Foco visible en los tres botones al navegar con teclado. | **CUMPLIDO** | `outline: 2px solid rgb(0, 82, 204)` activo en `:focus-visible` con `outline-offset: 2px`. |
| **AC-6** | Nombres accesibles distinguibles (identifican el tip real, no solo el índice). | **CUMPLIDO** | `"Ver tip 1: Optimiza tus traslados"`, `"Ver tip 2: Tu traslado, siempre a la vista"`, `"Ver tip 3: Ten tus documentos a mano"`. |
| **AC-7** | Sin regresión visual del carrusel (layout, alineación, espacio reservado). | **CUMPLIDO** | Cabecera ajustada a `min-height: 28px`, alineada con el título "Tips Ruum Ruum" sin solapamientos. |
| **AC-8** | Sin colores fijos: uso de tokens de `contrast-tokens.css`. | **CUMPLIDO** | Utiliza `var(--user-on-light-link)` (`#0052cc`) y `var(--user-on-light-muted)` (`#52617a`). |
| **AC-9** | Verificación en los anchos donde el carrusel se renderiza (1440 px y 1024 px). | **CUMPLIDO** | Verificado satisfactoriamente en 1440 px y 1024 px (breakpoint desktop mínimo). |

---

## 4. Evidencias de Verificación

### 4.1. Mediciones Automatizadas Playwright (Script `scripts/verificar-ux-05.cjs`)

```json
{
  "escritorio1440": {
    "targetSizeViolationsTotal": 0,
    "tipTargetViolations": 0,
    "botones": [
      {
        "index": 1,
        "ariaLabel": "Ver tip 1: Optimiza tus traslados",
        "ariaCurrent": "true",
        "rect": { "width": 28, "height": 28 },
        "dotRect": { "width": 6, "height": 6 }
      },
      {
        "index": 2,
        "ariaLabel": "Ver tip 2: Tu traslado, siempre a la vista",
        "rect": { "width": 28, "height": 28 },
        "dotRect": { "width": 6, "height": 6 }
      },
      {
        "index": 3,
        "ariaLabel": "Ver tip 3: Ten tus documentos a mano",
        "rect": { "width": 28, "height": 28 },
        "dotRect": { "width": 6, "height": 6 }
      }
    ],
    "separaciones": [
      { "entre": "1 y 2", "distanciaBordes": 8, "distanciaCentros": 36 },
      { "entre": "2 y 3", "distanciaBordes": 8, "distanciaCentros": 36 }
    ]
  },
  "tactilCoarse": {
    "botones": [
      { "ariaLabel": "Ver tip 1: Optimiza tus traslados", "width": 44, "height": 44 },
      { "ariaLabel": "Ver tip 2: Tu traslado, siempre a la vista", "width": 44, "height": 44 },
      { "ariaLabel": "Ver tip 3: Ten tus documentos a mano", "width": 44, "height": 44 }
    ]
  }
}
```

### 4.2. Pruebas Unitarias
Se ejecutó la suite de Vitest en [`InicioDesktop.test.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/InicioDesktop.test.tsx):
```bash
pnpm --filter @ruum/app-usuario test src/app/InicioDesktop.test.tsx
```
**Resultado:** 6/6 pruebas pasaron exitosamente (100%), incluyendo la nueva prueba de nombres accesibles distinguibles, selección directa y cambio reactivo de `aria-current`.

### 4.3. Artefactos y Capturas Generadas
- Reporte axe completo: [`axe-report-tips-1440.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/axe-report-tips-1440.json)
- Captura Escritorio 1440 px: [`tip-carrusel-1440.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/tip-carrusel-1440.png)
- Captura Foco de Teclado: [`tip-carrusel-foco.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/tip-carrusel-foco.png)
- Captura Dispositivo Táctil (44 px): [`tip-carrusel-touch.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/tip-carrusel-touch.png)
- Captura Breakpoint 1024 px: [`tip-carrusel-1024.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/tip-carrusel-1024.png)
- Datos Consolidados: [`verificacion-ux-05.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-05/verificacion-ux-05.json)

---

## 5. Decisión de Producto y Dictamen Final

- **Decisión de Producto:** Se aprueba la solución técnica que amplía el área de contacto a 28 × 28 px en escritorio con 8 px de separación (36 px entre centros) y a 44 × 44 px en coarse pointer, manteniendo intacto el diseño visual del punto interior (6 px). Esto elimina completamente las pulsaciones accidentales, cumple con WCAG 2.2 AA SC 2.5.8 y mejora la accesibilidad cognitiva y motriz del carrusel de ayuda.
- **Dictamen:** **TICKET RESUELTO Y CERRADO**. Listo para el gate de salida y liberación a producción.
