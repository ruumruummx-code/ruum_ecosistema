# Revisión de la aplicación Android nativa de conductor

Fecha: 14 de octubre de 2026. Alcance: `apps/app-conductor-native`, contratos SQL y Edge Functions relacionados. Revisión estática; no equivale a certificación en dispositivo ni comprobación del backend desplegado. No se modificó código funcional.

## Hallazgos prioritarios

1. **P1 — Un fallo de consulta puede terminar la aplicación.** `ui/DriverViewModel.kt:338–362`: los `async` son hijos del `launch` de actualización. El fallo de un hijo cancela al padre, aunque `runCatching` capture la excepción de `await`; puede llegar al manejador no controlado del `launch`. Reorganizar con `coroutineScope` dentro del bloque de captura o supervisión explícita. Verificar con un repositorio que falle al cargar pagos mientras las otras consultas están pendientes.

2. **P1 — Una actualización pendiente puede deshacer visualmente el cierre de sesión.** `ui/DriverViewModel.kt:362,459`: `signOut` no cancela actualizaciones y `refresh` reemplaza todo el estado con `signedIn=true`. Una respuesta iniciada antes del cierre puede volver a presentar información del conductor anterior. Además, se oculta cualquier fallo de `repository.signOut()`. Cancelar trabajos de sesión, invalidar respuestas antiguas y comprobar el resultado del cierre. Probar cierre durante una respuesta demorada y posterior acceso con otra cuenta.

3. **P1 — Se elimina evidencia antes de confirmar su persistencia.** `ui/RuumConductorApp.kt:1261–1275`: `onCapture` inicia otro trabajo en el ViewModel y devuelve inmediatamente; enseguida se borra el archivo. `data/DriverRepository.kt:364–380` realiza carga y registro como dos operaciones separadas, sin cola persistente. Si falla la red se pierde el original local; si falla la inserción tras subirlo queda un objeto sin registro. Conservar la captura hasta confirmar ambas operaciones y permitir reintentos idempotentes.

4. **P2 — La cámara pierde su contexto al recrearse la actividad.** `ui/RuumConductorApp.kt:1249–1251,1697–1699`: URI, archivo y ángulo se guardan con `remember`. Al volver de la cámara después de una recreación, el callback puede recibir éxito pero carecer de URI o tipo, descartando la foto. Persistir los identificadores mediante estado guardable/SavedStateHandle y recuperar archivos pendientes. Probar con destrucción de actividad al abrir la cámara.

5. **P2 — El registro avanza aunque falle el guardado.** `ui/RuumConductorApp.kt:2449–2450` y `ui/DriverViewModel.kt:162–176`: el guardado es asíncrono y se incrementa el paso inmediatamente. La persona puede llegar al envío con información que nunca se persistió. Avanzar solo tras la confirmación y conservar el contenido local cuando haya error. Probar fallo de guardado en identidad y licencia.

6. **P2 — La recuperación del borrador no restaura consentimientos.** `ui/RuumConductorApp.kt:2210–2242`: las cuatro casillas empiezan en falso y el prellenado omite sus valores, aunque `expediente()` sí los guarda. Un borrador recuperado directamente en revisión tiene el envío deshabilitado; guardar después puede sobrescribir las autorizaciones con falso. Restaurar las declaraciones guardadas o conducir explícitamente a un nuevo consentimiento antes de continuar.

7. **P2 — La auditoría de llegada afirma una geocerca no medida.** `data/DriverRepository.kt:394–402`: se envían siempre `p_fuera_geocerca=false` y distancia nula. El manifiesto solo declara Internet y no existe adquisición de ubicación. La RPC vigente registra esos valores en auditoría (`20260717000600_llegada_destino_solo_traslado_en_curso.sql`). Medir distancia con permiso explícito o representar ubicación desconocida sin atribuir una comprobación positiva.

8. **P2 — El cierre de evidencia y la detección de daño no son atómicos.** `data/DriverRepository.kt:423–424`: primero cambia el estado a evidencia final completada y después consulta/crea la incidencia. Si falla la segunda parte, se muestra error aunque el traslado ya avanzó; el siguiente refresco ofrece entregar sin volver a evaluar el daño. Llevar ambas operaciones a una transacción del backend o guardar una obligación persistente de evaluación que bloquee la entrega hasta resolverse.

9. **P2 — El build depende de una instalación local concreta.** `gradle.properties:2`: fija `org.gradle.java.home=C:/Program Files/Android/Android Studio1/jbr`. Esa ruta no existe en este equipo y bloquea build, lint y pruebas antes de compilar. Quitar la ruta personal del archivo compartido y resolver Java mediante configuración local/toolchain. El script que detecta JAVA_HOME no corrige esta propiedad de Gradle.

## Cobertura y límites

- Arquitectura: separación core/data/domain/ui, DTO serializables y mutaciones operativas mediante RPC. Backup desactivado, tráfico HTTP sin cifrar desactivado y FileProvider no exportado.
- Pruebas existentes: métricas, certificación y tokens. No se encontraron pruebas del repositorio, ViewModel, registro ni captura; tampoco pruebas instrumentadas implementadas para los flujos completos.
- Sesión: `hasSession()` consulta el usuario una sola vez, sin esperar explícitamente la inicialización de Auth ni observar cambios de sesión. Requiere prueba de arranque en frío con sesión guardada y expiración de token.
- Operación: se instala Realtime, pero no hay suscripciones ni push ni seguimiento de ubicación. Ofertas, asignaciones y cambios operativos dependen de actualizaciones manuales. No hay flujo nativo para reportar una incidencia; Seguridad solo muestra indicaciones.
- Navegación/accesibilidad: las pantallas y formularios usan estado Compose local; falta comprobar restauración, botón/gesto Atrás, lector de pantalla, texto ampliado y rotación en dispositivo. El acceso flotante a Seguridad se oculta dentro del detalle del traslado (`street && !inOverlay`).
- Finanzas: `estimatedEarning` usa 85 % del precio cotizado si falta ganancia. Contrastar con la política vigente y evitar presentar una estimación como ganancia neta garantizada; el backend ya contempla cálculo y congelación propios.
- Documentación: README describe como pendientes varios flujos que ya existen. Actualizar su alcance y distinguir funciones implementadas de validación pendiente.

## Validación ejecutada

- Node 24.12.0 seleccionado explícitamente.
- `node scripts/check-native.mjs`: correcto; 17 fuentes, identificador de distribución y versión coherentes.
- `assembleDebug lintDebug testDebugUnitTest --offline`: primera ejecución bloqueada por permisos de caché Gradle; repetición autorizada llegó a Gradle 9.7.0 y falló por la ruta Java fija inválida. No se consideran aprobadas las pruebas ni la compilación.
- No se probaron dispositivos, cámara real, cuentas reales, pagos, RLS desplegadas ni un traslado completo. Los hallazgos funcionales se basan en lectura de código y contratos versionados.

## Orden de corrección

Primero resolver concurrencia de sesión, propagación de errores y persistencia de evidencia. Después reparar recuperación/guardado del registro y atomicidad del cierre. Completar validación de ubicación, notificaciones e incidencias antes de sustituir el cliente actual. Ejecutar build/lint/tests y un recorrido instrumentado de registro → aprobación → asignación → captura inicial → traslado → captura final → entrega, incluyendo interrupciones de red y recreación de actividad.
