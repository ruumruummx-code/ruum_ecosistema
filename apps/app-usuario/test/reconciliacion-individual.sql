-- Ejecutar con psql -v ON_ERROR_STOP=1 únicamente en una base local desechable.
-- Se confirman las filas de prueba para que ambas conexiones puedan verlas.
\set ON_ERROR_STOP on
create extension if not exists dblink with schema extensions;
begin;
insert into public.usuarios(id,tipo_cuenta) values ('12000000-0000-4000-8000-000000000001','personal');
insert into public.vehiculos(id,usuario_id,tipo,marca,modelo,anio) values ('12000000-0000-4000-8000-000000000002','12000000-0000-4000-8000-000000000001','sedan','Prueba','Prueba',2020);
insert into public.traslados(id,usuario_id,vehiculo_id,estado,tipo_pago,creado_en,cotizacion_expira_en,contacto_entrega_nombre,contacto_entrega_telefono,contacto_recepcion_nombre,contacto_recepcion_telefono,origen_direccion,origen_ciudad,destino_direccion,destino_ciudad,clave_idempotencia)
select ('12000000-0000-4000-8000-00000000000'||n)::uuid,'12000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','cotizacion_generada','anticipado',now()-interval '1 hour',
  case when n = 6 then now()+interval '1 hour' else now()-interval '30 minutes' end,
  'Prueba','5555555555','Prueba','5555555555','Origen','CDMX','Destino','Toluca',gen_random_uuid()
from generate_series(3,7) n;
insert into public.pagos(traslado_id,monto,momento,metodo,estado,stripe_payment_intent_id) values
 ('12000000-0000-4000-8000-000000000003',100,'anticipado','stripe','completado','pi_fixture_f6_paid'),
 ('12000000-0000-4000-8000-000000000005',100,'anticipado','stripe','pendiente','pi_fixture_f6_pending'),
 ('12000000-0000-4000-8000-000000000007',100,'anticipado','stripe','pendiente','pi_fixture_f6_concurrent');
set local role service_role;
do $$
declare resultado jsonb;
begin
  resultado := public.reconciliar_saga_traslados_individuales(50);
  if resultado is distinct from '{"confirmados":1,"compensados":1,"errores":0}'::jsonb then
    raise exception 'Primera ejecución: %', resultado;
  end if;
  resultado := public.reconciliar_saga_traslados_individuales(50);
  if resultado is distinct from '{"confirmados":0,"compensados":0,"errores":0}'::jsonb then
    raise exception 'Reintento: %', resultado;
  end if;
end $$;
reset role;
do $$
begin
  if (select array_agg(estado::text order by id) from public.traslados
      where usuario_id = '12000000-0000-4000-8000-000000000001')
    is distinct from array['servicio_confirmado', 'servicio_cancelado',
      'cotizacion_generada', 'cotizacion_generada', 'cotizacion_generada'] then
    raise exception 'Estados inesperados para pago completado, vencido sin pago, pendiente, futuro o concurrente';
  end if;
end $$;
commit;

-- Mantener abiertas las escrituras del procesador mientras otra sesión reconcilia.
select extensions.dblink_connect('reconciliador', 'dbname=' || current_database());
select extensions.dblink_exec('reconciliador', 'set role service_role');
select extensions.dblink_exec('reconciliador', 'set statement_timeout = ''5s''');
begin;
set local role service_role;
do $$
declare resultado jsonb;
begin
  resultado := public.procesar_pago_stripe('evt_fixture_f6_concurrent', 'pi_fixture_f6_concurrent', 'completado');
  if resultado->>'ok' is distinct from 'true' then
    raise exception 'Procesamiento concurrente del pago: %', resultado;
  end if;
end $$;
reset role;
do $$
declare resultado jsonb;
begin
  select respuesta into resultado
  from extensions.dblink('reconciliador',
    'select public.reconciliar_saga_traslados_individuales(50)') as respuesta(respuesta jsonb);
  if resultado is distinct from '{"confirmados":0,"compensados":0,"errores":0}'::jsonb then
    raise exception 'Reconciliación durante el procesamiento: %', resultado;
  end if;
end $$;
commit;
select extensions.dblink_disconnect('reconciliador');

begin;
set local role service_role;
do $$
declare resultado jsonb;
begin
  resultado := public.procesar_pago_stripe('evt_fixture_f6_concurrent', 'pi_fixture_f6_concurrent', 'completado');
  if resultado->>'ya_procesado' is distinct from 'true' then
    raise exception 'Repetición del evento concurrente: %', resultado;
  end if;
  resultado := public.reconciliar_saga_traslados_individuales(50);
  if resultado is distinct from '{"confirmados":0,"compensados":0,"errores":0}'::jsonb then
    raise exception 'Reconciliación posterior a la concurrencia: %', resultado;
  end if;
end $$;
reset role;
do $$
begin
  if not exists (
    select 1 from public.traslados t
    join public.pagos p on p.traslado_id = t.id
    where t.id = '12000000-0000-4000-8000-000000000007'
      and t.estado = 'servicio_confirmado'
      and p.estado = 'completado'
      and p.stripe_event_id = 'evt_fixture_f6_concurrent'
  ) then
    raise exception 'El pago concurrente no quedó completado con su traslado confirmado';
  end if;
  if (select count(*) from public.registro_auditoria
      where traslado_id = '12000000-0000-4000-8000-000000000007'
        and evento = 'registro_pago'
        and datos->>'estado_nuevo' = 'servicio_confirmado') <> 1 then
    raise exception 'El pago concurrente debe confirmar el traslado exactamente una vez';
  end if;
end $$;
rollback;
