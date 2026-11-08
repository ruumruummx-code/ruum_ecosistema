# Fase 5 — Sistema visual del conductor

Base: `092f668d` (fase 4). Trabajo exclusivo en `apps/app-conductor`.

La documentación de fases 1–4 deja pendiente la unificación visual y la revisión de todos los colores y estados (F06/F07). Esta entrega concreta ese alcance con el contrato móvil de fase 2: campos de 16 px, apoyo de 14 px, controles de 48 px y contraste de 4,5:1 para texto normal y 3:1 para texto grande y límites relevantes de controles. No sustituye la validación física prevista en fase 6.

## Acciones y criterios

| Acción | Criterio de aceptación |
|---|---|
| Consolidar paleta local | Una fuente de tokens para texto, superficies, acciones, foco, estados y deshabilitados en claro y oscuro. Usuario y Administración conservan sus archivos. |
| Migrar pantallas | Las hojas CSS de pantallas usan tokens semánticos; no imponen un esquema claro ni sus propias variables de tema. Excepción documentada para el lienzo exportable de firma. |
| Simplificar presentación | Superficies lisas, sin sombras decorativas por tarjeta; botones primarios con radio común; opciones de Cuenta breves y accesibles en 320 px. |
| Hacer estados comprensibles | Advertencia/error/sin conexión conservan texto; los indicadores de salud usan ✓ para correcto y ! para atención. Un botón deshabilitado mantiene texto legible. |
| Comprobar resultado | Contraste del texto renderizado en navegador, dos temas y tamaños 320×568/390×844; regresión de marcos, etapas y formularios; capturas revisadas. |

## Decisiones visuales

`src/app/conductor-theme.css` concentra el tema local y los alias de compatibilidad para componentes compartidos. Azul identifica la acción; verde, ámbar y rojo se reservan para estados. Las superficies neutrales organizan el contenido sin competir con el botón principal. Se mantienen nombre, logotipo y lenguaje del producto. El tema oscuro usa la variante oficial clara del logotipo mediante CSS, con la misma geometría y sin un estado React para cambiar imágenes. Preferencias presenta Día y Noche con estado pulsado accesible. Ambas claves de almacenamiento se actualizan juntas para evitar que una preferencia heredada vuelva a imponerse al recargar; se retira la opción Automático, que antes guardaba siempre el tema claro.

Se eliminan los dos bloques antiguos de tema de globals y el piloto naranja sin consumidores. Se migran colores de acceso, registro, cuenta, expedientes, ganancias, notificaciones, ofertas, legales, seguridad, soporte y lista de traslados; las etapas y formularios ya usan tokens. Las opciones de Cuenta muestran título e icono, sin repetir la descripción de su destino. Los iconos de Cuenta heredan un único color. El texto de acciones secundarias se acorta sin cambiar su destino o función. El acceso conserva campos de 16 px, etiquetas de 14 px y objetivos de 48 px; se eliminan sus reglas de compactación por altura, manteniendo desplazamiento interno cuando hay teclado o texto ampliado.

El lienzo de firma mantiene fondo blanco y tinta oscura: es el soporte del comprobante exportado, independiente del tema de la aplicación. Las fotografías, mapas, activos de marca y material documental conservan sus colores originales. No se alteran validaciones, permisos, APIs, transiciones operativas, carga de archivos, dependencias o configuración de Turbo.

## Reglas conservadas

El shell y los componentes de las fases 2–4 siguen siendo propietarios del viewport, safe areas, navegación, foco y desplazamiento. No se incorpora un nuevo algoritmo de altura ni se reduce la tipografía por teclado. Los documentos, listas extensas, legales, texto ampliado y formularios largos mantienen su desplazamiento interno; retorno y acciones persistentes conservan el contrato existente.

La guía React se aplicó a la revisión de cambios TSX: cambios de presentación y textos, sin nuevas suscripciones, solicitudes, efectos de tema o dependencias. Las reglas de negocio permanecen en sus controladores y servicios existentes.

Ver [validación](VALIDACION.md) y [evidencias](evidencia/).
