# Reconciliación de App Usuario en Supabase

Desplegar `reconciliar-usuario` en el proyecto de destino y aplicar la migración
`20261113190650_programar_reconciliacion_usuario`. Configurar el secreto
`RUUM_STRIPE_MODE` con `test` para Stripe Sandbox o `live` para pagos reales,
junto con la clave Stripe del mismo modo en ese proyecto.

Para alojar App Usuario en Vercel Production con Stripe Sandbox, configura
`RUUM_STRIPE_MODE=test` en ese entorno y usa
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` y `STRIPE_SECRET_KEY` del mismo sandbox.
El build de Production requiere claves live cuando el modo queda sin definir.
Configura la misma clave privada y el mismo modo en las Edge Functions del
proyecto Supabase que usa la app. La función `stripe-webhook` requiere también
`STRIPE_WEBHOOK_SECRET`, obtenido del endpoint de ese sandbox que apunta a
`/functions/v1/stripe-webhook` en el proyecto Supabase de destino. Vuelve a
desplegar App Usuario para incorporar la nueva clave publicable al cliente.

La confirmación de un pago de sandbox puede actualizar traslados en la base
conectada. Los intentos live existentes requieren el entorno Stripe live para
seguir conciliándose durante la transición.

Configurar la URL de la Edge Function en el proyecto de destino mediante el
editor SQL. Sustituir la referencia por la de ese mismo proyecto.

```sql
insert into private.reconciliacion_usuario_config (singleton, edge_url)
values (true, 'https://PROJECT_REF.supabase.co/functions/v1/reconciliar-usuario')
on conflict (singleton) do update set edge_url = excluded.edge_url;
```

El job individual corre cada cinco minutos y el masivo cada minuto. Cada
invocación lleva un nonce de un solo uso emitido por Postgres. Para probar ambos
jobs, ejecutar el siguiente SQL y consultar sus IDs en otra transacción.

```sql
select private.encolar_reconciliacion_usuario('individual') as individual,
       private.encolar_reconciliacion_usuario('masivo') as masivo;
```

```sql
select i.tipo, r.id, r.status_code, r.timed_out, r.error_msg, r.content
from private.reconciliacion_usuario_invocaciones i
join net._http_response r on r.id = i.request_id;
```

El historial de `cron.job_run_details` confirma el encolado. La respuesta HTTP
confirma la ejecución del worker. Los endpoints internos de Next quedan
disponibles para invocaciones manuales autenticadas con `CRON_SECRET`.
