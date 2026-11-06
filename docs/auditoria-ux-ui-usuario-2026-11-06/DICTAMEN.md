# Auditoría UX/UI de App Usuario — dictamen de preparación para producción

**Dictamen: NO GO.** Fecha: 6 de noviembre de 2026. Revisión: `b6e8a27f75eb8922020b64142dd232daca95f36a`. Aplicación: `apps/app-usuario`. La salida pública debe esperar a resolver el defecto transversal de estilos, corregir accesibilidad esencial y completar la validación de los recorridos críticos sobre un candidato de producción.

**Control de versión:** al iniciar la auditoría no había cambios de código rastreados en App Usuario. Al cierre aparecieron modificaciones concurrentes ajenas a esta auditoría en acceso, CSP y semáforo de PDF. Entre ellas se retiró el selector EN del acceso. Esa parte de UX-06 queda como corrección concurrente observada en el diff, pendiente de revalidación; la opción English de preferencias permanece en el alcance del hallazgo. Las capturas y pruebas describen el estado observado durante la revisión, no certifican automáticamente esas modificaciones posteriores. No se sobrescribieron esos cambios.

El dictamen se basa en inspección del código, navegación local en Chromium, capturas, análisis automático de accesibilidad y pruebas existentes. **No es una certificación del despliegue productivo ni una evaluación con usuarios reales.** No se proporcionó una URL de candidato de producción. Los datos y la autenticación del navegador proceden de los dobles locales del repositorio; no se ejecutaron cobros, llamadas, verificaciones de identidad ni solicitudes reales. No se modificó código de producto.

## Decisión ejecutiva

La propuesta de producto se entiende: solicitar, pagar, seguir y cerrar documentalmente un traslado. El escritorio ofrece una jerarquía clara entre traslado activo, seguimiento, conductor y acciones. Existen mecanismos valiosos: borradores con caducidad, explicación de conciliación de pagos, reintentos, recuperación de errores, consentimiento explícito y ayudas de accesibilidad.

Sin embargo, la experiencia móvil observada no mantiene esa jerarquía: una cabecera de 394 px ocupa casi la mitad de una pantalla de 844 px, recorta contenido y comprime el seguimiento hasta superponerlo con otras tarjetas. La consola identifica estilos bloqueados por la política de seguridad. En una comparación local que elimina únicamente esa cabecera de seguridad de la respuesta interceptada, el logotipo pasa de 392 a 36 px y la cabecera de 394 a 46 px. Esta comparación es diagnóstica; **eliminar la política de seguridad no es la solución propuesta**.

También se reproducen problemas de contraste en navegación y acceso, errores de semántica accesible y una selección de idioma que promete un cambio que no realiza. Las pruebas de componentes aprobadas no compensan esos defectos visuales y funcionales.

**P0 encontrados:** ninguno demostrado. **P1:** estilos bloqueados, accesibilidad de navegación/lectura, controles sin nombre y confirmación de guardado que oculta errores. **P2:** semántica, controles pequeños, idioma, recuperación de pago y comunicación de soporte. La ausencia de P0 no equivale a autorización de lanzamiento.

## Método y alcance

Se programó una matriz de 28 visitas: doce rutas a 390 y 1440 px, y cuatro rutas a 320 px, con altura de 900 px. Se añadió una reproducción independiente del inicio a 390 × 844 px, esperando `load`, ocho segundos adicionales y fuentes cargadas. El archivo `browser-results.json` registra qué visitas terminaron, qué URL se alcanzó y cuáles agotaron su tiempo. Las visitas fallidas no cuentan como pantallas visualmente auditadas.

**Resultado cerrado:** 26 visitas registradas, 21 análisis completos y cinco sin análisis completo; dos combinaciones adicionales no se completaron en la ejecución programada (detalle a 1440 px y wizard a 320 px). Se cubrieron diez rutas distintas con análisis en al menos un ancho. Los 115 nodos marcados incluyen repeticiones entre pantallas y tamaños, y no equivalen a 115 defectos únicos. Ver `MATRIZ.md`, `browser320-results.json` y `resumen-evidencia.json`.

Rutas de la matriz: acceso, registro, inicio, mis traslados, nuevo traslado, carga masiva, cuenta, preferencias, soporte, ubicaciones, pasaporte y detalle de un traslado activo. Se revisaron además en código recuperación de acceso, pago, cancelación, borrador, consentimiento, seguimiento, navegación y componentes compartidos.

El análisis con axe utiliza etiquetas WCAG A/AA de las versiones 2.0, 2.1 y 2.2. Sus resultados son hallazgos automáticos que requieren interpretación; cero incidencias automáticas no demuestra accesibilidad completa. No se midió conformidad integral, lector de pantalla, teclado virtual, dispositivos físicos, Safari, Firefox, TalkBack/VoiceOver ni shell Android. No se presentan puntuaciones inventadas de usabilidad, conversión o rendimiento.

## Hallazgos priorizados

### UX-01 · P1 · La política de estilos rompe el shell móvil

**Evidencia reproducida.** Inicio autenticado, 390 × 844 y 390 × 900. La imagen del encabezado se representa a 462 × 392 px; la cabecera mide 394 px. El contenido de seguimiento se superpone con accesos rápidos y el contacto del conductor queda parcialmente cubierto. Mis traslados presenta la misma imagen sobredimensionada. Un `scrollWidth` igual al ancho de pantalla no detecta este problema, porque hay recorte y desbordamiento interno.

**Causa comprobada mediante comparación local:** `style-src` incluye a la vez `unsafe-inline` y un nonce. El navegador avisa expresamente que ignora `unsafe-inline` al existir nonce y bloquea estilos en atributos. El logo compartido utiliza un estilo en línea para fijar su altura. Sin la cabecera CSP, en la misma aplicación, la imagen mide 36 px. El constructor de política también se usa para producción; el impacto en un build productivo debe verificarse antes de cerrar el hallazgo.

**Impacto:** dificulta leer el estado del servicio, encontrar acciones y comunicarse con el conductor; afecta una pantalla central del uso móvil.

**Corrección:** reconciliar la política de estilos con los componentes reales, preferir clases CSS para dimensiones estáticas y validar los elementos que necesitan estilos dinámicos. Mantener las protecciones de seguridad. Revisar logo, overlays, mapas y shell; no resolver únicamente el tamaño visible del logo.

**Aceptación:** candidato de producción con su CSP efectiva, sin bloqueos de estilo que afecten UI; cabecera compacta, seguimiento y acciones legibles, sin solapamientos a 320/360/390/430 px, orientación horizontal y texto ampliado. Repetir navegación y consentimiento con ratón y teclado.

Evidencias: `inicio-confirmado-390.png`, `inicio-confirmado.json`, `csp-browser.json`, `interacciones.json` y `diagnostico-local-sin-csp.png`. La última imagen corresponde a una comparación local alterada, no al comportamiento aprobado del producto.

### UX-02 · P1 · Contraste insuficiente en navegación y textos de acceso

**Evidencia automática y visual.** En el inicio y otras pantallas móviles, las etiquetas inactivas de navegación muestran relaciones aproximadas de 3.08–3.11:1 con texto de 11 px; el criterio aplicado por axe exige 4.5:1 para ese texto. En acceso, el texto legal alcanza 2.63:1 a 10.5 px. También existen enlaces que quedan cerca del umbral, en 4.49:1. Los valores y selectores completos están en el JSON.

**Impacto:** personas con baja visión o en condiciones de iluminación adversas pierden legibilidad en destinos principales y condiciones de acceso.

**Corrección y aceptación:** ajustar colores semánticos con margen suficiente, conservar diferencias de estado sin depender solo del color y repetir todos los estados en temas claro/oscuro. Cerrar los fallos de contraste de contenido esencial; no redondear 4.49 a aprobado. No basta subir la opacidad de un único texto local.

### UX-03 · P2 · Las listas de indicadores tienen estructura semántica inválida

**Evidencia reproducida con axe:** `definition-list` en resumen de mis traslados; `definition-list` y `dlitem` en cuenta. Hay iconos y contenedores dentro de las agrupaciones de términos/valores que no cumplen la estructura esperada. En el código de `MisViajesCliente.tsx` aparecen valores `dd` antes de sus términos `dt`.

**Impacto:** dificulta relacionar indicadores como total, activos y gastado mediante tecnología de asistencia.

**Aceptación:** estructura válida con término y valor relacionados, iconos decorativos fuera de la relación semántica, sin fallos de esas reglas; verificar lectura del resumen con lector de pantalla.

### UX-04 · P2 · El nombre accesible del mapa no está correctamente asociado

**Evidencia reproducida:** `aria-prohibited-attr` en el mapa del detalle y en la vista de escritorio de traslados. Se utiliza `aria-label` sobre un `div` sin un rol que lo admita.

**Corrección y aceptación:** dar al contenedor el rol y nombre adecuados a su función real, sin ocultar los controles interactivos; ofrecer estado, ubicación y antigüedad de actualización en texto. Verificar navegación por teclado. El mapa sin cartografía con el token de prueba no se clasifica como defecto del producto.

### UX-05 · P2 · Los indicadores del carrusel son demasiado pequeños

**Evidencia reproducida en escritorio:** `target-size` en los tres botones “Ver tip”. Axe mide 16 × 20 px y separación insuficiente entre vecinos.

**Impacto:** aumenta errores al pulsar y dificulta el uso con limitaciones motoras.

**Aceptación:** área interactiva de al menos 24 × 24 px con separación suficiente; preferir 44–48 px para interacción táctil donde el espacio lo permita. Mantener indicador visual pequeño dentro de un botón de tamaño suficiente, foco visible y nombres distinguibles.

### UX-06 · P2 · Seleccionar English / EN no traduce la interfaz

**Evidencia funcional:** en el acceso de escritorio se seleccionó EN. Cambia el indicador, pero “Inicia sesión”, las etiquetas y los mensajes permanecen en español, y el documento conserva `lang="es"`. En preferencias, el código guarda `en`, pero `aplicarIdiomaEnDocumento` fija siempre `es-MX` y el aviso reconoce que la interfaz está disponible en español.

**Impacto:** se promete una capacidad inexistente y se dificulta el acceso de personas que esperan operar en inglés.

**Aceptación:** traducir todo el recorrido y sus mensajes, con idioma del documento correcto, o retirar/deshabilitar la opción explicando su disponibilidad antes de seleccionarla. No simular una selección operativa.

### UX-07 · P2 · El inicio del pago puede quedarse esperando sin salida contextual

**Evidencia de código; no reproducida con Stripe real.** En `PagoStripe.tsx`, las peticiones para crear el intento y obtener la sesión de billetera no tienen un plazo de espera explícito ni cancelación. Mientras no haya resultado se muestra un esqueleto; el reintento aparece después de un error. Algunos mensajes muestran `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `clientSecret` o el nombre de Supabase al usuario.

**Impacto potencial:** ante una conexión estancada, la persona no sabe si debe esperar, salir o repetir la operación. Los errores técnicos trasladan al usuario una acción que no puede resolver.

**Aceptación:** plazo de espera controlado, mensaje con acción útil, consulta de estado antes de repetir un cobro, preservación de idempotencia y comprobante recuperable. Traducir fallos de configuración al lenguaje del usuario y enviar el detalle técnico a observabilidad. Probar rechazo, 3DS, pendiente, retorno, refresco y desconexión antes/después de confirmar pago.

### UX-08 · P2 · La confirmación de cancelación no gestiona explícitamente el foco

**Evidencia de código; pendiente de reproducción completa:** `CancelarTraslado.tsx` sustituye el campo y botón por un panel de confirmación. No se observa traslado/restauración de foco ni anuncio del nuevo panel en esa transición. No se requiere convertirlo necesariamente en un modal; se necesita que el cambio sea perceptible y operable.

**Aceptación:** activar “Cancelar viaje” con teclado, anunciar cargo y consecuencias, llevar el foco a un destino apropiado, permitir mantener el viaje y restaurar el foco de manera predecible. Confirmar que la acción final no se duplica ante pulsaciones repetidas. Conservar el texto de penalización previo a la confirmación.

### UX-09 · P2 · La promesa de soporte necesita precisión

**Evidencia de contenido:** el inicio móvil anuncia “Soporte 24/7”; el formulario publica horario de lunes a viernes 8:00–20:00 CDMX, menos de 30 minutos en horario y menos de dos horas fuera de horario. Esto puede significar recepción continua con atención diferenciada, pero esa distinción no se explica en el acceso principal.

**Aceptación:** acordar con operación qué canal responde a cada hora y diferenciar recepción, emergencia y tiempo esperado de atención. Usar el mismo mensaje en inicio, soporte y confirmación. El hallazgo es de claridad de promesa; esta auditoría no comprobó incumplimientos de atención real.

### UX-10 · P1 · Preferencias de escritorio tiene controles sin nombre accesible

**Evidencia reproducida:** nueve interruptores fallan `button-name` y cinco selectores fallan `select-name` en `/cuenta/preferencias` a 1440 px. Tener texto en una columna vecina no lo asocia automáticamente con el control. La variante móvil utiliza otro componente y no presenta esos mismos errores en la captura analizada.

**Impacto:** una persona con lector de pantalla no puede saber de forma fiable qué canal o preferencia está activando. La diferencia entre variantes muestra que revisar solo móvil o solo el componente compartido deja defectos sin detectar.

**Aceptación:** nombres únicos mediante etiquetas asociadas o referencias accesibles; en la matriz, identificar tanto evento como canal. Anunciar estado y cambio. Repetir axe y lector de pantalla en ambas variantes, no solo en la ruta móvil.

### UX-11 · P1 · Preferencias de escritorio confirma éxito aunque falle el guardado remoto

**Evidencia funcional y de código:** se interceptó la actualización de preferencias y se devolvió un HTTP 503 controlado. Aun así, la pantalla mostró “Cambios guardados con éxito”. `preferencias-falso-exito.json` registra una petición PATCH fallida y el texto de éxito; la captura homónima muestra el resultado. `handleGuardarCambios` en `cuenta/preferencias/PreferenciasCliente.tsx` captura el error y continúa hasta `setMensajeExito(true)`. La pantalla promete aplicación inmediata a la cuenta. El almacenamiento local usa además una clave global, distinta del esquema por usuario de la variante móvil. Varias opciones generales se almacenan solo en ese objeto local, mientras el guardado remoto envía un subconjunto de notificaciones.

**Impacto:** falsa certeza al configurar avisos de viaje, pago y privacidad; posibles diferencias al entrar desde otro dispositivo o cambiar de cuenta en el mismo navegador. El alcance exacto por opción requiere prueba adicional, pero el camino de falso éxito es explícito en el código.

**Aceptación:** unificar el contrato de preferencias móvil/escritorio, aislarlas por usuario, distinguir guardado local de sincronización remota y nunca anunciar éxito remoto tras un error. Simular un 503 y pérdida de red, verificar mensaje de pendiente/error con reintento y comprobar lectura tras recarga y cambio de cuenta. Validar cada control contra su efecto real, incluida accesibilidad y uso de datos.

## Condiciones de salida que aún requieren evidencia

| Gate | Evidencia necesaria para GO |
|---|---|
| Recorrido individual | Registro y confirmación, acceso, identidad, cotización con direcciones reales, aceptación de precio, solicitud, pago, asignación, seguimiento, entrega y expediente recuperable. |
| Recorrido masivo | Archivo válido, columnas inválidas, errores por fila, corrección, pago parcial, conciliación, cancelación y retorno tras refresco sin duplicar solicitudes/cobros. |
| Dinero y confianza | Stripe de pruebas integrado al backend real de staging: rechazo, autenticación adicional, pendiente, webhook retrasado, retorno y comprobante. Nunca convertir la ausencia de respuesta en “pagado”. |
| Identidad y teléfono | Didit con permiso concedido/denegado, abandono, aprobación/rechazo y retorno. Decisión explícita sobre suspensión de SMS; el registro lo omite por defecto salvo configuración contraria. No es por sí mismo un bug, pero cambia la promesa de teléfono verificado. |
| Comunicación y operación | Chat, llamada enmascarada, emergencia, ticket con folio, notificaciones y seguimiento con posición atrasada/sin GPS. Verificar contactos configurados y atención efectiva. |
| Accesibilidad | Contraste, foco, teclado, lector de pantalla y contenido a 200%/reflujo equivalente a 320 px, sin controles ocultos ni información que dependa solo del color. |
| Plataforma | Safari iOS y Chrome Android en dispositivos físicos, teclado abierto, permisos, áreas seguras, atrás del sistema y reanudación del shell Android si forma parte del lanzamiento. |
| Candidato de producción | Build reproducible, pruebas críticas aprobadas con CSP efectiva, carga lenta controlada y medición de rendimiento sobre el build productivo. El arranque frío del servidor de desarrollo no es un Core Web Vital de producción. |

Para un GO deben cerrarse los P1 y pasar los gates críticos. Los P2 restantes requieren decisión explícita del responsable de producto, con propietario y fecha; si bloquean completar una tarea esencial o afectan el alcance comercial prometido, también deben cerrarse antes de salida.

## Lectura correcta de las pruebas y límites

- Se usó Node 24.13.0, conforme al repositorio. No se cambiaron dependencias, configuración de Turbo, código de producto ni servicios externos.
- Las pruebas focalizadas de registro, pago y soporte terminaron con **32/32 aprobadas en tres archivos**. El patrón solicitado para preferencias no seleccionó un archivo adicional. No afirmar que toda la suite unitaria pasó: la ejecución global se interrumpió sin resultado final.
- El primer intento E2E de 58 pruebas se interrumpió tras esperas agotadas al navegar a nuevo traslado. Se repitió un subconjunto de 29 con un servidor aislado: el log conserva los casos aprobados, fallidos y el punto de interrupción. **No hay aprobación integral E2E.** Los fallos de acceso y cotización requieren diagnóstico/retest; no se presentan como incidentes de producción confirmados.
- La primera comprobación de tipos coincidió con regeneración de archivos `.next/types` y falló por archivos generados ausentes. El segundo intento **terminó aprobado**, para distinguir ese problema de entorno de errores del código.
- El servidor alternativo de inspección usa Next con Turbopack; no se modificó Turborepo. Los avisos de instrumentación y el arranque lento se documentan como condiciones del entorno. No se midieron tiempos productivos ni tasas de éxito reales.
- No se ejecutó ni certificó un build de producción. La reproducción visual corresponde al servidor local; el cierre debe repetirse sobre el candidato productivo y sus cabeceras efectivas.
- Las capturas incluyen indicadores de desarrollo de Next. Esos indicadores no son hallazgos de UX del producto.
- Un aviso `meta-refresh` en `/pasaporte` corresponde a una redirección transitoria hacia el expediente. Se conserva en el JSON, pero no se eleva a defecto persistente sin una reproducción específica.
- No se ejecutó una evaluación legal, de seguridad integral, carga de producción o investigación con personas usuarias. La cobertura automática no reemplaza estas disciplinas.

## Orden de remediación

1. Resolver UX-01 de forma transversal y volver a capturar inicio, navegación, consentimiento y recorridos móviles con la política productiva. Corregir el falso éxito de guardado de UX-11.
2. Corregir UX-02 y la semántica de datos/mapa; verificar teclado y lectura asistida.
3. Revalidar acceso, cotización y ambos checkouts en un candidato estable. Cerrar recuperación de pago y definir la promesa de idioma/soporte.
4. Ejecutar los gates con datos de staging y dispositivos reales. Registrar por caso entorno, resultado, comprobante y responsable.
5. Reemitir GO / NO GO sobre la misma versión candidata. Un cambio de versión posterior exige evaluar su impacto y repetir los casos afectados.

**Conclusión del dictamen:** NO GO para salida pública en el estado auditado. El defecto visual transversal basta para bloquear la liberación; los flujos externos pendientes impiden, además, certificar la experiencia completa de producción.
