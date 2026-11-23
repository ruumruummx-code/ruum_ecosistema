-- F1.1 Lote 3: Helpers Internos, Triggers y RLS (RUUM-SEC-009)
-- Revoca EXECUTE de la API pública (anon, public y authenticated). Exclusivo motor interno / service_role.

do $$
declare
  r record;
  funciones text[] := array[
    'calcular_pago_conductor',
    'calcular_pago_conductor_traslado',
    'conductor_acepta_viaje',
    'conductor_operativamente_aprobado',
    'determinar_tipo_pago_usuario',
    'empresa_tiene_permiso',
    'expediente_conductor_tiene_datos',
    'listar_traslados_admin_paginados',
    'metricas_registro_conductor_segmento',
    'mis_empresas_miembro',
    'notificar_torre_incidencia',
    'obs_registrar_auditoria',
    'obs_registrar_error_edge',
    'obs_resolver_correlation',
    'usuario_ids_de_traslados_asignados_conductor'
  ];
begin
  for r in
    select p.oid::regprocedure as proc_name
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = any(funciones)
  loop
    execute format('revoke execute on function %s from public, anon, authenticated;', r.proc_name);
    execute format('grant execute on function %s to service_role;', r.proc_name);
  end loop;

  -- Helpers requeridos por políticas RLS evaluadas en contexto de usuario (authenticated):
  -- Revocar a anon y public (eliminando warning anon_security_definer_function_executable)
  -- y otorgar a authenticated y service_role para que RLS funcione.
  for r in
    select p.oid::regprocedure as proc_name
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname in (
        'auth_es_conductor_de_traslado',
        'auth_es_conductor_de_traslado_activo',
        'auth_es_usuario_de_traslado',
        'conductor_id_actual',
        'empresa_id_del_titular_actual',
        'titular_es_dueno_de_empresa_de_usuario',
        'usuario_id_actual'
      )
  loop
    execute format('revoke execute on function %s from public, anon;', r.proc_name);
    execute format('grant execute on function %s to authenticated;', r.proc_name);
    execute format('grant execute on function %s to service_role;', r.proc_name);
  end loop;
end $$;
