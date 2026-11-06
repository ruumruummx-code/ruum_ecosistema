# Fase 1 — Inventario y diagnóstico de la interfaz del conductor

Fecha: 5 de noviembre de 2026. Base de la aplicación: [`d1537a4`](https://github.com/ruumruummx-code/ruum_ecosistema/commit/d1537a4704f80aeae160af9b8acd0cbc91c6e91d).

La fase 1 identifica problemas y prepara decisiones para la fase 2. **No se modificó la interfaz, la lógica de negocio ni las dependencias.** Se añadieron inventario, evidencias y herramientas de diagnóstico.

## Resultado y criterio de aceptación

Se revisaron **las 30 rutas de página**, sus componentes de presentación, sus estados y los límites de carga/error. El resultado es una matriz por ruta y un inventario de estados con hallazgos priorizados y criterios verificables de corrección.

- [Matriz de las 30 rutas](MATRIZ.md), también [CSV](matriz-rutas.csv).
- [Inventario de estados y cobertura real](ESTADOS.md).
- [Mediciones del navegador](evidencia/mediciones.json) y [referencias de código](evidencia/inventario-codigo.json).
- [Capturas seleccionadas](capturas/).

El diagnóstico confirma que la unificación está incompleta. La base de Inicio, Cuenta, Traslados y Ganancias no se extiende todavía a todas las vistas; tampoco basta con bloquear el scroll de la raíz para que una pantalla sea usable.

## Método y límites de interpretación

Se auditó el código de la versión indicada y su compilación de producción local, en Chromium 155.0.8059.79 sobre Linux. Se usaron únicamente datos ficticios y API de loopback; no se crearon cuentas, enviaron mensajes, subieron archivos ni ejecutaron transiciones sobre servicios reales.

Se guardaron **144 observaciones**: 114 recorridos/renderizados normales, nueve escenarios de texto ampliado, cuatro simulaciones de teclado y 17 sondas puntuales. Son observaciones diagnósticas, no 144 pruebas aprobadas.

La matriz usa **320×568 y 390×844 CSS px** como tamaños de referencia. Son tamaños de prueba para esta fase, no una afirmación de que todos los móviles estén cubiertos. Se recorrieron estados de viaje, los cinco pasos principales del registro, las pestañas de inspección y los paneles de soporte y emergencia. También se midieron nueve escenarios de texto ampliado y cuatro de teclado.

- «Texto 200 %» significa duplicación de tamaños computados de texto mediante DOM, no zoom nativo ni la configuración de accesibilidad de Android.
- «Teclado» significa simulación de `visualViewport.height = 320` con un campo enfocado; no incluye teclado físico/nativo, autofill ni navegación del sistema. En la sonda de evidencia se enfoca el primer campo disponible, no se recorren todos los campos.
- Los datos largos se inyectan en el DOM de prueba: sirven para detectar fragilidad de layout; no verifican persistencia ni normalización del backend.
- Un control fuera de la vista inicial dentro de un expediente desplazable **no se considera perdido automáticamente**. Se registra aparte del contenido sin una vía de desplazamiento.
- Los tamaños inferiores a 48×48 son candidatos contra el objetivo del proyecto. Una casilla puede tener una etiqueta asociada que amplíe su área táctil; los conteos brutos no son una certificación de accesibilidad ni una infracción automática de WCAG.
- El conteo de colores incluye SVG y comentarios. No demuestra por sí solo que cada literal sea incorrecto.
- Las pruebas de funcionamiento anteriores no se reinterpretan como una certificación de diseño, contraste, rendimiento o operación física.

## Hallazgos priorizados

**P1:** corregir antes de considerar uniforme y lista la operación móvil. **P2:** deuda estructural/consistencia que debe resolverse o quedar explícitamente planificada. No se asigna P0: la auditoría no demostró un bloqueo total del servicio ni corrupción de datos.

| ID | Prioridad | Hallazgo y evidencia | Criterio de corrección |
|---|---|---|---|
| **F01** | P1 | Siete rutas permiten scroll del documento a 320×568: Recuperar contraseña (+35 px), Preferencias (+1210), Seguridad (+751), Soporte de Cuenta (+782), Marco Legal (+569), Historial de ganancias (+238), Notificaciones (+69). Las sondas `scroll-raiz-*` confirman `window.scrollY > 0`, no solo un cálculo de altura. A 390×844 persisten cinco de ellas. | `scrollY = 0` en ambas medidas; encabezado/retorno y navegación permanecen disponibles. Historial, listas y textos largos se desplazan en una única región interna accesible. No reducir textos para conseguirlo. |
| **F02** | P1 | Emergencia queda recortada en «Dirígete al origen», «Recibe el vehículo» e «Inicia el trayecto» a 320 px. En el primer caso el botón ocupa `x=226`, `w=137`: termina en 363 px. [Captura](capturas/emergencia-recortada.png). | Botón completo, etiqueta legible y área mínima 48×48 dentro del viewport; hit-testing y apertura/cierre válidos con títulos largos, texto ampliado y teclado. Ningún control de seguridad depende de scroll horizontal. |
| **F03** | P1 | El bloqueo de overflow no resuelve el contenido ampliado. En Traslados con texto 200 %, «Volver al panel» comienza en `y=663` sin región interna desplazable. En inspección, Emergencia termina en `x=469`, «Siguiente» termina en `x=337` y hay fotos fuera del marco. En cierre también salen controles del viewport. [Captura](capturas/evidencia-texto200.png). | Acción principal, soporte y emergencia siguen disponibles; el texto puede crecer sin recorte irrecuperable. Reorganizar en pasos/detalles y permitir fallback de accesibilidad antes que ocultar información crítica. Verificar tanto simulación como texto ampliado nativo. |
| **F04** | P1 | Se intenta encajar reduciendo controles y tipografía. En Perfil de 320×568 se midieron texto de 7 px, etiquetas de 9 px y pestañas de 34 px de alto. Registro usa etiquetas de 11 px y, con teclado simulado, de 9 px. La oferta reduce volver/soporte/emergencia a 30 px; Login tiene enlaces legales de 17 px de alto. [Perfil](capturas/perfil-compactado.png), [Registro](capturas/registro-teclado-simulado.png). Fuentes: `cuenta/details.module.css:103–104`, `registro/registration.module.css:286–313`, `globals.css:65–69`. | Sustituir compactación por jerarquía y pasos. Definir en fase 2 una escala legible: propuesta inicial 16 px en campos/cuerpo y 12–14 px solo en apoyo; ningún dato operativo esencial a 7–11 px. Área táctil efectiva de al menos 48×48, incluyendo controles de icono y enlaces. |
| **F05** | P1 | Hay distintos mecanismos de teclado: Login y Registro observan visualViewport; viaje aplica variables propias; expedientes se basan en `100dvh`. En datos bancarios, con área útil simulada de 320 px, «Guardar y continuar» comienza en 332 px y mide 44 px, sin scroll interno disponible en ese estado medido. [Captura](capturas/banco-teclado-simulado.png). | Un único contrato de viewport/teclado. Campo, error y acción se pueden alcanzar sin cerrar el teclado; no ocultar controles ni reducirlos para caber. Confirmar en Android real además de la simulación. |
| **F06** | P1 | El tema oscuro es seleccionable, pero mezcla tokens oscuros con superficies claras fijas. En Traslados el `h1` tiene `rgb(246,248,251)` sobre `rgb(255,255,255)`, aproximadamente **1,06:1**. Login sigue mostrando un lienzo blanco al seleccionar noche. [Captura](capturas/traslados-modo-oscuro.png). | Resolver tema por componentes semánticos completos. Contraste mínimo 4,5:1 en texto normal y 3:1 en texto grande y controles relevantes; verificar también estados, foco y diálogos. Si el tema no está soportado, no presentarlo como una opción funcional. |
| **F07** | P2, dependencia de fase 2 | Hay siete implementaciones TSX de navegación principal: una compartida y seis locales en etapas del viaje/inspección. El CSS oculta la global durante esas etapas, por lo que no se observaron dos barras visibles a la vez: el problema es duplicación de responsabilidad y medidas. «Cuenta» cambia a «Mi cuenta». Además conviven TripOperationalFrame, RegistrationShell, DriverDetailsShell/ContainedScrollView y vistas sueltas. Se encontraron 1306 apariciones de literales hex en 489 valores distintos en TSX/CSS, incluidos SVG/comentarios. | Una única fuente de destinos, estado activo y medidas. Variantes explícitas del marco para acceso, operación, formulario y detalle; cada vista declara su variante en vez de coordinar selectores `:has` y alturas propias. Inventariar colores por uso antes de migrarlos. |
| **F08** | P1 | Menú y Salud operacional de Inicio usan `<dialog open>` sin `showModal()`: las sondas muestran `nativeModal=false`, `focusInside=false`, `visibleAfterEscape=true`. Historial usa también una implementación propia de hoja (`InfoSheet`). [Captura](capturas/menu-sin-modalidad.png). | Componente común de diálogo: foco inicial interior, fondo inerte, Tab contenido, Escape y botón de cierre, retorno al disparador y scroll interno cuando sea largo. Verificar con teclado y lector de pantalla. |
| **F09** | P2 | La jerarquía del viaje aún exige desplazamiento con datos breves: «Asignado» tiene 228 px de exceso en su cuerpo interno; cierre, 442 px. Nombre largo en Inicio aumenta el scroll interno a 83 px. Una referencia larga se trunca con ellipsis. [Captura](capturas/referencia-larga.png). No se afirma que el dato se pierda: algunos detalles pueden consultarse por otra vista. | Definir qué es esencial por etapa. Estado, destino/resumen y siguiente acción sin scroll en el caso habitual; datos completos, nunca sustituidos por una elipsis sin acceso, disponibles en detalle con retorno persistente. Probar nombres y referencias largos desde fixtures de datos, no solo DOM. |
| **F10** | P2, requiere reproducción | Una carga de Inicio registró React #418 (hidratación) en producción local. El resto de las mediciones no prueba una causa ni frecuencia. | Reproducir con tiempo, locale, conexión y estado de sesión controlados. Documentar causa antes de corregir; cero errores de hidratación en la matriz acordada. No atribuirlo a un componente sin evidencia. |
| **F11** | P2 | El router envía tanto `evidencia_final_completada` como `entrega_confirmada` y `servicio_cerrado` al mismo formulario de cierre. En los tres estados se mostró «CIERRE DE TRASLADO». No se ejecutó otro cierre ni se diagnosticó la autorización del backend. | Definir representación de estados terminales: estado final y comprobante claramente diferenciados de la acción pendiente. Verificar recarga/retorno y ausencia de acciones de modificación que no correspondan. |
| **F12** | P2 | La cobertura previa se concentraba en scroll raíz, navegación y acciones concretas; no establece un contrato global de 48 px, temas, tipografía, subestados y contenido largo. No hay una medición física actual de fluidez, teclado, cámara ni consumo. El build anterior informa 340 kB First Load JS en Inicio, 320 kB en Traslados y 305 kB en Ganancias; estos tamaños no son tiempos de respuesta. | Acordar contrato verificable de UI y presupuesto de rendimiento en fase 2. Incorporar matriz de estados, hit-testing, foco, texto ampliado, datos largos y carga/error; medir producción en móvil físico en fase 6. No declarar 100 % optimizada a partir del build. |

## Aplicación de las reglas del plan

| Regla | Qué se verificó en fase 1 | Resultado para las próximas fases |
|---|---|---|
| Operación principal sin scroll | Se midieron por separado raíz y regiones internas, con datos breves y largos. | Incumplimientos F01/F03/F09; no confundir raíz bloqueada con pantalla que cabe. |
| Desplazamiento permitido para extensos | Se identificaron expedientes, legales, historial y listas. | Mantener ContainedScrollView como comportamiento de referencia; no eliminar su contenido para evitar scroll. |
| No ocultar información crítica | Se revisaron truncamientos, overflow y controles fuera del marco. | F02/F03/F09; distinguir detalle consultable de contenido inaccesible. |
| Controles ≥48×48 y legibilidad | Medición de cajas y tamaños computados, con ejemplos revisados. | F04. Validar área táctil efectiva, no solo el glifo del checkbox o icono. |
| Carga, error, offline y recuperación | Se inventariaron límites de error/carga y se renderizaron carga/error de viaje, error de evidencia y desconexión de Inicio. | Hay estados identificados pero pendientes de interacción completa; figuran en ESTADOS.md. |
| Texto ampliado, teclado y datos largos | Sondas declaradas con su naturaleza simulada y capturas. | F03/F05/F09. No se sustituyen las pruebas nativas. |

## Orden de trabajo propuesto para fase 2

1. **Contrato de estructura:** asignar variante de marco a cada fila de MATRIZ.md y fijar propietario único de altura, safe areas y navegación. Resolver F07 sin eliminar los comportamientos útiles de expedientes y viaje.
2. **Controles y legibilidad:** acordar dimensiones efectivas, escala tipográfica y cómo acceder a los datos completos. Estos límites prevalecen sobre el intento de encajar todo.
3. **Viewport y acción persistente:** aplicar el contrato a las siete rutas con scroll raíz y a los encabezados de seguridad; el teclado se considera parte del contrato, no un parche por pantalla.
4. **Diálogo común y temas:** especificar foco, cierre, scroll interno, contraste y recuperación de contexto antes de migrar vistas.
5. **Matriz de regresión:** convertir los hallazgos confirmados en criterios de validación por variante. La ejecución de los flujos de viaje/evidencias/cierre corresponde después a las fases 3 y 4.

La salida de fase 2 debe ser concreta: componentes comunes documentados, mapa de migración por pantalla y pruebas del contrato. No implica rehacer todavía todas las etapas operativas.

## Reproducción

Desde `apps/app-conductor`, con Node 24 y pnpm 10. El build debe usar exclusivamente el fixture local, no credenciales reales:

```sh
node scripts/audit-interface-fixture.mjs
```

En otra terminal:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e2e_only \
RUUM_LOCAL_PRODUCTION=true NEXT_PUBLIC_RUUM_AMBIENTE=development \
pnpm exec next build

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e2e_only \
RUUM_LOCAL_PRODUCTION=true NEXT_PUBLIC_RUUM_AMBIENTE=development \
pnpm exec next start -p 3001
```

Con el servidor listo, en otra terminal:

```sh
RUUM_AUDIT_OUTPUT=/tmp/conductor-auditoria pnpm exec node scripts/audit-interface-phase1.mjs
RUUM_AUDIT_OUTPUT=/tmp/conductor-sondas pnpm exec node scripts/audit-interface-probes.mjs
```

Se puede indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` si se usa Chromium instalado. `--static-only` limita el primer script al inventario de código. `RUUM_AUDIT_CASE_FILTER` acepta IDs separados por coma; `RUUM_AUDIT_SKIP_STRESS=1` omite la simulación adicional. `RUUM_AUDIT_PROBE_PREFIX` limita las sondas. Los scripts rechazan un servidor de aplicación que no sea localhost/127.0.0.1.

Los nombres `screenshot` de las mediciones corresponden al paquete completo de evidencias entregado por separado; esta carpeta conserva nueve capturas seleccionadas con nombres descriptivos.

Los archivos JSON registran observaciones, no una suite aprobada: terminar el recorrido no significa que las pantallas cumplan los criterios. Las capturas y mediciones son la referencia para revisar cada hallazgo.
