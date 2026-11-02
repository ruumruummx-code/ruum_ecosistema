# Facturación y billetera de app-usuario

`/cuenta/facturacion` conserva el enlace a `#facturacion`; la vista receptora abre
el editor fiscal al montar y al cambiar el fragmento. La constancia fiscal sigue
disponible en la misma vista de documentos.

`/cuenta/metodos-pago` consulta las tarjetas del Customer asociado al usuario
autenticado, permite desvincularlas con confirmación y cambiar la predeterminada.
La captura de una tarjeta se realiza en Checkout de Stripe, en modo `setup`, sin
crear un cobro. El regreso de Checkout no se interpreta como éxito: la lista se
consulta nuevamente en Stripe. No se guardan PAN ni CVC en la aplicación.

La asociación usuario/Customer se crea en servidor con idempotencia y se guarda
en `billetera_clientes_stripe`, separada por modo test/live. La tabla tiene RLS y
solo service_role puede leer o insertar; no se permite reemplazar asociaciones.
No se vinculan clientes antiguos por coincidencia de email. Las tarjetas de Link
y otros Customers no se importan automáticamente a esta billetera.

Las mutaciones verifican sesión, CSRF, límite por usuario y pertenencia de la
tarjeta al Customer. Las sesiones de Elements se emiten después de comprobar el
Customer del PaymentIntent. Los nuevos pagos individuales y masivos incorporan
el Customer de la billetera. Los intentos antiguos sin Customer conservan su
captura original, sin recrearse. La selección y confirmación del pago continúa
en Elements; guardar o predeterminar una tarjeta nunca cobra un traslado.

## Despliegue

1. Aplicar `20261101215203_billetera_clientes_stripe.sql` antes del código consumidor.
2. Desplegar la función `crear-payment-intent` y app-usuario en el mismo entorno.
3. app-usuario requiere `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y
   `NEXT_PUBLIC_SUPABASE_URL`. La función usa su configuración existente de Stripe
   y Supabase. Las claves Stripe de ambos servicios deben pertenecer a la misma
   cuenta y al mismo modo. Usar una clave restringida con los permisos necesarios.
4. Validar en sandbox: alta con autenticación, cancelación, lista, cambio de
   predeterminada, selección en pago individual/masivo y eliminación. Confirmar
   que otra cuenta no puede operar los identificadores de la primera.

El webhook de pagos existente sigue siendo responsable de conciliar cobros.
La billetera consulta Stripe directamente y no realiza ninguna actualización
de negocio basada en la URL de regreso del alta.

## Validación local

Pruebas de UI y rutas con mocks de los bordes Stripe/Auth, pruebas de pertenencia
en servidor y `test/billetera_permisos.test.sql` sobre PostgreSQL local.
Estas comprobaciones no sustituyen una aceptación con Stripe sandbox ni un
despliegue de la migración y la función.
