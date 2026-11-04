# RUUM-USR-F2-001 — Contratos operativos del registro

## Saga Auth → perfil (CB-1)

`auth.users` y el perfil `public.usuarios` se crean mediante el trigger
canónico `manejar_nuevo_usuario_auth`, dentro de la misma transacción de
Postgres: si el perfil falla, el alta Auth falla y no se confirma un usuario
huérfano. `registro_saga_auth` conserva evidencia durable para cuentas
históricas o estados pendientes; un proceso administrativo debe reintentar o
marcar `reconciliacion_requerida`. Ninguna lectura crea perfiles.

La compensación no elimina silenciosamente cuentas Auth: requiere reconciliar
el perfil, conservar auditoría y aplicar el merge autorizado cuando exista
duplicidad.

## Teléfono (CB-2)

Antes de aplicar `usuarios_telefono_normalizado_uq` se ejecuta un preflight que
agrupa por los últimos diez dígitos y aborta si encuentra duplicados. La política
es merge aprobado por Operaciones, preservando la cuenta canónica, referencias
de traslados y auditoría; nunca se resuelve con `delete` automático. El índice
es parcial para permitir teléfonos nulos y evita duplicados de formatos como
`5512345678` y `+52 55 1234 5678`.

El despliegue recomendado es: preflight en staging, respaldo, merge firmado,
aplicar índice, verificar conteo y sólo entonces promover el registro. Si el
índice falla, se revierte la migración antes de abrir tráfico.

## Redis y dependencias (CB-3)

Redis es obligatorio en producción para rate limiting; si falta o falla, el
registro y OTP responden temporalmente con `429` y `Retry-After`, sin degradarse
a memoria por instancia. Twilio usa timeout de 8 segundos, un reintento sólo
para red/5xx y mensajes de recuperación sin filtrar credenciales. El alta Auth
tiene timeout de 10 segundos y el usuario recibe un error neutro.

## OTP y contraseña

El bypass telefónico está desactivado por defecto. Sólo puede habilitarse fuera
de producción con `PHONE_VERIFY_BYPASS=true`. El token HMAC contiene nonce
aleatorio y se consume una sola vez (`GETDEL` en Redis; memoria sólo en tests o
desarrollo). La política actual de contraseña exige mayúscula, minúscula y
número; la comprobación de contraseñas comprometidas queda como decisión
posterior porque requiere dimensionar proveedor, latencia, privacidad y costo.
