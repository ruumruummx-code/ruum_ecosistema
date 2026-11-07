# Decisiones Técnicas sobre Casos Especiales (SD-REM-011 / WCAG 2.5.3)

## 1. Iconos y Elementos Gráficos
- **Principio:** Los iconos que acompañan a texto visible deben marcarse incondicionalmente con `aria-hidden="true"` (ejemplo: flecha `▼` en `EstadoStepper`, símbolo en `RuumHeader` y teléfono en `InicioDesktop`).
- **Razón:** Si el icono aporta texto (como un `alt` de imagen o caracter SVG), dicho texto contamina el cálculo del nombre accesible y desalinea la coincidencia con lo que el usuario ve en pantalla.

## 2. Abreviaturas y Transformaciones CSS
- **Principio:** Transformaciones como `text-transform: uppercase` no alteran el nodo de texto en el DOM ni en el árbol accesible, pero los motores de reconocimiento por voz normalizan mayúsculas/minúsculas.
- **Razón:** `USUARIO` visual y `Usuario` en el DOM son tratados de forma equivalente por Voice Control y Dragon.

## 3. Estados Dinámicos y Texto Variable
- **Principio:** Cuando el texto visible cambia en función del estado (ejemplo: `Llamar` → `Conectando…` o `Enviar` → `Enviando…`), el `aria-label` (si existe) DEBE cambiar simultáneamente para reflejar el nuevo texto visible al inicio.
- **Razón:** Quien usa control por voz dirá el texto que ve en el momento exacto de la interacción.

## 4. Supresión Preferente de aria-label
- **Principio:** En componentes donde el texto visible ya describe completamente la acción (`Chat Button`, `EstadoStepper Summary`, `RuumHeader Link`), se elimina `aria-label` por completo.
- **Razón:** El estándar HTML/WAI-ARIA promueve que el propio contenido visible sea la fuente primaria de denominación accesible.
