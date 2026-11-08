# Fase 4 — Formularios móviles de conductor

Implementación del 8 de noviembre de 2026, sobre la base `f7b1469b`. Se conservan los componentes y la navegación de las fases 2 y 3. No se cambian dependencias, esquemas, permisos, RPC ni políticas de Supabase.

## Evidencia

`TripFormFrame` usa el marco común con retorno, soporte, SOS, progreso y una acción principal fuera de la región desplazable. La captura pasa de un mosaico y un formulario comprimido a diez pasos: cinco fotografías, llaves, mediciones, documentos, observaciones y revisión. Las cinco comprobaciones documentales se presentan una a la vez. El menú de pasos permite revisar y guardar sin perder valores.

Las fotografías se amplían completas en un diálogo. Se mantienen la compresión, el control de nitidez y la cola existente de evidencia; las capturas locales pendientes siguen bloqueando el envío hasta sincronizar. Al repetir una fotografía, la revisión elige la captura más reciente y no asume que la versión anterior sincronizada resuelve la nueva captura.

Llaves y combustible empiezan pendientes, sin cantidades supuestas. Un odómetro de cero se conserva como cero. El borrador remoto admite campos pendientes como `null`; el envío exige los datos obligatorios. Los cambios de inspección se conservan en `sessionStorage` por conductor, traslado y tipo, durante un máximo de siete días en esa pestaña. Las fotos siguen en su cola existente; no se duplican en ese borrador. Este borrador es una copia de trabajo local, no una acreditación del servidor.

La URL de evidencia solo muestra captura en estados de evidencia en proceso. Un estado cerrado o anterior a la verificación dirige al usuario al resumen del traslado. No se usa un tipo inicial de respaldo para presentar acciones que no correspondan.

## Firma, recepción y cierre

El cierre se organiza en requisitos, firma y confirmación. Se conservan las comprobaciones de fotografías sincronizadas, conflictos, inventario de llaves, resolución administrativa y acuse persistido.

`SignaturePad` conserva trazos normalizados al redimensionar el lienzo, escala por densidad de pantalla y usa captura del puntero. Un toque sin trazo no acredita una firma. El trazo se mantiene al pasar a la confirmación y ante un error de persistencia. El guardado usa los servicios existentes; una firma acreditada por el servidor se muestra como tal y no se vuelve a subir innecesariamente.

Confirmar entrega y finalizar servicio son decisiones separadas. Cada confirmación emite un solo evento del conductor; se elimina el encadenamiento automático de entrega y cierre con una espera temporal. Tras la entrega se vuelve al resumen «Finaliza el servicio»; tras el cierre se muestra el estado de consulta de fase 3. No se permite sustituir una firma por texto ni resolver una diferencia de llaves en el cliente.

## Registro, OTP y documentos

Registro usa `ConductorScreen`, con cabecera y acción persistentes mediante ranuras de presentación. Los botones mantienen su asociación nativa al formulario con `form=...`; las validaciones, OTP y datos del expediente siguen en su controlador original. Las ranuras reservan espacio desde el primer renderizado.

La cuenta se divide en contacto y contraseña, manteniendo los valores entre ambos. El consentimiento legal sigue siendo explícito y obligatorio. Las contraseñas y el OTP no se añaden al borrador local. Se eliminan las reglas que reducían controles y tipografía por la altura disponible; los campos mantienen 16 px y las etiquetas migradas 14 px. Identidad conserva el domicilio y el contacto de emergencia en diálogos; licencia, documentos y revisión mantienen acceso al contenido completo.

OTP conserva longitud, intentos y espera de reenvío. La acción de activar permanece fija y la alternativa «Ya confirmé» queda en el contenido secundario. El OTP se introduce en un campo nativo visible, con autocompletado y su etiqueta asociada. Se mantiene el viewport compartido y no se mueve la raíz.

Los diálogos de borrador, domicilio, contacto, encuesta y Didit usan el modal común, con foco, Escape y cierre alcanzable. Los mensajes del registro permanecen hasta que el usuario los cierre. Didit conserva su validación de URL y sus servicios; los mensajes del iframe se filtran por origen y ventana. El proveedor sigue siendo responsable del resultado de la verificación.

## Criterio de desplazamiento y límites

Los pasos breves mantienen estado, captura o campo actual y acción principal alcanzables a 320×568 y 390×844. Al mostrar texto ampliado, un teclado, datos extensos, domicilio completo o revisión integral, se permite desplazamiento interno; no se reduce la letra ni se oculta información para forzar el ajuste. El cierre y retorno de los diálogos quedan fuera de ese desplazamiento.

La validación de navegador usa datos y respuestas sintéticas. No acredita cámara física, teclado real de Android/iOS, biometría Didit, entrega de correos OTP, objetos reales de Storage, RLS desplegada ni rendimiento físico. El recorrido con cámara/biometría real y los objetivos LCP/INP/CLS siguen pendientes de fase 6.

Ver [validación](VALIDACION.md) y [evidencias](evidencia/).
