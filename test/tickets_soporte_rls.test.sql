begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('94800000-0000-4000-8000-000000000011','soporte-a@local.test','{}','{}'),
('94800000-0000-4000-8000-000000000012','soporte-b@local.test','{}','{}'),
('94800000-0000-4000-8000-000000000013','soporte-admin@local.test','{}','{}');
insert into public.usuarios(id,auth_user_id,tipo_cuenta,rol,estado_verificacion) values
('94800000-0000-4000-8000-000000000021','94800000-0000-4000-8000-000000000011','personal','personal','verificado'),
('94800000-0000-4000-8000-000000000022','94800000-0000-4000-8000-000000000012','personal','personal','verificado');
insert into public.admins(auth_user_id,nombre,rol_operativo) values ('94800000-0000-4000-8000-000000000013','Soporte prueba','direccion');
set local role authenticated;
select set_config('request.jwt.claim.sub','94800000-0000-4000-8000-000000000011',true);
select lives_ok($$insert into public.tickets_soporte(id,motivo,descripcion) values ('94800000-0000-4000-8000-000000000001','Consulta general','Necesito ayuda con mi cuenta')$$, 'Crea ticket sin traslado');
select is((select count(*) from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),1::bigint,'Lee su ticket');
select lives_ok($$insert into public.tickets_soporte(id,motivo,descripcion) values ('94800000-0000-4000-8000-000000000001','Consulta general','Necesito ayuda con mi cuenta') on conflict(id) do nothing$$,'Reintento no necesita UPDATE');
select is((select count(*) from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),1::bigint,'Reintento no duplica');
select throws_ok($$insert into public.tickets_soporte(auth_user_id,motivo,descripcion) values ('94800000-0000-4000-8000-000000000012','Consulta','Necesito ayuda con mi cuenta')$$,'42501',null,'No suplanta otro autor');
select throws_ok($$insert into public.tickets_soporte(estado,motivo,descripcion) values ('resuelto','Consulta','Necesito ayuda con mi cuenta')$$,'42501',null,'No crea tickets ya resueltos');
select throws_ok($$insert into public.tickets_soporte(motivo,descripcion) values ('Consulta','corta')$$,'23514',null,'Valida descripcion en BD');
select throws_ok($$insert into public.tickets_soporte(traslado_id,motivo,descripcion) values ('94800000-0000-4000-8000-000000000099','Consulta','Necesito ayuda con mi cuenta')$$,'42501',null,'No vincula traslado sin acceso');
select results_eq($$update public.tickets_soporte set estado='resuelto' where id='94800000-0000-4000-8000-000000000001' returning id$$,$$select null::uuid where false$$,'Usuario no resuelve su propio ticket');
select set_config('request.jwt.claim.sub','94800000-0000-4000-8000-000000000012',true);
select is((select count(*) from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),0::bigint,'Otra cuenta no lee el ticket');
select set_config('request.jwt.claim.sub','94800000-0000-4000-8000-000000000013',true);
select is((select count(*) from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),1::bigint,'Admin ve la bandeja');
select lives_ok($$update public.tickets_soporte set estado='resuelto' where id='94800000-0000-4000-8000-000000000001'$$,'Admin resuelve ticket');
select is((select resuelto_por from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),'94800000-0000-4000-8000-000000000013'::uuid,'Registra actor verificado');
select ok((select resuelto_en is not null from public.tickets_soporte where id='94800000-0000-4000-8000-000000000001'),'Registra fecha de resolucion');
set local role anon;
select throws_ok($$select * from public.tickets_soporte$$,'42501',null,'Anon no lee tickets');
reset role;
select ok(not has_table_privilege('authenticated','public.tickets_soporte','DELETE'),'No elimina evidencia del ticket');
select * from finish();
rollback;
