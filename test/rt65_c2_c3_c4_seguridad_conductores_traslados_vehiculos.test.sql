-- RT-65 — Pruebas de seguridad para Fix C2, C3 y C4:
-- C2: Vista conductores_publicos y aislamiento de tabla conductores para clientes.
-- C3: Trigger proteger_campos_traslado contra modificación de precio/ruta/titularidad.
-- C4: WITH CHECK en políticas de vehiculos, usuarios y traslados.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

-- C2.1: Verificar que la vista conductores_publicos existe
select has_view('public', 'conductores_publicos', 'RT-65.1: la vista conductores_publicos existe');

-- C2.2: Verificar que la política usuarios_ven_conductores_activos fue eliminada
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conductores'
      and policyname = 'usuarios_ven_conductores_activos'
  ),
  'RT-65.2: la política usuarios_ven_conductores_activos fue eliminada'
);

-- C3.1: Verificar que el trigger proteger_campos_traslado existe en public.traslados
select has_trigger('public', 'traslados', 'proteger_campos_traslado', 'RT-65.3: trigger proteger_campos_traslado existe en traslados');

-- C4.1: Verificar que la política usuario_administra_sus_vehiculos tiene with check
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehiculos'
      and policyname = 'usuario_administra_sus_vehiculos'
      and with_check is not null
  ),
  'RT-65.4: la política usuario_administra_sus_vehiculos define WITH CHECK'
);

-- C4.2: Verificar que usuario_actualiza_su_registro en public.usuarios tiene with check
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usuarios'
      and policyname = 'usuario_actualiza_su_registro'
      and with_check is not null
  ),
  'RT-65.5: la política usuario_actualiza_su_registro define WITH CHECK'
);

-- C4.3: Verificar que conductor_actualiza_sus_traslados_asignados en public.traslados tiene with check
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'traslados'
      and policyname = 'conductor_actualiza_sus_traslados_asignados'
      and with_check is not null
  ),
  'RT-65.6: la política conductor_actualiza_sus_traslados_asignados define WITH CHECK'
);

-- Datos de prueba para validaciones en tiempo de ejecución
create or replace function pg_temp.correr_pruebas_rt65() returns setof text as $$
declare
  v_auth_user1 uuid := '96500000-0000-4000-8000-000000000001';
  v_auth_user2 uuid := '96500000-0000-4000-8000-000000000002';
  v_auth_cond uuid := '96500000-0000-4000-8000-000000000003';
  v_usuario1_id uuid;
  v_usuario2_id uuid;
  v_conductor_id uuid;
  v_vehiculo1_id uuid;
  v_traslado_id uuid;
begin
  -- Crear usuarios en auth
  insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_auth_user1, 'user1@rt65.test', now(), '{}', '{}', now(), now()),
    (v_auth_user2, 'user2@rt65.test', now(), '{}', '{}', now(), now()),
    (v_auth_cond, 'conductor@rt65.test', now(), '{}', '{}', now(), now());

  -- Crear usuarios en public
  insert into public.usuarios (auth_user_id, tipo_cuenta, rol, estado_verificacion, metodo_pago_registrado)
  values (v_auth_user1, 'personal', 'personal', 'verificado', true)
  returning id into v_usuario1_id;

  insert into public.usuarios (auth_user_id, tipo_cuenta, rol, estado_verificacion, metodo_pago_registrado)
  values (v_auth_user2, 'personal', 'personal', 'verificado', true)
  returning id into v_usuario2_id;

  -- Crear conductor activo
  insert into public.conductores (auth_user_id, nombre, estado, telefono, curp)
  values (v_auth_cond, 'Conductor Activo RT65', 'activo', '+525599990001', 'CURP999999XXXX01')
  returning id into v_conductor_id;

  -- Crear vehiculo del usuario 1
  insert into public.vehiculos (usuario_id, tipo, marca, modelo, anio, placas)
  values (v_usuario1_id, 'sedan', 'Nissan', 'Versa', 2022, 'RT65-01')
  returning id into v_vehiculo1_id;

  -- Crear traslado con tipo_pago al_cierre para evitar el gate de anticipado
  insert into public.traslados (
    id, estado, usuario_id, vehiculo_id, conductor_id, clave_idempotencia,
    contacto_entrega_nombre, contacto_entrega_telefono,
    contacto_recepcion_nombre, contacto_recepcion_telefono,
    origen_lat, origen_lng, origen_direccion, origen_ciudad,
    destino_lat, destino_lng, destino_direccion, destino_ciudad,
    precio_cotizado, tipo_pago
  ) values (
    '96500000-0000-4000-8000-000000000101', 'cotizacion_aceptada', v_usuario1_id, v_vehiculo1_id, v_conductor_id, gen_random_uuid(),
    'A', '+520000000000', 'B', '+520000000001',
    19.0, -99.0, 'origen', 'CDMX', 19.5, -99.5, 'destino', 'CDMX',
    1500, 'al_cierre'
  ) returning id into v_traslado_id;

  -- 1. Probar C2 como usuario normal autenticado
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_auth_user1::text, true);

  -- No debe ver registros en public.conductores
  return query select is(
    (select count(*)::int from public.conductores),
    0,
    'RT-65.7: usuario cliente no ve filas en public.conductores'
  );

  -- Sí debe ver información pública en public.conductores_publicos
  return query select is(
    (select count(*)::int from public.conductores_publicos where id = v_conductor_id),
    1,
    'RT-65.8: usuario cliente ve información en conductores_publicos'
  );

  -- 2. Probar C4 (WITH CHECK en vehiculos)
  -- Intentar actualizar usuario_id de su vehículo al usuario 2 -> debe fallar por WITH CHECK
  return query select throws_like(
    format('update public.vehiculos set usuario_id = %L where id = %L', v_usuario2_id, v_vehiculo1_id),
    '%policy%',
    'RT-65.9: WITH CHECK impide asignar vehiculo a otro usuario_id'
  );

  -- Crear admin para probar bypass autorizado de Fix C3
  reset role;
  insert into public.admins (auth_user_id, nombre)
  values (v_auth_user2, 'Admin RT65');

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_auth_user2::text, true);

  -- Administrador sí puede modificar precio_cotizado
  return query select lives_ok(
    format('update public.traslados set precio_cotizado = 2000 where id = %L', v_traslado_id),
    'RT-65.10: administrador sí puede modificar precio en public.traslados (bypass autorizado)'
  );

  -- 3. Probar C3 (Trigger proteger_campos_traslado)
  -- Como conductor asignado
  perform set_config('request.jwt.claim.sub', v_auth_cond::text, true);

  -- Intentar modificar precio_cotizado -> debe lanzar la excepción protegida
  return query select throws_like(
    format('update public.traslados set precio_cotizado = 9999 where id = %L', v_traslado_id),
    '%Conductor no autorizado a modificar precio/ruta/titularidad.%',
    'RT-65.11: trigger rechaza modificación de precio por el conductor'
  );

  -- Intentar modificar origen_lat -> debe lanzar la excepción protegida
  return query select throws_like(
    format('update public.traslados set origen_lat = 20.0 where id = %L', v_traslado_id),
    '%Conductor no autorizado a modificar precio/ruta/titularidad.%',
    'RT-65.12: trigger rechaza modificación de ruta/origen por el conductor'
  );

  reset role;
end;
$$ language plpgsql;

select * from pg_temp.correr_pruebas_rt65();

select * from finish();

rollback;
