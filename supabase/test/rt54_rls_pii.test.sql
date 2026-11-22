begin;
select plan(14);

-- ============================================================================
-- Setup
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_a',     gen_random_uuid()),
  ('user_b',     gen_random_uuid()),
  ('cond_a',     gen_random_uuid()),
  ('admin_comp', gen_random_uuid()),
  ('admin_sup',  gen_random_uuid()),
  ('admin_fin',  gen_random_uuid()),
  ('superadmin', gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt54.test' from _ctx;

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k in ('user_a', 'user_b');

insert into public.conductores (id, auth_user_id, nombre, estado)
select v, v, k, 'activo'::estado_conductor from _ctx
where k = 'cond_a';

insert into public.admins (auth_user_id, nombre, rol_operativo)
select v, k,
  case k
    when 'admin_comp' then 'compliance'::rol_admin_operativo
    when 'admin_sup'  then 'supervisor'::rol_admin_operativo
    when 'admin_fin'  then 'finanzas'::rol_admin_operativo
  end
from _ctx where k like 'admin_%';

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select gen_random_uuid(), u.id, 'sedan'::tipo_vehiculo, 'Test', 'Model', 2024
from public.usuarios u
where u.auth_user_id = (select v from _ctx where k = 'user_a');

insert into public.traslados (id, usuario_id, vehiculo_id, conductor_id, clave_idempotencia,
  contacto_entrega_nombre, contacto_entrega_telefono,
  contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad)
select gen_random_uuid(), u.id, v.id, c.id, gen_random_uuid(),
  'Entrega', '5500000001', 'Recepción', '5500000002',
  'Origen', 'CDMX', 'Destino', 'Toluca'
from public.usuarios u
join public.vehiculos v on v.usuario_id = u.id
join public.conductores c on c.auth_user_id = (select v from _ctx where k = 'cond_a')
where u.auth_user_id = (select v from _ctx where k = 'user_a');

-- Mensaje de chat del user_a
insert into public.mensajes_chat (id, traslado_id, remitente, contenido)
select gen_random_uuid(), t.id, 'usuario'::remitente_chat, 'Hola, tengo una duda sobre la entrega'
from public.traslados t
where t.usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'));

-- Llamada enmascarada del user_a
insert into public.llamadas_enmascaradas (id, traslado_id, iniciada_por, numero_virtual)
select gen_random_uuid(), t.id, 'usuario'::remitente_chat, '+525500000000'
from public.traslados t
where t.usuario_id = (select id from public.usuarios where auth_user_id = (select v from _ctx where k = 'user_a'));

grant select on _ctx to authenticated;

create function pg_temp.actuar_como(p_auth_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', p_auth_id, 'role', 'authenticated')::text, true);
end;
$$;

create function pg_temp.actuar_como_superadmin(p_auth_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', p_auth_id, 'role', 'authenticated',
      'app_metadata', jsonb_build_object('role', 'superadmin'))::text, true);
end;
$$;

set local role authenticated;

-- ============================================================================
-- MENSAJES_CHAT (1-7)
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));
select is(
  (select count(*) from public.mensajes_chat),
  1::bigint, 'user_a ve su mensaje de chat');

with r as (
  update public.mensajes_chat set contenido = 'hackeado' returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a NO puede UPDATE mensajes_chat');

with r as (
  delete from public.mensajes_chat returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a NO puede DELETE mensajes_chat');

-- compliance NO tiene Traslados:leer
select pg_temp.actuar_como((select v from _ctx where k = 'admin_comp'));
select is(
  (select count(*) from public.mensajes_chat),
  0::bigint, 'compliance NO ve mensajes_chat (sin Traslados:leer)');

-- finanzas tiene Traslados:leer pero NO :gestionar
select pg_temp.actuar_como((select v from _ctx where k = 'admin_fin'));
select is(
  (select count(*) from public.mensajes_chat),
  1::bigint, 'finanzas ve mensajes_chat (Traslados:leer)');

with r as (
  update public.mensajes_chat set reportado = true returning 1
)
select is((select count(*) from r), 0::bigint, 'finanzas NO puede UPDATE mensajes_chat (sin :gestionar)');

-- supervisor puede moderar (reportado) pero NO alterar contenido
select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));
with r as (
  update public.mensajes_chat set reportado = true returning 1
)
select is((select count(*) from r), 1::bigint, 'supervisor SÍ marca reportado (Traslados:gestionar)');

-- ============================================================================
-- MENSAJES_CHAT — trigger protege contenido (8-9)
-- ============================================================================
do $$ begin
  begin
    update public.mensajes_chat set contenido = 'alterado', reportado = false;
    raise exception 'NO debió permitir a supervisor alterar contenido';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%No puedes modificar el contenido%' then
        raise;
      end if;
  end;
end $$;
select is(true, true, 'trigger bloquea alteración de contenido');

do $$ begin
  begin
    update public.mensajes_chat set traslado_id = gen_random_uuid();
    raise exception 'NO debió permitir a supervisor mover mensaje';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%No puedes mover un mensaje%' then
        raise;
      end if;
  end;
end $$;
select is(true, true, 'trigger bloquea mover mensaje a otro traslado');

-- ============================================================================
-- LLAMADAS_ENMASCARADAS (10-14)
-- ============================================================================
select pg_temp.actuar_como((select v from _ctx where k = 'user_a'));
select is(
  (select count(*) from public.llamadas_enmascaradas),
  1::bigint, 'user_a ve su llamada enmascarada');

with r as (
  update public.llamadas_enmascaradas set numero_virtual = '+525599999999' returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a NO puede UPDATE llamadas');

with r as (
  delete from public.llamadas_enmascaradas returning 1
)
select is((select count(*) from r), 0::bigint, 'user_a NO puede DELETE llamadas');

select pg_temp.actuar_como((select v from _ctx where k = 'admin_sup'));
select is(
  (select count(*) from public.llamadas_enmascaradas),
  1::bigint, 'supervisor ve llamadas (Traslados:gestionar)');

with r as (
  update public.llamadas_enmascaradas set finalizada_en = now() returning 1
)
select is((select count(*) from r), 0::bigint, 'supervisor NO puede UPDATE llamadas (solo service_role)');

select * from finish();
rollback;