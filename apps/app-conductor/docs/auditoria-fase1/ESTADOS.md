# Inventario de estados y cobertura

Esta tabla separa **inventario** de **validación**. «Render» significa que se abrió el estado con datos ficticios y se midió su layout; no significa que se ejecutó la transición de negocio. «Código» significa que se identificó la implementación y sus variantes, pero no se certificó su comportamiento.

## Acceso y registro

| Flujo / estado | Cobertura obtenida | Pendiente y prioridad |
|---|---|---|
| Entrada `/`, onboarding visto | Render: termina en Login con flag local de onboarding visto. | Entrada inicial sin flag y callback con enlaces reales: verificar navegación; P2. |
| Onboarding | Render 320/390; CTA de registro y acceso inventariados. | Lectura con texto nativo ampliado; P2. |
| Login cargando / listo / clave visible / enviando / error de credenciales | Listo: render, texto 200 % y teclado simulado. Otros estados: código y pruebas existentes leídas, no ejecutadas en esta fase. | Área efectiva de controles, errores con teclado y recuperación de foco; F04/F05, P1. |
| Recuperar contraseña: listo / enviando / correo enviado / error | Listo: render 320/390 y scroll real. Otros: código. | Acción visible tras mensajes, sin enviar correos reales; F01, P1. |
| Nueva contraseña: token válido / inválido, envío / éxito / error | Render del estado que permite el fixture sin recovery real; código de las variantes. | Sesión de recovery controlada, validación de campos y retorno; P2. |
| Registro 1 — Cuenta | Render 320/390; texto 200 % y teclado simulado. | No reducir etiquetas a 9 px; controles efectivos ≥48 px; F04/F05, P1. |
| Registro — OTP: esperando / incompleto / vencido / incorrecto / reenviando / confirmado | Código de OtpVerification y pruebas existentes de verificación. | No se creó cuenta ni se envió OTP. Auditar reenvío y errores con fixtures de Auth, P1 en contrato de formularios. |
| Registro 2 — Identidad, domicilio y contacto | Render 320/390 con solicitud reanudada. Hojas y selectores: inventario de código. | Abrir y recorrer cada hoja, error de CP y datos largos; P1 por F04/F05. |
| Didit: creación / embebido / pendiente / éxito / error / cierre | Código de DiditVerificationModal y lógica de registro. | Integración externa y retorno al formulario: no ejecutados, P2 antes de certificar registro completo. |
| Registro 3 — Licencia, vencida / vigente / por vencer, consentimiento | Render de paso 320/390; reglas y consentimiento: código. | Comprobar errores, selección y retorno sin pérdida; P1 en contrato de formularios. |
| Registro 4 — Documentos, pendiente / cargando / subido / error | Render del paso en 320/390; subestados: código. | Cámara/selector físico, validación y recuperación del archivo; fase 4 y prueba nativa. |
| Registro 5 — Revisión, editar, aceptar / enviar | Render 320/390. | Referencias largas y retorno a edición sin pérdida; P1. |
| Registro: borrador recuperable / descartado; enviando / enviado / error | Código de hooks, DraftRecoveryModal y bloques de finalización. | Persistencia y recuperación reales quedan fuera del diagnóstico visual inicial; casos dirigidos antes de liberar el flujo. |

## Inicio, listados y Cuenta

| Flujo / estado | Cobertura obtenida | Pendiente y prioridad |
|---|---|---|
| Inicio: carga / revisión / disponible / no disponible / en viaje | Render del panel listo con fixture; carga/revisión/otros estados: código. | Matriz de disponibilidad y expediente con datos deterministas; P1 antes de certificar la operación completa. |
| Inicio: sin ofertas / con ofertas / viaje activo | Sin ofertas: render 320/390 y nombre largo. Variantes con oferta/viaje: código. | Acción persistente con nombre, destino y banners largos; F09, P2. |
| Inicio: GPS, documentos, conexión | Estado del fixture: render. Salud operacional: apertura, foco y Escape medidos. | Permisos nativos de GPS y su recuperación; F08, P1. |
| Inicio: Menú | Apertura, modalidad, foco y Escape medidos. | F08 confirmado; no se confirmó cierre con Escape ni captura de foco. |
| Inicio: offline / reconexión / error de actualización | Offline: render y alertas medidas. Reconexión, cola y reintento: código. | Verificar que mensajes no desplacen acción y que haya un solo aviso comprensible; P1 en contrato de feedback. |
| Traslados: carga / error / vacío / disponibles / aceptados / lista / mapa | Vacío: render 320/390, texto 200 % y tema oscuro. Resto: código de DriverTrasladosView y componentes. | Listas extensas, filtros, mapa real y coste de render: fases 3 y 6; F03/F06, P1. |
| Traslados: calendario, búsqueda, modo, filtros, rechazo / deshacer | Código; cajas de controles visibles medidas. | Interacción completa y foco/retorno entre filtros; F04/F07. |
| Cuenta: listo / cargando / error de salida / sincronización | Listo: render 320/390, texto 200 % y tema oscuro. Otros: código. | Diálogos de opciones y salir/cancelar con foco y lectura nativa; P2. |
| Perfil: Identidad / Documentación / Ubicación; guardando / error / éxito / foto | Identidad: render 320/390. Otros: código y estilos. | Tamaños de texto/controles, teclado, edición por pestaña y guardado sin pérdida; F04/F05, P1. |
| Documentos: pendientes / válidos / rechazados / subiendo / error | Render del expediente pendiente en ambos tamaños. Otros: código. | Subida/renovación y conservación de contexto; scroll interno previsto. |
| Certificación: progreso, requisito pendiente / validado, capacitación y paginación | Render pendiente 320/390; otros: código. | Apertura, lectura, retorno y memoria de página; scroll interno previsto. |
| Banco: vacío / registrado / revisión / verificado / rechazado; error / éxito | Vacío: render 320/390 y teclado simulado. Resto: código. | CTA con teclado y errores largos; F05, P1. No se guardaron datos bancarios. |
| Preferencias: Alertas / Viajes / Tema; guardando / error / quiet hours | Alertas: render y scroll real. Otras pestañas y cambio de tema: código; modo oscuro precargado en cuatro rutas. | Marco y controles; F01/F04/F06. |
| Seguridad, Soporte de Cuenta, Marco Legal | Render de sus páginas en 320/390 y scroll real en 320. | Un solo retorno y detalle interno, no documento raíz desplazable; F01. |
| Ganancias: semana / mes, cargando / error, pagos / vacío, banco / programación | Semana vacía: render 320/390, texto 200 % y oscuro. Diálogo y otras variantes: código; se conserva validación de la entrega previa como antecedente, no se recuenta como prueba ejecutada aquí. | Pagos y errores largos sin tapar acción; F04/F06. |
| Historial: periodos, detalle, validación / confirmado / programado / pagado / vacío / error | Vacío: render y scroll real. Otros: código de ledger y hojas. | Un scroll interno, retorno visible, foco de hojas y carga de volúmenes grandes; F01/F08. |
| Notificaciones: no leídas / leídas / todas; vacío / lista / sincronización / error de lectura | Vacío: render y scroll real; variantes y reintento de lectura: código. | Lista interna, filtros legibles y error junto a la acción; F01/F04. |
| Términos y Privacidad: lectura / descarga / retorno contextual | Render 320/390 con regiones internas largas. | Confirmar alcance mediante teclado, retorno y descarga en dispositivo; conservar excepción de scroll interno. |

## Ruta dinámica de viaje

IDs ficticios `10000000-0000-4000-8000-000000000NNN`; los números corresponden al fixture local. Todos los siguientes estados se renderizaron a 320×568 y 390×844.

| NNN | Estado de datos | Vista observada | Hallazgos / siguiente verificación |
|---|---|---|---|
| 000 | pendiente_de_conductor, sin conductor | Detalle de oferta | Controles de seguridad de 30 px; F04. Aceptación/rechazo no ejecutados. |
| 001 | conductor_asignado | Prepárate para salir | Cuerpo interno con exceso de 228 px en 320; F09. Datos largos y texto ampliado medidos adicionalmente. |
| 002 | conductor_en_camino_al_origen | Dirígete al origen | Emergencia recortada en 320; F02. |
| 003 | evidencia_inicial_en_proceso | Recibe el vehículo | Emergencia recortada; F02. |
| 004 | traslado_en_curso | Dirígete al destino | Cuerpo interno desplazable en 320, F09; soporte/emergencia/control principal presentes. |
| 005 | evidencia_final_completada | CIERRE DE TRASLADO | Cuerpo con exceso de 442 px en 320; F09. Texto ampliado medido. Firma/confirmación finales no ejecutadas. |
| 008 | consulta falla | Error al cargar este viaje | Render y acciones de recuperación inventariadas; no se fuerza un resultado exitoso. |
| 009 | pasaporte ausente | No encontramos ese viaje | Render de salida y retorno; región de viaje interna. |
| 011 | conductor_en_punto_de_recoleccion | Recibe el vehículo | F02/F04. |
| 012 | verificacion_vehiculo_en_proceso | Verifica REPUVE y VIN | Reorganización de controles y contenido; no se consultó REPUVE real. |
| 013 | evidencia_inicial_completada | Inicia el trayecto | F02/F04. |
| 014 | vehiculo_recibido | Inicia el trayecto | F02/F04. |
| 015 | llegada_a_destino | Dirígete al destino | Jerarquía y siguiente paso; F09. |
| 016 | evidencia_final_en_proceso | Dirígete al destino | El checklist se consulta en su subruta; no se completa una entrega. |
| 017 | entrega_confirmada | CIERRE DE TRASLADO | Misma vista que cierre pendiente; definir UX terminal, F11. |
| 018 | servicio_cerrado | CIERRE DE TRASLADO | Misma vista que cierre pendiente; definir UX terminal, F11. No se infiere un fallo del backend. |
| 019 | servicio_cancelado | Traslado concluido o cancelado | Salidas inventariadas; sin acción operativa nueva. |
| 020 | traslado_fallido | Traslado concluido o cancelado | Salidas inventariadas; sin acción operativa nueva. |

El caso `pendiente_de_conductor` con conductor ya asignado y un estado desconocido con conductor se identificaron en el router como fallback a la vista asignada. Se revisaron en código; no se ejecutaron como casos separados.

## Subflujos de viaje e inspección

| Subflujo / estado | Cobertura | Pendiente |
|---|---|---|
| Detalles: Itinerario / Vehículo / Pago / Operación | Entrada renderizada 320/390; implementación de las cuatro pestañas revisada. La entrada no presenta `h1` en la medición. | Navegar cada pestaña, retorno y estado activo; revisar jerarquía de encabezados. |
| Soporte: información, reporte, enviando / error | Página renderizada; flujo de reporte y mensajes inventariado. | Envío solo a fixture, errores y recuperación de foco. No se contactaron canales externos. |
| Inspección inicial: fotos | Render 320/390; texto ampliado y teclado simulado. | Cámara real, permisos, captura/repetición, orientación y archivo grande. |
| Inspección inicial: llaves / mediciones | Transiciones «Siguiente requisito» hasta ambas pestañas y render 320/390. | Validación, borradores y guardado con teclado en cada campo. |
| Inspección: soporte / emergencia | Apertura y render de ambos paneles en 320/390. | Foco/retorno y scroll interno de todas las opciones. No se llama al 911 ni se comparte ubicación. |
| Inspección final | Render específico con estado evidencia_final_en_proceso en 320/390. | Comparación origen/destino, discrepancias, reglas de cierre y finalización. |
| Inspección: error de consulta | Render específico en 320/390. | Reintento exitoso con recuperación de las capturas. |
| Inspección: carga / cola offline / conflicto / reintento / envío / éxito / valoración | Inventario de hooks, componentes y límites de error. | Interacción dirigida y dispositivo físico; no se declara completada por render del caso normal. |
| Cierre: gastos, conciliación, receptor, firma, reporte, confirmación, error / éxito | Formulario renderizado; componentes y bloqueos revisados en código. | Ejecutar recorrido dirigido con firma y datos íntegros; versiones de documento y errores largos. No se finaliza ningún servicio real. |
| Gastos, incidencia, chat y navegación externa | Componentes, botones, destinos y diálogos inventariados. | Pruebas de apertura/retorno, teclado, archivo y lanzamiento de app de mapas en Android. |

## Estados técnicos transversales

- Carga de viaje: render mediante respuesta retenida en fixture y captura CDP; se libera la respuesta al terminar.
- Error de viaje y error de evidencia: render mediante error de API local.
- Desconexión: Inicio muestra aviso local y global; no se verificó en esta fase la recuperación integral de la cola offline.
- 403 y actualización requerida: render de página. No se simula una actualización de APK ni el bloqueo nativo de versiones.
- 404, error global y errores específicos de Cuenta/Ganancias/Inicio/Traslados: componentes y acciones inventariados; no se provocaron todos sus límites React.
- Suspensión, permisos denegados, GPS degradado, cámara y sesión caducada: lógica y componentes identificados; validación nativa/integral pendiente.

Esta lista cierra el inventario de la fase 1. Las coberturas parciales son tareas de validación para las fases siguientes y no se presentan como estados aprobados.
