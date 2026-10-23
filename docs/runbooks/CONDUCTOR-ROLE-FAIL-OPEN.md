# Incidente: fallo al verificar el rol de conductor

## Riesgo y comportamiento

El middleware de `app-conductor` valida la sesión con Supabase Auth y después
clasifica el rol de la cuenta. Ante una excepción reintenta dos veces (50 ms y
100 ms). Si los tres intentos fallan, **falla cerrado**: deniega la petición
protegida con HTTP 503 y emite `conductor_role_verification_failed`. Una
interrupción del proveedor puede bloquear temporalmente a conductores legítimos;
la respuesta 503 les permite reintentar sin conceder acceso a una identidad
cuyo rol no pudo verificarse.

La política RLS de Supabase es la barrera de autorización de datos y mutaciones;
no asumir que el middleware por sí solo protege una operación. Si RLS falta o
una ruta privilegiada no la aplica, el riesgo pasa de acceso a UI a lectura o
mutación no autorizada.

El middleware emite el log estructurado antes de intentar registrar el evento
en `eventos_operativos_app`. La persistencia es best-effort y no cambia la
denegación; si falla la RPC, el log de Vercel queda como señal alternativa.

## Disparador y severidad

La alerta cuenta `conductor_role_verification_failed` para
`ambito=app-conductor` en una ventana móvil de 5 minutos:

- **Warning:** 1 o más eventos.
- **Page Seguridad + on-call:** 3 o más eventos.

Ejecutar cada minuto el monitor SQL definido en
[`apps/app-conductor/docs/ops/SENTRY_ALERTS.md`](../../apps/app-conductor/docs/ops/SENTRY_ALERTS.md).
Si no llegan filas a la base de datos, buscar el mismo nombre de evento como
JSON en Vercel Logs: ese log se genera antes del intento de persistencia.

## Respuesta

1. Registrar inicio, ambiente, release, volumen de eventos y rutas afectadas.
   Usar `motivo` como código corto; no copiar cookies, tokens ni datos de
   usuarios al ticket o a los canales de incidente.
2. Revisar Vercel Logs por el evento y comparar `pathname`, `motivo` y
   `version_app`. Buscar correlación con latencia/errores de Supabase Auth,
   PostgREST, red, DNS o despliegues. El evento no registra éxitos; ausencia de
   eventos no demuestra que las consultas de rol estén sanas.
3. Confirmar el estado de Supabase y que `clasificarRolApp` puede leer la
   asociación usuario/rol. Verificar que la migración
   `20261020000000_rls_rol_usuario_no_accede_conductor.sql` está aplicada y
   validar en un entorno seguro que una cuenta `usuario` no puede crear su
   propio registro de conductor.
4. Probar con cuentas de prueba: una cuenta de conductor debe acceder a una ruta
   protegida; una cuenta de usuario/pasajero debe recibir `/403`; las lecturas y
   mutaciones protegidas deben seguir denegadas por RLS cuando corresponda.
5. Si hay indicios de bypass de RLS o acceso/mutación no autorizados, elevar a
   incidente de seguridad, pausar el rollout y aplicar la mitigación aprobada
   por Seguridad (bloqueo temporal de las operaciones sensibles o rollback).
   No confiar únicamente en el middleware para detener una operación.
6. Si se confirma una falla transitoria de Supabase/red sin bypass de RLS,
   restaurar la verificación y monitorizar los 503 hasta recuperar el servicio.
   No deshabilitar RLS ni ampliar privilegios para eliminar la alerta.
7. Tras corregir la causa, repetir las pruebas de roles y RLS, confirmar que la
   métrica queda en cero durante 30 minutos y documentar causa raíz, alcance y
   acciones preventivas.

## Cierre

Cerrar el incidente sólo con evidencia de recuperación de la clasificación de
roles, acceso denegado para cuentas no conductor y RLS intacto. Adjuntar conteo
antes/después y release validado, sin PII ni secretos.
