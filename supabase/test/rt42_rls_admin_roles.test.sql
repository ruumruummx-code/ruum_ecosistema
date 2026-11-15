begin;

set local search_path = public, extensions;
select plan(40);

create temp table rt42_clientes (
  auth_id uuid, usuario_id uuid, vehiculo_id uuid, traslado_id uuid, pago_id uuid, checkout_id uuid
);
insert into rt42_clientes values
  ('42000000-0000-4000-8000-000000000001', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()),
  ('42000000-0000-4000-8000-000000000002', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid());

create temp table rt42_roles (auth_id uuid, rol public.rol_admin_operativo, usuarios bigint, traslados bigint, pagos bigint);
insert into rt42_roles values
  ('42000000-0000-4000-8000-000000000003', 'operador',   0, 2, 0),
  ('42000000-0000-4000-8000-000000000004', 'supervisor', 0, 2, 0),
  ('42000000-0000-4000-8000-000000000005', 'finanzas',   0, 2, 2),
  ('42000000-0000-4000-8000-000000000006', 'compliance', 2, 0, 0),
  ('42000000-0000-4000-8000-000000000007', 'direccion',  2, 2, 2);

insert into auth.users (id, email)
select auth_id, 'rt42-' || auth_id || '@example.test'
from (select auth_id from rt42_clientes union all select auth_id from rt42_roles) as identidades;

insert into public.admins (auth_user_id, nombre, rol_operativo)
select auth_id, 'RT42 ' || rol, rol from rt42_roles;

insert into public.usuarios (id, auth_user_id, tipo_cuenta)
select usuario_id, auth_id, 'personal' from rt42_clientes;

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select vehiculo_id, usuario_id, 'sedan', 'Prueba', 'Prueba', 2024 from rt42_clientes;

insert into public.traslados (
  id, usuario_id, vehiculo_id, clave_idempotencia, contacto_entrega_nombre,
  contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad
)
select traslado_id, usuario_id, vehiculo_id, gen_random_uuid(), 'Original RT42',
       '5500000001', 'RT42', '5500000002', 'Origen', 'CDMX', 'Destino', 'Toluca'
from rt42_clientes;

insert into public.checkout_traslados_masivos (
  id, auth_user_id, filas, cotizaciones, monto_centavos, idempotency_key, route_hash
)
select checkout_id, auth_id, '[{}]', '[{"tarifa":100}]', 10000,
       checkout_id::text, encode(extensions.digest(checkout_id::text, 'sha256'), 'hex')
from rt42_clientes;

insert into public.pagos (id, traslado_id, checkout_masivo_id, monto, momento, metodo)
select pago_id, traslado_id, checkout_id, 100, 'anticipado', 'stripe' from rt42_clientes;

-- Las funciones de prueba son SECURITY INVOKER. Las consultas se ejecutan bajo RLS.
grant select on rt42_clientes, rt42_roles to authenticated;

create function pg_temp.actuar_como(p_auth_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_auth_id, 'role', 'authenticated')::text, true);
end;
$$;

create function pg_temp.probar_cliente(p_auth_id uuid)
returns setof text language plpgsql as $$
declare
  destino record;
  esperado bigint;
  contexto text;
  afectadas bigint;
begin
  perform pg_temp.actuar_como(p_auth_id);
  for destino in select * from rt42_clientes order by auth_id loop
    esperado := (destino.auth_id = p_auth_id)::integer;
    contexto := format('cliente %s, destino %s', right(p_auth_id::text, 1), right(destino.auth_id::text, 1));
    return next is((select count(*) from public.usuarios where id = destino.usuario_id), esperado, contexto || ': usuarios');
    return next is((select count(*) from public.traslados where id = destino.traslado_id), esperado, contexto || ': traslados');
    return next is((select count(*) from public.pagos where id = destino.pago_id), esperado, contexto || ': pagos');
    return next is((select count(*) from public.checkout_traslados_masivos where id = destino.checkout_id), esperado, contexto || ': checkout');
    if esperado = 0 then
      update public.traslados set contacto_entrega_nombre = 'Escritura cruzada RT42'
      where id = destino.traslado_id;
      get diagnostics afectadas = row_count;
      return next is(afectadas, 0::bigint, contexto || ': escritura cruzada');
    end if;
  end loop;
end;
$$;

create function pg_temp.probar_admin(p_rol rt42_roles)
returns setof text language plpgsql as $$
begin
  perform pg_temp.actuar_como(p_rol.auth_id);
  return next is((select count(*) from public.usuarios where id in (select usuario_id from rt42_clientes)),
                 p_rol.usuarios, p_rol.rol || ': usuarios');
  return next is((select count(*) from public.traslados where id in (select traslado_id from rt42_clientes)),
                 p_rol.traslados, p_rol.rol || ': traslados');
  return next is((select count(*) from public.pagos where id in (select pago_id from rt42_clientes)),
                 p_rol.pagos, p_rol.rol || ': pagos');
  return next is((select count(*) from public.checkout_traslados_masivos where id in (select checkout_id from rt42_clientes)),
                 0::bigint, p_rol.rol || ': checkout reservado al propietario');
end;
$$;

create function pg_temp.verificar_traslado(p_auth_id uuid, p_traslado_id uuid)
returns text language plpgsql as $$
begin
  perform pg_temp.actuar_como(p_auth_id);
  return is((select contacto_entrega_nombre from public.traslados where id = p_traslado_id),
            'Original RT42', 'el propietario conserva su traslado tras la escritura cruzada');
end;
$$;

set local role authenticated;
select pg_temp.probar_cliente(auth_id) from rt42_clientes;
select pg_temp.verificar_traslado(auth_id, traslado_id) from rt42_clientes;
select pg_temp.probar_admin(r) from rt42_roles r;

select * from finish();
rollback;

