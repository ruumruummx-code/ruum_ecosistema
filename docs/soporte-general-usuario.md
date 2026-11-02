# Cancelación y consultas generales

Cuando la cancelación directa está bloqueada, el enlace de chat abre la pestaña
correspondiente y cierra la hoja de detalles. Soporte navega a
`/soporte?viaje=<id>&motivo=cancelacion` para abrir el formulario con contexto.

Las consultas sin tipo de incidencia operativa se guardan en `tickets_soporte`,
con o sin traslado. El formulario muestra el folio solo después de confirmar la
fila. Conserva la descripción ante fallos y reutiliza el UUID de solicitud en
reintentos del mismo contenido. No convierte una consulta general en incidencia
operativa ni altera el estado del traslado. Correo continúa como alternativa
manual ante un fallo de registro, no como destino habitual del envío.

La API valida sesión, CSRF, límites y contenido. RLS impide leer tickets ajenos o
vincular traslados sin acceso; los permisos por columna impiden suplantar autor,
fecha o estado inicial. El usuario no puede editar, resolver ni eliminar tickets.
La bandeja de consultas en `/incidencias` de panel-admin permite a administradores
consultarlos y marcarlos resueltos. La base registra actor y fecha de resolución.
Esta bandeja requiere consulta/actualización; no se añadió envío automático de
correo ni WhatsApp.

## Despliegue y validación

Aplicar `20261102014943_tickets_soporte_general.sql` antes de desplegar app-usuario
y panel-admin. No se requieren nuevas dependencias ni variables de entorno.
La migración se valida localmente; su despliegue remoto se informa por separado.

Pruebas: formulario, enlaces de cancelación, apertura/cierre contextual del chat,
API con sesión y CSRF, claves idempotentes, bandeja administrativa y
`test/tickets_soporte_rls.test.sql` con cuentas sintéticas y rollback.
