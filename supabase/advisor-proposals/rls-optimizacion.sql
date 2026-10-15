-- Proposed optimization only; preserves all policy names/roles/conditions.
-- Evaluate request claims once per statement; retain policy names, roles and logic.
alter policy "conductor_crea_solicitud_cambio" on "public"."solicitudes_cambio_conductor"
 with check ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_sus_solicitudes_cambio" on "public"."solicitudes_cambio_conductor"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_paradas_de_sus_traslados" on "public"."traslado_paradas"
 using (((traslado_id IN ( SELECT traslados.id
   FROM traslados
  WHERE (traslados.usuario_id IN ( SELECT usuarios.id
           FROM usuarios
          WHERE (usuarios.auth_user_id = (SELECT auth.uid())))))) OR (traslado_id IN ( SELECT traslados.id
   FROM traslados
  WHERE (traslados.conductor_id IN ( SELECT conductores.id
           FROM conductores
          WHERE (conductores.auth_user_id = (SELECT auth.uid())))))) OR es_admin()));
alter policy "conductor_ve_operaciones_asignadas" on "public"."operaciones"
 using ((EXISTS ( SELECT 1
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((t.operation_id = operaciones.id) AND (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "empresa_ve_sus_operaciones" on "public"."operaciones"
 using (((empresa_id IS NULL) OR (empresa_id IN ( SELECT u.empresa_id
   FROM usuarios u
  WHERE ((u.auth_user_id = (SELECT auth.uid())) AND (u.empresa_id IS NOT NULL))))));
alter policy "conductor_actualiza_su_evidencia_storage" on "storage"."objects"
 using (((bucket_id = 'evidencia'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)))
 with check (((bucket_id = 'evidencia'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "conductor_actualiza_su_foto_perfil" on "storage"."objects"
 using (((bucket_id = 'fotos-perfil-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND (EXISTS ( SELECT 1
   FROM conductores c
  WHERE ((c.auth_user_id = (SELECT auth.uid())) AND ((c.id)::text = (storage.foldername(objects.name))[1]))))))
 with check (((bucket_id = 'fotos-perfil-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND (EXISTS ( SELECT 1
   FROM conductores c
  WHERE ((c.auth_user_id = (SELECT auth.uid())) AND ((c.id)::text = (storage.foldername(objects.name))[1])))) AND (lower(storage.filename(name)) = ANY (ARRAY['perfil.jpg'::text, 'perfil.jpeg'::text, 'perfil.png'::text, 'perfil.webp'::text]))));
alter policy "conductor_lee_fotos_perfil_autorizadas" on "storage"."objects"
 using (((bucket_id = 'fotos-perfil-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND (es_admin() OR (EXISTS ( SELECT 1
   FROM conductores c
  WHERE (((c.id)::text = (storage.foldername(objects.name))[1]) AND (c.auth_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (((t.conductor_id)::text = (storage.foldername(objects.name))[1]) AND (u.auth_user_id = (SELECT auth.uid()))))))));
alter policy "conductor_lee_su_evidencia_storage" on "storage"."objects"
 using (((bucket_id = 'evidencia'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "conductor_lee_sus_documentos_storage" on "storage"."objects"
 using (((bucket_id = 'documentos-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 3) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text) AND objetivo_documento_texto_pertenece_auth((storage.foldername(name))[2])));
alter policy "conductor_ruta_controlada_documentos_storage" on "storage"."objects"
 with check (((bucket_id = 'documentos-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 3) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text) AND objetivo_documento_texto_pertenece_auth((storage.foldername(name))[2]) AND ((storage.foldername(name))[3] = ANY (ARRAY['licencia_frente'::text, 'licencia_reverso'::text, 'identificacion_oficial'::text, 'constancia_situacion_fiscal'::text, 'documento_operativo'::text])) AND (storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,179}$'::text) AND ruta_documento_validada_para_auth(name)));
alter policy "conductor_sube_su_evidencia_storage" on "storage"."objects"
 with check (((bucket_id = 'evidencia'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "conductor_sube_su_foto_perfil" on "storage"."objects"
 with check (((bucket_id = 'fotos-perfil-conductor'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND (EXISTS ( SELECT 1
   FROM conductores c
  WHERE ((c.auth_user_id = (SELECT auth.uid())) AND ((c.id)::text = (storage.foldername(objects.name))[1])))) AND (lower(storage.filename(name)) = ANY (ARRAY['perfil.jpg'::text, 'perfil.jpeg'::text, 'perfil.png'::text, 'perfil.webp'::text]))));
alter policy "usuario_actualiza_su_foto_perfil" on "storage"."objects"
 using (((bucket_id = 'fotos-perfil'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)))
 with check (((bucket_id = 'fotos-perfil'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "usuario_lee_evidencia_de_sus_traslados_storage" on "storage"."objects"
 using (((bucket_id = 'evidencia'::text) AND (EXISTS ( SELECT 1
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) AND ((t.id)::text = (storage.foldername(objects.name))[2]))))));
alter policy "usuario_lee_su_foto_perfil" on "storage"."objects"
 using (((bucket_id = 'fotos-perfil'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "usuario_sube_su_documento_identidad" on "storage"."objects"
 with check (((bucket_id = 'documentos-identidad'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text) AND (storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|pdf)$'::text) AND ruta_identidad_validada_para_auth(name)));
alter policy "usuario_sube_su_foto_perfil" on "storage"."objects"
 with check (((bucket_id = 'fotos-perfil'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
alter policy "usuario_ve_su_documento_identidad" on "storage"."objects"
 using (((bucket_id = 'documentos-identidad'::text) AND (COALESCE(array_length(storage.foldername(name), 1), 0) = 1) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text) AND (storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|pdf)$'::text)));
alter policy "conductor_ve_historial_asignados" on "public"."historial_estados_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_historial_sus_traslados" on "public"."historial_estados_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_sus_asignaciones" on "public"."asignaciones"
 using ((conductor_id IN ( SELECT c.id
   FROM conductores c
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_asignaciones_sus_traslados" on "public"."asignaciones"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_registra_custodia_asignados" on "public"."custodia_eventos"
 with check ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_custodia_asignados" on "public"."custodia_eventos"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_registra_custodia_sus_traslados" on "public"."custodia_eventos"
 with check ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_custodia_sus_traslados" on "public"."custodia_eventos"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "partes_ven_sesiones_tracking" on "public"."tracking_sesiones"
 using ((EXISTS ( SELECT 1
   FROM ((traslados t
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE ((t.id = tracking_sesiones.traslado_id) AND ((c.auth_user_id = (SELECT auth.uid())) OR (u.auth_user_id = (SELECT auth.uid())))))));
alter policy "partes_ven_historial_incidencia" on "public"."incidencia_historial"
 using ((incidencia_id IN ( SELECT i.id
   FROM (((incidencias i
     JOIN traslados t ON ((t.id = i.traslado_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "partes_enlazan_evidencia_incidencia" on "public"."incidencia_evidencia_fotos"
 with check (((incidencia_id IN ( SELECT i.id
   FROM (((incidencias i
     JOIN traslados t ON ((t.id = i.traslado_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))) OR es_admin()));
alter policy "partes_ven_evidencia_incidencia" on "public"."incidencia_evidencia_fotos"
 using ((incidencia_id IN ( SELECT i.id
   FROM (((incidencias i
     JOIN traslados t ON ((t.id = i.traslado_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "partes_ven_cotizaciones" on "public"."cotizaciones"
 using ((traslado_id IN ( SELECT t.id
   FROM ((traslados t
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "partes_ven_sla_operacion" on "public"."sla_operacion_politicas"
 using (((operacion_id IN ( SELECT operaciones.id
   FROM operaciones
  WHERE (operaciones.empresa_id IN ( SELECT mis_empresas_miembro() AS mis_empresas_miembro)))) OR (EXISTS ( SELECT 1
   FROM ((traslados t
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE ((t.operation_id = sla_operacion_politicas.operacion_id) AND ((c.auth_user_id = (SELECT auth.uid())) OR (u.auth_user_id = (SELECT auth.uid()))))))));
alter policy "partes_ven_sla_evaluaciones" on "public"."sla_evaluaciones"
 using ((traslado_id IN ( SELECT t.id
   FROM ((traslados t
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "partes_ven_sla_events" on "public"."sla_events"
 using ((traslado_id IN ( SELECT t.id
   FROM ((traslados t
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE ((u.auth_user_id = (SELECT auth.uid())) OR (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "admin_ve_su_propio_registro" on "public"."admins"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "conductor_ve_su_capacitacion" on "public"."capacitaciones_conductor"
 using ((EXISTS ( SELECT 1
   FROM conductores c
  WHERE ((c.id = capacitaciones_conductor.conductor_id) AND (c.auth_user_id = (SELECT auth.uid()))))));
alter policy "usuario_ve_sus_cargas_masivas" on "public"."cargas_traslados_masivos"
 using ((usuario_id = ( SELECT usuarios.id
   FROM usuarios
  WHERE (usuarios.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_sus_calificaciones" on "public"."calificaciones_traslado"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_califica_sus_traslados" on "public"."calificaciones_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_crea_su_registro" on "public"."conductores"
 with check (((SELECT auth.uid()) = auth_user_id));
alter policy "conductor_ve_su_registro" on "public"."conductores"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "conductor_ve_sus_datos_bancarios" on "public"."datos_bancarios_conductor"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_sus_consentimientos" on "public"."consentimientos_usuario"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "usuario_administra_sus_dispositivos_push" on "public"."dispositivos_push"
 using ((usuario_id = (SELECT auth.uid())))
 with check ((usuario_id = (SELECT auth.uid())));
alter policy "conductor_ve_y_abre_disputas_de_sus_traslados" on "public"."disputas"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_y_abre_disputas_de_sus_traslados" on "public"."disputas"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "solicitante_o_conductor_lee_documentos" on "public"."documentos_conductor"
 using (((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))) OR (solicitud_id IN ( SELECT solicitudes_conductor.id
   FROM solicitudes_conductor
  WHERE (solicitudes_conductor.auth_user_id = (SELECT auth.uid()))))));
alter policy "usuario_ve_historial_identidad" on "public"."documentos_identidad_usuario"
 using ((usuario_id IN ( SELECT u.id
   FROM usuarios u
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "titular_ve_su_empresa" on "public"."empresas"
 using ((id IN ( SELECT u.empresa_id
   FROM usuarios u
  WHERE ((u.auth_user_id = (SELECT auth.uid())) AND (u.rol = 'titular_empresa'::rol_usuario)))));
alter policy "eventos_operativos_app_insert_own" on "public"."eventos_operativos_app"
 with check ((usuario_id = (SELECT auth.uid())));
alter policy "eventos_operativos_app_read_own" on "public"."eventos_operativos_app"
 using ((usuario_id = (SELECT auth.uid())));
alter policy "conductor_administra_evidencia_de_sus_traslados" on "public"."evidencia_fotos"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_evidencia_de_sus_traslados" on "public"."evidencia_fotos"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_administra_inspeccion_de_sus_traslados" on "public"."evidencia_inspecciones"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))))
 with check ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_inspeccion_de_sus_traslados" on "public"."evidencia_inspecciones"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "exportaciones_propias_o_auditoria" on "public"."exportaciones_admin"
 using (((admin_id = ( SELECT admins.id
   FROM admins
  WHERE (admins.auth_user_id = (SELECT auth.uid())))) OR admin_tiene_permiso('auditoria:leer'::text)));
alter policy "conductor_administra_gastos_de_sus_traslados" on "public"."gastos_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))))
 with check ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_sus_filas_masivas" on "public"."filas_carga_traslados_masivos"
 using ((carga_id IN ( SELECT cargas_traslados_masivos.id
   FROM cargas_traslados_masivos
  WHERE (cargas_traslados_masivos.usuario_id = ( SELECT usuarios.id
           FROM usuarios
          WHERE (usuarios.auth_user_id = (SELECT auth.uid())))))));
alter policy "conductor_administra_incidencias_de_sus_traslados" on "public"."incidencias"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_reporta_incidencias_de_sus_traslados" on "public"."incidencias"
 with check (((reportada_por = 'usuario'::actor_reporte) AND (traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid()))))));
alter policy "usuario_ve_incidencias_de_sus_traslados" on "public"."incidencias"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_llamadas_de_sus_traslados" on "public"."llamadas_enmascaradas"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_llamadas_de_sus_traslados" on "public"."llamadas_enmascaradas"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_lee_mensajes_de_sus_traslados" on "public"."mensajes_chat"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_lee_mensajes_de_sus_traslados" on "public"."mensajes_chat"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_su_modo_prueba" on "public"."modo_prueba_supervisada"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_actualiza_lectura_notificaciones" on "public"."notificaciones_conductor"
 using ((usuario_id = (SELECT auth.uid())))
 with check ((usuario_id = (SELECT auth.uid())));
alter policy "usuario_lee_sus_notificaciones" on "public"."notificaciones_conductor"
 using ((usuario_id = (SELECT auth.uid())));
alter policy "usuario_lee_entregas_push" on "public"."notificaciones_push_entregas"
 using ((EXISTS ( SELECT 1
   FROM notificaciones_conductor n
  WHERE ((n.id = notificaciones_push_entregas.notificacion_id) AND (n.usuario_id = (SELECT auth.uid()))))));
alter policy "usuario_ve_pagos_de_sus_traslados" on "public"."pagos"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_sus_payouts" on "public"."payouts_conductor"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "preferencias_admin_propias" on "public"."preferencias_admin"
 using ((admin_id = ( SELECT admins.id
   FROM admins
  WHERE (admins.auth_user_id = (SELECT auth.uid())))))
 with check ((admin_id = ( SELECT admins.id
   FROM admins
  WHERE (admins.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_administra_sus_preferencias" on "public"."preferencias_conductor"
 using ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))))
 with check ((conductor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_reclamos_de_sus_traslados" on "public"."reclamos_seguro"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "actor_registra_su_propio_evento" on "public"."registro_auditoria"
 with check (((actor_id IN ( SELECT usuarios.id
   FROM usuarios
  WHERE (usuarios.auth_user_id = (SELECT auth.uid())))) OR (actor_id IN ( SELECT conductores.id
   FROM conductores
  WHERE (conductores.auth_user_id = (SELECT auth.uid())))) OR es_admin()));
alter policy "conductor_ve_su_sesion_proxy" on "public"."sesiones_proxy_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN conductores c ON ((c.id = t.conductor_id)))
  WHERE (c.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_su_sesion_proxy" on "public"."sesiones_proxy_traslado"
 using ((traslado_id IN ( SELECT t.id
   FROM (traslados t
     JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE (u.auth_user_id = (SELECT auth.uid())))));
alter policy "aprobaciones_lectura" on "public"."solicitudes_aprobacion_admin"
 using ((admin_tiene_permiso('aprobaciones:aprobar'::text) OR (solicitada_por = ( SELECT admins.id
   FROM admins
  WHERE (admins.auth_user_id = (SELECT auth.uid()))))));
alter policy "solicitante_edita_su_borrador" on "public"."solicitudes_conductor"
 using ((((SELECT auth.uid()) = auth_user_id) AND (estado = ANY (ARRAY['borrador'::estado_expediente_conductor, 'datos_incompletos'::estado_expediente_conductor, 'documentos_pendientes'::estado_expediente_conductor, 'requiere_correccion'::estado_expediente_conductor]))))
 with check (((SELECT auth.uid()) = auth_user_id));
alter policy "solicitante_ve_su_solicitud" on "public"."solicitudes_conductor"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "tracking_salud_visible_para_participantes_y_admin" on "public"."tracking_salud_traslado"
 using ((es_admin() OR (EXISTS ( SELECT 1
   FROM ((traslados t
     LEFT JOIN conductores c ON ((c.id = t.conductor_id)))
     LEFT JOIN usuarios u ON ((u.id = t.usuario_id)))
  WHERE ((t.id = tracking_salud_traslado.traslado_id) AND ((c.auth_user_id = (SELECT auth.uid())) OR (u.auth_user_id = (SELECT auth.uid()))))))));
alter policy "usuario_actualiza_su_registro" on "public"."usuarios"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "usuario_crea_su_registro" on "public"."usuarios"
 with check (((SELECT auth.uid()) = auth_user_id));
alter policy "usuario_ve_su_registro" on "public"."usuarios"
 using (((SELECT auth.uid()) = auth_user_id));
alter policy "conductor_ve_su_verificacion_didit" on "public"."verificaciones_identidad_didit"
 using ((solicitud_id IN ( SELECT solicitudes_conductor.id
   FROM solicitudes_conductor
  WHERE (solicitudes_conductor.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_su_verificacion_didit" on "public"."verificaciones_identidad_didit"
 using ((usuario_id IN ( SELECT usuarios.id
   FROM usuarios
  WHERE (usuarios.auth_user_id = (SELECT auth.uid())))));
alter policy "conductor_ve_vehiculos_de_traslados_relevantes" on "public"."vehiculos"
 using (((EXISTS ( SELECT 1
   FROM conductores c
  WHERE (c.auth_user_id = (SELECT auth.uid())))) AND (id IN ( SELECT t.vehiculo_id
   FROM traslados t
  WHERE (((t.estado = 'pendiente_de_conductor'::estado_traslado) AND (t.conductor_id IS NULL) AND conductor_operativamente_aprobado()) OR (t.conductor_id IN ( SELECT c.id
           FROM conductores c
          WHERE (c.auth_user_id = (SELECT auth.uid())))))))));
alter policy "usuario_administra_sus_vehiculos" on "public"."vehiculos"
 using ((usuario_id IN ( SELECT usuarios.id
   FROM usuarios
  WHERE (usuarios.auth_user_id = (SELECT auth.uid())))));
alter policy "usuario_ve_sus_vehiculos" on "public"."vehiculos"
 using ((usuario_id IN ( SELECT usuarios.id
   FROM usuarios
  WHERE (usuarios.auth_user_id = (SELECT auth.uid())))));
