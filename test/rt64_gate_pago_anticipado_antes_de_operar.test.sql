-- RT-64 — Gate "sin pago anticipado no procede" (F1):
-- un traslado con tipo_pago = 'anticipado' NO puede entrar a
-- servicio_confirmado ni a pendiente_de_conductor sin un pago con
-- estado = 'completado'. 'al_cierre' queda exento por diseño y las
-- salidas (p. ej. servicio_cancelado) nunca se bloquean.
--
-- Cómo correr:
--   supabase db reset
--   supabase test db supabase/test/rt64_gate_pago_anticipado_antes_de_operar.test.sql
--
-- pgTAP: corre dentro de una transacción con ROLLBACK final.

create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

create or replace function pg_temp.correr_rt64() returns setof text as $$
declare
  v_auth_user uuid := gen_random_uuid();
  v_usuario_id uuid;
  v_vehiculo_id uuid;
  v_t1 uuid := '96400000-0000-4000-8000-000000000301';
  v_t2 uuid := '96400000-0000-4000-8000-000000000302';
  v_t3 uuid := '96400000-0000-4000-8000-000000000303';
  v_t4 uuid := '96400000-0000-4000-8000-000000000304';
  v_ok boolean;
  v_msg text;
begin
  insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_auth_user, v_auth_user || '@rt64.test', now(), '{}', '{}', now(), now());

  insert into public.usuarios (auth_user_id, tipo_cuenta, rol, estado_verificacion, metodo_pago_registrado)
  values (v_auth_user, 'personal', 'personal', 'verificado', true)
  returning id into v_usuario_id;

  insert into public.vehiculos (usuario_id, tipo, marca, modelo, anio, placas)
  values (v_usuario_id, 'sedan', 'Nissan', 'Versa', 2022, 'RT64-001')
  returning id into v_vehiculo_id;

  -- T1/T2/T4: anticipados en cotizacion_aceptada. T3: al_cierre en cotizacion_generada.
  insert into public.traslados (
    id, estado, usuario_id, vehiculo_id, clave_idempotencia,
    contacto_entrega_nombre, contacto_entrega_telefono,
    contacto_recepcion_nombre, contacto_recepcion_telefono,
    origen_lat, origen_lng, origen_direccion, origen_ciudad,
    destino_lat, destino_lng, destino_direccion, destino_ciudad,
    precio_cotizado, tipo_pago
  ) values
    (v_t1, 'cotizacion_aceptada', v_usuario_id, v_vehiculo_id, gen_random_uuid(),
     'A', '+520000000000', 'B', '+520000000001',
     19.0, -99.0, 'origen', 'CDMX', 19.5, -99.5, 'destino', 'CDMX',
     1000, 'anticipado'),
    (v_t2, 'cotizacion_aceptada', v_usuario_id, v_vehiculo_id, gen_random_uuid(),
     'A', '+520000000000', 'B', '+520000000001',
     19.0, -99.0, 'origen', 'CDMX', 19.5, -99.5, 'destino', 'CDMX',
     1000, 'anticipado'),
    (v_t3, 'cotizacion_generada', v_usuario_id, v_vehiculo_id, gen_random_uuid(),
     'A', '+520000000000', 'B', '+520000000001',
     19.0, -99.0, 'origen', 'CDMX', 19.5, -99.5, 'destino', 'CDMX',
     1000, 'al_cierre'),
    (v_t4, 'cotizacion_aceptada', v_usuario_id, v_vehiculo_id, gen_random_uuid(),
     'A', '+520000000000', 'B', '+520000000001',
     19.0, -99.0, 'origen', 'CDMX', 19.5, -99.5, 'destino', 'CDMX',
     1000, 'anticipado');

  -- 1-2. Anticipado sin pago NO entra a servicio_confirmado, con mensaje de negocio.
  begin
    update public.traslados set estado = 'servicio_confirmado' where id = v_t1;
    v_ok := true; v_msg := null;
  exception when others then
    v_ok := false; v_msg := sqlerrm;
  end;
  return next ok(not v_ok, 'RT-64.1: anticipado sin pago no entra a servicio_confirmado');
  return next ok(
    v_msg ilike '%PAGO_ANTICIPADO_REQUERIDO%',
    'RT-64.2: el rechazo expone causa de negocio, no el error crudo del grafo'
  );

  -- 3. Con pago completado, la confirmación procede.
  insert into public.pagos (traslado_id, monto, momento, estado, metodo)
  values (v_t1, 1000, 'anticipado', 'completado', 'tarjeta');
  update public.traslados set estado = 'servicio_confirmado' where id = v_t1;
  return next is(
    (select estado::text from public.traslados where id = v_t1),
    'servicio_confirmado',
    'RT-64.3: anticipado con pago completado sí confirma'
  );

  -- 4. ...y avanza a pendiente_de_conductor.
  update public.traslados set estado = 'pendiente_de_conductor' where id = v_t1;
  return next is(
    (select estado::text from public.traslados where id = v_t1),
    'pendiente_de_conductor',
    'RT-64.4: anticipado pagado sí entra a operación'
  );

  -- 5-6. El gate de pendiente_de_conductor también frena sin pago: se coloca
  -- T2 en servicio_confirmado saltando solo el gate (fixture), y el avance
  -- a pendiente debe rechazarse hasta que exista el pago.
  alter table public.traslados disable trigger traslados_validar_transicion_pago;
  update public.traslados set estado = 'servicio_confirmado' where id = v_t2;
  alter table public.traslados enable trigger traslados_validar_transicion_pago;
  begin
    update public.traslados set estado = 'pendiente_de_conductor' where id = v_t2;
    v_ok := true; v_msg := null;
  exception when others then
    v_ok := false; v_msg := sqlerrm;
  end;
  return next ok(not v_ok, 'RT-64.5: anticipado sin pago no entra a pendiente_de_conductor');
  return next ok(
    v_msg ilike '%PAGO_ANTICIPADO_REQUERIDO%',
    'RT-64.6: el rechazo en pendiente también expone causa de negocio'
  );

  -- 7. Con pago, T2 también opera.
  insert into public.pagos (traslado_id, monto, momento, estado, metodo)
  values (v_t2, 1000, 'anticipado', 'completado', 'tarjeta');
  update public.traslados set estado = 'pendiente_de_conductor' where id = v_t2;
  return next is(
    (select estado::text from public.traslados where id = v_t2),
    'pendiente_de_conductor',
    'RT-64.7: pendiente_de_conductor procede con pago completado'
  );

  -- 8. al_cierre queda exento: confirma sin prepago (cobranza al cierre).
  update public.traslados set estado = 'servicio_confirmado' where id = v_t3;
  return next is(
    (select estado::text from public.traslados where id = v_t3),
    'servicio_confirmado',
    'RT-64.8: al_cierre confirma sin prepago (exención por diseño)'
  );

  -- 9. El gate no sobre-bloquea salidas: cancelar un anticipado impago procede.
  update public.traslados set estado = 'servicio_cancelado' where id = v_t4;
  return next is(
    (select estado::text from public.traslados where id = v_t4),
    'servicio_cancelado',
    'RT-64.9: la cancelación nunca queda bloqueada por el gate de pago'
  );
end;
$$ language plpgsql;

select * from pg_temp.correr_rt64();

select * from finish();

rollback;
