# Revisión UX — App Conductor — 2026-10-23

**Objetivo:** dictaminar preparación de UX para producción con enfoque mobile first y operación sin scroll global.
**Alcance:** las 30 rutas `page.tsx` de `apps/app-conductor/src/app`, shell compartido, navegación y recorridos descritos por sus componentes y QA.
**Método:** inspección estática de flujos, jerarquía/acciones, navegación y documentación de QA. No se ejecutó una sesión interactiva ni se validó un build en teléfono durante esta revisión; los hallazgos señalados como confirmados proceden de composición comprobable en código.
**Dictamen:** **NO-GO para producción con aprobación UX global.** Hay un defecto de navegación comprobable en rutas que montan barras inferiores propias además del shell global y falta evidencia de UX de varias rutas críticas/estados. El hallazgo de navegación debe corregirse antes de aprobar.

## Resumen

La app organiza la navegación alrededor de Inicio, Traslados, Ganancias, Notificaciones y Cuenta; el flujo operativo del traslado también desglosa estados y acciones. El acceso rápido al viaje activo, la persistencia de filtros y estados vacíos con siguientes acciones son patrones útiles.

La principal inconsistencia concreta es que el layout monta `NavegacionConductor` globalmente, pero varias vistas añaden su propia barra inferior. Traslados, Notificaciones, Cuenta y Perfil tienen barras locales; además, Traslados/Notificaciones usan convenciones de navegación distintas (tres destinos contra cinco). Esto hace que el usuario vea controles duplicados, consume altura útil y debilita la orientación entre pantallas. En Cuenta hay una prueba que comprueba la navegación local por su nombre accesible, pero no detecta la segunda navegación global, cuyo nombre es distinto.

El criterio “no scroll” debe significar que la acción primaria y el estado actual estén disponibles sin desplazar la página raíz, no eliminar desplazamiento necesario de listas, documentos o contenido legal. El registro ya documenta este patrón; se debe aplicar y verificar de forma uniforme.

## Hallazgos

| ID | Severidad | Rutas | Hallazgo UX | Impacto/criterio de cierre |
|---|---|---|---|---|
| UX-CND-01 | **P1** | `/panel`, `/viajes`, `/notificaciones`, `/cuenta`, `/cuenta/perfil` | El shell global monta navegación móvil y estas vistas también declaran barra inferior local. En `/viajes` y `/notificaciones`, además, la vista local ofrece tres destinos frente a los cinco de la barra global. | Duplicación y competencia por el espacio inferior; el usuario recibe dos modelos de navegación y puede perder área de contenido. Definir un único propietario de navegación móvil y usarlo de manera consistente. Cerrar con verificación de una sola barra, navegación accesible a todos los destinos y CTA sin obstrucción. |
| UX-CND-02 | **P1** | `/viajes/[id]` y subflujos `/evidencia`, `/detalles`, `/soporte` | Los recorridos de operación contienen múltiples etapas, confirmaciones y acciones fijadas; no hay evidencia UX integral que demuestre que el estado actual, siguiente paso, soporte/emergencia y CTA se entienden y quedan accesibles en viewport bajo durante todos los estados. | Riesgo operativo alto si no queda claro qué hacer o la acción queda tapada por navegación/teclado/panel fijo. Cerrar con walkthrough por cada etapa y estado de error/offline, incluyendo prueba de comprensión/orden de acciones y viewport compacto. |
| UX-CND-03 | **P1** | `/login`, `/registro`, `/recuperar-password`, `/nueva-password` | La evidencia de registro y login reconoce pendientes físicos de teclado, autorrelleno, orientación y áreas seguras. Recuperación y cambio de contraseña no quedan incluidos en esas pruebas documentadas. | La persona puede quedar sin ver el campo o la acción para continuar al aparecer el teclado real. Cerrar en Android WebView físico y cubrir navegación de recuperación completa. |
| UX-CND-04 | **P2** | `/panel` | El inicio reúne disponibilidad, GPS/seguimiento, viaje activo, oportunidades, métricas y soporte. Aunque la tarjeta de oportunidades ofrece un siguiente paso claro, la prioridad de la pantalla puede variar mucho entre estado sin viaje y viaje activo; falta evidencia de jerarquía para ambas variantes y para avisos de documento/conexión. | Puede diluirse la acción dominante en el inicio. Validar cuál es la tarea primaria por estado y que disponibilidad/documentos y viaje activo no compitan visualmente. |
| UX-CND-05 | **P2** | `/ganancias`, `/ganancias/historial`, `/cuenta/datos-bancarios` | “Solicitar pago” abre un diálogo que explica que el equipo operativo programa pagos y deriva a soporte; el CTA puede sugerir una solicitud automática aunque el resultado real sea contactar a soporte. | Ajustar la etiqueta para describir el resultado (p. ej. “Consultar solicitud de pago” o “Contactar a soporte”) y explicar disponibilidad/saldo/requisitos antes del tap. Verificar consistencia con estado bancario. |
| UX-CND-06 | **P2** | `/notificaciones` | Al tocar un aviso se marca como leído (con fallo silenciado y actualización optimista) y se navega inmediatamente al destino. La pantalla no comunica una acción separada para leer/abrir ni confirma si el marcado falló. | Puede sorprender al usuario y reducir confianza en el estado leído. Hacer explícito que abrir marca como leído y conservar/indicar estado si la operación falla o se sincroniza después. |
| UX-CND-07 | **P2** | `/cuenta/documentos`, `/cuenta/perfil`, `/cuenta/certificacion`, `/cuenta/datos-bancarios` | Formularios y expedientes extensos están divididos en listas, pestañas, acordeones o paginadores para limitar densidad. La revisión no encontró evidencia homogénea de que el usuario conserve contexto, entienda el progreso y sepa qué dato falta o fue enviado a revisión en todas las rutas. | Alinear estado, progreso y siguiente acción; incluir feedback persistente después de guardar/subir y una forma clara de corregir rechazos. Validar con contenido máximo y lector de pantalla. |
| UX-CND-08 | **P2** | `/legal/terminos`, `/legal/privacidad`, `/cuenta/legal`, `/documentos` | Son rutas con contenido potencialmente largo, pero no hay una regla de producto documentada que distinga scroll interno legítimo del scroll global que debe evitarse. | Definir contenedor desplazable, retorno y acción de cierre/continuación; el contenido legal no debe recortarse para cumplir “no scroll”. |

## Matriz de revisión por pantalla

“Pendiente” significa que no hay evidencia suficiente para dictaminar UX de producción en esta revisión; no afirma por sí solo que la pantalla esté defectuosa.

| Ruta | Revisión UX mobile first / no-scroll | Estado |
|---|---|---|
| `/` | Entrada/redirect: verificar destino según sesión y estados de carga/error sin intermedio confuso. | Pendiente de walkthrough interactivo |
| `/panel` | Priorizar disponibilidad o viaje activo, estado GPS/documentos, y acción siguiente en ambos escenarios. | Parcial; revisar jerarquía + barra duplicada |
| `/viajes` | Ofertas/aceptados, filtros, fecha, orden, mapa/lista, rechazo/deshacer y vacíos. Unificar navegación inferior. | Barra duplicada confirmada; resto requiere walkthrough |
| `/viajes/[id]` | El estado del traslado debe dominar y conducir a una sola acción segura; validar contactos, navegación y emergencia. | Pendiente de recorrido completo |
| `/viajes/[id]/detalles` | Tabs de itinerario, operación, vehículo y pago deben conservar contexto/retorno. | Pendiente |
| `/viajes/[id]/evidencia` | Guiar captura, progreso, revisión, notas y sincronización; mantener siguiente paso visible con teclado/cámara. | Pendiente |
| `/viajes/[id]/soporte` | Canal, contexto del traslado y salida/retorno claros; confirmar acciones externas. | Pendiente |
| `/login` | Reducir fricción de entrada y recuperación; validar teclado/autorrelleno y retorno al login en teléfono físico. | Parcial; QA físico pendiente |
| `/registro` | Progreso por pasos, validación y borrador; scroll solo dentro de paneles cuando el teclado reduce área. | Parcial; QA físico pendiente |
| `/recuperar-password` | Claridad sobre correo enviado, reintento y retorno a login. | Pendiente |
| `/nueva-password` | Requisitos, errores y confirmación sin perder foco/contenido con teclado. | Pendiente |
| `/onboarding` | Beneficio y única acción para entrar a operación; evitar repetición en retornos. | Pendiente |
| `/ganancias` | Resumen por periodo, importes y últimos pagos; aclarar qué significa solicitar pago. | Parcial; confirmar jerarquía y CTA |
| `/ganancias/historial` | Búsqueda temporal/estados y lectura de lista larga con navegación de regreso. | Pendiente |
| `/notificaciones` | Prioridad de avisos, leído/no leído, destino de cada acción; unificar barra inferior de tres destinos. | Barra duplicada confirmada; demás parcial |
| `/cuenta` | Encontrabilidad de perfil, documentos, certificación, banco, seguridad y salida de sesión. | Parcial; barra duplicada confirmada |
| `/cuenta/perfil` | Pestañas/grupos editables, campos sensibles y guardado/revisión. | Parcial; barra duplicada confirmada |
| `/cuenta/documentos` | Estados de revisión/rechazo, subir/reemplazar y restricciones por estado. | Pendiente de validación con expediente completo |
| `/cuenta/certificacion` | Progreso, acordeones/paginación y relación entre requisitos y acción para cumplirlos. | Parcial; falta walkthrough |
| `/cuenta/datos-bancarios` | Explicar CLABE/titularidad, privacidad, verificación y corrección. | Parcial; revisar con errores y teclado |
| `/cuenta/preferencias` | Efecto de cada ajuste, guardado y persistencia comprensibles. | Pendiente |
| `/cuenta/seguridad` | Estado de sesión, cambio de contraseña y recuperación sin callejones sin salida. | Pendiente |
| `/cuenta/soporte` | Canales ordenados por urgencia y contexto para ayuda ordinaria/emergencia. | Pendiente |
| `/cuenta/legal` | Selección/lectura/retorno dentro del visualizador sin perder el contexto de cuenta. | Pendiente |
| `/legal/terminos` | Lectura larga y retorno al punto de entrada; acordar scroll interno. | Pendiente |
| `/legal/privacidad` | Lectura larga, jerarquía y retorno; acordar scroll interno. | Pendiente |
| `/documentos` | Definir propósito frente a `/cuenta/documentos`; evitar destinos redundantes o distintos sin explicación. | Pendiente; validar equivalencia y navegación |
| `/configuracion` | Verificar ruta vigente, contenido y enlace de retorno; evitar duplicar opciones de Cuenta. | Pendiente |
| `/403` | Explicar acceso denegado y ofrecer una salida válida al inicio/soporte. | Pendiente |
| `/actualizacion-requerida` | Indicar acción de actualización y canal autorizado; comprobar que no sea callejón sin salida. | Pendiente |

## Base de la revisión y limitaciones

- Shell compartido: `src/app/layout.tsx`, `src/app/NavegacionConductor.tsx` y `src/app/components/ConductorNav.tsx`.
- Barras locales detectadas en `panel/page.tsx`, `viajes/DriverTrasladosView.tsx`, `notificaciones/page.tsx`, `cuenta/DriverAccountView.tsx` y `cuenta/DriverDetailsShell.tsx`.
- QA de acceso/registro: `docs/qa/RC-2026-001.md` y `docs/qa/RC-2026-002-004.md`; ambos señalan comprobaciones físicas pendientes.
- Accesibilidad física: `tests/a11y/talkback-checklist.md` contiene criterios para tareas críticas, anuncios de estado y controles operativos; esta auditoría no equivale a la ejecución de esa matriz.
- No se inició sesión en la aplicación, no se generaron capturas y no se probó la experiencia con conductores. Por eso, los estados dinámicos y la comprensión de mensajes quedan señalados como pendientes, no como defectos observados.

## Condiciones mínimas para cambiar a GO

1. Corregir UX-CND-01: una sola navegación inferior visible por pantalla y destinos/etiquetas coherentes.
2. Completar walkthroughs de las 30 rutas con datos de prueba, incluyendo vacío, carga, error, offline, rechazo y contenido máximo donde aplique.
3. En flujos críticos, probar con viewport 320×568 y 360×640; en formularios probar área reducida por teclado, orientación y áreas seguras en Android WebView físico.
4. Verificar que cada acción principal se identifique sin ambigüedad, mantenga el contexto al volver y quede alcanzable sin scroll global; admitir scroll interno intencional para listas/documentos largos.
5. Cerrar los P1 y registrar evidencia, dispositivo/build, responsable y fecha. Luego emitir dictamen por alcance; si se limita el lanzamiento, enumerar explícitamente las rutas incluidas.

