# Confirmación de correo en app-usuario

Revisión del 24 de octubre de 2026. Proyecto Supabase: `asmzetwwwugaoowiukdv`.

## Evidencia de producción

- El endpoint público de configuración de Auth responde con `mailer_autoconfirm=false`, `disable_signup=false` y `external.email=true`: el registro por correo y su confirmación están activos.
- A las 10:42:10 de Ciudad de México (16:42:10 UTC), el registro desde el dominio de app-usuario produjo `user_repeated_signup` y HTTP 200.
- La cuenta asociada a ese evento ya había sido creada y confirmada esa madrugada; su metadata de registro indica `conductor`.
- El reenvío de las 10:56:31 (16:56:31 UTC) respondió HTTP 200 sin evento de nueva confirmación. Un HTTP 200 de reenvío no demuestra entrega a la bandeja del destinatario.
- En las últimas 24 horas consultadas hay solicitudes de confirmación y verificaciones exitosas desde app-conductor. No aparecen errores SMTP en las entradas consultadas de signup/resend.

## Causa y correcciones locales

Las aplicaciones comparten Supabase Auth. El correo ya confirmado no crea otra identidad al registrarse en app-usuario. Auth puede devolver un usuario ficticio sin identidades para ocultar la existencia de la cuenta; la aplicación interpretaba cualquier usuario sin sesión como una cuenta nueva pendiente de confirmar.

Se añadió el manejo de la respuesta sin identidades para mostrar una alternativa de acceso/recuperación, sin prometer un correo. También se dejó de clasificar cualquier HTTP 422 como duplicado: ese estado puede corresponder a configuración de correo. Se agregaron registros con código y estado del error, sin correo ni credenciales.

El reenvío conserva respuestas neutras para cuentas inexistentes, pero ahora comunica errores del proveedor HTTP 429, HTTP 5xx y `email_address_not_authorized` en vez de anunciar éxito.

## Configuración y límites de la revisión

El envío lo hace Supabase Auth mediante `auth.signUp` / `auth.resend`; no lo hace Twilio ni una Edge Function. La plantilla local incluye `{{ .Token }}` y configura seis dígitos con una hora de vigencia. El archivo local `supabase/config.toml` no demuestra cuál es la plantilla ni el SMTP guardados en el proyecto alojado.

No se inspeccionaron las credenciales SMTP ni se modificó la configuración alojada. No se enviaron correos de prueba ni se crearon cuentas de producción. Los cambios de código requieren despliegue.

Para probar un registro nuevo, usar un correo que todavía no exista en este proyecto de Auth. La aplicación de usuario también tiene una restricción de acceso para cuentas de conductor; habilitar ambos perfiles con una misma identidad requiere revisar ese flujo por separado.

Referencias: [registro de Supabase](https://supabase.com/docs/reference/javascript/auth-signup), [SMTP de Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp).
