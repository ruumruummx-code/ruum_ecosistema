-- E — Barrido "sin pago no hay solicitud": cancela solicitudes anticipadas
-- que quedaron en espera de pago en el Paso 5.
--
-- Contexto: el wizard crea el traslado al salir del Paso 4 (necesita el
-- traslado_id para el PaymentIntent) y el pago se valida en el Paso 5. Si el
-- usuario abandona sin pagar, la fila quedaría latente en
-- cotizacion_aceptada para siempre. Este barrido la cancela tras la ventana
-- de gracia para que ningún traslado fantasma llegue a operación.
--
-- Reglas:
--   * Solo tipo_pago = 'anticipado' en estado = 'cotizacion_aceptada'.
--   * Ventana de gracia: 30 minutos desde creado_en.
--   * No toca traslados con pago completado (ya operan por la vía normal).
--   * No toca traslados con intento de pago reciente (PaymentIntent pendiente
--     de los últimos 30 minutos: el usuario puede estar pagando ahora).
--   * La transición cotizacion_aceptada -> servicio_cancelado es válida por
--     grafo y el gate de pago nunca bloquea salidas.
--   * SECURITY DEFINER + ejecución por service_role (patrón de
--     procesar_competencias_asignacion): ningún rol de app lo invoca directo.

create or replace function public.cancelar_traslados_impagos_vencidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_afectados integer;
begin
  update public.traslados t
  set estado = 'servicio_cancelado'
  where t.estado::text = 'cotizacion_aceptada'
    and t.tipo_pago::text = 'anticipado'
    and t.creado_en < now() - interval '30 minutes'
    and not exists (
      select 1 from public.pagos p
      where p.traslado_id = t.id
        and p.estado = 'completado'
    )
    and not exists (
      select 1 from public.pagos p
      where p.traslado_id = t.id
        and p.estado = 'pendiente'
        and p.registrado_en > now() - interval '30 minutes'
    );

  get diagnostics v_afectados = row_count;
  return v_afectados;
end;
$$;

revoke all on function public.cancelar_traslados_impagos_vencidos() from public;
grant execute on function public.cancelar_traslados_impagos_vencidos() to service_role;

-- Programa el barrido cada 5 minutos sin asumir pg_cron en cada entorno
-- (mismo patrón que ruum-resolver-asignacion-automatica).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron with schema pg_catalog';
    execute $cron$
      select cron.schedule(
        'ruum-cancelar-impagos-vencidos',
        '*/5 * * * *',
        'select public.cancelar_traslados_impagos_vencidos()'
      )
    $cron$;
  end if;
exception
  when insufficient_privilege or undefined_function or invalid_schema_name then
    raise notice 'pg_cron no disponible; programar public.cancelar_traslados_impagos_vencidos() cada 5 minutos en el entorno alojado.';
end;
$$;

-- Autoverificación: la función existe con la firma esperada.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from pg_proc
  where proname = 'cancelar_traslados_impagos_vencidos'
    and pronamespace = 'public'::regnamespace;
  if v_count <> 1 then
    raise exception 'La función cancelar_traslados_impagos_vencidos no quedó creada';
  end if;
end;
$$;
