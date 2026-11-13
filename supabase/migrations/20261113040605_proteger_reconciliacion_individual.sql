-- La conciliación de Stripe verifica los PaymentIntents con el proveedor.
-- La compensación SQL solo vence cotizaciones que nunca iniciaron un pago.
create or replace function public.reconciliar_saga_traslados_individuales(p_limite integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_confirmados integer := 0;
  v_compensados integer := 0;
  v_errores integer := 0;
  r record;
begin
  if p_limite is null or p_limite not between 1 and 200 then
    raise exception 'Límite de reconciliación inválido (debe ser entre 1 y 200).';
  end if;

  for r in
    select t.id, t.usuario_id
    from public.traslados t
    where t.estado = 'cotizacion_generada'
      and coalesce(t.cotizacion_expira_en, t.creado_en + interval '15 minutes') < now()
      and (
        exists (
          select 1 from public.pagos p
          where p.traslado_id = t.id and p.estado = 'completado'
        )
        or not exists (select 1 from public.pagos p where p.traslado_id = t.id)
      )
    order by t.creado_en, t.id
    limit p_limite
    for update of t skip locked
  loop
    begin
      if exists (select 1 from public.pagos p where p.traslado_id = r.id and p.estado = 'completado') then
        update public.traslados set estado = 'servicio_confirmado', actualizado_en = now() where id = r.id;
        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'confirmacion_servicio', 'sistema', r.usuario_id,
          jsonb_build_object('origen', 'reconciliacion_individual', 'estado_anterior', 'cotizacion_generada', 'nuevo_estado', 'servicio_confirmado'));
        v_confirmados := v_confirmados + 1;
      elsif not exists (select 1 from public.pagos p where p.traslado_id = r.id) then
        update public.traslados set estado = 'servicio_cancelado', actualizado_en = now() where id = r.id;
        insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
        values (r.id, 'cancelacion_traslado', 'sistema', r.usuario_id,
          jsonb_build_object('origen', 'reconciliacion_individual', 'motivo', 'cotizacion_vencida_sin_pago'));
        v_compensados := v_compensados + 1;
      end if;
    exception when others then
      v_errores := v_errores + 1;
      insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
      values (r.id, 'reporte_incidencia', 'sistema', r.usuario_id,
        jsonb_build_object('origen', 'reconciliacion_individual', 'error', sqlerrm, 'sqlstate', sqlstate));
    end;
  end loop;
  return jsonb_build_object('confirmados', v_confirmados, 'compensados', v_compensados, 'errores', v_errores);
end;
$$;

revoke all on function public.reconciliar_saga_traslados_individuales(integer) from public, anon, authenticated;
grant execute on function public.reconciliar_saga_traslados_individuales(integer) to service_role;
comment on function public.reconciliar_saga_traslados_individuales(integer) is
  'Confirma cotizaciones con pago registrado y vence cotizaciones sin pago; la conciliación de Stripe procesa intents pendientes.';
