# Auditoría técnica integral de la aplicación de usuario — preparación para RC

**Fecha:** 14 de octubre de 2026, America/Mexico_City.  
**Repositorio:** `ruum_ecosistema`. **Revisión:** `0c42944d12b59cc1b935e7e99f1d46e48a7424b8`.  
**Aplicación:** `apps/app-usuario`. **Supabase:** `asmzetwwwugaoowiukdv`.  
**Dictamen:** **NO-GO para RC en el corte auditado. Beta funcional con bloqueos concretos de seguridad, pagos y validación.**

## 1. Resumen ejecutivo

La aplicación tiene una base funcional importante: autenticación, recuperación, solicitud de traslado, cotización, pagos, seguimiento, evidencia, comunicación con conductor, Cuenta y documentos. TypeScript, ESLint y los controles estáticos ejecutados pasan. No es necesario reescribirla para acercarse a RC.

El trabajo urgente está en cuatro áreas: cerrar las RPC privilegiadas expuestas, garantizar una verificación telefónica real, hacer consistente el procesamiento de pagos y recuperar una señal de pruebas confiable. Se identifican **4 hallazgos P0, 8 P1 y 4 P2**. P0 bloquea RC; P1 bloquea el flujo afectado si forma parte de la RC; P2 admite resolución posterior o aceptación explícita del riesgo.

La estrategia más corta es **RC web de traslado individual**, con seguridad y pago completos, sin incorporar nuevas funcionalidades. Estimación inicial: **48–80 horas de ingeniería, aproximadamente 6–10 jornadas**, incluida preparación de aceptación, sujeta a disponibilidad de staging, acceso a proveedores y correcciones de pagos. No es una fecha garantizada. La aceptación con servicios reales necesita además una ventana coordinada de 1–2 jornadas, parcialmente solapable.

Esta es una auditoría integral de código, pruebas y configuración consultable. **No es una certificación de funcionamiento en producción:** no fue posible completar navegación real, Lighthouse, comprobación de despliegue frontend ni transacciones reales. Esos vacíos aparecen como criterios de salida pendientes, no como pruebas aprobadas.

## 2. Alcance, método y límites

Se revisaron rutas de autenticación, middleware, APIs de registro/OTP/recuperación/solicitudes, wizard, pagos, pasaporte, chat, cargas masivas, Cuenta, documentos, soporte, estado global, almacenamiento local, CSP, observabilidad, CI y configuración móvil. Se consultaron metadatos, definiciones de funciones, grants, políticas y despliegues de Supabase.

Se ejecutaron 375 pruebas en 71 archivos, TypeScript, ESLint, controles de CSP, migraciones, fronteras y secretos; se consultó el registro de vulnerabilidades con `pnpm audit --prod`. Se realizaron reproducciones locales con proveedores sintéticos y sin red.

**Seguridad de la auditoría:** no se cobraron pagos, no se enviaron SMS/correos, no se crearon usuarios ni traslados, no se modificó Supabase y no se invocaron las RPC de mantenimiento detectadas. Los archivos de evidencia no contienen credenciales reales. Las modificaciones ajenas existentes en el workspace no se revirtieron.

**Limitaciones verificadas:**

- El navegador integrado y la conexión a la pestaña de Chrome agotaron el tiempo de espera. La consulta web de las páginas públicas tampoco dio acceso. No hay validación visual, de teclado o de accesibilidad real acreditada.
- La compilación local falló al descargar Inter desde Google Fonts por DNS. Al repetir la validación con `NODE_ENV=production`, el entorno local fue rechazado por URL de aplicación HTTP y formato de token Mapbox. Esto describe **el entorno local**, no demuestra una mala configuración del hosting.
- Vercel no resolvió el dominio como despliegue y la consulta del proyecto localizado fue rechazada con 403 para el scope correspondiente. No se verificaron variables, commit, logs ni estado del despliegue frontend.
- No se ejecutaron E2E contra producción. La enumeración de Playwright falló antes de ejecutar pruebas por resolución de referencias de tsconfig en este entorno.
- No se midió cobertura de código ni rendimiento de dispositivos. Tampoco se ejecutó la suite SQL completa sobre una base aislada.
- El audit de dependencias cubre el grafo **de producción del monorepo**; no acredita ausencia de vulnerabilidades en dependencias de desarrollo ni en paquetes Deno de las Edge Functions.

## 3. Resultados de validación

| Control | Resultado | Interpretación |
|---|---|---|
| TypeScript de app-usuario | Aprobado, exit 0 | Sin errores de tipos detectados en ese comando |
| ESLint de app-usuario | Aprobado, exit 0 | [Evidencia JSON](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/eslint.json) |
| Suite completa | 365 aprobadas / 375; 10 fallidas | 71 archivos; dos archivos con fallos |
| Repetición aislada de registro/correo | 6 aprobadas / 14; 8 fallidas | Los cuatro tests de correo pasan aislados; registro conserva 8 fallos |
| Build inicial | Bloqueado | DNS de Google Fonts, no prueba de un defecto de compilación del código |
| Validación production del entorno local | Rechazada | APP_URL y token Mapbox locales no válidos para production |
| Aserciones CSP | Aprobadas | No sustituyen la prueba del nonce durante refresco de sesión |
| Convención de migraciones | Aprobada | 210 archivos conformes en el corte |
| Fronteras de arquitectura | Aprobadas | 0 accesos directos no justificados reportados |
| Escaneo de secretos de app-usuario | Aprobado | 0 hallazgos en el alcance del scanner |
| Scanner estático de grants | Aprobado | Es parcial: no detecta las RPC privilegiadas de la base desplegada |
| Enumeración E2E | Bloqueada | Playwright no resuelve una referencia de tsconfig |
| Audit de dependencias production | 0 altas / 0 críticas; 6 moderadas | Cuatro advisories distintos tienen rutas que afectan app-usuario |
| Reproducciones de fallos críticos | Confirmadas localmente | Teléfono, webhook y pérdida de nonce |

La primera ejecución completa duró unos 539 segundos. **No se interpreta como “10 defectos de producto”:** siete fallos aislados de registro buscan la etiqueta antigua “Teléfono celular”, hoy “Teléfono móvil”; otro exige `role=alert` en un mensaje que usa `aria-live=polite`. Son contratos de pruebas que deben reconciliarse con la UX accesible. Los dos fallos iniciales de correo desaparecen aislados y requieren revisar aislamiento/tiempos.

Evidencias: [suite completa](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/pruebas.json), [repetición aislada](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/retest-registro.json), [dependencias](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/dependencias.json), [Supabase](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/supabase.json), [reproducciones](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/reproducciones.json).

## 4. Hallazgos que bloquean RC

### RC-01 — P0: tareas de mantenimiento ejecutables sin sesión

**Confirmado en Supabase.** `cancelar_traslados_impagos_vencidos()` y `procesar_competencias_asignacion()` son SECURITY DEFINER, tienen EXECUTE para anon/authenticated y no comprueban la identidad del llamante en su cuerpo. Pueden modificar traslados/asignaciones con privilegios del dueño. La primera cancela solicitudes impagas; la segunda procesa asignaciones y puntualidad.

**Acción mínima:** restringirlas a roles internos y conservar su ejecución cron; revisar otros endpoints mutadores expuestos con el mismo criterio. No hace falta mover 216 funciones para cerrar primero estas entradas.

**Cierre verificable:** anon y usuario normal reciben 42501; service_role y cron mantienen acceso; prueba SQL en staging y comprobación del siguiente ciclo cron. **Estimación:** 1–2 h para este cierre puntual; la revisión exhaustiva de otras RPC es adicional.

Fuentes: [cancelación cron](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/migrations/20261009000200_barrido_cancela_impagos_vencidos.sql:21), [procesamiento de asignaciones](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/migrations/20260902131724_asignacion_automatica_concer.sql:666) y snapshot remoto de esta auditoría. No se ejecutaron estas operaciones.

### RC-02 — P0: consulta de paradas sin autorización de propietario

**Confirmado por definición y grants remotos.** `obtener_paradas_traslado(uuid)` ejecuta una consulta de todas las columnas de paradas como SECURITY DEFINER, únicamente filtrada por el UUID recibido. Está disponible para anon/authenticated y carece de comprobación de pertenencia.

**Impacto:** quien consiga un identificador de traslado puede consultar información de paradas fuera de las políticas normales. La dificultad de adivinar un UUID no es autorización.

**Acción mínima:** respetar RLS mediante invoker si sus consumidores lo permiten, o autorizar explícitamente propietario/conductor/admin antes de consultar.

**Cierre:** cuenta A, cuenta B y anon contra una parada sintética; sólo participantes autorizados leen. **Estimación:** 1–2 h.

Fuente: [RPC de paradas](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/migrations/20260903000001_traslado_paradas_escalas_tareas.sql:77). Se comprobó el código desplegado, no se extrajeron paradas de terceros.

### RC-03 — P0: la verificación telefónica falla abierta en production

**Reproducido localmente con NODE_ENV=production.** Si faltan las credenciales de Twilio, `verificarCodigoTwilioVerify` acepta `123456`. El secreto de firma también puede caer a la clave pública anon o a una cadena fija, permitiendo fabricar un token que el validador acepta.

**Matiz de despliegue:** se confirmó el defecto del código; no se verificó qué secretos existen en el hosting de producción. El .env local auditado no tiene Twilio ni PHONE_VERIFY_SECRET.

**Acción mínima:** en production, rechazar la operación si faltan Twilio o un secreto privado dedicado; permitir mock únicamente en test/desarrollo explícito. El validador de entorno debe cubrir estas dependencias. Verificar además que el alta directa de Supabase no eluda controles de aplicación: el endpoint propio no es por sí solo una barrera ante GoTrue.

**Cierre:** sin proveedor/secreto, 503 y ningún token; la clave pública no firma verificaciones válidas; OTP real sólo para el teléfono validado; expiración y reuso probados. **Estimación:** 2–4 h más prueba SMS real.

Fuente: [firma](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/lib/phone-verification.ts:14), [mock de validación](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/lib/phone-verification.ts:201) y reproducción local.

### RC-04 — P0: el webhook puede perder trabajo pendiente y retroceder un pago

**Reproducido localmente con el handler real y almacenamiento sintético.** El handler guarda `stripe_event_id` y marca el pago completado antes de auditar y actualizar el traslado. Si falla después, devuelve 500. En el reintento ve el mismo evento y sale con 200 sin terminar la actualización.

Resultado observado: **pago completado + traslado en cotizacion_aceptada**, primer intento 500, reintento 200 y sólo un intento de actualizar el traslado. También se reprodujo que un evento de fallo distinto y tardío cambia un pago completado a fallido: no hay protección de monotonicidad/orden.

**Despliegue:** el index.ts de stripe-webhook desplegado coincide con el local. El helper remoto difiere en algunas transiciones, pero mantiene el mismo chequeo de evento que causa estos fallos.

**Acción mínima:** operación transaccional o procesamiento duradero con un registro de evento cuya finalización ocurra después de todos los efectos; transiciones de pago que no degraden un cobro confirmado por un evento obsoleto; reconciliación reintentable.

**Cierre:** fallo inyectado después de cada escritura, reentrega del mismo evento, eventos fuera de orden y llegada concurrente. Pago, traslado y auditoría terminan consistentes. **Estimación:** 6–10 h.

Fuentes: [idempotencia temprana](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/functions/stripe-webhook/index.ts:111), [marca del evento](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/functions/stripe-webhook/index.ts:117), [avance posterior](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/functions/stripe-webhook/index.ts:151). Referencia primaria: [Stripe: reintentos y orden de webhooks](https://docs.stripe.com/webhooks).

## 5. Hallazgos P1: cierre de los flujos incluidos

| ID | Hallazgo y evidencia | Corrección mínima / criterio de cierre | Esfuerzo orientativo |
|---|---|---|---|
| RC-05 | **PaymentIntent sin idempotencia ante concurrencia.** Consulta un pendiente y luego crea un PI sin idempotencyKey. Dos solicitudes simultáneas pueden crear dos PI. La base sólo tiene unicidad por PI/evento, no por operación de cobro. [Creación](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/functions/crear-payment-intent/index.ts:281) | Clave estable de operación y control transaccional; dos pestañas/reintentos devuelven el mismo intento cobrable. Probar fallo de persistencia después de crear PI. | 3–5 h |
| RC-06 | **Detalle anuncia pago confirmado con processing.** PagoStripe llama onPagado tanto en succeeded como processing; PagoTraslado marca pagoConfirmado=true y muestra “Pago procesado correctamente”. El wizard sí espera confirmación de BD, por lo que hay criterios distintos. [Callback](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/PagoStripe.tsx:280), [Detalle](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/viajes/[id]/PagoTraslado.tsx:30) | Estado pendiente/procesando separado; sólo BD/webhook confirma. Probar processing, rechazo tardío y reload. | 1–2 h |
| RC-07 | **Vehículo guardado rechazado por ID equivocado.** /api/viajes llama listarVehiculosDeUsuario(cliente,user.id), donde user.id es Auth; el servicio filtra vehiculos.usuario_id, que usa usuarios.id. Supabase confirma al menos un perfil con IDs distintos. [API](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/api/viajes/route.ts:109), [Servicio](C:/Users/hecto/ecosistema/ruum_ecosistema/packages/api/src/services/vehiculos.ts:13) | Resolver perfil por auth_user_id y pasar su id interno. Prueba de vehículo propio con ambos IDs distintos y vehículo ajeno. | 1 h |
| RC-08 | **Nonce perdido durante refresco de cookies.** setAll reconstruye la respuesta con request original, sin requestHeaders que contenía x-nonce. Se reprodujo que la respuesta tiene nonce pero el render no lo recibe. [Middleware](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/middleware.ts:123), [Layout](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/layout.tsx:44) | Preservar headers reenviados al renovar sesión. Smoke con token vencido/refrescable y CSP bloqueante real: sin bloqueos de scripts ni hidratación. | 1–2 h |
| RC-09 | **La suite no está verde.** 10 fallos en ejecución conjunta; repetición deja 8 fallos de registro. Hay selectores obsoletos y contrato de anuncio de errores distinto. | Reconciliar tests con UX accesible, mantener validación de foco y OTP; ejecutar suite completa otra vez. No resolver con skip ni eliminando aserciones críticas. | 2–4 h |
| RC-10 | **CI/E2E no acreditan la aplicación.** CI invoca test:unit, que filtra sólo packages; no tiene job de build de usuario/E2E/coverage. E2E usa rutas /mis-Traslados y /traslados, mocks de RPC antiguos y algunos catch vacíos. --list falla por tsconfig en este entorno. [CI](C:/Users/hecto/ecosistema/ruum_ecosistema/.github/workflows/ci.yml:79), [Script](C:/Users/hecto/ecosistema/ruum_ecosistema/package.json:11), [E2E](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/tests/e2e/flujos-criticos.spec.ts:123) | Job explícito de app-usuario; build reproducible; E2E con rutas actuales y fallos reales, sobre staging aislado. Fijar versiones del runner y resolver tsconfig. | 4–8 h |
| RC-11 | **Documentos complementarios sin ciclo administrativo.** La función guarda licencia/comprobante/constancia en revisión. No se encontraron funciones de aprobación para esa tabla ni políticas administrativas de lectura; la UI tampoco permite abrir el archivo guardado. [Carga](C:/Users/hecto/ecosistema/ruum_ecosistema/supabase/functions/documentos-cuenta-usuario/index.ts), [Tarjeta](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/cuenta/DocumentoCuentaTarjeta.tsx) | Si entran en RC: lectura segura administrativa, aprobar/rechazar con motivo/auditoría y actualizar estado visible. Si son opcionales: retirarlos del alcance/promesa de RC, manteniendo INE/Didit operativo. | 4–8 h; acotar puede ser menor |
| RC-12 | **Estado/borrador no aislado por cuenta al salir.** Cuenta hace signOut sin limpiar borrador ni estado global. El borrador usa una clave global, incluye nombres de contactos y vive hasta 24 h. AppStateProvider no escucha cambio de identidad. [Salida](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:216), [Persistencia](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/lib/borrador-traslado.ts:29) | Limpiar datos y reducers al salir/cambiar usuario; clave por identidad si se conserva borrador. Prueba A→logout→B en el mismo navegador sin datos de A. Manejar el error devuelto por signOut. | 2–3 h |

Para RC-05, [Stripe documenta las claves de idempotencia](https://docs.stripe.com/api/idempotent_requests). La coexistencia de dos PI se identifica como riesgo de carrera por código y restricciones; **no se provocaron cobros duplicados reales**.

## 6. Hallazgos P2 y decisiones de alcance

| ID | Hallazgo | Tratamiento recomendado |
|---|---|---|
| RC-13 | Soporte muestra “Chat en vivo” pero genera respuestas en memoria. El modal sí declara que es demostrativo; no es un canal de atención persistente. [Soporte](C:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/src/app/soporte/SoporteCliente.tsx:284) | Para RC, ocultar demo y dirigir a teléfono/WhatsApp/correo/ticket comprobados. No construir un chat nuevo si esos canales resuelven la operación. |
| RC-14 | Dependencias production: audit reporta 6 moderadas en el grafo; cuatro advisories distintos afectan usuario. Hay Next 15.5.24 con rango corregido >=15.5.27; fast-uri 3.1.7 con corrección >=3.1.8 y brace-expansion 5.0.11 con corrección >=5.0.12. | Actualización mínima compatible del monorepo, pnpm install y regresión. Comprobar aplicabilidad de los avisos de caché a la infraestructura; no afirmar explotación por el simple número de versión. |
| RC-15 | Historial/inicio consulta pasaporte_digital con select(*) y sin paginación; Advisor conserva 76 avisos de initplan y 553 de políticas permisivas superpuestas. | Paginar/listar lo necesario, optimizar políticas manteniendo permisos y medir con carga representativa. No convertir “cero avisos” en sustituto de autorización correcta. |
| RC-16 | Falta evidencia operativa de release: helper del webhook remoto distinto del repo; documentos-cuenta-usuario no figura en deno task check:functions; falta prueba de alerta/rollback; build y runtime frontend no verificados. | Inventario de commit→frontend→migraciones→Edge Functions; incluir nueva función en checks; smoke y alerta de error/pago desincronizado en staging; runbook probado. |

**Facturación:** la ruta activa redirige a Verificación y facturación y registra datos fiscales/constancia. No se acreditó emisión ni descarga de CFDI en esa pantalla. Para RC debe declararse el alcance: captura fiscal con proceso operativo externo, o incluir emisión como requisito adicional. Esto es una decisión funcional; este informe no certifica cumplimiento fiscal.

**Métodos de pago guardados:** la ruta actual redirige a Cuenta. No se debe presentar como funcionalidad entregada si se espera guardar/administrar tarjetas.

**Móvil:** Capacitor usa WebView remota, por lo que depende del frontend disponible. El scanner nativo del monorepo que pasó corresponde al conductor; **no acredita el APK de usuario**. No hay evidencia de pruebas de cámara, geolocalización, deep links, teclado, regreso de Didit/Stripe ni conectividad del APK de usuario. Una RC nativa requiere un gate propio.

## 7. Cobertura funcional por módulo

| Área | Evidencia disponible | Pendiente para aceptar RC |
|---|---|---|
| Inicio y navegación | Componentes y pruebas; estados reales/estado vacío | Visual móvil/escritorio, accesos y sesión expirada |
| Registro/SMS/correo | APIs, firma/OTP revisados, tests y reproducción | RC-03/09/10; alta real en staging con proveedor |
| Login/recuperación | Middleware, callback, cookie recovery y tests inspeccionados | Correo entregado, enlace válido/caducado/usado, otra pestaña, logout y acceso posterior |
| Identidad | Pipeline privado, sellos/hash, Didit y funciones activas | Flujo real aprobado/rechazado/cancelado; retorno a navegador/WebView |
| Solicitud/cotización | Zod y RPC con propiedad, verificación y bloqueo de idempotencia | Vehículo nuevo/guardado; cambio de ruta/tarifa; reintento sin duplicado; catálogo desconocido |
| Pago | Monto desde BD, sesión validada, firma de webhook, pruebas/reproducción | RC-04/05/06; pago test con reintentos, retraso y fallo parcial |
| Seguimiento/pasaporte/evidencia | RLS y componentes, suscripciones con limpieza | Dos cuentas aisladas; mapa/chat en tiempo real, archivos autorizados, reconexión |
| Cancelación/incidencias | Servicios, RPC y reglas existentes | Autorización, cargos/estados y recuperación tras error; cierre coordinado con conductor |
| Cuenta/fiscal/documentos | Persistencia fiscal transaccional y funciones desplegadas | Revisión documental completa o alcance recortado; cuenta personal vs titular |
| Soporte | Contactos y formulario, demo identificada | Entrega efectiva de ticket y contactos; demo fuera de camino crítico |
| Carga masiva/empresas | Código de validación, concurrencia limitada y cancelación | E2E de lotes y permisos de titular; recomendación: fuera de RC inicial si no indispensable |
| Observabilidad/release | Instrumentación y sanitización existentes | DSN/alerta comprobados, correlación de pago, rollback y monitoreo de primera operación |

## 8. Supabase Advisor: riesgo real frente a ruido informativo

Estado consultado durante esta auditoría:

| Regla | Cantidad | Prioridad |
|---|---:|---|
| anon_security_definer_function_executable | 178 | Revisar primero; RC-01/02 son casos concretos sin autorización |
| authenticated_security_definer_function_executable | 200 | Clasificar: algunas RPC necesitan privilegios; otras deben ser internas |
| function_search_path_mutable | 25 | Corregir paths verificados |
| extension_in_public | 2 | Reubicar sólo después de calificar referencias |
| auth_leaked_password_protection | 1 | Activar si el plan lo permite; no cambiar plan/coste automáticamente |
| rls_enabled_no_policy | 4 | Son tablas internas restringidas; explicitar intención sin abrirlas a usuarios |
| auth_rls_initplan | 76 | Rendimiento; optimizar después del cierre de autorización |
| multiple_permissive_policies | 553 | No son 553 fallos distintos: hay combinaciones de tabla/rol/acción |
| unused_index | 139 | Informativo; no eliminar restricciones ni índices nuevos por falta de estadísticas |

Los avisos de FK sin índice no reaparecieron. La corrección anterior creó 79 índices. **No hace falta cerrar los 139 avisos informativos para RC.** Tampoco debe cambiarse toda función a invoker: varias implementan autorización y acceso interno deliberado.

Las propuestas de seguridad de la tarea anterior no se han aplicado: su revisión automática de aprobación rechazó el impacto en producción. Este informe no intenta ejecutarlas ni eludir esa revisión. Para avanzar, proponer primero cierres pequeños con pruebas de permiso, empezando por RC-01 y RC-02.

Referencia: [Supabase: proteger la Data API](https://supabase.com/docs/guides/api/securing-your-api).

## 9. Ruta más corta hacia RC

### Alcance recomendado de la primera RC

Web responsive; cuenta personal; registro y recuperación; verificación necesaria para solicitar; traslado individual con vehículo nuevo/guardado; cotización; pago electrónico; seguimiento/evidencia/chat con conductor; cancelación/incidencia; datos fiscales y soporte real.

Aplazar, salvo requisito comercial indispensable: CFDI automático, administración de tarjetas, carga masiva, expansión empresarial y RC Android independiente. No retirar controles de seguridad, verificación o confirmación real de pago para acelerar.

### Secuencia de trabajo

| Fase | Entrega concreta | Dependencia | Estimación |
|---|---|---|---:|
| A. Cerrar exposición y registro | RC-01/02/03; pruebas anon/A/B/servicio | Staging y aprobación específica para grants de producción | 6–10 h |
| B. Consistencia de cobro | RC-04/05/06, reconciliación y eventos fuera de orden | Stripe sandbox y BD de pruebas | 10–17 h |
| C. Estabilizar aplicación | RC-07/08/09/12; decidir RC-11; demo fuera del flujo | Contratos UX congelados | 8–16 h |
| D. Hacer verificable el release | RC-10/14/16; build válido; suite app en CI; E2E reales | Configuración y accesos de hosting/proveedores | 12–20 h |
| E. Aceptación y ensayo de operación | Matriz de salida, accesibilidad, móvil web, rollback y alertas | A–D verdes | 8–16 h |

Hay solapamiento posible entre pruebas/CI y correcciones backend; la estimación global contempla incertidumbre y evita sumar extremos como si fueran precisión contractual. El plazo se alarga si se incorpora CFDI, carga masiva o APK al mismo alcance.

**Primer día recomendado:** cerrar dos RPC internas y paradas, desactivar el fallback de SMS en production, corregir la búsqueda del vehículo guardado y poner las pruebas de app-usuario en CI. Son acciones pequeñas que reducen riesgo y hacen visible cualquier regresión mientras se trabaja en pagos.

## 10. Criterios verificables para declarar RC

No declarar RC sólo porque la pantalla funciona o el despliegue está READY.

1. **Seguridad:** cero P0 abiertos; tabla de RPC con roles permitidos; anon y otra cuenta no leen ni mutan operaciones/documentos ajenos; cron y servicios siguen funcionando.
2. **Registro:** OTP real obligatorio según alcance; production sin secretos falla cerrado; alta, confirmación y recuperación probadas con entrega de correo/SMS y enlaces caducados/reutilizados.
3. **Pago:** una operación cobrable por solicitud; cobro confirmado sólo por servidor; webhook repetido/desordenado/fallido converge; pago y traslado nunca quedan divergentes sin alerta/reconciliación.
4. **Funcionalidad:** recorrido nuevo/guardado→cotización→pago→asignación→evidencia→entrega→cierre; rechazo de verificación y cancelación probados. Dos sesiones/cuentas y refresh incluidos.
5. **Pruebas:** suite de app-usuario completa verde en ejecución conjunta; E2E críticos verdes sin catch vacío/skip de requisito; build production aprobado con Node 24 y lockfile congelado.
6. **Experiencia:** teclado/foco/errores comprobados; móvil web y escritorio; zoom; modales de OTP/Didit/pago; estados de carga/error/vacío; ninguna promesa de demo como atención real.
7. **Operación:** commit exacto, migraciones y funciones alineados; entorno de producción revisado sin exponer secretos; alerta de fallo probada, responsable y canales de soporte definidos; rollback ensayado.
8. **Alcance:** toda función visible incluida está operativa o retirada explícitamente. Las excepciones P2 quedan documentadas con responsable/fecha; no se aceptan P0/P1 del camino crítico por falta de tiempo.

### Matriz mínima de aceptación

| Caso | Resultado requerido |
|---|---|
| Registro sin Twilio/secreto en production | Bloqueo claro; no OTP mock/token |
| Registro válido, correo y recuperación | Cuenta utilizable; enlace caducado/usado rechazado |
| Usuario A con vehículo guardado | Solicitud válida aun con Auth ID distinto de perfil |
| Usuario B con UUID de A | Sin acceso a paradas/documentos/pago/seguimiento |
| Dos pestañas solicitan cobro | Un PI/operación; misma cantidad autorizada |
| Stripe processing | Pendiente, sin éxito definitivo |
| Webhook duplicado y fuera de orden | Estado final correcto, sin regresión ni duplicidad |
| Error tras escritura parcial del webhook | Reintento termina todos los efectos |
| Sesión que renueva cookies | Página hidratada y nonce coherente bajo CSP |
| Salir A y entrar B en dispositivo compartido | Sin borrador/contactos/estado de A |
| Documento subido/reemplazado/rechazado | Estado real, lectura autorizada y motivo |
| Sin red/proveedor temporalmente caído | Error recuperable, sin falsos éxitos ni duplicados |
| Cancelación/entrega/cierre | Reglas correctas y trazabilidad de la operación |
| Soporte y alerta | Ticket/canal llega a responsable; error operativo visible |

## 11. Evidencia y reproducción

Carpeta de evidencia: [auditoria-rc-usuario](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario).

El script [reproducciones.cjs](C:/Users/hecto/ecosistema/ruum_ecosistema/docs/auditoria-rc-usuario/reproducciones.cjs) transpila el código auditado, sustituye proveedores por implementaciones sintéticas y **demuestra los defectos actuales**. Sus aserciones no son un gate de regresión listo para CI: después de corregir el producto deben invertirse y convertirse en pruebas del comportamiento seguro.

Comando local, desde la raíz, con Node 24:

```text
node docs/auditoria-rc-usuario/reproducciones.cjs
```

Los JSON de pruebas, ESLint, dependencias, Supabase y reproducciones permiten revisar este dictamen. No se han modificado fuentes de producto, dependencias, permisos ni despliegues como parte de esta auditoría.
