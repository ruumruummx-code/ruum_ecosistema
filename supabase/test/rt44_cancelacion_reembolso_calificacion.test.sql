-- Auditoría App Usuario 2026-11-19: cancelación con reembolso, cobro tardío
-- sobre traslado cancelado, calificación por RPC y piso de tarifa.
set search_path = public, extensions;

begin;
select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('44000000-0000-4000-8000-000000000001', 'rt44-usuario@example.test', '{}'::jsonb),
  ('44000000-0000-4000-8000-000000000002', 'rt44-otro@example.test', '{}'::jsonb),
  ('44000000-0000-4000-8000-000000000009', 'rt44-conductor@example.test', '{}'::jsonb);

insert into public.usuarios (id, auth_user_id, tipo_cuenta) values
  ('44000000-0000-4000-8000-000000000011', '44000000-0000-4000-8000-000000000001', 'personal'),
  ('44000000-0000-4000-8000-000000000012', '44000000-0000-4000-8000-000000000002', 'personal');

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
values ('44000000-0000-4000-8000-000000000021', '44000000-0000-4000-8000-000000000011', 'sedan', 'Nissan', 'Versa', 2022);

-- T1: pagado (servicio_confirmado) sin conductor → reembolso 100 %.
-- T2: cotización aceptada con PaymentIntent pendiente → sin cargo y PI a cancelar.
-- T3: cerrado con conductor → calificación.
insert into public.traslados (id, usuario_id, vehiculo_id, estado, precio_cotizado, tipo_pago, origen_direccion, destino_direccion,
  contacto_entrega_nombre, contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono, origen_ciudad, destino_ciudad, clave_idempotencia)
values
  ('44000000-0000-4000-8000-000000000031', '44000000-0000-4000-8000-000000000011', '44000000-0000-4000-8000-000000000021', 'cotizacion_aceptada', 1000, 'anticipado', 'A', 'B', 'E', '5555555555', 'R', '5555555555', 'CDMX', 'CDMX', gen_random_uuid()),
  ('44000000-0000-4000-8000-000000000032', '44000000-0000-4000-8000-000000000011', '44000000-0000-4000-8000-000000000021', 'cotizacion_aceptada', 900, 'anticipado', 'A', 'B', 'E', '5555555555', 'R', '5555555555', 'CDMX', 'CDMX', gen_random_uuid());

insert into public.pagos (id, traslado_id, monto, momento, estado, metodo, stripe_payment_intent_id) values
  ('44000000-0000-4000-8000-000000000041', '44000000-0000-4000-8000-000000000031', 1000, 'anticipado', 'completado', 'tarjeta', 'pi_rt44pagado'),
  ('44000000-0000-4000-8000-000000000042', '44000000-0000-4000-8000-000000000032', 900, 'anticipado', 'pendiente', 'tarjeta', 'pi_rt44pendiente');
-- El pago completado habilita servicio_confirmado (trigger de pago anticipado).
update public.traslados set estado = 'servicio_confirmado' where id = '44000000-0000-4000-8000-000000000031';

-- Piso de cobro
select is(public.calcular_tarifa_traslado('ligero_a','rango_1','entrada','seminueva','diurno','entre_semana',1,0.1),
          699.00::numeric, 'La tarifa nunca queda por debajo del piso de cobro');

-- Usuario autenticado: ya no puede cancelar directo ni insertar calificaciones.
set local role authenticated;
set local request.jwt.claims = '{"sub":"44000000-0000-4000-8000-000000000001","role":"authenticated"}';

select throws_ok($$ select public.usuario_cancela_traslado('44000000-0000-4000-8000-000000000031'::uuid, 'x') $$,
                 '42501', null, 'La RPC directa de cancelación ya no es ejecutable por usuarios');

select is((public.usuario_previsualizar_cancelacion('44000000-0000-4000-8000-000000000031')->>'monto_reembolso')::numeric,
          1000::numeric, 'La previsualización anuncia reembolso total sin conductor');

select throws_ok($$ insert into public.calificaciones_traslado (traslado_id, conductor_id, estrellas)
                    values ('44000000-0000-4000-8000-000000000031', gen_random_uuid(), 5) $$,
                 '42501', null, 'El usuario no puede insertar calificaciones directamente');

reset role;
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';

-- Otro usuario no puede cancelar el traslado ajeno.
select throws_like($$ select public.servidor_cancela_traslado('44000000-0000-4000-8000-000000000002', '44000000-0000-4000-8000-000000000031', 'x') $$,
                   '%no pertenece%', 'Un usuario no cancela traslados ajenos');

select is((public.servidor_cancela_traslado('44000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000031', 'cambio de planes')->>'monto_reembolso')::numeric,
          1000::numeric, 'Cancelar un traslado pagado encola el reembolso del 100 % sin penalización');
select is((select count(*)::int from public.pagos where traslado_id = '44000000-0000-4000-8000-000000000031' and metodo = 'cargo_cancelacion'),
          0, 'No se crea un cargo de cancelación adicional si ya se cobró');
select is((select estado from public.reembolsos_traslado where pago_id = '44000000-0000-4000-8000-000000000041'),
          'pendiente', 'El reembolso queda pendiente para la Edge Function');

select is(public.servidor_cancela_traslado('44000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000032', 'x')->'payment_intents_pendientes',
          '["pi_rt44pendiente"]'::jsonb, 'Se devuelven los PaymentIntent pendientes para cancelarlos');

-- Cobro tardío sobre el traslado cancelado: no lo reactiva y encola el reembolso.
select is((public.aplicar_verificacion_pago_stripe(jsonb_build_object(
  'id','evt_rt44_tarde','origen','webhook','intent_id','pi_rt44pendiente','traslado_id','44000000-0000-4000-8000-000000000032',
  'estado_proveedor','succeeded','monto_centavos',90000,'monto_recibido',90000,'moneda','mxn','livemode',false,'modo_esperado',false))->>'reembolso_encolado')::boolean,
  true, 'Un cobro sobre traslado cancelado encola su reembolso');
select is((select estado::text from public.traslados where id = '44000000-0000-4000-8000-000000000032'),
          'servicio_cancelado', 'El cobro tardío no reactiva el traslado');

-- Reclamo y resultado de reembolsos.
select is((select count(*)::int from public.reclamar_reembolsos_traslado(10, '44000000-0000-4000-8000-000000000031')),
          1, 'El worker reclama el reembolso pendiente');
select lives_ok($$ select public.registrar_resultado_reembolso(
  (select id from public.reembolsos_traslado where pago_id = '44000000-0000-4000-8000-000000000041'), true, 're_rt44', null) $$,
  'Se registra el reembolso exitoso');

-- Reembolso parcial no conciliado → cola de revisión financiera.
select is((public.registrar_reembolso_parcial_stripe('evt_rt44_parcial', 'pi_rt44pagado', 'ch_rt44', 12345, 100000, false)->>'requiere_revision')::boolean,
          true, 'Un reembolso parcial que no coincide queda en revisión');
select is((select count(*)::int from public.revision_financiera_stripe where stripe_evento_id = 'evt_rt44_parcial'),
          1, 'Finanzas recibe el reembolso parcial en su cola');

reset role;

-- Calificación por RPC: el conductor sale del traslado, no del cliente.
update public.traslados set estado = 'servicio_cerrado', conductor_id = (select id from public.conductores limit 1)
 where id = '44000000-0000-4000-8000-000000000031' and exists (select 1 from public.conductores);

set local role authenticated;
set local request.jwt.claims = '{"sub":"44000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_like($$ select public.usuario_califica_traslado('44000000-0000-4000-8000-000000000031', 5, null) $$,
                   '%no encontrado%', 'Otro usuario no puede calificar el traslado');
reset role;

select ok(not has_table_privilege('anon', 'public.calificaciones_traslado', 'insert'),
          'anon no conserva INSERT sobre calificaciones');

select * from finish();
rollback;
