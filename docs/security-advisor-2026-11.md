# Reporte de Auditoría: Supabase Security Advisor (Noviembre 2026)

**Fecha de extracción:** 2026-11-22  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata)  
**Ticket:** `RUUM-SEC-002` (F0.4)  
**Fuente:** Extracción directa de `supabase/audits/advisor-security-20261118-prod.json` y `supabase/audits/advisor-security-20261118-staging.json` generados por `supabase db advisors --type security --level info`.

---

## 1. Resumen Estadístico del Advisor

| Regla del Advisor | Nivel | Total Hallazgos | Descripción | Impacto |
|---|:---:|:---:|---|---|
| `security_definer_view` | **ERROR** | **1** | Vista `public.conductores_publicos` definida con `SECURITY DEFINER`. | Riesgo aceptado: expone solo 4 columnas públicas sin PII; `anon` no tiene SELECT. |
| `anon_security_definer_function_executable` | **WARN** | **94** | 94 firmas (correspondientes a **91 funciones únicas**) `SECURITY DEFINER` ejecutables por el rol `anon` vía `/rest/v1/rpc`. | **🔴 Crítico:** Superficie de ataque no autenticada en Postgres. |
| `authenticated_security_definer_function_executable` | **WARN** | **194** | 194 firmas `SECURITY DEFINER` ejecutables por cualquier usuario autenticado. | **🟡 Medio:** Requiere validar que cada función compruebe rol o `auth.uid()` internamente. |
| `auth_leaked_password_protection` | **WARN** | **1** | Protección de contraseñas filtradas (HaveIBeenPwned) desactivada en Auth. | Configuración de Dashboard (Auth -> Providers -> Email). |
| `rls_enabled_no_policy` | **INFO** | **6** | Tablas con RLS habilitado pero sin políticas (acceso exclusivo `service_role`). | Comportamiento correcto intencional (tablas internas/colas). |
| `rls_disabled_in_public` | **OK** | **0** | Ninguna tabla pública tiene RLS desactivado (124/124 tablas protegidas). | Cumplimiento total. |
| `policy_exists_rls_disabled` | **OK** | **0** | No existen políticas huérfanas sobre tablas desprotegidas. | Cumplimiento total. |

---

## 2. Detalle de Warnings: `anon_security_definer_function_executable` (91 Funciones)

A continuación se listan las 91 funciones únicas identificadas en la auditoría con permiso `EXECUTE` concedido a `anon` (y a `PUBLIC`).

### 2.1 Procesos Administrativos, Auditoría y Torre de Control (22 funciones)
*Funciones con mayor severidad si se invocan sin sesión:*
1. `admin_dictaminar_auditoria_repuve`
2. `admin_override_verificacion_repuve`
3. `asignar_incidencia`
4. `auditar_acceso_documento_pii`
5. `es_admin`
6. `escalar_incidencia`
7. `guardar_preferencia_admin`
8. `listar_conductores_admin_paginados`
9. `listar_traslados_admin_paginados`
10. `listar_usuarios_admin_paginados`
11. `metricas_registro_conductor_segmento`
12. `notificar_torre_incidencia`
13. `obtener_metricas_registro_conductor_v2`
14. `obtener_preferencia_admin`
15. `obtener_resumen_verificacion_repuve`
16. `ofrecer_asignacion`
17. `reasignar_conductor`
18. `rechazar_asignacion`
19. `registrar_acceso_admin_denegado`
20. `registrar_permiso_admin_denegado`
21. `resolver_incidencia`
22. `solicitar_supresion_documentos_arco`

### 2.2 Colas Internas, Cron, Idempotencia y Reconciliación (16 funciones)
*Funciones que deben restringirse exclusivamente a `service_role`:*
23. `consumir_clave_idempotencia`
24. `crear_incidencia_sistema_dano_no_reportado`
25. `desactivar_dispositivo_push`
26. `encolar_limpieza_documento`
27. `encolar_limpieza_foto_perfil`
28. `reclamar_lote_limpieza_documentos`
29. `reclamar_lote_limpieza_fotos_perfil`
30. `reconciliar_usuarios_validacion_fiscal_sat`
31. `registrar_estado_saga_auth`
32. `registrar_resultado_idempotente`
33. `registrar_resultado_limpieza_documento`
34. `registrar_resultado_limpieza_foto_perfil`
35. `sla_evaluar_traslados`
36. `sla_horas_operativas_desde`
37. `sla_politica_efectiva`
38. `transicionar_estado_documento_cuenta`

### 2.3 Operaciones de Conductor y Telemetría (17 funciones)
39. `auth_es_conductor_de_traslado`
40. `auth_es_conductor_de_traslado_activo`
41. `calcular_pago_conductor`
42. `calcular_pago_conductor_traslado`
43. `conductor_acepta_viaje`
44. `conductor_avanza_traslado`
45. `conductor_confirmar_llegada_destino`
46. `conductor_guarda_datos_bancarios`
47. `conductor_id_actual`
48. `conductor_operativamente_aprobado`
49. `conductor_registra_verificacion_repuve`
50. `conductor_reportar_incidencia_transaccional`
51. `conductor_solicita_asignacion`
52. `evaluar_salud_tracking`
53. `expediente_conductor_tiene_datos`
54. `finalizar_sesion_tracking`
55. `registrar_heartbeat_tracking`

### 2.4 Operaciones de Usuario, Billetera y Facturación (13 funciones)
56. `actualizar_datos_facturacion`
57. `auth_es_usuario_de_traslado`
58. `calcular_tarifa_traslado`
59. `determinar_tipo_pago_usuario`
60. `puede_ver_tarifa_traslado`
61. `traslado_tiene_metodo_pago_registrado`
62. `traslado_tiene_verificacion_repuve_valida`
63. `usuario_acepta_cotizacion`
64. `usuario_actualiza_perfil_transaccional`
65. `usuario_cancela_traslado`
66. `usuario_crea_traslados_masivos`
67. `usuario_id_actual`
68. `usuario_procesa_carga_traslados_masivos`

### 2.5 Empresas y Roles Corporativos (6 funciones)
69. `empresa_cambiar_rol_miembro`
70. `empresa_id_del_titular_actual`
71. `empresa_invitar_miembro`
72. `empresa_remover_miembro`
73. `empresa_tiene_permiso`
74. `titular_es_dueno_de_empresa_de_usuario`

### 2.6 Chat, Disputas, Observabilidad y Notificaciones (17 funciones)
75. `abrir_disputa_traslado`
76. `cancelar_asignacion`
77. `enviar_mensaje_chat`
78. `marcar_notificacion_leida`
79. `mis_empresas_miembro`
80. `obs_registrar_auditoria`
81. `obs_registrar_error_edge`
82. `obs_registrar_latencia_rpc`
83. `obs_registrar_log`
84. `obs_resolver_correlation`
85. `registrar_apertura_push`
86. `registrar_dispositivo_push`
87. `registrar_evento_custodia`
88. `registrar_evento_registro_conductor`
89. `registrar_evento_registro_conductor_v2`
90. `registrar_telemetria_lote`
91. `usuario_ids_de_traslados_asignados_conductor`
