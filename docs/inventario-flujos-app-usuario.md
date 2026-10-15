# Inventario de flujos de App Usuario

**Revisión:** 2026-10-14  
**Alcance:** `apps/app-usuario/src/app` y sus componentes inmediatos. Inventario estático del código; no implica que cada recorrido se haya ejecutado contra Supabase, Stripe, Twilio o Mapbox en producción.

## Resumen

La aplicación cubre el ciclo de solicitud y seguimiento de traslados, autenticación y verificación, autoservicio de cuenta y contacto con soporte. La navegación principal expone Inicio, Traslados y Cuenta; algunas funciones se alcanzan desde esos flujos y otras rutas son aliases o redirecciones.

El acceso a datos de sesión depende de Supabase. El middleware protege traslados, cuenta, pasaporte, verificación y soporte; al solicitar una ruta protegida sin sesión envía a `/login` con destino de retorno. La pantalla de inicio distingue entre visitante, sesión autenticada y error de configuración/conexión. Referencias: [navegación](../apps/app-usuario/src/app/NavegacionUsuario.tsx), [middleware](../apps/app-usuario/src/middleware.ts), [inicio](../apps/app-usuario/src/app/page.tsx).

## Flujos principales

| Flujo | Recorrido observado | Resultado / condición |
|---|---|---|
| Descubrimiento | `/` público → recorrido `/onboarding` opcional → `/registro` o `/login` | Con sesión, `/` muestra el panel de inicio; sin sesión muestra la landing. El onboarding tiene tres láminas informativas y conserva el paso en `localStorage`. |
| Registro | `/registro`: datos personales y teléfono → OTP SMS → correo, contraseña y aceptación de términos → `POST /api/auth/signup` | El teléfono debe verificarse antes del alta. Si Supabase exige confirmación, pasa por `/registro/confirma-correo` y `/auth/callback`; si no, vuelve a Inicio. La UI actual fija `tipoCuenta = "personal"`, aunque el endpoint admite `empresa`. |
| Inicio de sesión | `/login` con correo/contraseña → `next` si existe, o Inicio | Presenta mensajes distintos para confirmación de correo y sesión requerida. Ya autenticado, el middleware redirige desde login/registro a `/`. |
| Recuperación de acceso | `/recuperar-password` → enlace de Supabase → `/auth/callback` → `/nueva-password` → cerrar sesión → `/login` | El callback valida el token/código y marca la sesión de recuperación; el formulario nuevo requiere sesión autorizada, contraseña válida y confirmación. El enlace inválido/expirado ofrece volver a solicitarlo. |
| Verificación de identidad | `/verificacion` → lectura del estado de cuenta → flujo Didit o documentación manual | Estados contemplados: pendiente, en revisión, verificado y rechazado. Si ya está verificado, permite volver al destino `next` o a Inicio. El wizard de traslado bloquea la solicitud si la verificación requerida no está completa. |
| Solicitud individual | `/viajes/nuevo`: 1) tarifa, 2) vehículo, 3) ruta/contactos, 4) detalles/políticas, 5) pago | La app valida campos, muestra tarifa y ruta, guarda borrador local por 24 h excluyendo datos sensibles, y permite restaurarlo o descartarlo. Valida también en `POST /api/viajes`, crea el traslado con clave de idempotencia y requiere sesión real. Al crear pasa al pago Stripe; el avance solo considera el pago confirmado cuando la base refleja `completado` tras el webhook. |
| Solicitud masiva | `/viajes/masivo` → cargar CSV → validar/enriquecer filas → revisar resultados → enviar/procesar carga | Límite documentado en el componente: 100 filas y 5 MB. Revisa campos, CP y coordenadas; geocodifica/calcula ruta cuando Mapbox está disponible, presenta errores/advertencias y permite descargar plantilla o reporte. El procesamiento tiene polling y cancelación al abandonar la pantalla. |
| Lista de traslados | `/mis-viajes` → pestañas Activos, Programados, Finalizados y Cancelados → abrir un traslado | La clasificación deriva del estado operativo. Incluye estados de error con reintento/contacto a soporte, estado vacío con CTA a nueva solicitud y controles de búsqueda/filtro. |
| Pasaporte digital | `/pasaporte` → redirección al traslado activo más reciente (o al último); `/viajes/[id]` abre un registro concreto | Verifica sesión y pertenencia del traslado al usuario, y oculta el registro como no encontrado si falla la comprobación. El detalle presenta estado, vehículo, conductor, evidencia, pagos, seguimiento y acciones habilitadas por estado. |
| Acciones del traslado | Desde `/viajes/[id]`: chat/llamada con conductor, seguimiento, evidencia, cancelación, incidencia, disputa, calificación, pagos recuperables, reclamo de seguro y exportación/compartición del pasaporte | Acciones y ventanas disponibles dependen del estado y los datos existentes; por ejemplo, la calificación y disputa tienen ventanas posteriores al cierre. La ruta es dinámica y no se debe servir desde caché compartida. |
| Cuenta | `/cuenta` → datos personales, vehículos, verificación/facturación, preferencias y contraseña | El resumen muestra perfil y métricas, lista vehículos existentes y enlaza a pantallas de autoservicio. La carga distingue sin sesión de error de Supabase. |
| Datos personales | `/cuenta/datos-personales` → editar perfil/domicilio/teléfono/foto y guardar | Actualiza perfil por servicio API. La fecha de nacimiento se intenta guardar aparte y el error se tolera mientras la columna no exista. |
| Verificación documental y fiscal | `/cuenta/verificacion-documentos` → INE, licencia, comprobante y datos fiscales | Consulta/sube documentos y muestra estado/progreso. La captura de RFC, razón social, régimen, CP, uso CFDI y correo está en esta misma pantalla; los documentos se pueden reemplazar. |
| Preferencias | `/cuenta/preferencias` → activar/desactivar notificaciones y alertas, cambiar tema/idioma/unidades/accesibilidad y privacidad | Preferencias de notificación se guardan localmente e intentan sincronizarse con Supabase; varias preferencias de presentación/dispositivo viven solo en `localStorage`. |
| Contraseña autenticada | `/cuenta/cambiar-contrasena` → verificar contraseña actual → guardar una nueva | Requiere contraseña actual, mínimo 8 caracteres, mayúscula, minúscula, número y confirmación. Para credenciales olvidadas se desvía al flujo de recuperación. |
| Soporte | `/soporte` → motivo, viaje opcional y descripción → incidencia ligada a viaje o correo | Con viaje y Supabase disponible crea incidencia con folio; consulta general o fallo de registro abre `mailto:` prellenado. Puede recibir viaje/motivo/canal por query string. FAQ y canales de contacto también están accesibles desde Inicio/Cuenta. |
| Información legal | `/legal/terminos` y `/legal/privacidad` | Páginas públicas de consulta con retorno a Cuenta. No dependen de un registro activo para el contenido. |

## Catálogo de rutas

Las páginas inspeccionadas son 30; los endpoints de API se enumeran aparte. Los redirects se muestran como aliases, no como flujos independientes.

| Grupo | Rutas |
|---|---|
| Entrada | `/`, `/onboarding`, `/ui-v2-preview` (vista de preview) |
| Acceso | `/login`, `/registro`, `/registro/confirma-correo`, `/recuperar-password`, `/nueva-password` |
| Identidad | `/verificacion` |
| Traslados | `/viajes/nuevo`, `/viajes/masivo`, `/mis-viajes`, `/viajes/[id]`, `/pasaporte` |
| Cuenta | `/cuenta`, `/cuenta/datos-personales`, `/cuenta/vehiculos`, `/cuenta/verificacion-documentos`, `/cuenta/preferencias`, `/cuenta/cambiar-contrasena`, `/cuenta/preguntas-frecuentes` |
| Ayuda/legal | `/soporte`, `/preguntas-frecuentes`, `/legal/terminos`, `/legal/privacidad` |
| Aliases/redirecciones | `/preferencias` → `/cuenta/preferencias`; `/facturacion` → `/cuenta/facturacion` → `/cuenta/verificacion-documentos#facturacion`; `/cuenta/facturacion` → sección fiscal; `/cuenta/documentos` → `/cuenta/verificacion-documentos`; `/cuenta/metodos-pago` → `/cuenta` |

El callback de autenticación es `/auth/callback` (Route Handler). Endpoints funcionales adicionales: `/api/auth/signup`, `/api/auth/resend`, `/api/auth/verify-otp`, `/api/auth/phone-verify/send`, `/api/auth/phone-verify/verify`, `/api/recovery/verify`, `/api/recovery/clear`, `/api/viajes` y `/api/csp-report`.

## Gaps y verificaciones recomendadas

1. **Alta de cuentas de empresa:** el cliente de registro solo envía `personal`; el endpoint y el modelo permiten `empresa`. Confirmar si la exclusión de empresas es intencional o si falta selector/flujo.
2. **Enlace Legal del resumen de Cuenta:** `NavegacionCuenta` apunta a `/cuenta/legal`, pero no existe una página para esa ruta en el árbol inspeccionado. Los enlaces directos a Términos y Privacidad sí existen.
3. **Métodos de pago:** `/cuenta/metodos-pago` solo redirige al resumen; no se encontró flujo de gestión de tarjetas guardadas. El pago individual usa Stripe y la UI declara que no guarda datos de tarjeta.
4. **Historial de facturas:** existe `cuenta/Facturacion.tsx` con una vista de facturas derivada de traslados y pruebas, pero no aparece importada por una página/ruta productiva. Las rutas `/facturacion` y `/cuenta/facturacion` llevan a la captura de datos fiscales, no a ese historial. Verificar si el historial debe exponerse o retirarse.
5. **Disponibilidad de soporte:** algunas vistas anuncian atención 24/7; el formulario de soporte informa horario de lunes a viernes, 8:00–20:00 CDMX, y SLA distinto fuera de horario. Alinear promesa y operación.
6. **Vehículos guardados:** `/cuenta/vehiculos` es una lista de lectura; el texto indica que los vehículos se guardan al solicitar traslados. No se observa edición/eliminación desde esa pantalla.
7. **Cobertura de pruebas:** hay pruebas unitarias/componentes en registro, wizard, cuenta, preferencias, facturación, soporte y pasaporte; este inventario no valida integraciones reales ni completa un recorrido E2E con servicios externos.

## Fuentes principales

- [README de App Usuario](../apps/app-usuario/README.md)
- [Rutas y navegación](../apps/app-usuario/src/app/NavegacionUsuario.tsx)
- [Wizard de traslado](../apps/app-usuario/src/app/viajes/nuevo/NuevoTrasladoForm.tsx) y [definición de pasos](../apps/app-usuario/src/app/viajes/nuevo/constants.ts)
- [Lista de traslados](../apps/app-usuario/src/app/mis-viajes/page.tsx) y [Pasaporte Digital](../apps/app-usuario/src/app/viajes/[id]/PasaporteDigitalSegmentado.tsx)
- [Resumen de Cuenta](../apps/app-usuario/src/app/cuenta/CuentaCliente.tsx) y [carga de datos de Cuenta](../apps/app-usuario/src/app/cuenta/cuenta-ui.tsx)
- [Middleware de sesión](../apps/app-usuario/src/middleware.ts)