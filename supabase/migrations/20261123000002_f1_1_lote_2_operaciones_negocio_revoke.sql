-- F1.1 Lote 2: Operaciones de Negocio / Clientes (RUUM-SEC-009)
-- Revoca EXECUTE a anon y public; mantiene authenticated y service_role.

do $$
declare
  r record;
  funciones text[] := array[
    'abrir_disputa_traslado',
    'actualizar_datos_facturacion',
    'calcular_tarifa_traslado',
    'conductor_avanza_traslado',
    'conductor_confirmar_llegada_destino',
    'conductor_guarda_datos_bancarios',
    'conductor_registra_verificacion_repuve',
    'conductor_reportar_incidencia_transaccional',
    'conductor_solicita_asignacion',
    'empresa_cambiar_rol_miembro',
    'empresa_invitar_miembro',
    'empresa_remover_miembro',
    'enviar_mensaje_chat',
    'evaluar_salud_tracking',
    'finalizar_sesion_tracking',
    'marcar_notificacion_leida',
    'obs_registrar_latencia_rpc',
    'obs_registrar_log',
    'puede_ver_tarifa_traslado',
    'rechazar_asignacion',
    'registrar_apertura_push',
    'registrar_dispositivo_push',
    'registrar_evento_custodia',
    'registrar_evento_registro_conductor',
    'registrar_evento_registro_conductor_v2',
    'registrar_heartbeat_tracking',
    'registrar_telemetria_lote',
    'solicitar_supresion_documentos_arco',
    'traslado_tiene_metodo_pago_registrado',
    'traslado_tiene_verificacion_repuve_valida',
    'usuario_acepta_cotizacion',
    'usuario_actualiza_perfil_transaccional',
    'usuario_cancela_traslado',
    'usuario_crea_traslados_masivos',
    'usuario_procesa_carga_traslados_masivos'
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
    execute format('grant execute on function %s to authenticated;', r.proc_name);
    execute format('grant execute on function %s to service_role;', r.proc_name);
  end loop;
end $$;
