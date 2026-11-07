# Estado actual de la fase 2

La implementación del 7 de noviembre completa el marco común, la adopción de las siete rutas con scroll raíz y las pruebas de producción pendientes. Ver [IMPLEMENTACION-2026-11-07.md](IMPLEMENTACION-2026-11-07.md) para componentes, mapa de las 30 rutas, resultados y límites actuales.

El contenido que sigue es el **registro histórico de la primera adopción del 6 de noviembre**; sus pendientes y bloqueos no describen por sí solos el estado actual.

---

# Fase 2 — Contrato común y migración móvil

Fecha: 6 de noviembre de 2026. Diagnóstico de origen: `../auditoria-fase1/README.md` sobre d1537a4; implementación iniciada sobre b6e8a27. La revisión anterior y el inventario de estados se conservan como antecedentes, no como pruebas aprobadas en esta revisión.

## Contrato de interfaz

- El shell es dueño de navegación y safe areas. `useConductorShellInsets` mide la barra real; las páginas no deben restar una altura constante. Ancho máximo: 440 CSS px.
- `useVisibleViewport` publica en cada marco `--conductor-visible-top`, `--conductor-visible-height` y `--conductor-visible-bottom`. Atiende resize/scroll de visualViewport y resize de window. Al cambiar el área visible conserva el campo activo alcanzable. Fallback: innerHeight; CSS inicial: 100dvh.
- En formularios, expedientes, legales e historial se permite una región interna con nombre accesible, foco y desplazamiento por teclado. El retorno queda fuera de ella. No se evita scroll reduciendo la tipografía o eliminando contenido.
- Escala objetivo: cuerpo y campos 16 px, apoyo 14 px (12 px únicamente metadatos no esenciales), encabezados desde 20 px. No reducirla con teclado ni por altura. Texto ampliado debe reorganizar el contenido.
- Objetivo táctil: 48×48 CSS px efectivos, incluidos iconos, retorno y seguridad. Una etiqueta puede ampliar el objetivo de un checkbox; los controles adyacentes no comparten área.
- Temas: superficie, texto, borde, foco y estados se resuelven juntos mediante tokens semánticos. Contraste requerido: 4,5:1 texto normal y 3:1 texto grande y controles relevantes. La existencia de tokens no acredita contraste en todas las vistas.
- `ConductorDialog`: showModal nativo, foco inicial en cerrar, fondo inerte, Escape controlado por el padre, retorno al disparador al cerrar/desmontar, cierre persistente y cuerpo interno desplazable. Se mantiene el estado local de cada flujo.
- Operación: estado, destino/resumen, siguiente acción y seguridad tienen prioridad; el detalle largo debe ser consultable. Si el texto ampliado o teclado impiden ese reparto, usar un fallback accesible desplazable. No compactar controles a 30 px.
- Carga/error/offline: el feedback conserva contexto y reintento junto a su acción. Las pruebas de layout no deben ejecutar cambios de negocio remotos.

## Componentes y adopción actual

| Responsabilidad | Implementación | Estado en esta entrega |
|---|---|---|
| Navegación principal y medidas | ConductorNav / useConductorShellInsets | Se conserva; las seis barras locales operativas siguen pendientes de migración. |
| Área visible | useVisibleViewport | Compartida por ContainedScrollView y ConductorDialog; acceso y viaje siguen usando sus mecanismos anteriores. |
| Detalle y formulario extenso | ContainedScrollView / DriverDetailsShell | Se conserva restauración por ruta; adopta área visible y mínimos de 48 px en botones y retorno. |
| Diálogo | ConductorDialog | Adoptado en Menú de Inicio, Salud operacional e InfoSheet de Historial. Otros diálogos quedan en el mapa de migración. |
| Acceso | RegistrationShell y acceso actual | Adaptación al contrato compartido pendiente. |
| Operación | TripOperationalFrame | Se conserva como propietario actual del viaje; adaptación de sus etapas corresponde a las fases 3 y 4. |

## Mapa de las 30 rutas

La variante es el destino de migración, no una declaración de que la ruta ya cumple. No se añaden nuevos propietarios de altura paralelos a estos marcos.

| Ruta | Variante | Trabajo pendiente / adopción |
|---|---|---|
| / | acceso / redirección | Conservar entrada, onboarding y retorno de sesión. |
| /onboarding | acceso | Texto nativo ampliado y objetivos táctiles. |
| /login | acceso / formulario | Adoptar viewport común, enlaces 48 px y escala legible. |
| /recuperar-password | acceso / formulario | F01: retorno persistente y un scroll interno; probar éxito/error. |
| /nueva-password | acceso / formulario | Recovery controlado, campos y error con teclado. |
| /registro | formulario por pasos | Migrar RegistrationShell; eliminar compactación de etiquetas; hojas/OTP. |
| /panel | operación principal | Menú y Salud migrados a diálogo común; comprobar disponibilidad/offline/nombres largos. |
| /viajes | lista operativa | F03/F06: fallback con texto ampliado y superficies del tema. |
| /viajes/[id] | operación por etapa | F02/F03/F09/F11: seguridad, datos largos y estados terminales; fases 3–4. |
| /viajes/[id]/detalles | detalle | Mantener retorno; pestañas y encabezado accesible. |
| /viajes/[id]/evidencia | formulario por pasos | F03/F05: fotos/llaves/mediciones, teclado y seguridad; fase 4. |
| /viajes/[id]/soporte | detalle / formulario | Mensajes largos, error y recuperación de foco. |
| /cuenta | operación principal | Navegación única; opciones/salida y texto ampliado. |
| /cuenta/perfil | formulario por secciones | F04: eliminar texto de 7–11 px y controles compactados. |
| /cuenta/documentos | detalle | ContainedScrollView adopta viewport común; validar todos los estados de archivo. |
| /cuenta/certificacion | detalle | ContainedScrollView adopta viewport común; verificar paginación/retorno. |
| /cuenta/datos-bancarios | formulario | ContainedScrollView adopta viewport común; verificar CTA/error con teclado físico. |
| /cuenta/preferencias | detalle | F01: migrar cuerpo a scroll interno y conservar retorno/pestañas. |
| /cuenta/seguridad | detalle | F01: migrar cuerpo a scroll interno. |
| /cuenta/soporte | detalle | F01: migrar cuerpo a scroll interno. |
| /cuenta/legal | detalle | F01: migrar cuerpo a scroll interno. |
| /ganancias | operación principal | Conservar resumen; temas/estados y diálogo de programación por migrar. |
| /ganancias/historial | lista / detalle | InfoSheet migrado; F01: un scroll interno para el ledger. |
| /notificaciones | lista | F01: filtros/retorno fijos y lista interna. |
| /documentos | detalle / redirección | Mantener compatibilidad con expediente; comprobar destino/retorno. |
| /configuracion | detalle / redirección | Mantener destino y sesión; evitar otro marco propio. |
| /legal/terminos | detalle | Conservar ContainedScrollView y descarga; viewport común heredado. |
| /legal/privacidad | detalle | Conservar ContainedScrollView y descarga; viewport común heredado. |
| /403 | estado / acceso | Acción de salida legible y alcanzable. |
| /actualizacion-requerida | estado / acceso | Acción de actualización y retorno físico pendientes. |

## Matriz de regresión y límites

1. En 320×568 y 390×844: scrollY=0, sin scroll horizontal; hit-testing en centro y bordes de seguridad, retorno y CTA; una sola navegación visible.
2. Texto al 200 % y datos largos: cada dato esencial completo o detalle consultable, sin acciones inaccesibles. Registrar por separado simulación DOM y texto nativo.
3. Teclado simulado: foco, error y CTA alcanzables dentro del área útil; repetir en Android físico con autofill, rotación y navegación del sistema.
4. Diálogos: modalidad nativa, foco interior, Tab/Shift+Tab, Escape, cierre explícito, retorno al disparador y contenido largo desplazable.
5. Claro/oscuro: contraste medido en superficies, estados, foco y diálogos. F06 sigue abierto hasta medirlo.
6. Estados: ejecutar progresivamente ESTADOS.md con fixtures deterministas. Las transiciones completas de viaje/cámara/firma/cierre y rendimiento físico pertenecen a fases posteriores.

## Estado de los hallazgos

Esta entrega establece el contrato y realiza una primera adopción. No cierra los siete P1: F01–F06 requieren migración/medición adicional; F08 tiene tres implementaciones migradas con pruebas específicas. F07 conserva deuda explícita de navegación y marcos. F10 necesita reproducción antes de asignar causa. No se publican despliegues ni cambios remotos.

## Comprobaciones

Desde apps/app-conductor, Node 24:

```sh
pnpm exec vitest run test/conductor-dialog.test.tsx test/visible-viewport.test.tsx
pnpm exec playwright test --config playwright.mobile-shell.config.ts --grep diálogos
pnpm exec tsc --noEmit
```

Las pruebas unitarias simulan la API de diálogo ausente en jsdom; la captura nativa de foco y el fondo inerte deben verificarse en navegador. Los resultados de ejecución se registran al terminar la validación de esta entrega.

### Resultados locales de esta entrega

- Node 24.13.0. TypeScript y ESLint de archivos modificados: correctos.
- Cuatro pruebas unitarias aprobadas. En este entorno se ejecutaron con `--testTimeout 20000 --maxWorkers 1`; la primera ejecución excedió el límite predeterminado de 5 segundos.
- Primer intento de navegador: la navegación inicial a `/panel` excedió 360000 ms antes de interactuar con los diálogos. El API ficticio `/health` devolvió 200. No equivale a un fallo demostrado de modalidad o foco.
- Sin validación física Android, lector de pantalla ni build de producción nuevo.

### Bloqueo reproducido en navegador (F10)

El reintento con espera de datos llegó a renderizar el panel, pero falló antes de abrir Menú: React informó una diferencia de hidratación entre un bloque de alerta renderizado en servidor y `PanelLoadingSkeleton` en cliente. La capa `nextjs-portal` de error de desarrollo interceptó los clics sobre «Abrir menú». Playwright agotó 180000 ms; las otras dos medidas no se ejecutaron por `--max-failures 1`.

No se forzó el clic, se ocultó la capa ni se relajó CSP. La consola también registró rechazos CSP de estilos del overlay y errores del transporte Realtime del fixture. No se ha establecido la causa raíz de hidratación ni su equivalencia con el error observado en producción durante la fase 1. Los diálogos no tienen validación de navegador aprobada en esta entrega.

Comando del reintento:

```sh
pnpm exec playwright test --config playwright.mobile-shell.config.ts --grep diálogos --max-failures 1 --timeout 180000
```

La captura del bloqueo se conserva en `evidencia/hidratacion-panel-320.png`. Las cuatro pruebas unitarias volvieron a pasar después de hacer enfocable la región desplazable del diálogo, y ESLint de ese componente pasó de nuevo.
