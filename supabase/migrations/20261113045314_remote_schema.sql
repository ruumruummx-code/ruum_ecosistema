SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.reconciliar_saga_traslados_individuales (
  p_limite integer DEFAULT 50
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth', 'pg_temp'
  AS $function$
declare
  v_confirmados integer := 0;
  v_compensados integer := 0;
  v_errores integer := 0;
  r record;
  v_pago record;
begin
  if p_limite is null or p_limite < 1 or p_limite > 200 then
    raise exception 'Límite de reconciliación inválido (debe ser entre 1 y 200).';
  end if;

  for r in
    select t.id, t.usuario_id, t.creado_en
    from public.traslados t
    where t.estado = 'cotizacion_generada'
      and t.creado_en < (now() - interval '15 minutes')
    order by t.creado_en asc
    limit p_limite
    for update skip locked
  loop
    begin
      -- Verificar si existe pago aprobado en la tabla de pagos
      select p.id, p.estado into v_pago
      from public.pagos p
      where p.traslado_id = r.id
      order by p.creado_en desc
      limit 1;

      if v_pago.id is not null and v_pago.estado in ('completado', 'aprobado', 'succeeded') then
        -- Caso: Pago confirmado en pasarela pero webhook no transicionó el traslado
        update public.traslados
        set estado = 'servicio_confirmado',
            actualizado_en = now()
        where id = r.id;

        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'reconciliacion_pago_exitoso_traslado', 'sistema', r.usuario_id,
          jsonb_build_object('pago_id', v_pago.id, 'estado_anterior', 'cotizacion_generada', 'nuevo_estado', 'servicio_confirmado'));

        v_confirmados := v_confirmados + 1;
      else
        -- Caso: Abandono o pago fallido tras 15 minutos -> Compensación de saga
        update public.traslados
        set estado = 'servicio_cancelado',
            actualizado_en = now()
        where id = r.id;

        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'compensacion_saga_pago_fallido', 'sistema', r.usuario_id,
          jsonb_build_object('motivo', 'pago_fallido_compensacion', 'tiempo_transcurrido_min', 15, 'pago_estado', v_pago.estado));

        v_compensados := v_compensados + 1;
      end if;
    exception when others then
      v_errores := v_errores + 1;
      insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
      values (r.id, 'error_reconciliacion_saga_f6', 'sistema', r.usuario_id,
        jsonb_build_object('error', sqlerrm, 'sqlstate', sqlstate));
    end;
  end loop;

  return jsonb_build_object('confirmados', v_confirmados, 'compensados', v_compensados, 'errores', v_errores);
end;
$function$;

COMMENT ON FUNCTION "public"."reconciliar_saga_traslados_individuales"(integer) IS 'F6-001: job de mantenimiento/reconciliación cada 5 minutos; transiciona a servicio_confirmado traslados pagados pendientes o compensa a servicio_cancelado traslados abandonados > 15m con SKIP LOCKED.';

