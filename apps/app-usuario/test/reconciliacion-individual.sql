-- Ejecutar con psql sobre una base local limpia con las migraciones aplicadas.
begin;
insert into public.usuarios(id,tipo_cuenta) values ('12000000-0000-4000-8000-000000000001','personal');
insert into public.vehiculos(id,usuario_id,tipo,marca,modelo,anio) values ('12000000-0000-4000-8000-000000000002','12000000-0000-4000-8000-000000000001','sedan','Prueba','Prueba',2020);
insert into public.traslados(id,usuario_id,vehiculo_id,estado,tipo_pago,creado_en,cotizacion_expira_en,contacto_entrega_nombre,contacto_entrega_telefono,contacto_recepcion_nombre,contacto_recepcion_telefono,origen_direccion,origen_ciudad,destino_direccion,destino_ciudad,clave_idempotencia)
select ('12000000-0000-4000-8000-00000000000'||n)::uuid,'12000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','cotizacion_generada','anticipado',now()-interval '1 hour',now()-interval '30 minutes','Prueba','5555555555','Prueba','5555555555','Origen','CDMX','Destino','Toluca',gen_random_uuid()
from generate_series(3,5) n;
insert into public.pagos(traslado_id,monto,momento,metodo,estado,stripe_payment_intent_id) values
 ('12000000-0000-4000-8000-000000000003',100,'anticipado','stripe','completado','pi_fixture_f6_paid'),
 ('12000000-0000-4000-8000-000000000005',100,'anticipado','stripe','pendiente','pi_fixture_f6_pending');
set local role service_role;
do $$
declare resultado jsonb;
begin
  resultado := public.reconciliar_saga_traslados_individuales(50);
  if resultado <> '{"confirmados":1,"compensados":1,"errores":0}' then
    raise exception 'Primera ejecución: %', resultado;
  end if;
  resultado := public.reconciliar_saga_traslados_individuales(50);
  if resultado <> '{"confirmados":0,"compensados":0,"errores":0}' then
    raise exception 'Reintento: %', resultado;
  end if;
end $$;
select estado,id from public.traslados where usuario_id='12000000-0000-4000-8000-000000000001' order by id;
select evento,datos from public.registro_auditoria where datos->>'origen'='reconciliacion_individual';

rollback;
