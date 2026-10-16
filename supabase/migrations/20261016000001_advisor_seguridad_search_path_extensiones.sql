-- Advisor seguridad: search_path + extensiones + definer mínimo.
-- Origen: supabase/advisor-proposals/seguridad-y-permisos.sql (propuesta, no aplicada).
-- Idempotente y segura para re-ejecutar con `supabase db push`.

set lock_timeout = '5s';

-- 1) search_path fijo en las funciones señaladas por Advisor (todas las sobrecargas).
do $$
declare
  r record;
  v_nombres text[] := array[
    'trigger_recalcular_calificacion',
    'recalcular_calificacion_conductor',
    'validar_transicion_traslado',
    'chat_disponible',
    'bloquear_mutacion_auditoria',
    'rango_desde_distancia',
    'set_actualizado_en_tarifas',
    'horario_desde_timestamp',
    'dia_desde_timestamp',
    'catalogar_vehiculo_para_tarifa',
    'incidencia_aplicar_sla',
    'sla_categoria_desde_tipo',
    'is_superadmin',
    'generar_folio_operacion',
    'mis_empresas_miembro',
    'empresa_tiene_permiso',
    'empresa_invitar_miembro',
    'empresa_cambiar_rol_miembro',
    'empresa_remover_miembro',
    'traducir_estado_operativo',
    'sincronizar_estado_operativo',
    'vincular_operacion_masiva',
    'sellar_evento_custodia',
    'bloquear_mutacion_custodia',
    'sla_events_inmutable'
  ];
begin
  for r in
    select p.oid::regprocedure as ident
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (v_nombres)
  loop
    execute format('alter function %s set search_path = pg_catalog, public, extensions, pg_temp', r.ident);
  end loop;
end;
$$;

-- 2) Mover extensiones fuera de public (Advisor: extension_in_public).
-- Orden: crear esquema -> mover -> recalificar uso de unaccent.
create schema if not exists extensions;

do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
  from pg_extension e join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'unaccent';
  if v_schema = 'public' then
    execute 'alter extension unaccent set schema extensions';
  end if;

  select n.nspname into v_schema
  from pg_extension e join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'btree_gist';
  if v_schema = 'public' then
    execute 'alter extension btree_gist set schema extensions';
  end if;
end;
$$;

-- Recalificar catálogo para que funcione con search_path fijo y con
-- la extensión ya en `extensions` (antes public.unaccent / unaccent sin calificar).
CREATE OR REPLACE FUNCTION public.catalogar_vehiculo_para_tarifa(p_marca text, p_modelo text)
RETURNS TABLE(categoria_tarifa public.categoria_tarifa_vehiculo, gama public.gama_vehiculo)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public, extensions, pg_temp
AS $function$
  with combinaciones as (
    select distinct c.categoria_tarifa, c.gama
    from public.catalogo_vehiculos_tarifa c
    where lower(extensions.unaccent(c.marca)) = lower(extensions.unaccent(p_marca))
      and lower(extensions.unaccent(c.modelo)) = lower(extensions.unaccent(p_modelo))
  )
  select combinaciones.categoria_tarifa, combinaciones.gama
  from combinaciones
  where (select count(*) from combinaciones) = 1;
$function$;

-- 3) Superficie SECURITY DEFINER mínima: estos helpers no necesitan privilegios
-- del dueño (solo leen JWT / RLS).
alter function public.is_superadmin() security invoker;
alter function public.obtener_paradas_traslado(uuid) security invoker;

-- 4) Recortes de EXECUTE (Advisor 0028/0029): solo lo que no rompe flujos.
-- 4a) Tareas cron: solo postgres/service_role.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as ident from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'cancelar_traslados_impagos_vencidos',
      'procesar_competencias_asignacion'
    )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.ident);
    execute format('grant execute on function %s to service_role', r.ident);
  end loop;
end;
$$;

-- 4b) Facturación requiere usuario firmado.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as ident from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'actualizar_datos_facturacion'
  loop
    execute format('revoke execute on function %s from public, anon', r.ident);
    execute format('grant execute on function %s to authenticated, service_role', r.ident);
  end loop;
end;
$$;

-- 4c) Funciones admin_*: quitar anon, conservar authenticated (el check
-- es_admin()/permiso sigue dentro de cada función).
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as ident from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', r.ident);
    execute format('grant execute on function %s to authenticated, service_role', r.ident);
  end loop;
end;
$$;

-- 4d) Funciones solo-trigger (RETURNS trigger): nunca deben ser RPC.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as ident from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.ident);
    execute format('grant execute on function %s to service_role', r.ident);
  end loop;
end;
$$;

-- 5) Intención server-only explícita (tablas ya sin grants a anon/authenticated).
do $$ begin
  if to_regclass('public.claves_idempotencia') is not null then
    drop policy if exists advisor_solo_servicio on public.claves_idempotencia;
    create policy advisor_solo_servicio on public.claves_idempotencia
      for all to service_role using (true) with check (true);
  end if;
  if to_regclass('public.documentos_identidad_storage_validados') is not null then
    drop policy if exists advisor_solo_servicio on public.documentos_identidad_storage_validados;
    create policy advisor_solo_servicio on public.documentos_identidad_storage_validados
      for all to service_role using (true) with check (true);
  end if;
  if to_regclass('public.documentos_storage_validados') is not null then
    drop policy if exists advisor_solo_servicio on public.documentos_storage_validados;
    create policy advisor_solo_servicio on public.documentos_storage_validados
      for all to service_role using (true) with check (true);
  end if;
  if to_regclass('public.edge_function_rate_limits') is not null then
    drop policy if exists advisor_solo_servicio on public.edge_function_rate_limits;
    create policy advisor_solo_servicio on public.edge_function_rate_limits
      for all to service_role using (true) with check (true);
  end if;
end $$;

notify pgrst, 'reload schema';
