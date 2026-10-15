-- Targeted Advisor fixes; no relocation of application functions.
set lock_timeout = '5s';
set search_path = public, extensions, pg_catalog;
alter function public."trigger_recalcular_calificacion"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."recalcular_calificacion_conductor"(p_conductor_id uuid) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."validar_transicion_traslado"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."chat_disponible"(p_estado estado_traslado) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."bloquear_mutacion_auditoria"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."rango_desde_distancia"(p_km numeric) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."set_actualizado_en_tarifas"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."horario_desde_timestamp"(p_ts timestamp with time zone) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."dia_desde_timestamp"(p_ts timestamp with time zone) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."catalogar_vehiculo_para_tarifa"(p_marca text, p_modelo text) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."incidencia_aplicar_sla"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."sla_categoria_desde_tipo"(p_tipo text, p_vencido boolean) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."is_superadmin"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."generar_folio_operacion"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."mis_empresas_miembro"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."empresa_tiene_permiso"(p_empresa_id uuid, p_permiso text) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."empresa_invitar_miembro"(p_empresa_id uuid, p_usuario_id uuid, p_rol text) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."empresa_cambiar_rol_miembro"(p_miembro_id uuid, p_rol text) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."empresa_remover_miembro"(p_miembro_id uuid) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."traducir_estado_operativo"(e estado_traslado) set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."sincronizar_estado_operativo"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."vincular_operacion_masiva"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."sellar_evento_custodia"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."bloquear_mutacion_custodia"() set search_path = pg_catalog, public, extensions, pg_temp;
alter function public."sla_events_inmutable"() set search_path = pg_catalog, public, extensions, pg_temp;

-- JWT-only helper needs no owner privileges; route data through existing RLS.
alter function public.is_superadmin() security invoker;
alter function public.obtener_paradas_traslado(uuid) security invoker;
-- Scheduled exclusively as postgres; service role remains authorized.
revoke execute on function public."cancelar_traslados_impagos_vencidos"() from public, anon, authenticated;
grant execute on function public."cancelar_traslados_impagos_vencidos"() to service_role;
-- Scheduled exclusively as postgres; service role remains authorized.
revoke execute on function public."procesar_competencias_asignacion"() from public, anon, authenticated;
grant execute on function public."procesar_competencias_asignacion"() to service_role;
-- Billing requires a signed-in user; preserve the authenticated application flow.
revoke execute on function public.actualizar_datos_facturacion(text,text,text,text,text,text) from public, anon;
grant execute on function public.actualizar_datos_facturacion(text,text,text,text,text,text) to authenticated, service_role;
-- These tables already have no anon/authenticated grants; make server-only intent explicit.
create policy advisor_solo_servicio on public."claves_idempotencia" for all to service_role using (true) with check (true);
-- These tables already have no anon/authenticated grants; make server-only intent explicit.
create policy advisor_solo_servicio on public."documentos_identidad_storage_validados" for all to service_role using (true) with check (true);
-- These tables already have no anon/authenticated grants; make server-only intent explicit.
create policy advisor_solo_servicio on public."documentos_storage_validados" for all to service_role using (true) with check (true);
-- These tables already have no anon/authenticated grants; make server-only intent explicit.
create policy advisor_solo_servicio on public."edge_function_rate_limits" for all to service_role using (true) with check (true);

CREATE OR REPLACE FUNCTION public.catalogar_vehiculo_para_tarifa(p_marca text, p_modelo text)
 RETURNS TABLE(categoria_tarifa categoria_tarifa_vehiculo, gama gama_vehiculo)
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
$function$
;
alter extension unaccent set schema extensions;
alter extension btree_gist set schema extensions;
notify pgrst, 'reload schema';
