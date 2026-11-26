# Inventario SECURITY DEFINER de la Fase 1

Se reconstruyó Supabase local desde las migraciones y se consultaron los catálogos de Postgres 17. El inventario registra 273 funciones en `public` y 31 en `private`, con sus sobrecargas. Las columnas de roles indican el permiso `EXECUTE` de la función. También se requiere `USAGE` del esquema para invocarla.

| Estado del catálogo | Funciones | Sin `search_path` fijo | Con `EXECUTE` para `PUBLIC` |
| --- | ---: | ---: | ---: |
| Antes de la migración de esta fase | 304 | 0 | 8 |
| Después de la migración de esta fase | 304 | 0 | 0 |

La [migración de la Fase 1](../migrations/20261126072854_fase1_endurecer_security_definer.sql) revoca `EXECUTE` de `PUBLIC`, `anon` y `authenticated` en las ocho funciones `proteger_columnas_sensibles_*`. La [prueba de catálogo](../test/rt56_security_definer.test.sql) verifica los permisos y las rutas de búsqueda del esquema migrado.

`pnpm check:supabase-security` valida las nuevas declaraciones de funciones. Las siete definiciones históricas sin ruta explícita se identifican por archivo y nombre. Las migraciones `20260708000044_fix_search_path_security_definer.sql` y `20261016000001_advisor_seguridad_search_path_extensiones.sql` fijaron sus rutas de búsqueda.

## Funciones y permisos después de la migración

| Firma | `search_path` | `PUBLIC` | `anon` | `authenticated` | `service_role` |
| --- | --- | --- | --- | --- | --- |
| `private.abrir_competencia_asignacion(p_traslado_id uuid)` | `""` | No | No | No | No |
| `private.abrir_tracking_al_iniciar()` | `public, pg_temp` | No | No | No | No |
| `private.actualizar_historial_por_incidencia()` | `public, pg_temp` | No | No | No | No |
| `private.actualizar_historial_por_traslado()` | `public, pg_temp` | No | No | No | No |
| `private.actualizar_salud_desde_punto()` | `public, pg_temp` | No | No | No | No |
| `private.admin_resuelve_disputa(p_disputa_id uuid, p_estado public.estado_disputa, p_resolucion public.resolucion_disputa, p_detalle text)` | `public` | No | No | No | Sí |
| `private.confirmar_puntualidad_vencida()` | `""` | No | No | No | No |
| `private.congelar_total_definitivo()` | `public, pg_temp` | No | No | No | No |
| `private.encolar_reconciliacion_usuario(p_tipo text)` | `""` | No | No | No | No |
| `private.estadisticas_equidad_conductor(p_conductor_id uuid)` | `""` | No | No | No | No |
| `private.evaluar_elegibilidad_asignacion(p_traslado_id uuid, p_conductor_id uuid)` | `""` | No | No | No | No |
| `private.exigir_tracking_abierto(p_traslado_id uuid)` | `""` | No | No | No | No |
| `private.proteger_generales_traslado_iniciado()` | `public, pg_temp` | No | No | No | No |
| `private.proteger_inventario_llaves()` | `public, pg_temp` | No | No | No | No |
| `private.proteger_tracking_terminal()` | `""` | No | No | No | No |
| `private.proteger_vehiculo_operacion()` | `public, pg_temp` | No | No | No | No |
| `private.recalcular_historial(p_conductor uuid, p_usuario uuid)` | `public, pg_temp` | No | No | No | No |
| `private.registrar_puntualidad_desde_auditoria()` | `""` | No | No | No | No |
| `private.resolver_competencia_asignacion(p_competencia_id uuid)` | `""` | No | No | No | No |
| `private.resolver_disputa_puntualidad()` | `""` | No | No | No | No |
| `private.resumen_puntualidad_conductor(p_conductor_id uuid)` | `""` | No | No | No | No |
| `private.sincronizar_resumen_disputa()` | `""` | No | No | No | No |
| `private.trigger_abrir_competencia_asignacion()` | `""` | No | No | No | No |
| `private.validar_fotos_antes_de_cerrar()` | `public, pg_temp` | No | No | No | No |
| `private.validar_llaves_entrega()` | `public, pg_temp` | No | No | No | No |
| `private.validar_ocupacion_conductor()` | `public, pg_temp` | No | No | No | No |
| `private.validar_resolucion_disputa()` | `""` | No | No | No | No |
| `private.validar_resumen_disputa()` | `""` | No | No | No | No |
| `private.validar_solicitud_abierta()` | `public, pg_temp` | No | No | No | No |
| `private.vincular_disputa_puntualidad()` | `""` | No | No | No | No |
| `private.vincular_ganador_asignacion()` | `public, pg_temp` | No | No | No | No |
| `public.abrir_disputa_traslado(p_traslado_id uuid, p_abierta_por public.abierta_por_actor, p_tipo public.tipo_disputa, p_descripcion text)` | `public` | No | No | Sí | Sí |
| `public.abrir_disputa_traslado(p_traslado_id uuid, p_abierta_por public.abierta_por_actor, p_tipo public.tipo_disputa, p_descripcion text, p_mantener_estado boolean)` | `public` | No | No | Sí | Sí |
| `public.aceptar_asignacion(p_asignacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.actualizar_datos_facturacion(p_rfc text, p_razon_social text, p_regimen_fiscal text, p_codigo_postal_fiscal text, p_uso_cfdi text, p_correo_facturacion text, p_estado_validacion_fiscal text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_accion_masiva(p_accion text, p_traslado_ids uuid[], p_payload jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actual_id()` | `public` | No | No | Sí | Sí |
| `public.admin_actualiza_alerta_sla(p_alerta_id uuid, p_accion text, p_responsable text, p_comentario text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualiza_conductor_documentos(p_conductor_id uuid, p_aprobado boolean)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualiza_empresa_corporativa(p_empresa_id uuid, p_datos jsonb, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualiza_reclamo_seguro(p_reclamo_id uuid, p_estado public.estado_reclamo_seguro, p_responsable_pago text, p_notas_admin text)` | `public` | No | No | Sí | Sí |
| `public.admin_actualiza_reclamo_seguro(p_reclamo_id uuid, p_estado public.estado_reclamo_seguro, p_responsable_pago text, p_notas_admin text, p_mantener_estado boolean)` | `public` | No | No | Sí | Sí |
| `public.admin_actualiza_usuario_verificacion(p_usuario_id uuid, p_estado public.estado_verificacion, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualizar_conductor_atomic(p_conductor_id uuid, p_datos jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualizar_configuracion(p_clave text, p_valor jsonb, p_motivo text, p_version_esperada integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualizar_estado_traslado_con_version(p_traslado_id uuid, p_estado public.estado_traslado, p_version_esperada bigint)` | `public` | No | No | Sí | Sí |
| `public.admin_actualizar_politica_tarifaria_normativa(p_aprobacion_id uuid, p_payload jsonb)` | `public` | No | No | Sí | Sí |
| `public.admin_actualizar_rol_colaborador(p_admin_id uuid, p_rol public.rol_admin_operativo, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualizar_usuario_atomic(p_usuario_id uuid, p_datos jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_actualizar_vehiculo(p_vehiculo_id uuid, p_datos jsonb, p_version_esperada bigint)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_ajustar_precio_final(p_aprobacion_id uuid, p_traslado_id uuid, p_precio_final numeric)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_aplica_tarifa_normativa(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.admin_asigna_conductor(p_traslado_id uuid, p_conductor_id uuid)` | `""` | No | No | Sí | Sí |
| `public.admin_cambia_estado_empresa(p_empresa_id uuid, p_estado_operativo text, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_cambiar_estado_traslado(p_traslado_id uuid, p_nuevo_estado text, p_version_esperada bigint, p_aprobacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_cancela_carga_traslados_masivos(p_carga_id uuid, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_completar_exportacion(p_id uuid, p_filas integer, p_hash text, p_error text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_conceder_capacidad(p_admin_id uuid, p_capacidad text, p_concedida boolean, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_crea_carga_masiva_operacion(p_operacion_id uuid, p_empresa_id uuid, p_usuario_id uuid, p_nombre_archivo text, p_filas jsonb, p_hash_archivo text, p_tamano_bytes bigint, p_mime_type text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_crea_empresa_corporativa(p_empresa jsonb, p_titular jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_crea_traslados_masivos(p_empresa_id uuid, p_usuario_id uuid, p_nombre_archivo text, p_filas jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_crea_traslados_masivos(p_empresa_id uuid, p_usuario_id uuid, p_nombre_archivo text, p_filas jsonb, p_hash_archivo text, p_tamano_bytes bigint, p_mime_type text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_decidir_aprobacion(p_solicitud_id uuid, p_aprobar boolean, p_motivo text, p_version_esperada bigint)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_dictaminar_auditoria_repuve(p_verificacion_id uuid, p_dictamen text, p_notas text)` | `public` | No | No | Sí | Sí |
| `public.admin_ejecutar_aprobacion(p_aprobacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_ejecutar_pago(p_aprobacion_id uuid, p_traslado_id uuid, p_monto numeric)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_emite_cotizacion(p_traslado_id uuid, p_precio numeric)` | `public` | No | No | Sí | Sí |
| `public.admin_exportar_evidencia_firmada(p_traslado_ids uuid[])` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_finanzas_operacion(p_operacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_finanzas_traslado(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_generar_payouts_periodo(p_periodo_inicio date, p_periodo_fin date)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_guarda_documento_empresa(p_empresa_id uuid, p_documento jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_guarda_usuario_empresa(p_empresa_id uuid, p_usuario jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_invitar_usuario(p_correo text, p_nombre text, p_tipo_cuenta text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_listar_capacidades(p_admin_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_listar_capacidades_catalogo()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_listar_configuracion()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_listar_solicitudes_conductor_paginadas(p_pagina integer, p_tamano integer, p_filtro text, p_busqueda text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_listar_vehiculos_paginados(p_pagina integer, p_tamano integer, p_busqueda text)` | `public` | No | No | Sí | Sí |
| `public.admin_marca_traslado_fallido(p_traslado_id uuid, p_causa public.causa_fallido, p_cargo_aplica_cliente boolean, p_requiere_reagendamiento boolean, p_porcentaje_descuento_segundo_intento numeric, p_mensaje text)` | `public` | No | No | Sí | Sí |
| `public.admin_mutacion_con_auditoria(p_accion text, p_traslado_id uuid, p_payload jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obs_cola_offline()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obs_dashboard(p_desde timestamp with time zone, p_hasta timestamp with time zone)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obs_metricas_negocio(p_desde timestamp with time zone, p_hasta timestamp with time zone, p_empresa_id uuid, p_operacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obs_purgar(p_tabla text, p_limite integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obs_tracking_fallos(p_limite integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_obtener_evidencia_vehiculo(p_vehiculo_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_override_verificacion_repuve(p_traslado_id uuid, p_motivo text, p_verificacion_origen_id uuid)` | `public` | No | No | Sí | Sí |
| `public.admin_previsualizar_carga_masiva(p_empresa_id uuid, p_usuario_id uuid, p_filas jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_procesa_carga_traslados_masivos(p_carga_id uuid, p_limite integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_registrar_cancelacion_injustificada(p_aprobacion_id uuid, p_conductor_id uuid, p_cancelaciones integer, p_nuevo_estado text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_registrar_exportacion(p_recurso text, p_filtros jsonb, p_formato text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_registrar_no_presentacion(p_aprobacion_id uuid, p_conductor_id uuid, p_ocurrencias integer, p_nuevo_estado text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_resuelve_cambio_empresa(p_cambio_id uuid, p_aprobar boolean, p_comentario text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_resuelve_disputa(p_disputa_id uuid, p_estado public.estado_disputa, p_resolucion public.resolucion_disputa, p_detalle text, p_mantener_estado boolean)` | `public` | No | No | Sí | Sí |
| `public.admin_resumen_disputas_perdidas_conductor(p_conductor_id uuid)` | `""` | No | No | Sí | Sí |
| `public.admin_sancionar_conductor(p_aprobacion_id uuid, p_conductor_id uuid, p_motivo text, p_dias_suspension integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_sincroniza_alertas_sla_operacionales()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_sla_cola_torre(p_empresa_id uuid, p_operacion_id uuid, p_limite integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_sla_reporte_historico(p_desde timestamp with time zone, p_hasta timestamp with time zone, p_empresa_id uuid, p_operacion_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_solicitar_aprobacion(p_tipo text, p_capacidad text, p_recurso text, p_recurso_id uuid, p_accion text, p_payload jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_sugerir_tarifa_traslado(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.admin_suspender_conductor(p_aprobacion_id uuid, p_conductor_id uuid, p_nuevo_estado text, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_tiene_permiso(p_permiso text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.admin_validar_aprobacion(p_aprobacion_id uuid, p_capacidad_requerida text, p_recurso text, p_recurso_id uuid, p_accion text, p_payload jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.aplicar_verificacion_pago_stripe(p_datos jsonb)` | `public, pg_temp` | No | No | No | Sí |
| `public.aprobar_expediente_conductor_admin(p_conductor_id uuid)` | `public` | No | No | Sí | Sí |
| `public.aprobar_solicitud_cambio_conductor(p_solicitud_id uuid)` | `public` | No | No | Sí | Sí |
| `public.aprobar_solicitud_conductor_admin(p_solicitud_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.aprobar_solicitud_conductor_sistema(p_solicitud_id uuid, p_verificacion_id uuid)` | `public` | No | No | No | Sí |
| `public.aprobar_usuario_por_verificacion_sistema(p_usuario_id uuid, p_verificacion_id uuid)` | `public` | No | No | No | Sí |
| `public.asignar_incidencia(p_incidencia_id uuid, p_admin_id uuid, p_severidad text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.auditar_acceso_documento_pii(p_usuario_objetivo_id uuid, p_documento_id text, p_tipo_documento text, p_justificacion text, p_ip inet)` | `public` | No | No | Sí | Sí |
| `public.auth_es_conductor_de_traslado(p_traslado_id uuid, p_conductor_id uuid)` | `public` | No | No | Sí | Sí |
| `public.auth_es_conductor_de_traslado_activo(p_traslado_id uuid, p_conductor_id uuid)` | `public` | No | No | Sí | Sí |
| `public.auth_es_usuario_de_traslado(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.calcular_pago_conductor(p_certificacion public.certificacion_conductor, p_precio numeric)` | `public` | No | No | No | Sí |
| `public.calcular_pago_conductor_traslado(p_traslado_id uuid, p_conductor_id uuid)` | `public` | No | No | No | Sí |
| `public.calcular_tarifa_traslado(p_categoria public.categoria_tarifa_vehiculo, p_rango public.rango_distancia, p_gama public.gama_vehiculo, p_condicion public.condicion_vehiculo, p_horario public.horario_traslado, p_dia public.dia_traslado, p_distancia_km numeric, p_tiempo_horas numeric)` | `public` | No | No | Sí | Sí |
| `public.cambiar_estado_expediente_conductor(p_conductor_id uuid, p_destino public.estado_expediente_conductor)` | `public` | No | No | No | Sí |
| `public.cambiar_estado_solicitud_conductor(p_solicitud_id uuid, p_destino public.estado_expediente_conductor)` | `public` | No | No | No | Sí |
| `public.cancelar_asignacion(p_asignacion_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.cancelar_solicitud_cambio_conductor(p_solicitud_id uuid)` | `public` | No | No | Sí | Sí |
| `public.cancelar_traslados_impagos_vencidos()` | `public` | No | No | No | Sí |
| `public.capturar_cotizacion()` | `public, pg_temp` | No | No | No | Sí |
| `public.cerrar_tracking_al_terminar()` | `""` | No | No | No | Sí |
| `public.clasificar_registro_conductor(p_auth_user_id uuid)` | `public` | No | No | No | Sí |
| `public.completar_solicitud_conductor_v2(p_datos_personales jsonb, p_domicilio jsonb, p_licencia jsonb, p_contacto_emergencia jsonb)` | `public, auth` | No | No | Sí | Sí |
| `public.conductor_acepta_viaje(p_traslado_id uuid)` | `""` | No | No | No | Sí |
| `public.conductor_avanza_traslado(p_traslado_id uuid, p_evento text)` | `public` | No | No | Sí | Sí |
| `public.conductor_confirmar_llegada_destino(p_traslado_id uuid, p_fuera_geocerca boolean, p_distancia_m numeric, p_precision_m numeric, p_antiguedad_s integer, p_motivo_sin_medicion text)` | `public` | No | No | Sí | Sí |
| `public.conductor_guarda_datos_bancarios(p_titular_cuenta text, p_banco text, p_clabe text, p_numero_tarjeta text)` | `public` | No | No | Sí | Sí |
| `public.conductor_guarda_datos_bancarios(p_titular_cuenta text, p_banco text, p_clabe text, p_numero_tarjeta text, p_password text)` | `public, extensions` | No | No | Sí | Sí |
| `public.conductor_id_actual()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.conductor_operativamente_aprobado(p_auth_user_id uuid)` | `public` | No | No | Sí | Sí |
| `public.conductor_registra_verificacion_repuve(p_traslado_id uuid, p_vin_fisico text, p_placas_fisicas text, p_resultado text, p_captura_path text)` | `public` | No | No | Sí | Sí |
| `public.conductor_reportar_incidencia_transaccional(p_traslado_id uuid, p_tipo public.tipo_incidencia, p_momento public.momento_incidencia, p_descripcion text, p_incidencia_id uuid, p_escalar_urgente boolean)` | `public` | No | No | Sí | Sí |
| `public.conductor_solicita_asignacion(p_traslado_id uuid, p_lat numeric, p_lng numeric)` | `""` | No | No | Sí | Sí |
| `public.confirmar_checkout_masivo(p_id uuid, p_intent text, p_monto bigint, p_moneda text)` | `public, pg_temp` | No | No | No | Sí |
| `public.confirmar_correo_expediente_conductor()` | `public, auth` | No | No | No | Sí |
| `public.confirmar_correo_solicitud_conductor()` | `public, auth` | No | No | No | Sí |
| `public.congelar_ganancia_conductor_al_cerrar()` | `public, pg_temp` | No | No | No | Sí |
| `public.consentimientos_solicitud_completos(p_solicitud_id uuid)` | `public` | No | No | No | Sí |
| `public.consultar_oportunidad_asignacion(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.consumir_clave_idempotencia(p_clave text, p_entidad text, p_entidad_id text)` | `public, pg_temp` | No | No | No | Sí |
| `public.consumir_rate_limit(p_bucket text, p_rate_key text, p_max_attempts integer, p_window_seconds integer)` | `public` | No | No | No | Sí |
| `public.crear_incidencia_sistema_dano_no_reportado(p_traslado_id uuid, p_descripcion text)` | `public` | No | No | No | Sí |
| `public.crear_usuario_legacy_desde_auth(p_usuario auth.users)` | `public` | No | No | No | Sí |
| `public.desactivar_dispositivo_push(p_device_id text)` | `public` | No | No | No | Sí |
| `public.determinar_tipo_pago_usuario(p_usuario_id uuid)` | `public` | No | No | No | Sí |
| `public.empresa_cambiar_rol_miembro(p_miembro_id uuid, p_rol text)` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.empresa_id_del_titular_actual()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.empresa_invitar_miembro(p_empresa_id uuid, p_usuario_id uuid, p_rol text)` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.empresa_remover_miembro(p_miembro_id uuid)` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.empresa_tiene_permiso(p_empresa_id uuid, p_permiso text)` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.encolar_limpieza_documento(p_usuario_id uuid, p_bucket text, p_storage_path text, p_motivo text)` | `public` | No | No | No | Sí |
| `public.encolar_limpieza_foto_perfil(p_usuario_id uuid, p_storage_path text, p_motivo text)` | `public` | No | No | No | Sí |
| `public.encolar_notificacion_conductor(p_usuario_id uuid, p_tipo text, p_titulo text, p_cuerpo text, p_destino text, p_idempotency_key text, p_entidad_tipo text, p_entidad_id uuid, p_datos jsonb, p_prioridad text)` | `public` | No | No | No | Sí |
| `public.enviar_mensaje_chat(p_traslado_id uuid, p_contenido text)` | `public` | No | No | Sí | Sí |
| `public.enviar_solicitud_conductor()` | `public` | No | No | Sí | Sí |
| `public.es_admin()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.escalar_incidencia(p_incidencia_id uuid, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.evaluar_salud_tracking(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.exigir_pago_anticipado_antes_de_operar()` | `public` | No | No | No | Sí |
| `public.expediente_conductor_tiene_datos(p_conductor_id uuid)` | `public` | No | No | No | Sí |
| `public.expirar_checkouts_masivos_huerfanos(p_horas integer)` | `public, pg_temp` | No | No | No | Sí |
| `public.finalizar_sesion_tracking(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.guardar_borrador_conductor(p_paso_actual smallint, p_datos_personales jsonb, p_domicilio jsonb, p_licencia jsonb, p_contacto_emergencia jsonb)` | `public` | No | No | Sí | Sí |
| `public.guardar_preferencia_admin(p_clave text, p_valor jsonb, p_version_esperada bigint)` | `public` | No | No | Sí | Sí |
| `public.inicializar_estado_expediente_conductor()` | `public, auth` | No | No | No | Sí |
| `public.iniciar_sesion_tracking(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.iniciar_solicitud_conductor()` | `public, auth` | No | No | Sí | Sí |
| `public.limpiar_checkouts_masivos_sin_intent(p_minutos integer)` | `public, pg_temp` | No | No | No | Sí |
| `public.listar_conductores_admin_paginados(p_pagina integer, p_tamano integer, p_busqueda text, p_estado text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.listar_traslados_admin_paginados(p_pagina integer, p_tamano integer, p_filtro_estado text, p_busqueda text, p_orden_columna text, p_orden_direccion text)` | `public, pg_temp` | No | No | No | Sí |
| `public.listar_usuarios_admin_paginados(p_pagina integer, p_tamano integer, p_busqueda text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.manejar_nuevo_usuario_auth()` | `public` | No | No | No | Sí |
| `public.marcar_checkpoint_checkout_masivo(p_id uuid, p_estado text, p_error text, p_reintentar_en timestamp with time zone)` | `public, pg_temp` | No | No | No | Sí |
| `public.marcar_notificacion_leida(p_notificacion_id uuid)` | `public` | No | No | Sí | Sí |
| `public.marcar_traslado_con_incidencia_abierta()` | `public` | No | No | No | Sí |
| `public.metricas_registro_conductor_segmento(p_desde timestamp with time zone, p_hasta timestamp with time zone, p_dimension text, p_zona text, p_fuente text, p_empresa_id uuid)` | `public, pg_temp` | No | No | No | Sí |
| `public.mis_empresas_miembro()` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.nombre_conductor_del_traslado(p_traslado_id uuid)` | `""` | No | No | Sí | Sí |
| `public.notificar_torre_incidencia(p_incidencia_id uuid, p_accion text, p_detalle text)` | `public, pg_temp` | No | No | No | Sí |
| `public.objetivo_documento_pertenece_auth(p_objetivo_id uuid, p_auth_user_id uuid)` | `public` | No | No | Sí | Sí |
| `public.objetivo_documento_texto_pertenece_auth(p_objetivo text)` | `public` | No | No | Sí | Sí |
| `public.obs_registrar_auditoria(p_evento public.evento_auditable, p_actor public.actor_auditoria, p_actor_id uuid, p_traslado_id uuid, p_operacion_id uuid, p_usuario_id uuid, p_correlation_id text, p_datos jsonb)` | `public, pg_temp` | No | No | No | Sí |
| `public.obs_registrar_error_edge(p_funcion text, p_codigo text, p_mensaje text, p_correlation_id text, p_traslado_id uuid, p_datos jsonb)` | `public, pg_temp` | No | No | No | Sí |
| `public.obs_registrar_latencia_rpc(p_funcion text, p_duracion_ms integer, p_ok boolean, p_codigo_error text, p_correlation_id text, p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.obs_registrar_log(p_nivel text, p_servicio text, p_nombre text, p_correlation_id text, p_traslado_id uuid, p_operacion_id uuid, p_usuario_id uuid, p_duracion_ms integer, p_datos jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.obs_resolver_correlation(p_correlation_id text)` | `public, pg_temp` | No | No | No | Sí |
| `public.obtener_metricas_registro_conductor(p_desde date, p_hasta date)` | `public` | No | No | Sí | Sí |
| `public.obtener_metricas_registro_conductor_v2(p_desde date, p_hasta date, p_zona text, p_fuente text, p_empresa_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.obtener_preferencia_admin(p_clave text)` | `public` | No | No | Sí | Sí |
| `public.obtener_resumen_verificacion_repuve(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.ofrecer_asignacion(p_traslado_id uuid, p_conductor_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.piso_cobro_traslado()` | `public` | No | No | No | Sí |
| `public.preparar_conductor_e2e(p_auth_user_id uuid, p_conductor_id uuid, p_datos jsonb)` | `public` | No | No | No | Sí |
| `public.preparar_expediente_por_documento()` | `public` | No | No | No | Sí |
| `public.procesar_competencias_asignacion()` | `""` | No | No | No | Sí |
| `public.procesar_pago_stripe(p_stripe_event_id text, p_stripe_payment_intent_id text, p_estado_pago text)` | `public` | No | No | No | Sí |
| `public.proteger_campos_conductor()` | `public, pg_temp` | No | No | No | Sí |
| `public.proteger_campos_documento_conductor()` | `public` | No | No | No | Sí |
| `public.proteger_campos_traslado_conductor()` | `public` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_conductor()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_datos_bancarios()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_empresa()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_llamada()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_mensaje_chat()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_pago()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_payout()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_columnas_sensibles_usuario()` | `pg_catalog, public, pg_temp` | No | No | No | Sí |
| `public.proteger_verificacion_usuario()` | `public` | No | No | No | Sí |
| `public.puede_ver_tarifa_traslado(p_usuario_id uuid)` | `public` | No | No | Sí | Sí |
| `public.reasignar_conductor(p_traslado_id uuid, p_nuevo_conductor_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.rechazar_asignacion(p_asignacion_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.rechazar_solicitud_cambio_conductor(p_solicitud_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.rechazar_solicitud_conductor_admin(p_solicitud_id uuid, p_motivo text)` | `public` | No | No | Sí | Sí |
| `public.rechazar_solicitud_por_verificacion_sistema(p_solicitud_id uuid, p_verificacion_id uuid, p_motivo text)` | `public` | No | No | No | Sí |
| `public.rechazar_usuario_por_verificacion_sistema(p_usuario_id uuid, p_verificacion_id uuid, p_motivo text)` | `public` | No | No | No | Sí |
| `public.reclamar_checkpoints_checkout_masivo(p_lote integer)` | `public, pg_temp` | No | No | No | Sí |
| `public.reclamar_limpieza_documentos_identidad(p_limite integer)` | `public` | No | No | No | Sí |
| `public.reclamar_lote_limpieza_documentos(p_limite integer)` | `public` | No | No | No | Sí |
| `public.reclamar_lote_limpieza_fotos_perfil(p_limite integer)` | `public` | No | No | No | Sí |
| `public.reclamar_reembolsos_traslado(p_limite integer, p_traslado_id uuid)` | `public, pg_temp` | No | No | No | Sí |
| `public.reconciliar_pagos_stripe()` | `public, pg_temp` | No | No | No | Sí |
| `public.reconciliar_registro_saga_auth(p_limite integer)` | `public, auth` | No | No | No | Sí |
| `public.reconciliar_saga_traslados_individuales(p_limite integer)` | `public, pg_temp` | No | No | No | Sí |
| `public.reconciliar_usuarios_validacion_fiscal_sat(p_limite integer)` | `public` | No | No | No | Sí |
| `public.reconciliar_verificacion_didit_resultado(p_session_id text, p_decision text, p_motivo text)` | `public` | No | No | No | Sí |
| `public.reemplazar_documento_conductor(p_documento_anterior_id uuid, p_nombre_archivo text, p_ruta text)` | `public, storage` | No | No | Sí | Sí |
| `public.registrar_acceso_admin_denegado(p_ruta text, p_metodo text, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.registrar_apertura_push(p_notificacion_id uuid, p_device_id text)` | `public` | No | No | Sí | Sí |
| `public.registrar_checkout_pago_confirmado(p_id uuid, p_intent text)` | `public, pg_temp` | No | No | No | Sí |
| `public.registrar_consentimiento_usuario(p_version integer, p_canal text, p_version_app text, p_aceptado_en timestamp with time zone)` | `public` | No | No | Sí | Sí |
| `public.registrar_consentimientos_conductor(p_solicitud_id uuid, p_consentimientos jsonb, p_canal text, p_version_app text)` | `public` | No | No | Sí | Sí |
| `public.registrar_dispositivo_push(p_device_id text, p_token_push text, p_plataforma text, p_modelo text, p_version_app text, p_version_so text)` | `public, auth` | No | No | Sí | Sí |
| `public.registrar_documento_conductor(p_objetivo_id uuid, p_tipo text, p_nombre_archivo text, p_ruta text)` | `public, storage` | No | No | Sí | Sí |
| `public.registrar_documento_identidad(p_sello_id uuid, p_ruta text, p_sha256 text)` | `public, storage` | No | No | Sí | Sí |
| `public.registrar_documento_identidad_usuario(p_ruta text)` | `public, storage` | No | No | No | Sí |
| `public.registrar_estado_saga_auth()` | `public, auth` | No | No | No | Sí |
| `public.registrar_evento_custodia(p_traslado_id uuid, p_tipo public.tipo_evento_custodia, p_lat numeric, p_lng numeric, p_odometro numeric, p_combustible text, p_ocurrido_en timestamp with time zone, p_foto_ids uuid[], p_inspeccion_id uuid, p_firma_metodo text, p_pin_verificado boolean, p_notas text, p_metadata jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.registrar_evento_registro_conductor(p_sesion_id uuid, p_evento text, p_paso smallint, p_codigo text, p_duracion_ms integer)` | `public` | No | No | Sí | Sí |
| `public.registrar_evento_registro_conductor_v2(p_sesion_id uuid, p_evento text, p_paso smallint, p_codigo text, p_duracion_ms integer, p_zona text, p_fuente text, p_empresa_id uuid, p_creado_en timestamp with time zone)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.registrar_heartbeat_tracking(p_traslado_id uuid, p_lat numeric, p_lng numeric, p_precision_m numeric, p_velocidad_mps numeric, p_bateria_pct integer, p_online boolean, p_plataforma text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.registrar_historial_incidencia()` | `public, pg_temp` | No | No | No | Sí |
| `public.registrar_permiso_admin_denegado(p_permiso text, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.registrar_reembolso_parcial_stripe(p_evento_id text, p_intent_id text, p_charge_id text, p_monto_reembolsado_centavos bigint, p_monto_cargo_centavos bigint, p_livemode boolean)` | `public, pg_temp` | No | No | No | Sí |
| `public.registrar_resultado_idempotente(p_clave text, p_entidad text, p_entidad_id text, p_resultado jsonb)` | `public, pg_temp` | No | No | No | Sí |
| `public.registrar_resultado_limpieza_documento(p_id uuid, p_exito boolean, p_error text)` | `public` | No | No | No | Sí |
| `public.registrar_resultado_limpieza_foto_perfil(p_id uuid, p_exito boolean, p_error text)` | `public` | No | No | No | Sí |
| `public.registrar_resultado_reembolso(p_id uuid, p_ok boolean, p_stripe_refund_id text, p_error text)` | `public, pg_temp` | No | No | No | Sí |
| `public.registrar_telemetria_lote(p_traslado_id uuid, p_puntos jsonb)` | `public` | No | No | Sí | Sí |
| `public.registrar_transicion_solicitud_conductor()` | `public` | No | No | No | Sí |
| `public.registrar_transicion_traslado()` | `public` | No | No | No | Sí |
| `public.registrar_version_politica()` | `public, pg_temp` | No | No | No | Sí |
| `public.reservar_checkout_masivo(p_id uuid, p_auth_user_id uuid, p_idempotency_key text, p_route_hash text, p_monto_centavos bigint)` | `public, pg_temp` | No | No | No | Sí |
| `public.resolver_incidencia(p_incidencia_id uuid, p_motivo text, p_severidad text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.resolver_inventario_llaves(p_traslado_id uuid, p_motivo text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.revisar_documento_conductor_admin(p_documento_id uuid, p_estado text, p_notas text)` | `public` | No | No | Sí | Sí |
| `public.ruta_documento_validada_para_auth(p_ruta text)` | `public` | No | No | Sí | Sí |
| `public.ruta_identidad_validada_para_auth(p_ruta text)` | `public` | No | No | Sí | Sí |
| `public.servidor_cancela_traslado(p_auth_user_id uuid, p_traslado_id uuid, p_motivo text)` | `public, pg_temp` | No | No | No | Sí |
| `public.servidor_cotizar_traslado_individual(p_auth_user_id uuid, p_vehiculo_id uuid, p_vehiculo jsonb, p_traslado jsonb, p_paradas jsonb)` | `""` | No | No | No | Sí |
| `public.sincronizar_asignacion_traslado()` | `public` | No | No | No | Sí |
| `public.sincronizar_custodia_traslado()` | `public, pg_temp` | No | No | No | Sí |
| `public.sla_evaluar_traslados(p_limite integer)` | `public, pg_temp` | No | No | No | Sí |
| `public.sla_events_puente_alertas()` | `public, pg_temp` | No | No | No | Sí |
| `public.sla_horas_operativas_desde(p_inicio timestamp with time zone, p_zona_horaria text, p_pausar boolean)` | `public, pg_temp` | No | No | No | Sí |
| `public.sla_politica_efectiva(p_policy text, p_empresa_id uuid, p_operacion_id uuid)` | `public, pg_temp` | No | No | No | Sí |
| `public.solicitar_cambio_expediente_conductor(p_cambios jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.solicitar_factura_traslado(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.solicitar_supresion_documentos_arco(p_tipo_documento text)` | `public` | No | No | Sí | Sí |
| `public.solicitud_conductor_datos_completos(p_solicitud_id uuid)` | `public` | No | No | No | Sí |
| `public.titular_es_dueno_de_empresa_de_usuario(p_usuario_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.tomar_ejecucion_conciliacion(p_id uuid, p_nonce text)` | `public, pg_temp` | No | No | No | Sí |
| `public.tomar_reconciliacion_usuario(p_tipo text, p_nonce text)` | `""` | No | No | No | Sí |
| `public.transicionar_estado_documento_cuenta(p_documento_id uuid, p_nuevo_estado text, p_actor text, p_actor_id uuid, p_motivo text, p_expira_en timestamp with time zone)` | `public` | No | No | No | Sí |
| `public.traslado_tiene_metodo_pago_registrado(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.traslado_tiene_verificacion_repuve_valida(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.trigger_recalcular_calificacion()` | `""` | No | No | No | Sí |
| `public.usuario_acepta_cotizacion(p_traslado_id uuid)` | `public` | No | No | Sí | Sí |
| `public.usuario_actualiza_perfil_transaccional(p_datos jsonb, p_version_esperada integer)` | `public` | No | No | Sí | Sí |
| `public.usuario_califica_traslado(p_traslado_id uuid, p_estrellas integer, p_comentario text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_cancela_traslado(p_traslado_id uuid, p_motivo text)` | `public` | No | Sí | No | Sí |
| `public.usuario_cancela_traslado(p_traslado_id uuid, p_motivo text, p_porcentaje_cargo numeric, p_monto_cargo numeric, p_mensaje text)` | `public` | No | Sí | No | Sí |
| `public.usuario_crea_traslado(p_vehiculo_id uuid, p_vehiculo jsonb, p_traslado jsonb, p_clave_idempotencia uuid, p_paradas jsonb)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_crea_traslados_masivos(p_nombre_archivo text, p_filas jsonb, p_hash_archivo text, p_tamano_bytes bigint, p_mime_type text)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_id_actual()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_ids_de_traslados_asignados_conductor()` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_previsualizar_cancelacion(p_traslado_id uuid)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_previsualizar_tarifa(p_marca text, p_modelo text, p_distancia_km numeric, p_tiempo_estimado_horas numeric, p_fecha_hora timestamp with time zone, p_condicion public.condicion_vehiculo)` | `public` | No | No | Sí | Sí |
| `public.usuario_previsualizar_tarifas_masivas(p_filas jsonb)` | `pg_catalog, public, extensions, pg_temp` | No | No | Sí | Sí |
| `public.usuario_procesa_carga_traslados_masivos(p_carga_id uuid, p_limite integer)` | `public, pg_temp` | No | No | Sí | Sí |
| `public.usuario_registra_vehiculo(p_id uuid, p_datos jsonb)` | `public` | No | No | Sí | Sí |
| `public.validar_auth_conductor_sin_solicitud()` | `public` | No | No | No | Sí |
| `public.validar_auth_solicitud_sin_conductor()` | `public` | No | No | No | Sí |
| `public.validar_identificadores_conductor_con_solicitudes()` | `public` | No | No | No | Sí |
| `public.validar_identificadores_solicitud_conductor()` | `public` | No | No | No | Sí |
| `public.validar_ruta_documento_conductor(p_objetivo_id uuid, p_tipo text, p_ruta text, p_auth_user_id uuid)` | `public, storage` | No | No | No | Sí |
| `public.validar_transicion_documento_conductor()` | `public` | No | No | No | Sí |
| `public.validar_transicion_expediente_conductor()` | `public` | No | No | No | Sí |
| `public.validar_transicion_solicitud_conductor()` | `public` | No | No | No | Sí |
| `public.vincular_checkout_masivo_payment_intent(p_id uuid, p_auth_user_id uuid, p_intent text)` | `public, pg_temp` | No | No | No | Sí |
