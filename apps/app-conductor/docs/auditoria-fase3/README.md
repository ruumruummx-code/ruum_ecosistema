# Fase 3 — Jerarquía del traslado y navegación operativa

Implementación local del 7 de noviembre de 2026, sobre `/workspace/ruum-fase2`, rama `codex/conductor-fase2`, con los cambios de fase 2 conservados. Esta entrega reorganiza la presentación; las RPC, permisos y requisitos del servidor siguen siendo la autoridad para cada avance.

## Cambios

- `TripStage` reúne cabecera, estado, instrucción, punto actual, vehículo, herramientas y una acción principal. Usa `ConductorScreen` y la navegación común de fase 2. Soporte, retorno y SOS permanecen alcanzables durante la operación.
- Asignación, camino al origen, recogida, verificación, recepción, inicio, trayecto, llegada y acceso al cierre comparten composición. Se eliminan mapas decorativos y datos ficticios de esos resúmenes. Navegar requiere dirección o coordenadas; los datos ausentes se muestran pendientes.
- Las direcciones resumidas tienen acceso explícito al dato completo; referencias, VIN, placas, contactos, ganancia y herramientas se consultan en un diálogo. El chat conserva su regla de disponibilidad y se carga al solicitarlo.
- Confirmar recepción e iniciar trayecto son decisiones distintas. Confirmar llegada al destino no inicia automáticamente el registro final. Se conservan GPS, precisión, antigüedad y geocerca del flujo existente.
- La verificación REPUVE mantiene VIN/placas reales, coincidencia física, consulta, captura y autorización del servidor. El formulario se abre a demanda; sus valores se conservan al cerrarlo.
- Ofertas abiertas muestran «Solicitar traslado» y las dirigidas «Aceptar oferta dirigida». La consulta de elegibilidad debe terminar antes de habilitar la acción. Se conservan competencia, aceptación dirigida, expiración, rechazo y resolución del servidor.
- `evidencia_final_completada` y `entrega_confirmada` muestran un resumen con el acceso al formulario existente mediante `?cierre=1`. `entrega_confirmada` conserva el cierre como pendiente. Los estados cerrados, detenidos, de revisión y desconocidos muestran consulta; la URL de cierre no los convierte en accionables.
- Lista: fechas, actualización y filtros pasan a un diálogo común; búsqueda y vistas permanecen en el contenido principal. Se mantiene paginación de una tarjeta, modo mapa y filtros por URL. El vacío permite limpiar filtros, volver a todas las fechas o recargar; no ofrece ordenar una lista sin resultados. Las tarjetas muestran datos esenciales y acceso al detalle, sin mapa decorativo ni compresión de texto a 8–11 px.
- El SOS de la lista se integra en la cabecera cuando hay un viaje activo; el acceso global duplicado se omite en las rutas de Traslados. El mapa conserva coordenadas memoizadas para evitar reinicializarse por sus propios renders, usa pines de 48 px y ofrece volver a la lista cuando falta configuración o coordenadas. Los datos de los popups se insertan como texto.
- Expediente: título, retorno y pestañas persistentes; selección con flechas, Inicio/Fin, semántica de pestañas y panel. Texto secundario de al menos 14 px y datos largos sin ellipsis. Soporte/incidencias usa el marco común con retorno fuera del contenido desplazable.

## Contrato de desplazamiento

El caso normal del resumen operativo debe caber a 320×568 y 390×844 sin desplazar raíz ni cuerpo. Los datos completos se abren en un diálogo con contenido desplazable y cierre fijo. Texto ampliado, direcciones extensas o alturas menores permiten desplazamiento interno de respaldo; no se elimina información ni se reducen controles para forzar el ajuste. La lista y el expediente admiten desplazamiento interno para contenido extenso y mapas.

## Límites

La fase 4 debe reorganizar los formularios completos de evidencia, cámara, firma y cierre. Aquí se conserva el acceso a esos formularios y sus reglas. Las pruebas usan datos ficticios y Chromium de escritorio con viewport móvil; no equivalen a teclado, lector de pantalla, GPS, cámara ni safe areas de Android/iOS físico. El mapa con proveedor/cartografía real requiere validación adicional; aquí se prueba su recuperación local sin proveedor configurado. Los objetivos LCP, INP y CLS de fase 6 siguen pendientes de medición física.

Ver [validación](VALIDACION.md) y [evidencias](evidencia/).

## Estado de entrega

Fase 3 implementada y verificada localmente: build, TypeScript y 23 pruebas de navegador aprobados. La entrega incluye los componentes comunes de fase 2, necesarios para la fase 3, junto con sus pruebas y evidencias. La referencia de publicación se conserva en el historial Git del repositorio. La siguiente intervención funcional corresponde a la fase 4: formularios de evidencia y cierre.
