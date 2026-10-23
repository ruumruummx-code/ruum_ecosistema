# Scroll de documentos, certificación y legales

En `/cuenta/documentos`, `/cuenta/certificacion`, `/legal/terminos` y `/legal/privacidad`, el documento raíz permanece inmóvil. El contenido extenso se desplaza dentro de una región identificada y accesible con teclado. No se reduce el tamaño de texto o de los controles para intentar encajarlo completo.

`ContainedScrollView` calcula el espacio disponible con `100dvh`, las alturas medidas del shell y la cabecera de retorno. Usa `min-height: 0`, `overflow-y: auto` y `overscroll-behavior: contain`; el retorno queda fuera de esa región. En escritorio conserva el lienzo centrado de 440 px. Los diálogos largos desplazan su contenido y mantienen visible el cierre.

El formulario de datos bancarios comparte este contenedor para evitar que el teclado provoque solapamientos. Las mediciones del shell observan `border-box`, de modo que los cambios de padding de las safe areas también actualizan el espacio disponible.

El desplazamiento se recuerda por ruta y consulta durante la sesión. Certificación recuerda también el panel y su página al actualizar documentos. El parámetro `volver` admite únicamente rutas internas explícitas de Cuenta, Login y Registro; un destino inválido usa el retorno predeterminado. No se guardan documentos ni datos del formulario para recordar este contexto.

## Validación

Con Node 24, desde la raíz:

```sh
pnpm --filter @ruum/app-conductor test:e2e:scroll
```

La suite Chromium usa el API local aislado. Comprueba las cuatro vistas y datos bancarios a 320×568, 390×844 y 1280×960, ausencia de desplazamiento raíz y horizontal, retorno accesible mediante hit-testing, cambios de altura del shell, memoria del contexto y cierre del checklist. Incluye regresiones de Cuenta y Login. Las capturas compactas quedan en `test-results`.

Esta suite también se incluye en `test:e2e:ui`.
