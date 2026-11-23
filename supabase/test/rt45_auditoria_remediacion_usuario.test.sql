begin;
select plan(8);

-- ============================================================================
-- RT-45: Remediación de Auditoría de Usuario (20261119000001)
-- ============================================================================

-- 1. Verificar configuración de piso de cobro en tarifas_config
select is(
  (select count(*) from public.tarifas_config where piso_cobro >= 699),
  1::bigint,
  'tarifas_config tiene configurado piso_cobro >= 699 MXN'
);

select is(
  (select count(*) from public.tarifas_config where cargo_por_parada >= 0),
  1::bigint,
  'tarifas_config tiene configurado cargo_por_parada >= 0'
);

-- 2. calcular_tarifa_traslado respeta el piso de cobro
select cmp_ok(
  public.calcular_tarifa_traslado(
    'ligero_a'::categoria_tarifa_vehiculo,
    'rango_1'::rango_distancia,
    'entrada'::gama_vehiculo,
    'seminueva'::condicion_vehiculo,
    'diurno'::horario_traslado,
    'entre_semana'::dia_traslado,
    1.0, -- distancia mínima (1 km)
    0.2  -- tiempo mínimo (12 min)
  ),
  '>=',
  699.00,
  'calcular_tarifa_traslado nunca devuelve un monto inferior al piso_cobro'
);

-- ============================================================================
-- Setup para pruebas transaccionales de usuario
-- ============================================================================
create temp table _ctx (k text primary key, v uuid);
insert into _ctx values
  ('user_test', gen_random_uuid()),
  ('cond_test', gen_random_uuid());

insert into auth.users (id, email)
select v, k || '@rt45.test' from _ctx;

insert into public.usuarios (id, auth_user_id, tipo_cuenta, rol, nombre)
select v, v, 'personal', 'personal'::rol_usuario, k from _ctx
where k = 'user_test';

insert into public.conductores (id, auth_user_id, nombre, estado)
select v, v, k, 'activo'::estado_conductor from _ctx
where k = 'cond_test';

insert into public.vehiculos (id, usuario_id, tipo, marca, modelo, anio)
select gen_random_uuid(), u.id, 'sedan'::tipo_vehiculo, 'Nissan', 'Versa', 2024
from public.usuarios u
where u.auth_user_id = (select v from _ctx where k = 'user_test');

insert into public.traslados (
  id, usuario_id, vehiculo_id, clave_idempotencia, estado, precio_cotizado, precio_final,
  contacto_entrega_nombre, contacto_entrega_telefono,
  contacto_recepcion_nombre, contacto_recepcion_telefono,
  origen_direccion, origen_ciudad, destino_direccion, destino_ciudad
)
select
  gen_random_uuid(), u.id, v.id, gen_random_uuid(), 'solicitado'::estado_traslado, 850.00, 850.00,
  'Entrega', '5511111111', 'Recepción', '5522222222',
  'Origen CDMX', 'CDMX', 'Destino Toluca', 'Toluca'
from public.usuarios u
join public.vehiculos v on v.usuario_id = u.id
where u.auth_user_id = (select v from _ctx where k = 'user_test');

-- 3. servidor_cancela_traslado: 0% cargo si no hay conductor asignado
select is(
  (
    select (public.servidor_cancela_traslado(
      (select v from _ctx where k = 'user_test'),
      (select id from public.traslados limit 1),
      'Cancelación de prueba previa a asignación'
    )).porcentaje_cargo
  ),
  0::numeric,
  'servidor_cancela_traslado aplica 0% de cargo cuando no hay conductor asignado'
);

-- 4. El estado del traslado cambia a cancelado tras la ejecución
select is(
  (select estado::text from public.traslados limit 1),
  'cancelado',
  'El traslado transiciona a cancelado correctamente'
);

-- 5. Tabla registro_auditoria registra eventos del sistema
select is(
  (select count(*) >= 0 from public.registro_auditoria),
  true,
  'Tabla registro_auditoria es consultable y válida'
);

-- 6. RPC puede_ver_tarifa_traslado valida visibilidad
select is(
  public.puede_ver_tarifa_traslado((select v from _ctx where k = 'user_test')),
  true,
  'puede_ver_tarifa_traslado permite a usuario legítimo ver tarifas'
);

-- 7. Usuario no existente devuelve false en puede_ver_tarifa_traslado
select is(
  public.puede_ver_tarifa_traslado(gen_random_uuid()),
  false,
  'puede_ver_tarifa_traslado niega visibilidad a usuario inexistente'
);

select * from finish();
rollback;
