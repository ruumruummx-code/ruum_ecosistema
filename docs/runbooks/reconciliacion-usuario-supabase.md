# Reconciliación de App Usuario en Supabase

Desplegar `reconciliar-usuario` en el proyecto de destino y aplicar la migración
`20261113190650_programar_reconciliacion_usuario`. Configurar el secreto
`RUUM_STRIPE_MODE` con `test` en staging o `live` en producción, junto con la
clave Stripe del mismo modo en ese proyecto.

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
