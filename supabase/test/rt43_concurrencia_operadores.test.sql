-- Los dos operadores usan conexiones independientes. El fixture se confirma
-- para que ambas sesiones lo vean, y se elimina al terminar.
create extension if not exists dblink with schema extensions;
set search_path = public, extensions;

begin;

insert into auth.users (id, email) values
  ('43000000-0000-4000-8000-000000000001', 'rt43-operador-a@example.test'),
  ('43000000-0000-4000-8000-000000000002', 'rt43-operador-b@example.test');

insert into public.admins (auth_user_id, nombre, rol_operativo)
select id, 'RT43 ' || email, 'supervisor'
from auth.users
where id in ('43000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000002');

insert into public.usuarios (id, tipo_cuenta)
values ('43000000-0000-4000-8000-000000000003', 'personal');

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio, version)
values ('43000000-0000-4000-8000-000000000004', '43000000-0000-4000-8000-000000000003',
        'sedan', 'Original RT43', 'Prueba', 2024, 1);

commit;

begin;
select plan(8);

do $$
begin
  -- La interfaz Docker usa SCRAM, que dblink exige para el rol postgres local.
  perform dblink_connect('rt43_b', format('host=%s port=%s dbname=%s user=postgres password=postgres',
                                        inet_server_addr(), inet_server_port(), current_database()));
  perform dblink_exec('rt43_b', 'set role authenticated');
  perform dblink_exec('rt43_b', 'set statement_timeout = ''15s''');
  perform dblink_exec('rt43_b', 'set request.jwt.claim.sub = ''43000000-0000-4000-8000-000000000002''');
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '43000000-0000-4000-8000-000000000001';

select is((select version from public.vehiculos where id = '43000000-0000-4000-8000-000000000004'),
          1::bigint, 'A parte de la version 1');
reset role;
select is((select version from dblink('rt43_b',
          $$select version from public.vehiculos where id = '43000000-0000-4000-8000-000000000004'$$) as r(version bigint)),
          1::bigint, 'B lee la misma version antes de escribir');

set local role authenticated;
set local request.jwt.claim.sub = '43000000-0000-4000-8000-000000000001';

select is(public.admin_actualizar_vehiculo('43000000-0000-4000-8000-000000000004', '{"marca":"Ganador Rt43"}', 1)->>'version',
          '2', 'A actualiza la version 1 y mantiene el bloqueo hasta confirmar');

reset role;

select is(dblink_send_query('rt43_b', $$
  select public.admin_actualizar_vehiculo('43000000-0000-4000-8000-000000000004', '{"marca":"Perdedor RT43"}', 1)
$$), 1, 'B intenta escribir la version 1 en otra sesion');

-- Esperar una confirmación observable del bloqueo evita depender de un sleep fijo.
create function pg_temp.rt43_esperar_bloqueo()
returns boolean language plpgsql as $$
declare
  limite timestamptz := clock_timestamp() + interval '5 seconds';
begin
  loop
    perform pg_stat_clear_snapshot();
    if exists (
      select 1 from pg_stat_activity
      where pg_backend_pid() = any(pg_blocking_pids(pid))
        and query like '%Perdedor RT43%'
    ) then
      return true;
    end if;
    if clock_timestamp() >= limite then
      return false;
    end if;
    perform pg_sleep(0.02);
  end loop;
end;
$$;

select ok(pg_temp.rt43_esperar_bloqueo(), 'B espera el bloqueo de fila de A');
commit;

begin;

select throws_ok(
  $$select * from dblink_get_result('rt43_b') as r(resultado jsonb)$$,
  '40001', 'CONCURRENCY_CONFLICT', 'B recibe el conflicto de version al confirmar A'
);
select results_eq(
  $$select marca, version from public.vehiculos where id = '43000000-0000-4000-8000-000000000004'$$,
  $$values ('Ganador Rt43'::text, 2::bigint)$$,
  'Solo persisten los datos de A y la version aumenta una vez'
);
select results_eq(
  $$select auth_user_id from public.auditoria_admin_seguridad
    where recurso = 'vehiculos' and accion = 'actualizar'
      and datos->>'vehiculo_id' = '43000000-0000-4000-8000-000000000004'$$,
  $$values ('43000000-0000-4000-8000-000000000001'::uuid)$$,
  'La auditoria registra solo la escritura ganadora'
);

do $$
begin
  perform dblink_disconnect('rt43_b');
end;
$$;

delete from public.auditoria_admin_seguridad
where auth_user_id in ('43000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000002')
  and recurso = 'vehiculos' and datos->>'vehiculo_id' = '43000000-0000-4000-8000-000000000004';
delete from public.vehiculos where id = '43000000-0000-4000-8000-000000000004';
delete from public.usuarios where id = '43000000-0000-4000-8000-000000000003';
delete from auth.users where id in ('43000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000002');

select * from finish();
commit;
