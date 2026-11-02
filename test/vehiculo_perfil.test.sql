begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('94900000-0000-4000-8000-000000000011','flota-a@local.test','{}','{}'),
('94900000-0000-4000-8000-000000000012','flota-b@local.test','{}','{}');
insert into public.usuarios(id,auth_user_id,tipo_cuenta,rol,estado_verificacion) values
('94900000-0000-4000-8000-000000000021','94900000-0000-4000-8000-000000000011','personal','personal','pendiente'),
('94900000-0000-4000-8000-000000000022','94900000-0000-4000-8000-000000000012','personal','personal','verificado');
set local role authenticated;
select set_config('request.jwt.claim.sub','94900000-0000-4000-8000-000000000011',true);
select is(public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000001','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"ABC-123","transmision":"automatica"}'),'94900000-0000-4000-8000-000000000001'::uuid,'Alta sin traslado');
select is((select usuario_id from public.vehiculos where id='94900000-0000-4000-8000-000000000001'),'94900000-0000-4000-8000-000000000021'::uuid,'Propietario derivado de Auth');
select is((select placas from public.vehiculos where id='94900000-0000-4000-8000-000000000001'),'ABC123','Normaliza placas');
select is((select count(*) from public.traslados where vehiculo_id='94900000-0000-4000-8000-000000000001'),0::bigint,'No crea traslado ni contratación');
select lives_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000001','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"ABC123","transmision":"automatica"}')$$,'Reintento idempotente');
select is((select count(*) from public.vehiculos where id='94900000-0000-4000-8000-000000000001'),1::bigint,'No duplica vehículo');
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000001','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Rojo","placas":"ABC123","transmision":"automatica"}')$$,'P0001',null,'No sobrescribe en reintento con otros datos');
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000002','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"ABC123","transmision":"automatica"}')$$,'P0001',null,'Detecta duplicado de identificador en la cuenta');
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000003','{"marca":"Nissan","modelo":"Versa","anio":1900,"tipo":"sedan","color":"Blanco","placas":"XYZ123","transmision":"automatica"}')$$,'P0001',null,'Valida año en servidor');
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000003','{"usuario_id":"94900000-0000-4000-8000-000000000022","marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"XYZ123","transmision":"automatica"}')$$,'P0001',null,'No acepta propietario del cliente');
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000003','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"","vin":"INVALIDO","transmision":"automatica"}')$$,'P0001',null,'Valida VIN');
select lives_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000004','{"marca":"Nissan","modelo":"Leaf","anio":2024,"tipo":"sedan","color":"Azul","placas":"","vin":"1HGCM82633A004352","transmision":"electrica"}')$$,'Registra eléctrico con VIN sin placas');
select ok((select transmision='electrica' and not tiene_placas and not tiene_verificacion and not tiene_tarjeta_circulacion from public.vehiculos where id='94900000-0000-4000-8000-000000000004'),'No inventa documentación ni placas');
select set_config('request.jwt.claim.sub','94900000-0000-4000-8000-000000000012',true);
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000001','{"marca":"Nissan","modelo":"Versa","anio":2024,"tipo":"sedan","color":"Blanco","placas":"ABC123","transmision":"automatica"}')$$,'42501',null,'No adopta un vehículo ajeno');
select is((select count(*) from public.vehiculos where id='94900000-0000-4000-8000-000000000001'),0::bigint,'Otra cuenta no ve el vehículo');
reset role;
select is((select count(*) from public.registro_auditoria where datos->>'vehiculo_id'='94900000-0000-4000-8000-000000000001' and datos->>'accion'='registro_desde_perfil'),1::bigint,'Auditoría única de alta');
set local role anon;
select throws_ok($$select public.usuario_registra_vehiculo('94900000-0000-4000-8000-000000000003','{}')$$,'42501',null,'Anon no puede registrar');
reset role;
select ok(not has_table_privilege('authenticated','public.vehiculos','INSERT'),'El INSERT directo sigue cerrado');
select * from finish();
rollback;
