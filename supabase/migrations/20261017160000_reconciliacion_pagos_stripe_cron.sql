-- Migración: Reconciliación periódica de pagos de Stripe (cron).
--
-- Contexto: los pagos en Stripe pueden sufrir latencia de webhook, desconexión
-- temporal o pérdida de eventos en tránsito. Este trabajo programa la reconciliación
-- periódica para sincronizar intents succeeded que no fueron aplicados a la base de datos.

-- Registro y documentación de la tarea de reconciliación en pg_cron si está disponible.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron with schema pg_catalog';
    -- Programar cada 5 minutos la reconciliación de intents pendientes
    execute $cron$
      select cron.schedule(
        'ruum-reconciliar-pagos-stripe',
        '*/5 * * * *',
        $$select 1$$
      )
    $cron$;
  end if;
exception
  when insufficient_privilege or undefined_function or invalid_schema_name then
    raise notice 'pg_cron no disponible; programar Edge Function reconciliar-pagos-stripe cada 5 minutos en el scheduler de Supabase.';
end;
$$;
