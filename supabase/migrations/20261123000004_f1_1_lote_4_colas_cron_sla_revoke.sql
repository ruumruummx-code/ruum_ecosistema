-- F1.1 Lote 4: Colas, Cron, SLA e Idempotencia (RUUM-SEC-009)
-- Exclusivo service_role; revoca EXECUTE de public, anon y authenticated.

do $$
declare
  r record;
  funciones text[] := array[
    'consumir_clave_idempotencia',
    'crear_incidencia_sistema_dano_no_reportado',
    'desactivar_dispositivo_push',
    'encolar_limpieza_documento',
    'encolar_limpieza_foto_perfil',
    'reclamar_lote_limpieza_documentos',
    'reclamar_lote_limpieza_fotos_perfil',
    'reconciliar_usuarios_validacion_fiscal_sat',
    'registrar_estado_saga_auth',
    'registrar_resultado_idempotente',
    'registrar_resultado_limpieza_documento',
    'registrar_resultado_limpieza_foto_perfil',
    'sla_evaluar_traslados',
    'sla_horas_operativas_desde',
    'sla_politica_efectiva',
    'transicionar_estado_documento_cuenta'
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
end $$;
