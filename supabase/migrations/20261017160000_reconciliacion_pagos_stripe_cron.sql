-- Migración: Reconciliación periódica de pagos de Stripe (cron).
-- Contexto: ...

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog';
    -- Programar cada 5 minutos la reconciliación de intents pendientes
    EXECUTE $cron$
      SELECT cron.schedule(
        'ruum-reconciliar-pagos-stripe',
        '*/5 * * * *',
        $cmd$SELECT public.reconciliar_pagos_stripe();$cmd$
      )
    $cron$;
  END IF;
EXCEPTION
  WHEN insufficient_privilege OR undefined_function OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron no disponible; programar Edge Function reconciliar-pagos-stripe cada 5 minutos en el scheduler de Supabase.';
END;
$do$;