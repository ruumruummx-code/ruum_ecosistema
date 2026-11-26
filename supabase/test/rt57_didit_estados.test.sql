set search_path = public, extensions;

begin;
select plan(7);

insert into auth.users (id, email)
values ('57000000-0000-4000-8000-000000000001', 'rt57-usuario@example.test');

insert into public.usuarios (id, auth_user_id, tipo_cuenta)
values ('57000000-0000-4000-8000-000000000011', '57000000-0000-4000-8000-000000000001', 'personal');

insert into public.verificaciones_identidad_didit (usuario_id, session_id, workflow_id, estado, procesado_en)
values
  ('57000000-0000-4000-8000-000000000011', 'rt57-vigente', 'flujo-rt57', 'pendiente', null),
  ('57000000-0000-4000-8000-000000000011', 'rt57-anterior', 'flujo-rt57', 'expirado', now());

set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';

select is(public.reconciliar_verificacion_didit_resultado('rt57-vigente', 'Approved')->>'resultado',
          'aprobado', 'La conciliación aprueba la sesión vigente');
select is(public.reconciliar_verificacion_didit_resultado('rt57-vigente', 'Declined')->>'ya_procesado',
          'true', 'Una decisión tardía no se aplica a una sesión procesada');
select is((select estado from public.verificaciones_identidad_didit where session_id = 'rt57-vigente'),
          'aprobado', 'La sesión conserva el estado aprobado');
select is(public.reconciliar_verificacion_didit_resultado('rt57-anterior', 'Approved')->>'ya_procesado',
          'true', 'Se descarta una aprobación de una sesión reemplazada');
select is((select estado from public.verificaciones_identidad_didit where session_id = 'rt57-anterior'),
          'expirado', 'La sesión reemplazada permanece expirada');
select is((select estado_verificacion::text from public.usuarios where id = '57000000-0000-4000-8000-000000000011'),
          'verificado', 'El estado del usuario conserva el resultado aplicado');
select is((select count(*) from public.registro_auditoria where datos->>'didit_session_id' in ('rt57-vigente', 'rt57-anterior')),
          1::bigint, 'Solo la decisión vigente genera un evento de auditoría');

select * from finish();
rollback;
