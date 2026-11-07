# Fase 2 — Estructura común implementada

Fecha: 7 noviembre 2026. Base: `fd0692a3` de main. Esta entrega completa la adopción estructural pendiente tras la primera implementación documentada el 6 de noviembre. No reemplaza el inventario de la fase 1 ni certifica los flujos completos de las fases 3 y 4.

## Resultado

Se implementó un marco común con encabezado, cuerpo interno y acción inferior. La reserva de navegación y el área visible tienen un propietario compartido; las pantallas dejan de calcularlas mediante hooks diferentes. Se conservan las reglas de negocio y el estado de los formularios.

| Componente | Responsabilidad y adopción |
|---|---|
| `ConductorScreen` | Variantes access, overview, operation, form, detail, list y state. Encabezado y acción fuera del cuerpo desplazable; ancho máximo 440 px, safe areas y teclado. Adoptado en las siete rutas F01 y heredado por expedientes/Perfil. |
| `ConductorPageHeader` | Retorno, título y descripción con jerarquía común; el retorno no se mueve al desplazar el detalle. |
| `ConductorShellBridge` | Único escritor de `--conductor-shell-bottom-height`; mide el host visible real, incluidos banners, alturas del texto y navegación embebida. Sustituye `useConductorShellInsets`. |
| `useVisibleViewport` | Única implementación de visualViewport. El bridge publica las variables del documento; los diálogos usan el mismo algoritmo local. Login, Registro y TripOperationalFrame heredan el área visible y dejan de tener observadores propios. |
| `ConductorNavigation` | Única implementación JSX, destinos, etiquetas, iconos y selección. Sustituye las seis copias operativas. Los hosts operativos conservan su posición en el flujo hasta la reorganización por etapas. |
| `ConductorDialog` | Modalidad nativa, cierre persistente, Tab/Shift+Tab contenidos, Escape, retorno al disparador sin mover la página, cuerpo interno y footer opcional. Adoptado también por DetailsDialog, TripDialog y programación de pagos. Se mantienen Menú, Salud e InfoSheet ya migrados. |
| `ContainedScrollView` | Conserva restauración por ruta/consulta y foco de su región. Delega toda la geometría a ConductorScreen. Perfil y Banco pasan sus acciones de guardar al footer externo. |
| `route-contract.ts` | Variante y política de navegación explícitas para las 30 rutas. Una prueba compara el manifiesto con todos los page.tsx para detectar rutas olvidadas. |

## Aplicación del contrato

- **Scroll:** Preferencias, Seguridad, Soporte de Cuenta, Marco Legal, Historial, Notificaciones y Recuperar contraseña ya mantienen inmóvil el documento. El contenido largo queda en una región interna accesible. No se eliminó información para lograrlo.
- **Teclado:** se oculta la navegación durante edición con reducción del área visible y se conserva la acción del formulario. Banco y Perfil tienen el botón de guardar fuera del cuerpo; Recuperar contraseña usa un submit asociado mediante `form`.
- **Seguridad del viaje:** los encabezados se reorganizan en filas antes de recortar Emergencia. Se preserva la acción primaria fuera del detalle desplazable en las etapas origen, recepción e inicio. Esto es una corrección del marco, no una simplificación de sus estados de negocio.
- **Tamaño y lectura:** el marco y los diálogos establecen 48×48 px efectivos, cuerpo/campos de 16 px y apoyo de 14 px. En los formularios de expediente migrados se anula la compactación de etiquetas a 7–11 px. Registro conserva todavía estilos propios que deben reorganizarse en fase 4; compartir viewport no acredita su legibilidad completa.
- **Temas:** las superficies de las plantillas migradas usan tokens semánticos. Se corrigió la mezcla de texto casi blanco sobre fondo blanco en el título de Traslados. La prueba calcula contraste, no solo presencia de un atributo de tema. La revisión de todos los colores/estados de operación sigue en fase 5.
- **Contexto:** los diálogos conservan los callbacks, validaciones y datos del flujo. No cambian permisos, RPC, almacenamiento, reglas de asignación, cierre ni liquidación.

### Hidratación de Inicio

Se identificó una divergencia concreta: en Node 24 `typeof navigator` es `object`, pero `navigator.onLine` es `undefined`. El estado inicial anterior podía producir el aviso offline en servidor y el skeleton en cliente. Ahora ambos inician con el mismo valor y el efecto de montaje consulta la conectividad real. Dos pruebas de producción (320/390) capturan `pageerror` y verifican ausencia de errores 418/hidratación durante la carga y apertura de los diálogos. Esto no certifica todos los límites de error de la aplicación.

## Mapa de migración de las 30 rutas

| Rutas | Variante / adopción actual | Trabajo posterior |
|---|---|---|
| `/`, `/configuracion`, `/documentos` | Entrada y alias con contrato explícito | Conservar redirecciones y sesión; sin otra estructura propia. |
| `/onboarding`, `/login`, `/recuperar-password`, `/nueva-password` | Access; Login hereda viewport, Recuperar usa ConductorScreen y footer | Completar adopción visual de acceso y probar errores/recovery integral. |
| `/registro` | Form; viewport compartido | Fase 4: pasos, OTP, Didit, archivos, textos ampliados y eliminación de compactación restante. |
| `/panel`, `/cuenta`, `/ganancias` | Overview; navegación y mediciones del shell compartidas | Fases 3/5: jerarquía de cada estado y temas completos. |
| `/viajes` | List; navegación común y superficies semánticas | Fase 3: lista/mapa, búsqueda, filtros, datos largos y vacío con texto ampliado. |
| `/viajes/[id]` | Operation; navegación JSX común, viewport heredado y encabezados de seguridad adaptados | Fase 3: información esencial por etapa y representación terminal F11. |
| `/viajes/[id]/detalles`, `/viajes/[id]/soporte` | Detail; TripOperationalFrame hereda viewport, TripDialog usa modal común | Fase 3: pestañas, retorno, incidencias y mensajes extensos. |
| `/viajes/[id]/evidencia` | Form; navegación común, viewport heredado | Fase 4: cámara, borradores, fotos/llaves/mediciones y cierre con texto ampliado. |
| `/cuenta/perfil`, `/cuenta/datos-bancarios` | Form; ConductorScreen por DriverDetailsShell, footer externo | Completar estados de validación/autorización/guardado y teclado físico. |
| `/cuenta/documentos`, `/cuenta/certificacion` | Detail; memoria de ContainedScrollView con geometría común | Archivos, paginación, actualización y lector de pantalla. |
| `/cuenta/preferencias`, `/cuenta/seguridad`, `/cuenta/soporte`, `/cuenta/legal` | Detail; ConductorScreen con retorno fijo | Refinamiento visual y estados particulares. |
| `/ganancias/historial`, `/notificaciones` | List; ConductorScreen, contenido interno | Volúmenes grandes, filtros y recuperación de errores. |
| `/legal/terminos`, `/legal/privacidad` | Detail; geometría común por ContainedScrollView | Descarga, memoria y lectura con accesibilidad nativa. |
| `/403`, `/actualizacion-requerida` | State; contrato explícito | Adopción visual final y navegación del sistema/actualización de APK. |

El contrato enumera exactamente 30 rutas. La tabla agrupa rutas con el mismo tratamiento; el registro individual está en `route-contract.ts`. En vistas aún no migradas a ConductorScreen, los estilos existentes son adaptadores transitorios, no una nueva autoridad de medida. Se mantienen algunos selectores de estado del viaje para decidir cuándo mostrar navegación/seguridad; eliminarlos requiere la reorganización de fases 3 y 4.

## Validación ejecutada

Compilación de producción Next.js correcta, 31 páginas generadas. TypeScript correcto. ESLint de los componentes nuevos y pruebas del contrato: sin errores ni advertencias en la última ejecución específica. El build completo conserva advertencias en archivos preexistentes del repositorio.

**10 pruebas de navegador aprobadas**, ejecutadas como una matriz inicial de ocho y dos pruebas adicionales de resistencia sobre la misma compilación:

| Comprobación | Evidencia |
|---|---|
| Retorno fijo, cuerpo accesible y scroll raíz cero | Diez rutas por tamaño, a 320×568 y 390×844; más recuperación con teclado simulado. El control se comprueba por coordenadas y hit-testing, no solo visibilidad. |
| Diálogos de Menú y Salud | Modalidad nativa, foco interior, doce Tab y doce Shift+Tab, Escape, retorno al disparador y cierre alcanzable en ambas medidas. |
| Navegación y seguridad | Estados asignado, origen, recepción y trayecto en ambas medidas: una navegación visible, etiquetas coherentes, Emergencia ≥48×48 y acción principal alcanzable. |
| Formulario bancario | Guardar visible dentro de 320 px de área útil simulada, sin desplazar la raíz. |
| Tema oscuro | Contraste del título de Traslados ≥4,5:1 contra su superficie real. No se infiere contraste de toda la aplicación. |
| Registro de rutas | Igualdad entre page.tsx y manifiesto de variantes; resolución de subruta dinámica de evidencia. |
| Texto ampliado y dato largo | Texto DOM al 200 % en Preferencias con contenido añadido; región interna desplazable y retorno alcanzable. |
| Diálogo largo con teclado | Autorización bancaria, foco en contraseña, área útil simulada de 320 px y contenido largo; cierre alcanzable, Escape y recuperación de foco en ambas medidas. No se enviaron contraseñas ni se guardaron datos. |

Los primeros intentos detectaron escapes de foco con Tab y un botón de emergencia de 44 px; se corrigieron y la matriz se repitió con éxito. También se corrigieron los errores ESLint asociados a regiones desplazables y se verificó nuevamente el build.

La simulación DOM no equivale a texto ampliado nativo. Cambiar visualViewport no equivale al teclado de Android. Permanecen pendientes Android físico, lector de pantalla, rotación, safe areas reales, cámara, firma y transiciones completas.

### Reproducción

Desde `apps/app-conductor`, con Node 24 y pnpm 10:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e2e_only \
RUUM_LOCAL_PRODUCTION=true NEXT_PUBLIC_RUUM_AMBIENTE=development \
pnpm exec next build

pnpm exec playwright test --config playwright.interface.config.ts
```

Playwright inicia el API local ficticio y la compilación de producción en el puerto 3003. Se puede indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para Chromium instalado. Las pruebas no usan cuentas reales ni despliegues externos. Las capturas y trazas del runner se generan en test-results; cuatro capturas de revisión y un registro con hashes de los componentes se conservan en [evidencia/implementacion-2026-11-07](evidencia/implementacion-2026-11-07/validacion.json).

## Presupuesto y aceptación de la fase

Sin dependencias nuevas ni fuentes remotas. El build informa First Load JS: Inicio 341 kB, Traslados 320 kB y Ganancias 306 kB. Son tamaños del artefacto, no latencia ni fluidez medidas en dispositivo.

Objetivos de medición para fase 6: LCP ≤2,5 s, INP ≤200 ms y CLS ≤0,1 en el móvil/red acordados, con muestras repetibles de producción. Cualquier incorporación de mapas, cámara o análisis debe registrar su impacto antes de ampliar el presupuesto. Estos objetivos todavía no se presentan como resultados obtenidos.

**La aceptación de fase 2 queda cubierta:** componentes comunes implementados/documentados, variantes asignadas a todas las rutas, adopción de las siete rutas con scroll raíz y pruebas del contrato aprobadas. Se deja un mapa explícito para la reorganización funcional de viaje, evidencias y cierre; no se declara terminada la optimización de toda la aplicación.
