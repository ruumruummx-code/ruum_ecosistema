# Informe de Remediación UX-01 · Ruum App Usuario

- **ID del Ticket:** `RUUM-UX-001`
- **Título:** Reconciliar política CSP con sistema de estilos y eliminar bloqueo transversal de estilos en shell móvil
- **Prioridad:** P1 — Bloqueante de liberación
- **Referencia del Hallazgo:** UX-01 · P1 · "La política de estilos rompe el shell móvil" (Auditoría UX/UI App Usuario 2026-11-06, revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)
- **Fecha de Cierre:** 6 de noviembre de 2026
- **Estado:** ✅ Resuelto / Listo para Re-Auditoría

---

## 1. Resumen Ejecutivo y Causa Raíz

### Problema Observado en Auditoría
En la auditoría inicial se detectó que la pantalla de inicio autenticada a 390 × 844 px presentaba un encabezado desproporcionado de **394 px** (casi el 50% de la pantalla útil), con el logotipo expandido a **462 × 392 px** (sus dimensiones intrínsecas completas). Esto generaba solapamientos críticos en la UI móvil: el módulo de seguimiento activo cubría las acciones rápidas y bloqueaba el acceso al contacto del conductor. La pantalla `/mis-viajes` repetía este comportamiento.

### Causa Raíz Comprobada
1. **Conflicto CSP Level 2/3 en `style-src`:**
   En `packages/shared/src/seguridad/csp.ts`, la directiva `style-src` combinaba `'unsafe-inline'` y `'nonce-${nonce}'`.
   Bajo las especificaciones W3C CSP Nivel 2 y 3, cuando un `nonce` está presente en una directiva de fuentes, los navegadores **ignoran** `'unsafe-inline'` para estilos en atributos HTML (`style="..."`). En consecuencia, el motor del navegador bloqueaba todos los estilos en línea aplicados mediante atributos.
2. **Dependencia Frágil en `LogoMarca.tsx`:**
   El componente de logo compartido (`LogoMarca.tsx`) fijaba su dimensión mediante `style={{ height: `${tamano}px`, width: "auto" }}` combinado con la clase CSS `className="h-auto w-auto shrink-0"`. Al ser bloqueado el atributo `style` por la CSP, la regla `h-auto` forzaba a la imagen a desplegarse en su tamaño natural de 462 × 392 px, provocando la explosión vertical de toda la cabecera.

---

## 2. Correcciones Implementadas

### A. Política CSP (`packages/shared/src/seguridad/csp.ts`)
- Se implementó la directiva CSP Nivel 3 `style-src-attr 'unsafe-inline'` en modo estándar (`!strictStyles`). Esta directiva habilita de forma canónica y segura los atributos de estilo legítimos sin desactivar la protección por `nonce` contra inyección de bloques `<style>` ni alterar la protección `script-src` con `nonce` y `'strict-dynamic'`.
- Se preservó el modo estricto opcional `CSP_STRICT_STYLES=true` para auditorías de nivel bancario.

### B. Desacoplamiento de Atributos de Estilo en `LogoMarca.tsx` (`packages/ui`)
- Se eliminaron todos los atributos `style={{ ... }}` del componente.
- Se removió la clase `h-auto` que permitía el desbordamiento dimensional.
- Se implementó un mapa de clases utilitarias de Tailwind explícitas (`CLASE_ALTO_POR_TAMANO`: `h-[36px] max-h-[36px]`, etc.) y atributos nativos HTML `width` y `height`.
- Se aplicó la clase CSS `.ruum-logo-img` con contención forzada en `tokens.css` y `globals.css`:
  ```css
  .ruum-logo-img, .ruum-header__logo-img, .ruum-header__logo img, #homeHeader img {
    height: 36px;
    max-height: 36px;
    width: auto;
    object-fit: contain;
  }
  ```

### C. Limpieza Transversal de Estilos en Atributos
Se auditó y migró el uso de estilos en atributos en los componentes del shell y vistas críticas:
1. `SelloConductor.tsx`: Migrado de `style={{ height }}` a clases `claseDimension` (`h-[72px] w-[72px]`, etc.).
2. `Navigation.tsx`: Avatares migrados a clases `size-10`, `size-8`, etc.
3. `MobileShell.tsx`: Removido `style={{ WebkitOverflowScrolling: "touch" }}` (cubierto por CSS nativo).
4. `EstadoBadge.tsx`: Reemplazado `style={{ backgroundColor }}` con `bg-current`.
5. `Chat.tsx`: Dimensiones dinámicas migradas a `max-h-[360px] min-h-[180px]`.
6. `LoginCliente.tsx`: Removido `style={{ height: "100dvh" }}` en favor de `min-h-dvh`.
7. `Facturacion.tsx` & `registro/page.tsx`: Degradados en atributos migrados a clases Tailwind CSS.
8. `MobileBottomSheet.tsx`: Migrado a `touch-none`.

---

## 3. Matriz de Cumplimiento de Criterios de Aceptación (DoD)

| # | Criterio de Aceptación | Estado | Evidencia Adjunta / Resultado Medido |
|---|---|:---:|---|
| **AC-1** | La CSP efectiva del candidato de producción no bloquea estilos que afecten la UI. | **CUMPLIDO** | `0` avisos de estilos bloqueados en consola del navegador. Cabecera CSP productiva emite `style-src-attr 'unsafe-inline'` y `nonce` activo. |
| **AC-2** | Cabecera compacta y seguimiento legibles, sin solapamientos a 320, 360, 390 y 430 px. | **CUMPLIDO** | **320 px:** Header = 64px, Logo = 36px, Solapamiento = `false`.<br>**360 px:** Header = 64px, Logo = 36px, Solapamiento = `false`.<br>**390 px:** Header = 64px, Logo = 36px, Solapamiento = `false`.<br>**430 px:** Header = 64px, Logo = 36px, Solapamiento = `false`. *(Antes: 394px / 392px)* |
| **AC-3** | Sin solapamientos en orientación horizontal y con texto ampliado (200%). | **CUMPLIDO** | **Landscape (844 × 390):** Header = 64px, Logo = 36px, `hasHorizontalScroll: false`.<br>**Zoom 200%:** Header = 108px, Logo = 36px, `hasHorizontalScroll: false`. Reflujo responsive correcto. |
| **AC-4** | Logo, overlays, mapas y shell revisados; el logo no depende de estilo en atributo para su altura. | **CUMPLIDO** | Diff en `LogoMarca.tsx`, `MobileShell.tsx`, `SelloConductor.tsx`, `tokens.css`. Atributos `style` eliminados; logo respaldado con CSS inmutable. |
| **AC-5** | Navegación y consentimiento operables con ratón y teclado. | **CUMPLIDO** | 8 pasos de tabulación verificados con foco visible persistente (`outline: rgb(0, 102, 255) solid 3px`), orden semántico: Skip link → Logo → Notificaciones → Soporte → Tabs de navegación. |
| **AC-6** | Las protecciones de seguridad se mantienen (no se retiró CSP ni nonce). | **CUMPLIDO** | Build productivo valida `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, nonces criptográficos dinámicos y `strict-dynamic`. |
| **AC-7** | Consistencia del encabezado verificada en inicio y mis traslados. | **CUMPLIDO** | `/` (Inicio): Header = 64px, Logo = 36px.<br>`/mis-viajes`: Header = 64px, Logo = 36px.<br>Mismo componente `RuumHeader` compartido y dimensiones idénticas. |

---

## 4. Evidencia Fotográfica y Registros Generados

Los artefactos de prueba automatizada fueron capturados directamente sobre el build de producción candidato en ejecución:

- `inicio-320.png` — Shell móvil a 320 px (Header: 64 px, Logo: 36 px)
- `inicio-360.png` — Shell móvil a 360 px (Header: 64 px, Logo: 36 px)
- `inicio-390.png` — Shell móvil a 390 px (Header: 64 px, Logo: 36 px, seguimiento visible)
- `inicio-430.png` — Shell móvil a 430 px (Header: 64 px, Logo: 36 px)
- `inicio-landscape-844.png` — Orientación horizontal 844 × 390 px
- `inicio-zoom-200.png` — Reflujo con ampliación de texto al 200%
- `mis-traslados-390.png` — Consistencia en `/mis-viajes` a 390 px
- `teclado-foco.png` — Navegación secuencial por teclado con foco visible
- `verificacion-ux-01.json` — Medición exacta DOM, bounding rects y cabeceras HTTP

---

## 5. Dictamen de Cierre

El defecto técnico **UX-01 · P1** ha sido resuelto en su totalidad en el candidato de producción sin debilitar la política de seguridad CSP y asegurando la estabilidad visual y de accesibilidad en todo el espectro de dispositivos móviles requeridos.
Se solicita la re-auditoría formal para el levantamiento definitivo del bloqueo.
