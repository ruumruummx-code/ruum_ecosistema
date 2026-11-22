-- F1.1 Lote 1: Admin & Auditoría (RUUM-SEC-009)
-- Revoca EXECUTE a anon y public; garantiza service_role y authenticated para administradores.

do $$
declare
  r record;
  funciones text[] := array[
    'admin_dictaminar_auditoria_repuve',
    'admin_override_verificacion_repuve',
    'asignar_incidencia',
    'auditar_acceso_documento_pii',
    'cancelar_asignacion',
    'es_admin',
    'escalar_incidencia',
    'guardar_preferencia_admin',
    'listar_conductores_admin_paginados',
    'listar_usuarios_admin_paginados',
    'obtener_metricas_registro_conductor_v2',
    'obtener_preferencia_admin',
    'obtener_resumen_verificacion_repuve',
    'ofrecer_asignacion',
    'reasignar_conductor',
    'registrar_acceso_admin_denegado',
    'registrar_permiso_admin_denegado',
    'resolver_incidencia'
  ];
begin
  for r in
    select p.oid::regprocedure as proc_name
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = any(funciones)
  loop
    execute format('revoke execute on function %s from public, anon;', r.proc_name);
    execute format('grant execute on function %s to service_role;', r.proc_name);
    execute format('grant execute on function %s to authenticated;', r.proc_name);
  end loop;
end $$;
