# Auditoría RLS — 2026-11-18

Proyectos: producción `asmzetwwwugaoowiukdv`, staging `ytqhzrbmiczzwzzuzgbq`.

## Dictamen
**Cumple.** 124/124 tablas de `public` con RLS en producción y 124/124 en staging (100%). El Security Advisor no reporta `rls_disabled_in_public` ni `policy_exists_rls_disabled`.

## Security Advisor (296 hallazgos)
| Nivel | Regla | # | Dictamen |
|---|---|---|---|
| ERROR | security_definer_view | 1 | Riesgo aceptado (intencional, migración `20261016071319_conductores_publicos_definer_c2`): expone solo `id, estado, nivel_operativo_vigente, calificacion_promedio` de conductores activos; `anon` no tiene SELECT. Documentar excepción o migrar a función RPC. |
| WARN | anon_security_definer_function_executable | 94 | Revocar `EXECUTE` a `anon` (y a `PUBLIC`) en las que no deban llamarse sin sesión. Prioridad alta en las administrativas y de colas internas. |
| WARN | authenticated_security_definer_function_executable | 194 | Esperado para RPC de negocio; verificar que cada una valide rol/propiedad internamente (`es_admin()`, `auth.uid()`). Las de uso interno (colas, cron) deben quedar solo para `service_role`. |
| WARN | auth_leaked_password_protection | 1 | Activar en Auth → Providers → Email → “Leaked password protection” (requiere plan Pro). |
| INFO | rls_enabled_no_policy | 6 | Correcto para tablas solo-backend: RLS sin políticas = denegar todo a `anon`/`authenticated`; solo `service_role` accede. Sin acción. |

## Matriz RLS (producción; staging idéntico)
| # | Tabla | RLS prod | RLS staging | Políticas | Comandos | SELECT anon | SELECT auth |
|---|---|---|---|---|---|---|---|
| 1 | admin_capacidades | ON | ON | 1 | ALL | no | no |
| 2 | admins | ON | ON | 3 | ALL,SELECT | sí | sí |
| 3 | alertas_sla_historial | ON | ON | 1 | SELECT | sí | sí |
| 4 | alertas_sla_operacionales | ON | ON | 1 | SELECT | sí | sí |
| 5 | asignaciones | ON | ON | 3 | ALL,SELECT | sí | sí |
| 6 | auditoria_admin_seguridad | ON | ON | 2 | ALL,SELECT | no | sí |
| 7 | billetera_clientes_stripe | ON | ON | 0 | — | no | no |
| 8 | calificaciones_traslado | ON | ON | 3 | ALL,SELECT | sí | sí |
| 9 | capacitaciones_conductor | ON | ON | 2 | ALL,SELECT | sí | sí |
| 10 | cargas_traslados_masivos | ON | ON | 2 | ALL,SELECT | sí | sí |
| 11 | catalogo_vehiculos_tarifa | ON | ON | 2 | ALL,SELECT | sí | sí |
| 12 | certificacion_pago_conductor | ON | ON | 2 | ALL | sí | sí |
| 13 | certificaciones_operativas_conductor | ON | ON | 2 | ALL,SELECT | sí | sí |
| 14 | checkout_masivo_checkpoints | ON | ON | 0 | — | no | no |
| 15 | checkout_traslados_masivos | ON | ON | 2 | SELECT,UPDATE | sí | sí |
| 16 | claves_idempotencia | ON | ON | 2 | ALL | no | no |
| 17 | cola_limpieza_documentos | ON | ON | 0 | — | no | no |
| 18 | cola_limpieza_fotos_perfil | ON | ON | 0 | — | no | no |
| 19 | competencias_asignacion | ON | ON | 1 | SELECT | sí | sí |
| 20 | conductores | ON | ON | 4 | ALL,INSERT,SELECT | sí | sí |
| 21 | configuracion_admin | ON | ON | 1 | SELECT | sí | sí |
| 22 | configuracion_contactos_soporte | ON | ON | 2 | ALL,SELECT | sí | sí |
| 23 | confirmaciones_recepcion | ON | ON | 2 | INSERT,SELECT | sí | sí |
| 24 | consentimientos_usuario | ON | ON | 2 | SELECT | sí | sí |
| 25 | cotizaciones | ON | ON | 2 | ALL,SELECT | sí | sí |
| 26 | custodia_evento_fotos | ON | ON | 3 | ALL,INSERT,SELECT | sí | sí |
| 27 | custodia_eventos | ON | ON | 5 | ALL,INSERT,SELECT | sí | sí |
| 28 | datos_bancarios_conductor | ON | ON | 3 | ALL,SELECT | sí | sí |
| 29 | dispositivos_push | ON | ON | 1 | ALL | sí | sí |
| 30 | disputas | ON | ON | 4 | ALL | sí | sí |
| 31 | documento_conductor_transiciones | ON | ON | 1 | SELECT | sí | sí |
| 32 | documentos_conductor | ON | ON | 2 | ALL,SELECT | sí | sí |
| 33 | documentos_cuenta_usuario | ON | ON | 1 | SELECT | no | sí |
| 34 | documentos_identidad_storage_validados | ON | ON | 1 | ALL | no | no |
| 35 | documentos_identidad_usuario | ON | ON | 1 | SELECT | no | sí |
| 36 | documentos_storage_validados | ON | ON | 1 | ALL | no | no |
| 37 | edge_function_rate_limits | ON | ON | 1 | ALL | no | no |
| 38 | empresa_miembros | ON | ON | 2 | ALL,SELECT | sí | sí |
| 39 | empresa_rol_permisos | ON | ON | 2 | ALL,SELECT | sí | sí |
| 40 | empresa_roles | ON | ON | 2 | ALL,SELECT | sí | sí |
| 41 | empresa_sucursales | ON | ON | 5 | ALL,DELETE,INSERT,SELECT,UPDATE | sí | sí |
| 42 | empresas | ON | ON | 4 | ALL,SELECT | sí | sí |
| 43 | empresas_cambios_sensibles | ON | ON | 1 | SELECT | sí | sí |
| 44 | empresas_condiciones_comerciales_versiones | ON | ON | 1 | SELECT | sí | sí |
| 45 | empresas_datos_fiscales_versiones | ON | ON | 1 | SELECT | sí | sí |
| 46 | empresas_documentos | ON | ON | 1 | SELECT | sí | sí |
| 47 | estado_operativo_transiciones_validas | ON | ON | 1 | SELECT | sí | sí |
| 48 | estado_transiciones_validas | ON | ON | 1 | ALL | sí | sí |
| 49 | eventos_observabilidad | ON | ON | 1 | SELECT | no | no |
| 50 | eventos_operativos_app | ON | ON | 2 | INSERT,SELECT | sí | sí |
| 51 | eventos_registro_conductor | ON | ON | 1 | SELECT | no | sí |
| 52 | evidencia_conflictos | ON | ON | 2 | INSERT,SELECT | no | sí |
| 53 | evidencia_fotos | ON | ON | 4 | ALL,SELECT | sí | sí |
| 54 | evidencia_inspecciones | ON | ON | 4 | ALL,SELECT | sí | sí |
| 55 | expediente_conductor_transiciones | ON | ON | 1 | SELECT | sí | sí |
| 56 | exportaciones_admin | ON | ON | 1 | SELECT | sí | sí |
| 57 | feature_flags_app | ON | ON | 2 | ALL,SELECT | sí | sí |
| 58 | filas_carga_traslados_masivos | ON | ON | 2 | ALL,SELECT | sí | sí |
| 59 | gastos_traslado | ON | ON | 2 | ALL | sí | sí |
| 60 | historial_estados_documentos_cuenta | ON | ON | 1 | SELECT | no | sí |
| 61 | historial_estados_solicitud_conductor | ON | ON | 1 | SELECT | no | sí |
| 62 | historial_estados_traslado | ON | ON | 3 | ALL,SELECT | sí | sí |
| 63 | incidencia_evidencia_fotos | ON | ON | 3 | ALL,INSERT,SELECT | sí | sí |
| 64 | incidencia_historial | ON | ON | 2 | ALL,SELECT | sí | sí |
| 65 | incidencias | ON | ON | 5 | ALL,INSERT,SELECT | sí | sí |
| 66 | llamadas_enmascaradas | ON | ON | 4 | ALL,SELECT | sí | sí |
| 67 | mensajes_chat | ON | ON | 4 | ALL,SELECT | sí | sí |
| 68 | metas_registro_conductor | ON | ON | 1 | SELECT | sí | sí |
| 69 | modo_prueba_supervisada | ON | ON | 2 | ALL,SELECT | sí | sí |
| 70 | notas_internas_solicitud_conductor | ON | ON | 2 | INSERT,SELECT | no | sí |
| 71 | notas_internas_traslado | ON | ON | 2 | ALL | sí | sí |
| 72 | notificaciones_admin_operativas | ON | ON | 1 | SELECT | sí | sí |
| 73 | notificaciones_conductor | ON | ON | 2 | SELECT,UPDATE | sí | sí |
| 74 | notificaciones_push_entregas | ON | ON | 1 | SELECT | sí | sí |
| 75 | obs_edge_errors | ON | ON | 1 | SELECT | sí | sí |
| 76 | obs_retencion_politicas | ON | ON | 2 | ALL,SELECT | sí | sí |
| 77 | obs_rpc_latency | ON | ON | 1 | SELECT | sí | sí |
| 78 | operaciones | ON | ON | 4 | ALL,SELECT | sí | sí |
| 79 | pagos | ON | ON | 3 | ALL,SELECT | sí | sí |
| 80 | payout_traslados | ON | ON | 1 | SELECT | no | sí |
| 81 | payouts_conductor | ON | ON | 3 | ALL,SELECT | sí | sí |
| 82 | politicas_version_app | ON | ON | 2 | ALL,SELECT | sí | sí |
| 83 | preferencias_admin | ON | ON | 2 | ALL | sí | sí |
| 84 | preferencias_conductor | ON | ON | 3 | ALL | sí | sí |
| 85 | puntualidad_traslado | ON | ON | 1 | SELECT | sí | sí |
| 86 | reclamos_seguro | ON | ON | 3 | ALL,SELECT | sí | sí |
| 87 | registro_auditoria | ON | ON | 2 | INSERT,SELECT | sí | sí |
| 88 | registro_saga_auth | ON | ON | 0 | — | no | no |
| 89 | resoluciones_inventario_llaves | ON | ON | 1 | SELECT | no | sí |
| 90 | sat_regimenes_fiscales | ON | ON | 1 | SELECT | sí | sí |
| 91 | sat_usos_cfdi | ON | ON | 1 | SELECT | sí | sí |
| 92 | sesiones_proxy_traslado | ON | ON | 4 | ALL,SELECT | sí | sí |
| 93 | sla_empresa_politicas | ON | ON | 2 | ALL,SELECT | sí | sí |
| 94 | sla_evaluaciones | ON | ON | 2 | ALL,SELECT | sí | sí |
| 95 | sla_events | ON | ON | 2 | ALL,SELECT | sí | sí |
| 96 | sla_operacion_politicas | ON | ON | 2 | ALL,SELECT | sí | sí |
| 97 | sla_policies | ON | ON | 2 | ALL,SELECT | sí | sí |
| 98 | sla_reglas_operativas | ON | ON | 1 | SELECT | sí | sí |
| 99 | solicitudes_aprobacion_admin | ON | ON | 2 | ALL,SELECT | sí | sí |
| 100 | solicitudes_asignacion | ON | ON | 1 | SELECT | sí | sí |
| 101 | solicitudes_cambio_conductor | ON | ON | 3 | ALL,INSERT,SELECT | sí | sí |
| 102 | solicitudes_conductor | ON | ON | 4 | ALL,SELECT,UPDATE | sí | sí |
| 103 | solicitudes_factura | ON | ON | 1 | SELECT | no | sí |
| 104 | stripe_conciliacion_ejecuciones | ON | ON | 1 | SELECT | no | sí |
| 105 | stripe_verificaciones | ON | ON | 1 | SELECT | no | sí |
| 106 | tarifas_condicion | ON | ON | 2 | ALL | sí | sí |
| 107 | tarifas_config | ON | ON | 2 | ALL | sí | sí |
| 108 | tarifas_dia | ON | ON | 2 | ALL | sí | sí |
| 109 | tarifas_gama | ON | ON | 2 | ALL | sí | sí |
| 110 | tarifas_horario | ON | ON | 2 | ALL | sí | sí |
| 111 | tarifas_politica_versiones | ON | ON | 1 | ALL | sí | sí |
| 112 | tarifas_vehiculo | ON | ON | 2 | ALL | sí | sí |
| 113 | tickets_soporte | ON | ON | 3 | INSERT,SELECT,UPDATE | no | sí |
| 114 | totales_definitivos_traslado | ON | ON | 1 | SELECT | no | sí |
| 115 | tracking_salud_traslado | ON | ON | 2 | ALL,SELECT | sí | sí |
| 116 | tracking_sesiones | ON | ON | 2 | ALL,SELECT | sí | sí |
| 117 | traslado_paradas | ON | ON | 1 | SELECT | sí | sí |
| 118 | traslados | ON | ON | 8 | ALL,INSERT,SELECT,UPDATE | sí | sí |
| 119 | ubicaciones_traslado | ON | ON | 5 | ALL,INSERT,SELECT | sí | sí |
| 120 | usuarios | ON | ON | 7 | ALL,INSERT,SELECT,UPDATE | sí | sí |
| 121 | vehiculo_verificaciones_repuve | ON | ON | 4 | INSERT,SELECT | no | sí |
| 122 | vehiculos | ON | ON | 5 | ALL,SELECT | sí | sí |
| 123 | verificaciones_identidad_didit | ON | ON | 3 | SELECT | sí | sí |
| 124 | versiones_documento_consentimiento | ON | ON | 1 | SELECT | sí | sí |

## Vistas
| Vista | security_invoker | SELECT anon |
|---|---|---|
| conductores_publicos | false | no |
| obs_dashboard_diario | true | sí |
| obs_rpc_latencia_resumen | true | sí |
| obs_tracking_fallos | true | sí |
| pasaporte_digital | true | sí |
| sla_eventos_diario | true | sí |
| sla_torre_cola | true | sí |

## Funciones SECURITY DEFINER ejecutables por anon (91)
- abrir_disputa_traslado
- actualizar_datos_facturacion
- admin_dictaminar_auditoria_repuve ⚠️ admin/interna
- admin_override_verificacion_repuve ⚠️ admin/interna
- asignar_incidencia
- auditar_acceso_documento_pii
- auth_es_conductor_de_traslado
- auth_es_conductor_de_traslado_activo
- auth_es_usuario_de_traslado
- calcular_pago_conductor
- calcular_pago_conductor_traslado
- calcular_tarifa_traslado
- cancelar_asignacion
- conductor_acepta_viaje
- conductor_avanza_traslado
- conductor_confirmar_llegada_destino
- conductor_guarda_datos_bancarios
- conductor_id_actual
- conductor_operativamente_aprobado
- conductor_registra_verificacion_repuve
- conductor_reportar_incidencia_transaccional
- conductor_solicita_asignacion
- consumir_clave_idempotencia
- crear_incidencia_sistema_dano_no_reportado
- desactivar_dispositivo_push
- determinar_tipo_pago_usuario
- empresa_cambiar_rol_miembro
- empresa_id_del_titular_actual
- empresa_invitar_miembro
- empresa_remover_miembro
- empresa_tiene_permiso
- encolar_limpieza_documento
- encolar_limpieza_foto_perfil
- enviar_mensaje_chat
- es_admin ⚠️ admin/interna
- escalar_incidencia
- evaluar_salud_tracking
- expediente_conductor_tiene_datos
- finalizar_sesion_tracking
- guardar_preferencia_admin ⚠️ admin/interna
- listar_conductores_admin_paginados ⚠️ admin/interna
- listar_traslados_admin_paginados ⚠️ admin/interna
- listar_usuarios_admin_paginados ⚠️ admin/interna
- marcar_notificacion_leida
- metricas_registro_conductor_segmento
- mis_empresas_miembro
- notificar_torre_incidencia
- obs_registrar_auditoria
- obs_registrar_error_edge
- obs_registrar_latencia_rpc
- obs_registrar_log
- obs_resolver_correlation ⚠️ admin/interna
- obtener_metricas_registro_conductor_v2
- obtener_preferencia_admin ⚠️ admin/interna
- obtener_resumen_verificacion_repuve
- ofrecer_asignacion
- puede_ver_tarifa_traslado
- reasignar_conductor
- rechazar_asignacion
- reclamar_lote_limpieza_documentos ⚠️ admin/interna
- reclamar_lote_limpieza_fotos_perfil ⚠️ admin/interna
- reconciliar_usuarios_validacion_fiscal_sat ⚠️ admin/interna
- registrar_acceso_admin_denegado ⚠️ admin/interna
- registrar_apertura_push
- registrar_dispositivo_push
- registrar_estado_saga_auth
- registrar_evento_custodia
- registrar_evento_registro_conductor
- registrar_evento_registro_conductor_v2
- registrar_heartbeat_tracking
- registrar_permiso_admin_denegado ⚠️ admin/interna
- registrar_resultado_idempotente
- registrar_resultado_limpieza_documento
- registrar_resultado_limpieza_foto_perfil
- registrar_telemetria_lote
- resolver_incidencia
- sla_evaluar_traslados ⚠️ admin/interna
- sla_horas_operativas_desde
- sla_politica_efectiva
- solicitar_supresion_documentos_arco
- titular_es_dueno_de_empresa_de_usuario
- transicionar_estado_documento_cuenta
- traslado_tiene_metodo_pago_registrado
- traslado_tiene_verificacion_repuve_valida
- usuario_acepta_cotizacion
- usuario_actualiza_perfil_transaccional
- usuario_cancela_traslado
- usuario_crea_traslados_masivos
- usuario_id_actual
- usuario_ids_de_traslados_asignados_conductor
- usuario_procesa_carga_traslados_masivos
