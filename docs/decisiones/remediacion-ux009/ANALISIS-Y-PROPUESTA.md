# RUUM-UX-009 · Inventario y propuesta pendiente de validación

Fecha: 6 de noviembre de 2026. Estado histórico: análisis previo a la aprobación. La decisión posterior y vigente está en DECISION-PRODUCTO-OPERACION.md; el resultado de implementación está en INFORME-CIERRE-RUUM-UX-009.md.

## Hallazgos en el código actual

| Punto | Mensaje o diferencia |
|---|---|
| InicioMobile.tsx | Texto y nombre accesible «Soporte 24/7». |
| InicioDesktop.tsx | «Nuestro equipo está listo para apoyarte en todo momento». |
| viajes/[id]/PasaporteDigitalSegmentado.tsx | «Asistencia 24/7». |
| viajes/[id]/AccionesPasaporte.tsx | «Asistencia 24/7». |
| preguntas-frecuentes/PreguntasFrecuentes.tsx | «Nuestro equipo te contactará de inmediato» y llamada a «soporte 24/7». |
| soporte/FormularioSoporte.tsx | Horario Lunes a Viernes 8:00–20:00 CDMX; <30 min en horario y <2 horas fuera. |
| Confirmación de incidencia | Repite tiempos diferenciados, sin precisar recepción continua ni canal de emergencia. |
| Confirmación de consulta general | Confirma registro con folio, sin repetir horario o tiempos. |
| soporte/SoporteCliente.tsx | Ofrece crear reporte, llamada, WhatsApp y correo. No establece disponibilidad por canal. |

Los contactos se resuelven mediante contactos-soporte.ts y configuración compartida. Su existencia en código no acredita cobertura operativa ni respuesta inmediata. No se ha contactado a terceros ni probado llamadas reales.

## Datos que requieren validación

- Recepción del formulario: ¿24/7?
- Atención: ¿L–V 8:00–20:00, hora de Ciudad de México?
- Estimación de primera respuesta: ¿menos de 30 minutos en horario y menos de 2 horas fuera? Aclarar si aplica a todos los canales o solo reportes.
- Emergencia: canal concreto y horario; distinguirlo del formulario y del contacto con conductor.
- Llamada, WhatsApp y correo: cobertura y tiempos por canal, si difieren.
- Propietarios de Producto y Operación y fecha de aprobación.

## Propuesta de contenido para revisión

No publicada, sujeta a validación de los datos anteriores:

- Acceso: «Soporte» con resumen de recepción, atención y enlace al detalle.
- Formulario: bloques identificables «Recepción de reportes», «Atención y primera respuesta» y «Emergencias».
- Confirmación: folio y registro confirmado, seguidos de los mismos horarios y tiempos aprobados; no equiparar registro con atención efectiva.
- Pasaporte y preguntas frecuentes: eliminar promesas de disponibilidad o inmediatez que Operación no confirme y remitir a la misma información de soporte.

## Implementación y verificación previstas

Centralizar el contenido aprobado y reutilizarlo en accesos, formulario y ambas confirmaciones. Preservar reglas de registro, folios, enlaces y estilos. Revisar también nombres accesibles y comentarios obsoletos. Comprobar todas las coincidencias de «24/7», «inmediato» y «en todo momento» relacionadas con soporte; probar ambos caminos de confirmación; capturar móvil/escritorio y evaluar contraste con axe.

Este inventario documenta el diagnóstico previo; consultar el informe de cierre para el estado actualizado de AC-1–AC-8.
