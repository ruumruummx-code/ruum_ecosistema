begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(id,email) values ('92200000-0000-4000-8000-000000000001','rr22@test.local');
insert into public.usuarios(id,auth_user_id,tipo_cuenta,estado_verificacion) values ('92200000-0000-4000-8000-000000000002','92200000-0000-4000-8000-000000000001','personal','verificado');
insert into public.checkout_traslados_masivos(id,auth_user_id,filas,cotizaciones,monto_centavos,stripe_payment_intent_id) values (
'92200000-0000-4000-8000-000000000003','92200000-0000-4000-8000-000000000001',
'[{"vehiculo_marca":"Nissan","vehiculo_modelo":"Versa","vehiculo_anio":"2024","vehiculo_tipo":"sedan","vehiculo_placas":"RR2201","categoria_tarifa":"ligero_a","gama":"media","condicion":"seminueva","origen_direccion":"Origen","destino_direccion":"Destino","origen_ciudad":"CDMX","destino_ciudad":"CDMX","origen_lat":"19.43","origen_lng":"-99.13","destino_lat":"19.5","destino_lng":"-99.2"}, {"vehiculo_marca":"Nissan","vehiculo_modelo":"Versa","vehiculo_anio":"2024","vehiculo_tipo":"sedan","origen_lat":"19.43","origen_lng":"-99.13","destino_lat":"19.5","destino_lng":"-99.2","vehiculo_placas":"RR2202","categoria_tarifa":"ligero_a","gama":"media","condicion":"seminueva","origen_direccion":"Origen","destino_direccion":"Destino","origen_ciudad":"CDMX","destino_ciudad":"CDMX"}]',
'[{"tarifa":1234.56},{"tarifa":2345.67}]',358023,'pi_rr22');
select is((select count(*)::int from public.traslados where usuario_id='92200000-0000-4000-8000-000000000002'),0,'No se crean órdenes antes de pagar');
select throws_ok($$select public.confirmar_checkout_masivo('92200000-0000-4000-8000-000000000003','pi_rr22',1,'mxn')$$,'P0001','Pago masivo no coincide con la cotización','Rechaza monto alterado');
select throws_ok($$select public.confirmar_checkout_masivo('92200000-0000-4000-8000-000000000003','pi_otro',358023,'mxn')$$,'P0001','Pago masivo no coincide con la cotización','Rechaza otro PaymentIntent');
select public.confirmar_checkout_masivo('92200000-0000-4000-8000-000000000003','pi_rr22',358023,'mxn');
select public.confirmar_checkout_masivo('92200000-0000-4000-8000-000000000003','pi_rr22',358023,'mxn');
select is((select count(*)::int from public.traslados where usuario_id='92200000-0000-4000-8000-000000000002'),2,'El reintento no duplica los N traslados');
select is((select sum(precio_cotizado) from public.traslados where usuario_id='92200000-0000-4000-8000-000000000002'),3580.23::numeric,'Mantiene la suma al centavo');
select is((select count(*)::int from public.pagos where checkout_masivo_id='92200000-0000-4000-8000-000000000003' and estado='completado'),2,'Cada pasaporte tiene su pago trazable');
select is((select count(*)::int from public.traslados where usuario_id='92200000-0000-4000-8000-000000000002' and estado='servicio_confirmado'),2,'Libera todos los servicios tras pago confirmado');
select ok(not has_function_privilege('authenticated','public.confirmar_checkout_masivo(uuid,text,bigint,text)','EXECUTE'),'El usuario no puede confirmar pagos por RPC');
select * from finish();
rollback;

