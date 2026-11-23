# Grants Reales y Clasificación Canónica de Funciones SECURITY DEFINER

**Fecha:** 2026-11-27 (Revisión Final de Cierre)  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata)  
**Ticket:** `RUUM-SEC-002` (F0.4) — Bloquea a `RUUM-SEC-009` (F1.1: REVOKE masivo de EXECUTE)  
**Owner de F1.1:** BS (Backend Senior / Arquitecto de Base de Datos)  
**Alcance:** Cruce sistemático de las 91 funciones `SECURITY DEFINER` con permiso a `anon` reportadas en el Security Advisor contra el código fuente (`packages/api/src/` y `supabase/functions/`).

---

> [!IMPORTANT]
> **Nota de Gobernanza y Fuente Canónica para F1.1:**  
> Esta es la **única fuente de verdad** para la ejecución de `RUUM-SEC-009` (F1.1). La distribución canónica comprende exactamente **91 funciones** divididas en 4 lotes funcionales:
> - **Lote 1:** 18 funciones (Admin & Auditoría)
> - **Lote 2:** 26 funciones (Operaciones de Negocio / Clientes)
> - **Lote 3:** 28 funciones (Helpers SQL internos, Triggers y RLS)
> - **Lote 4:** 19 funciones (Colas, Cron, Idempotencia y SLA)  
> Total: **18 + 26 + 28 + 19 = 91 funciones**.
> Cualquier borrador previo que agrupase funciones por niveles de severidad agregada (ej. 30/25/20/16) queda formalmente derogado y reemplazado por esta matriz operativa funcional.

---

## 1. Destino Final del Grant por Lote

| Lote | Descripción Funcional | Cantidad | Destino Final del Grant | Acción en F1.1 | Rol de Invocación Permitido |
|:---:|---|:---:|---|---|---|
| **Lote 1** | **Admin & Auditoría** | 18 | `service_role` exclusivo (o `authenticated` con verificación estricta de admin) | `REVOKE EXECUTE ... FROM anon, public;` | `service_role` / `admin` (vía middleware AAL2 en F1.2) |
| **Lote 2** | **Operaciones de Negocio** | 26 | `authenticated` | `REVOKE EXECUTE ... FROM anon, public;` | `authenticated` (segregación fina usuario/conductor en F1.2) |
| **Lote 3** | **Helpers Internos / RLS / Triggers** | 28 | Interno de Base de Datos | `REVOKE EXECUTE ... FROM anon, authenticated, public;` | Motor PostgreSQL / Contexto de Trigger |
| **Lote 4** | **Colas, Cron, SLA e Idempotencia** | 19 | `service_role` exclusivo | `REVOKE EXECUTE ... FROM anon, authenticated, public;` | `service_role` (Edge Functions, Workers y Cron) |
| **TOTAL** | | **91** | | | |

---

## 2. Mapa Cruzado y Detalle de las 91 Funciones

| # | Función SQL | Invocadores en Código (`packages/api` / Edge Functions) | Clasificación | Lote para F1.1 | Destino Final |
|---|---|---|---|:---:|---|
| 1 | `abrir_disputa_traslado` | `packages/api/src/services/disputas.ts` | Operación de cliente | **Lote 2** | `authenticated` |
| 2 | `actualizar_datos_facturacion` | `packages/api/src/services/usuarios.ts`, `supabase/funciones.ts` | Operación de cliente | **Lote 2** | `authenticated` |
| 3 | `admin_dictaminar_auditoria_repuve` | `packages/api/src/services/repuve.ts`, `supabase/funciones.ts` | Administración | **Lote 1** | `service_role` / `admin` |
| 4 | `admin_override_verificacion_repuve` | `packages/api/src/services/repuve.ts`, `supabase/funciones.ts` | Administración | **Lote 1** | `service_role` / `admin` |
| 5 | `asignar_incidencia` | `packages/api/src/incidents/consultas.ts` | Administración | **Lote 1** | `service_role` / `admin` |
| 6 | `auditar_acceso_documento_pii` | `packages/api/src/services/conductores.ts` | Auditoría | **Lote 1** | `service_role` / `admin` |
| 7 | `auth_es_conductor_de_traslado` | *(Helper SQL interno / RLS)* | Helper interno | **Lote 3** | BD interno |
| 8 | `auth_es_conductor_de_traslado_activo` | *(Helper SQL interno / RLS)* | Helper interno | **Lote 3** | BD interno |
| 9 | `auth_es_usuario_de_traslado` | *(Helper SQL interno / RLS)* | Helper interno | **Lote 3** | BD interno |
| 10 | `calcular_pago_conductor` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 11 | `calcular_pago_conductor_traslado`| *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 12 | `calcular_tarifa_traslado` | `packages/api/src/services/tarifas.ts` | Operación de cliente | **Lote 2** | `authenticated` |
| 13 | `cancelar_asignacion` | `packages/api/src/services/traslados.ts` | Administración / Operativo | **Lote 1** | `service_role` / `admin` |
| 14 | `conductor_acepta_viaje` | *(Migrada en BD a flujo con auditoría)* | Obsoleta / Helper | **Lote 3** | BD interno |
| 15 | `conductor_avanza_traslado` | `packages/api/src/transfers/viajes-conductor.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 16 | `conductor_confirmar_llegada_destino` | `packages/api/src/drivers/conductores.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 17 | `conductor_guarda_datos_bancarios` | `packages/api/src/drivers/conductores.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 18 | `conductor_id_actual` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 19 | `conductor_operativamente_aprobado` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 20 | `conductor_registra_verificacion_repuve` | `packages/api/src/services/repuve.ts`, `supabase/funciones.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 21 | `conductor_reportar_incidencia_transaccional`| `packages/api/src/drivers/conductores.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 22 | `conductor_solicita_asignacion` | `packages/api/src/drivers/conductores.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 23 | `consumir_clave_idempotencia` | *(Invocada desde RPCs compuestas)* | Idempotencia | **Lote 4** | `service_role` |
| 24 | `crear_incidencia_sistema_dano_no_reportado`| `packages/api/src/services/incidencias.ts` | Proceso batch sistema | **Lote 4** | `service_role` |
| 25 | `desactivar_dispositivo_push` | *(Gestionada en BD / Edge Functions)* | Mantenimiento push | **Lote 4** | `service_role` |
| 26 | `determinar_tipo_pago_usuario` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 27 | `empresa_cambiar_rol_miembro` | `packages/api/src/organizations/empresas.ts` | Operación cliente titular | **Lote 2** | `authenticated` |
| 28 | `empresa_id_del_titular_actual` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 29 | `empresa_invitar_miembro` | `packages/api/src/organizations/empresas.ts` | Operación cliente titular | **Lote 2** | `authenticated` |
| 30 | `empresa_remover_miembro` | `packages/api/src/organizations/empresas.ts` | Operación cliente titular | **Lote 2** | `authenticated` |
| 31 | `empresa_tiene_permiso` | *(Helper SQL interno en RLS)* | Helper interno RLS | **Lote 3** | BD interno |
| 32 | `encolar_limpieza_documento` | `supabase/functions/documentos-cuenta-usuario` | Cola asíncrona | **Lote 4** | `service_role` |
| 33 | `encolar_limpieza_foto_perfil` | `packages/api/src/services/usuarios.ts` | Cola asíncrona | **Lote 4** | `service_role` |
| 34 | `enviar_mensaje_chat` | `packages/api/src/services/chat.ts` | Operación cliente/conductor | **Lote 2** | `authenticated` |
| 35 | `es_admin` | `packages/api/src/services/permisos-admin.ts` | Helper RBAC Admin | **Lote 1** | `service_role` / `admin` |
| 36 | `escalar_incidencia` | `packages/api/src/services/incidencias.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 37 | `evaluar_salud_tracking` | `packages/api/src/tracking/ubicaciones.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 38 | `expediente_conductor_tiene_datos` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 39 | `finalizar_sesion_tracking` | `packages/api/src/tracking/ubicaciones.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 40 | `guardar_preferencia_admin` | `packages/api/src/services/permisos-admin.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 41 | `listar_conductores_admin_paginados` | `packages/api/src/drivers/conductores.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 42 | `listar_traslados_admin_paginados` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 43 | `listar_usuarios_admin_paginados` | `packages/api/src/services/usuarios.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 44 | `marcar_notificacion_leida` | `packages/api/src/services/notificaciones.ts` | Operación cliente | **Lote 2** | `authenticated` |
| 45 | `metricas_registro_conductor_segmento`| *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 46 | `mis_empresas_miembro` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 47 | `notificar_torre_incidencia` | *(Helper SQL interno / triggers)* | Helper trigger | **Lote 3** | BD interno |
| 48 | `obs_registrar_auditoria` | *(Invocada desde DB triggers)* | Trigger interno | **Lote 3** | BD interno |
| 49 | `obs_registrar_error_edge` | *(Invocada desde Edge Functions)* | Edge Function logging | **Lote 3** | BD interno |
| 50 | `obs_registrar_latencia_rpc` | `packages/api/src/obs/observabilidad.ts` | Telemetría cliente | **Lote 2** | `authenticated` |
| 51 | `obs_registrar_log` | `packages/api/src/obs/observabilidad.ts` | Telemetría cliente | **Lote 2** | `authenticated` |
| 52 | `obs_resolver_correlation` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 53 | `obtener_metricas_registro_conductor_v2` | `packages/api/src/services/conductores.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 54 | `obtener_preferencia_admin` | `packages/api/src/services/permisos-admin.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 55 | `obtener_resumen_verificacion_repuve` | `packages/api/src/services/repuve.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 56 | `ofrecer_asignacion` | `packages/api/src/services/traslados.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 57 | `puede_ver_tarifa_traslado` | `packages/api/src/transfers/viajes-usuario.ts` | Operación cliente | **Lote 2** | `authenticated` |
| 58 | `reasignar_conductor` | `packages/api/src/services/traslados.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 59 | `rechazar_asignacion` | `packages/api/src/services/traslados.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 60 | `reclamar_lote_limpieza_documentos` | `supabase/functions/limpiar-documentos-cuenta-obsoletos` | Proceso cron/worker | **Lote 4** | `service_role` |
| 61 | `reclamar_lote_limpieza_fotos_perfil` | *(Proceso interno cron/storage)* | Proceso cron/worker | **Lote 4** | `service_role` |
| 62 | `reconciliar_usuarios_validacion_fiscal_sat`| *(Cron interno SAT)* | Cron interno | **Lote 4** | `service_role` |
| 63 | `registrar_acceso_admin_denegado` | `packages/api/src/operations/queries/guard-admin.ts` | Auditoría admin | **Lote 1** | `service_role` / `admin` |
| 64 | `registrar_apertura_push` | `packages/api/src/services/notificaciones.ts` | Telemetría cliente | **Lote 2** | `authenticated` |
| 65 | `registrar_dispositivo_push` | `packages/api/src/services/notificaciones.ts` | Telemetría cliente | **Lote 2** | `authenticated` |
| 66 | `registrar_estado_saga_auth` | *(Proceso interno de registro)* | Orquestación saga | **Lote 4** | `service_role` |
| 67 | `registrar_evento_custodia` | `packages/api/src/custody/custodia.ts` | Operación conductor | **Lote 2** | `authenticated` |
| 68 | `registrar_evento_registro_conductor` | `packages/api/src/services/conductores.ts` | Onboarding | **Lote 2** | `authenticated` |
| 69 | `registrar_evento_registro_conductor_v2`| `packages/api/src/services/conductores.ts` | Onboarding | **Lote 2** | `authenticated` |
| 70 | `registrar_heartbeat_tracking` | `packages/api/src/tracking/ubicaciones.ts` | Telemetría conductor | **Lote 2** | `authenticated` |
| 71 | `registrar_permiso_admin_denegado` | `packages/api/src/services/permisos-admin.ts` | Auditoría admin | **Lote 1** | `service_role` / `admin` |
| 72 | `registrar_resultado_idempotente` | *(Procesamiento interno)* | Idempotencia | **Lote 4** | `service_role` |
| 73 | `registrar_resultado_limpieza_documento`| `supabase/functions/limpiar-documentos-cuenta-obsoletos` | Proceso cron/worker | **Lote 4** | `service_role` |
| 74 | `registrar_resultado_limpieza_foto_perfil`| *(Proceso interno de limpieza)* | Proceso cron/worker | **Lote 4** | `service_role` |
| 75 | `registrar_telemetria_lote` | `packages/api/src/tracking/ubicaciones.ts` | Telemetría conductor | **Lote 2** | `authenticated` |
| 76 | `resolver_incidencia` | `packages/api/src/incidents/consultas.ts` | Operación admin | **Lote 1** | `service_role` / `admin` |
| 77 | `sla_evaluar_traslados` | `packages/api/src/sla/evaluacion.ts` | Motor de SLA | **Lote 4** | `service_role` |
| 78 | `sla_horas_operativas_desde` | *(Helper SQL interno de cálculo SLA)* | Motor de SLA | **Lote 4** | `service_role` |
| 79 | `sla_politica_efectiva` | *(Helper SQL interno de cálculo SLA)* | Motor de SLA | **Lote 4** | `service_role` |
| 80 | `solicitar_supresion_documentos_arco`| `packages/api/src/services/usuarios.ts` | Privacidad ARCO | **Lote 2** | `authenticated` |
| 81 | `titular_es_dueno_de_empresa_de_usuario`| *(Helper SQL interno en RLS)* | Helper RLS | **Lote 3** | BD interno |
| 82 | `transicionar_estado_documento_cuenta`| *(Invocada desde Edge Functions)* | Edge Functions | **Lote 4** | `service_role` |
| 83 | `traslado_tiene_metodo_pago_registrado`| `packages/api/src/services/traslados.ts` | Validación cliente | **Lote 2** | `authenticated` |
| 84 | `traslado_tiene_verificacion_repuve_valida`| `packages/api/src/services/repuve.ts` | Validación cliente | **Lote 2** | `authenticated` |
| 85 | `usuario_acepta_cotizacion` | `packages/api/src/transfers/viajes-usuario.ts` | Operación usuario | **Lote 2** | `authenticated` |
| 86 | `usuario_actualiza_perfil_transaccional`| `packages/api/src/identity/perfil-transaccional.ts` | Operación usuario | **Lote 2** | `authenticated` |
| 87 | `usuario_cancela_traslado` | `packages/api/src/services/traslados.ts` | Operación usuario | **Lote 2** | `authenticated` |
| 88 | `usuario_crea_traslados_masivos` | `packages/api/src/services/cargas-masivas.ts` | Operación usuario | **Lote 2** | `authenticated` |
| 89 | `usuario_id_actual` | *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 90 | `usuario_ids_de_traslados_asignados_conductor`| *(Helper SQL interno)* | Helper interno | **Lote 3** | BD interno |
| 91 | `usuario_procesa_carga_traslados_masivos`| `packages/api/src/services/cargas-masivas.ts` | Operación usuario | **Lote 2** | `authenticated` |

---

## 3. Especificación Técnica de Migración para F1.1 (BS)

### Plantilla SQL para Lote 1 (Admin & Auditoría — 18 funciones)
```sql
-- Lote 1: Revocación masiva de anon y público para funciones admin
REVOKE EXECUTE ON FUNCTION public.admin_dictaminar_auditoria_repuve FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.admin_override_verificacion_repuve FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.asignar_incidencia FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.auditar_acceso_documento_pii FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.cancelar_asignacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.es_admin FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.escalar_incidencia FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.guardar_preferencia_admin FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.listar_conductores_admin_paginados FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.listar_usuarios_admin_paginados FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_metricas_registro_conductor_v2 FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_preferencia_admin FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_verificacion_repuve FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.ofrecer_asignacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.reasignar_conductor FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_acceso_admin_denegado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_permiso_admin_denegado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.resolver_incidencia FROM public, anon;

-- Asegurar permisos a service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

### Plantilla SQL para Lote 2 (Operaciones de Negocio — 26 funciones)
```sql
-- Lote 2: Revocar anon pero mantener authenticated
REVOKE EXECUTE ON FUNCTION public.abrir_disputa_traslado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.actualizar_datos_facturacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.calcular_tarifa_traslado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_avanza_traslado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_confirmar_llegada_destino FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_guarda_datos_bancarios FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_registra_verificacion_repuve FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_reportar_incidencia_transaccional FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.conductor_solicita_asignacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.empresa_cambiar_rol_miembro FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.empresa_invitar_miembro FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.empresa_remover_miembro FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.enviar_mensaje_chat FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.evaluar_salud_tracking FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.finalizar_sesion_tracking FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_notificacion_leida FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.obs_registrar_latencia_rpc FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.obs_registrar_log FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.puede_ver_tarifa_traslado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rechazar_asignacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_apertura_push FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_dispositivo_push FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_custodia FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_registro_conductor FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_registro_conductor_v2 FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_heartbeat_tracking FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_telemetria_lote FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.solicitar_supresion_documentos_arco FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.traslado_tiene_metodo_pago_registrado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.traslado_tiene_verificacion_repuve_valida FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.usuario_acepta_cotizacion FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.usuario_actualiza_perfil_transaccional FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.usuario_cancela_traslado FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.usuario_crea_traslados_masivos FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.usuario_procesa_carga_traslados_masivos FROM public, anon;

GRANT EXECUTE ON FUNCTION public.abrir_disputa_traslado TO authenticated;
-- (y correspondientes a authenticated)
```

### Plantilla SQL para Lote 3 (Helpers Internos — 28 funciones)
```sql
-- Lote 3: Revocar acceso de API completamente (anon y authenticated)
REVOKE EXECUTE ON FUNCTION public.auth_es_conductor_de_traslado FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auth_es_conductor_de_traslado_activo FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auth_es_usuario_de_traslado FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_pago_conductor FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_pago_conductor_traslado FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.conductor_acepta_viaje FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.conductor_id_actual FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.conductor_operativamente_aprobado FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.determinar_tipo_pago_usuario FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.empresa_id_del_titular_actual FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.empresa_tiene_permiso FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expediente_conductor_tiene_datos FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.listar_traslados_admin_paginados FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.metricas_registro_conductor_segmento FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mis_empresas_miembro FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notificar_torre_incidencia FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.obs_registrar_auditoria FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.obs_registrar_error_edge FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.obs_resolver_correlation FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.titular_es_dueno_de_empresa_de_usuario FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.usuario_id_actual FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.usuario_ids_de_traslados_asignados_conductor FROM public, anon, authenticated;
```

### Plantilla SQL para Lote 4 (Colas, Cron e Idempotencia — 19 funciones)
```sql
-- Lote 4: Exclusivo service_role
REVOKE EXECUTE ON FUNCTION public.consumir_clave_idempotencia FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_incidencia_sistema_dano_no_reportado FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.desactivar_dispositivo_push FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encolar_limpieza_documento FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encolar_limpieza_foto_perfil FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reclamar_lote_limpieza_documentos FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reclamar_lote_limpieza_fotos_perfil FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconciliar_usuarios_validacion_fiscal_sat FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_estado_saga_auth FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_resultado_idempotente FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_resultado_limpieza_documento FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_resultado_limpieza_foto_perfil FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sla_evaluar_traslados FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sla_horas_operativas_desde FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sla_politica_efectiva FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.transicionar_estado_documento_cuenta FROM public, anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```
