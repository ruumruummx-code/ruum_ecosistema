-- Política 2026-10-29. Fixtures aislados: todo se revierte al finalizar.
create extension if not exists pgtap with schema extensions;
begin;
select plan(1);

insert into public.conductores(id, nombre)
values ('96900000-0000-4000-8000-000000000201', 'Conductor RT-69');

do $$
declare v record; actual text;
begin
  assert (select calificacion_promedio = 5 and nivel_operativo_vigente = 'coleccion'
    from public.conductores where id = '96900000-0000-4000-8000-000000000201'), 'Alta debe iniciar en 5.0 / Concer 4';
  for v in select * from (values
    (5.00, 'coleccion'), (4.90, 'coleccion'), (4.89, 'luxury'), (4.80, 'luxury'),
    (4.79, 'ejecutivo'), (4.50, 'ejecutivo'), (4.49, 'basico'), (4.00, 'basico'), (3.99, null)
  ) as rangos(promedio, nivel) loop
    update public.conductores set calificacion_promedio = v.promedio,
      nivel_por_experiencia = 'basico'
    where id = '96900000-0000-4000-8000-000000000201'
    returning nivel_operativo_vigente::text into actual;
    assert actual is not distinct from v.nivel, 'Nivel debe depender del promedio, sin tope de experiencia';
  end loop;
  assert not has_table_privilege('authenticated', 'public.conductores', 'UPDATE'), 'El usuario no puede modificar su reputación';
  assert not has_function_privilege('anon', 'public.trigger_recalcular_calificacion()', 'EXECUTE'), 'Trigger no expuesto a anon';
  assert not has_function_privilege('authenticated', 'public.trigger_recalcular_calificacion()', 'EXECUTE'), 'Trigger no expuesto como RPC';
end;
$$;

insert into auth.users(id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('96900000-0000-4000-8000-0000000000b1', 'rt69-usuario@local.test', now(), '{}', '{}', now(), now());
insert into public.usuarios(id, auth_user_id, tipo_cuenta, rol, estado_verificacion, metodo_pago_registrado)
values ('96900000-0000-4000-8000-000000000101', '96900000-0000-4000-8000-0000000000b1', 'personal', 'personal', 'verificado', true);
insert into public.vehiculos(id, usuario_id, tipo, marca, modelo, anio, placas, tiene_tarjeta_circulacion, tiene_verificacion, tiene_placas, puede_circular_rodando)
values ('96900000-0000-4000-8000-000000000301', '96900000-0000-4000-8000-000000000101', 'sedan', 'RT69', 'Modelo', 2026, 'RT69ABC', true, true, true, true);
insert into public.traslados(id, estado, usuario_id, vehiculo_id, conductor_id, contacto_entrega_nombre, contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono, origen_lat, origen_lng, origen_direccion, origen_ciudad, destino_lat, destino_lng, destino_direccion, destino_ciudad, tipo_pago, clave_idempotencia)
values ('96900000-0000-4000-8000-000000000401', 'servicio_cerrado', '96900000-0000-4000-8000-000000000101', '96900000-0000-4000-8000-000000000301', '96900000-0000-4000-8000-000000000201', 'E', '+525500000001', 'R', '+525500000002', 19.4, -99.1, 'O', 'CDMX', 19.5, -99.2, 'D', 'CDMX', 'al_cierre', gen_random_uuid());

-- Escritura real con el rol del usuario: el trigger debe vencer la falta de
-- UPDATE a conductores sin ampliar permisos del usuario.
set local role authenticated;
select set_config('request.jwt.claim.sub', '96900000-0000-4000-8000-0000000000b1', true);
insert into public.calificaciones_traslado(traslado_id, conductor_id, estrellas)
values ('96900000-0000-4000-8000-000000000401', '96900000-0000-4000-8000-000000000201', 4);
reset role;
do $$ begin
  assert (select calificacion_promedio = 4 and nivel_operativo_vigente = 'basico'
    from public.conductores where id = '96900000-0000-4000-8000-000000000201'), 'Primera calificación real sustituye 5.0';
end; $$;
set local role authenticated;
update public.calificaciones_traslado set estrellas = 5 where traslado_id = '96900000-0000-4000-8000-000000000401';
reset role;
do $$ begin
  assert (select calificacion_promedio = 5 and nivel_operativo_vigente = 'coleccion'
    from public.conductores where id = '96900000-0000-4000-8000-000000000201'), 'Actualizar calificación recalcula nivel';
end; $$;
delete from public.calificaciones_traslado where traslado_id = '96900000-0000-4000-8000-000000000401';
do $$ begin
  assert (select calificacion_promedio = 5 and nivel_operativo_vigente = 'coleccion'
    from public.conductores where id = '96900000-0000-4000-8000-000000000201'), 'Sin valoraciones se conserva máximo inicial';
end; $$;
select pass('RT-69: alta máxima, rangos, reputación por usuario y permisos verificados');
select * from finish();
rollback;
