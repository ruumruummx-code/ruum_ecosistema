export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_capacidades": {
                  Row: {
                    "admin_id": string,"capacidad": string,"concedida": boolean,"creada_en": string,"motivo": string | null,"otorgada_por": string | null
                  }
                  Insert: {
                    "admin_id": string,"capacidad": string,"concedida"?: boolean,"creada_en"?: string,"motivo"?: string | null,"otorgada_por"?: string | null
                  }
                  Update: {
                    "admin_id"?: string,"capacidad"?: string,"concedida"?: boolean,"creada_en"?: string,"motivo"?: string | null,"otorgada_por"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_capacidades_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_capacidades_otorgada_por_fkey"
      columns: ["otorgada_por"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    }
                  ]
                },"admins": {
                  Row: {
                    "auth_user_id": string | null,"creado_en": string,"id": string,"nombre": string,"rol_operativo": Database["public"]['Enums']["rol_admin_operativo"]
                  }
                  Insert: {
                    "auth_user_id"?: string | null,"creado_en"?: string,"id"?: string,"nombre": string,"rol_operativo"?: Database["public"]['Enums']["rol_admin_operativo"]
                  }
                  Update: {
                    "auth_user_id"?: string | null,"creado_en"?: string,"id"?: string,"nombre"?: string,"rol_operativo"?: Database["public"]['Enums']["rol_admin_operativo"]
                  }
                  Relationships: [
                    
                  ]
                },"alertas_sla_historial": {
                  Row: {
                    "accion": string,"admin_id": string | null,"alerta_id": string,"comentario": string | null,"creado_en": string,"datos": NonNullable<Json>,"estado_anterior": string | null,"estado_nuevo": string | null,"id": string,"responsable_anterior": string | null,"responsable_nuevo": string | null
                  }
                  Insert: {
                    "accion": string,"admin_id"?: string | null,"alerta_id": string,"comentario"?: string | null,"creado_en"?: string,"datos"?: NonNullable<Json>,"estado_anterior"?: string | null,"estado_nuevo"?: string | null,"id"?: string,"responsable_anterior"?: string | null,"responsable_nuevo"?: string | null
                  }
                  Update: {
                    "accion"?: string,"admin_id"?: string | null,"alerta_id"?: string,"comentario"?: string | null,"creado_en"?: string,"datos"?: NonNullable<Json>,"estado_anterior"?: string | null,"estado_nuevo"?: string | null,"id"?: string,"responsable_anterior"?: string | null,"responsable_nuevo"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "alertas_sla_historial_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_historial_alerta_id_fkey"
      columns: ["alerta_id"]
isOneToOne: false
      referencedRelation: "alertas_sla_operacionales"
      referencedColumns: ["id"]
    }
                  ]
                },"alertas_sla_operacionales": {
                  Row: {
                    "actualizado_en": string,"acuse_en": string | null,"acuse_por_admin_id": string | null,"asignado_en": string | null,"asignado_por_admin_id": string | null,"categoria": string,"cerrado_en": string | null,"cerrado_por_admin_id": string | null,"creado_en": string,"dedupe_key": string,"descripcion": string,"entidad_id": string,"entidad_tipo": string,"escalado_en": string | null,"escalado_por_admin_id": string | null,"estado": string,"folio": string,"horas_limite": number,"horas_transcurridas": number,"id": string,"metadata": NonNullable<Json>,"notificacion_estado": string,"origen_creado_en": string,"porcentaje_consumido": number,"prioridad": number,"regla_id": string | null,"responsable": string | null,"resuelto_en": string | null,"resuelto_por_admin_id": string | null,"severidad": string,"sla_restante_horas": number,"traslado_id": string | null,"vence_en": string
                  }
                  Insert: {
                    "actualizado_en"?: string,"acuse_en"?: string | null,"acuse_por_admin_id"?: string | null,"asignado_en"?: string | null,"asignado_por_admin_id"?: string | null,"categoria": string,"cerrado_en"?: string | null,"cerrado_por_admin_id"?: string | null,"creado_en"?: string,"dedupe_key": string,"descripcion": string,"entidad_id": string,"entidad_tipo": string,"escalado_en"?: string | null,"escalado_por_admin_id"?: string | null,"estado"?: string,"folio": string,"horas_limite": number,"horas_transcurridas"?: number,"id"?: string,"metadata"?: NonNullable<Json>,"notificacion_estado"?: string,"origen_creado_en": string,"porcentaje_consumido"?: number,"prioridad"?: number,"regla_id"?: string | null,"responsable"?: string | null,"resuelto_en"?: string | null,"resuelto_por_admin_id"?: string | null,"severidad"?: string,"sla_restante_horas": number,"traslado_id"?: string | null,"vence_en"?: string
                  }
                  Update: {
                    "actualizado_en"?: string,"acuse_en"?: string | null,"acuse_por_admin_id"?: string | null,"asignado_en"?: string | null,"asignado_por_admin_id"?: string | null,"categoria"?: string,"cerrado_en"?: string | null,"cerrado_por_admin_id"?: string | null,"creado_en"?: string,"dedupe_key"?: string,"descripcion"?: string,"entidad_id"?: string,"entidad_tipo"?: string,"escalado_en"?: string | null,"escalado_por_admin_id"?: string | null,"estado"?: string,"folio"?: string,"horas_limite"?: number,"horas_transcurridas"?: number,"id"?: string,"metadata"?: NonNullable<Json>,"notificacion_estado"?: string,"origen_creado_en"?: string,"porcentaje_consumido"?: number,"prioridad"?: number,"regla_id"?: string | null,"responsable"?: string | null,"resuelto_en"?: string | null,"resuelto_por_admin_id"?: string | null,"severidad"?: string,"sla_restante_horas"?: number,"traslado_id"?: string | null,"vence_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alertas_sla_operacionales_acuse_por_admin_id_fkey"
      columns: ["acuse_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_asignado_por_admin_id_fkey"
      columns: ["asignado_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_cerrado_por_admin_id_fkey"
      columns: ["cerrado_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_escalado_por_admin_id_fkey"
      columns: ["escalado_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_regla_id_fkey"
      columns: ["regla_id"]
isOneToOne: false
      referencedRelation: "sla_reglas_operativas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_resuelto_por_admin_id_fkey"
      columns: ["resuelto_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "obs_tracking_fallos"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "pasaporte_digital"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "alertas_sla_operacionales_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "traslados"
      referencedColumns: ["id"]
    }
                  ]
                },"asignaciones": {
                  Row: {
                    "aceptada_en": string | null,"actualizado_en": string,"asignada_en": string,"cancelada_en": string | null,"completada_en": string | null,"conductor_id": string,"creado_en": string,"estado": Database["public"]['Enums']["estado_asignacion"],"gestionada_por": string | null,"id": string,"iniciada_en": string | null,"metadata": NonNullable<Json>,"motivo": string | null,"ofrecida_en": string | null,"origen": string,"puntaje": number | null,"rechazada_en": string | null,"traslado_id": string
                  }
                  Insert: {
                    "aceptada_en"?: string | null,"actualizado_en"?: string,"asignada_en"?: string,"cancelada_en"?: string | null,"completada_en"?: string | null,"conductor_id": string,"creado_en"?: string,"estado"?: Database["public"]['Enums']["estado_asignacion"],"gestionada_por"?: string | null,"id"?: string,"iniciada_en"?: string | null,"metadata"?: NonNullable<Json>,"motivo"?: string | null,"ofrecida_en"?: string | null,"origen"?: string,"puntaje"?: number | null,"rechazada_en"?: string | null,"traslado_id"?: string
                  }
                  Update: {
                    "aceptada_en"?: string | null,"actualizado_en"?: string,"asignada_en"?: string,"cancelada_en"?: string | null,"completada_en"?: string | null,"conductor_id"?: string,"creado_en"?: string,"estado"?: Database["public"]['Enums']["estado_asignacion"],"gestionada_por"?: string | null,"id"?: string,"iniciada_en"?: string | null,"metadata"?: NonNullable<Json>,"motivo"?: string | null,"ofrecida_en"?: string | null,"origen"?: string,"puntaje"?: number | null,"rechazada_en"?: string | null,"traslado_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "asignaciones_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores_publicos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "obs_tracking_fallos"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "asignaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "pasaporte_digital"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "asignaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "traslados"
      referencedColumns: ["id"]
    }
                  ]
                },"auditoria_admin_seguridad": {
                  Row: {
                    "accion": string | null,"admin_id": string | null,"auth_user_id": string | null,"creado_en": string,"datos": NonNullable<Json>,"id": string,"motivo": string | null,"recurso": string,"rol": string | null,"tipo": string
                  }
                  Insert: {
                    "accion"?: string | null,"admin_id"?: string | null,"auth_user_id"?: string | null,"creado_en"?: string,"datos"?: NonNullable<Json>,"id"?: string,"motivo"?: string | null,"recurso": string,"rol"?: string | null,"tipo": string
                  }
                  Update: {
                    "accion"?: string | null,"admin_id"?: string | null,"auth_user_id"?: string | null,"creado_en"?: string,"datos"?: NonNullable<Json>,"id"?: string,"motivo"?: string | null,"recurso"?: string,"rol"?: string | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "auditoria_admin_seguridad_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    }
                  ]
                },"calificaciones_traslado": {
                  Row: {
                    "calificado_en": string,"comentario": string | null,"conductor_id": string,"estrellas": number,"traslado_id": string
                  }
                  Insert: {
                    "calificado_en"?: string,"comentario"?: string | null,"conductor_id": string,"estrellas": number,"traslado_id": string
                  }
                  Update: {
                    "calificado_en"?: string,"comentario"?: string | null,"conductor_id"?: string,"estrellas"?: number,"traslado_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calificaciones_traslado_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calificaciones_traslado_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores_publicos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calificaciones_traslado_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: true
      referencedRelation: "obs_tracking_fallos"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "calificaciones_traslado_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: true
      referencedRelation: "pasaporte_digital"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "calificaciones_traslado_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: true
      referencedRelation: "traslados"
      referencedColumns: ["id"]
    }
                  ]
                },"capacitaciones_conductor": {
                  Row: {
                    "actualizado_en": string,"conductor_id": string,"creado_en": string,"curso": string,"estado": string,"id": string,"puntaje": number | null
                  }
                  Insert: {
                    "actualizado_en"?: string,"conductor_id": string,"creado_en"?: string,"curso": string,"estado"?: string,"id"?: string,"puntaje"?: number | null
                  }
                  Update: {
                    "actualizado_en"?: string,"conductor_id"?: string,"creado_en"?: string,"curso"?: string,"estado"?: string,"id"?: string,"puntaje"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "capacitaciones_conductor_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "capacitaciones_conductor_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores_publicos"
      referencedColumns: ["id"]
    }
                  ]
                },"cargas_traslados_masivos": {
                  Row: {
                    "cancelado_en": string | null,"cancelado_por": string | null,"creado_en": string,"creado_por_admin_id": string | null,"empresa_id": string | null,"estado": string,"filas_creadas": number,"filas_error": number,"filas_procesadas": number,"finalizado_en": string | null,"hash_archivo": string | null,"id": string,"iniciado_en": string | null,"mensaje_estado": string | null,"mime_type": string | null,"nombre_archivo": string,"operation_id": string | null,"reporte_errores_csv": string | null,"tamano_bytes": number,"total_filas": number,"usuario_id": string
                  }
                  Insert: {
                    "cancelado_en"?: string | null,"cancelado_por"?: string | null,"creado_en"?: string,"creado_por_admin_id"?: string | null,"empresa_id"?: string | null,"estado"?: string,"filas_creadas"?: number,"filas_error"?: number,"filas_procesadas"?: number,"finalizado_en"?: string | null,"hash_archivo"?: string | null,"id"?: string,"iniciado_en"?: string | null,"mensaje_estado"?: string | null,"mime_type"?: string | null,"nombre_archivo": string,"operation_id"?: string | null,"reporte_errores_csv"?: string | null,"tamano_bytes"?: number,"total_filas"?: number,"usuario_id": string
                  }
                  Update: {
                    "cancelado_en"?: string | null,"cancelado_por"?: string | null,"creado_en"?: string,"creado_por_admin_id"?: string | null,"empresa_id"?: string | null,"estado"?: string,"filas_creadas"?: number,"filas_error"?: number,"filas_procesadas"?: number,"finalizado_en"?: string | null,"hash_archivo"?: string | null,"id"?: string,"iniciado_en"?: string | null,"mensaje_estado"?: string | null,"mime_type"?: string | null,"nombre_archivo"?: string,"operation_id"?: string | null,"reporte_errores_csv"?: string | null,"tamano_bytes"?: number,"total_filas"?: number,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cargas_traslados_masivos_cancelado_por_fkey"
      columns: ["cancelado_por"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cargas_traslados_masivos_creado_por_admin_id_fkey"
      columns: ["creado_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cargas_traslados_masivos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cargas_traslados_masivos_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: false
      referencedRelation: "operaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cargas_traslados_masivos_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"catalogo_vehiculos_tarifa": {
                  Row: {
                    "categoria_tarifa": Database["public"]['Enums']["categoria_tarifa_vehiculo"],"gama": Database["public"]['Enums']["gama_vehiculo"],"id": string,"marca": string,"modelo": string
                  }
                  Insert: {
                    "categoria_tarifa": Database["public"]['Enums']["categoria_tarifa_vehiculo"],"gama": Database["public"]['Enums']["gama_vehiculo"],"id"?: string,"marca": string,"modelo": string
                  }
                  Update: {
                    "categoria_tarifa"?: Database["public"]['Enums']["categoria_tarifa_vehiculo"],"gama"?: Database["public"]['Enums']["gama_vehiculo"],"id"?: string,"marca"?: string,"modelo"?: string
                  }
                  Relationships: [
                    
                  ]
                },"certificacion_pago_conductor": {
                  Row: {
                    "actualizado_en": string,"actualizado_por_admin_id": string | null,"certificacion": Database["public"]['Enums']["certificacion_conductor"],"porcentaje": number
                  }
                  Insert: {
                    "actualizado_en"?: string,"actualizado_por_admin_id"?: string | null,"certificacion": Database["public"]['Enums']["certificacion_conductor"],"porcentaje": number
                  }
                  Update: {
                    "actualizado_en"?: string,"actualizado_por_admin_id"?: string | null,"certificacion"?: Database["public"]['Enums']["certificacion_conductor"],"porcentaje"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificacion_pago_conductor_actualizado_por_admin_id_fkey"
      columns: ["actualizado_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    }
                  ]
                },"certificaciones_operativas_conductor": {
                  Row: {
                    "conductor_id": string,"creada_en": string,"id": string,"revocada_en": string | null,"tipo": string,"vigente_desde": string,"vigente_hasta": string | null
                  }
                  Insert: {
                    "conductor_id": string,"creada_en"?: string,"id"?: string,"revocada_en"?: string | null,"tipo": string,"vigente_desde"?: string,"vigente_hasta"?: string | null
                  }
                  Update: {
                    "conductor_id"?: string,"creada_en"?: string,"id"?: string,"revocada_en"?: string | null,"tipo"?: string,"vigente_desde"?: string,"vigente_hasta"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificaciones_operativas_conductor_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificaciones_operativas_conductor_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores_publicos"
      referencedColumns: ["id"]
    }
                  ]
                },"checkout_traslados_masivos": {
                  Row: {
                    "auth_user_id": string,"carga_id": string | null,"cotizaciones": NonNullable<Json>,"creado_en": string,"filas": NonNullable<Json>,"id": string,"monto_centavos": number,"pagado_en": string | null,"stripe_payment_intent_id": string | null
                  }
                  Insert: {
                    "auth_user_id": string,"carga_id"?: string | null,"cotizaciones": NonNullable<Json>,"creado_en"?: string,"filas": NonNullable<Json>,"id": string,"monto_centavos": number,"pagado_en"?: string | null,"stripe_payment_intent_id"?: string | null
                  }
                  Update: {
                    "auth_user_id"?: string,"carga_id"?: string | null,"cotizaciones"?: NonNullable<Json>,"creado_en"?: string,"filas"?: NonNullable<Json>,"id"?: string,"monto_centavos"?: number,"pagado_en"?: string | null,"stripe_payment_intent_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "checkout_traslados_masivos_carga_id_fkey"
      columns: ["carga_id"]
isOneToOne: false
      referencedRelation: "cargas_traslados_masivos"
      referencedColumns: ["id"]
    }
                  ]
                },"claves_idempotencia": {
                  Row: {
                    "clave": string,"creado_en": string,"entidad": string,"entidad_id": string | null,"expira_en": string,"id": string,"resultado": Json | null
                  }
                  Insert: {
                    "clave": string,"creado_en"?: string,"entidad": string,"entidad_id"?: string | null,"expira_en"?: string,"id"?: string,"resultado"?: Json | null
                  }
                  Update: {
                    "clave"?: string,"creado_en"?: string,"entidad"?: string,"entidad_id"?: string | null,"expira_en"?: string,"id"?: string,"resultado"?: Json | null
                  }
                  Relationships: [
                    
                  ]
                },"competencias_asignacion": {
                  Row: {
                    "abierta_en": string,"cierra_en": string,"conductor_seleccionado_id": string | null,"detalle_resolucion": NonNullable<Json>,"estado": string,"id": string,"politica_version": number,"resuelta_en": string | null,"traslado_id": string
                  }
                  Insert: {
                    "abierta_en"?: string,"cierra_en": string,"conductor_seleccionado_id"?: string | null,"detalle_resolucion"?: NonNullable<Json>,"estado"?: string,"id"?: string,"politica_version": number,"resuelta_en"?: string | null,"traslado_id": string
                  }
                  Update: {
                    "abierta_en"?: string,"cierra_en"?: string,"conductor_seleccionado_id"?: string | null,"detalle_resolucion"?: NonNullable<Json>,"estado"?: string,"id"?: string,"politica_version"?: number,"resuelta_en"?: string | null,"traslado_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "competencias_asignacion_conductor_seleccionado_id_fkey"
      columns: ["conductor_seleccionado_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competencias_asignacion_conductor_seleccionado_id_fkey"
      columns: ["conductor_seleccionado_id"]
isOneToOne: false
      referencedRelation: "conductores_publicos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competencias_asignacion_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "obs_tracking_fallos"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "competencias_asignacion_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "pasaporte_digital"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "competencias_asignacion_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "traslados"
      referencedColumns: ["id"]
    }
                  ]
                },"conductores": {
                  Row: {
                    "actualizado_en": string,"auth_user_id": string | null,"autoriza_verificacion_antecedentes": boolean,"calificacion_promedio": number,"calle": string | null,"cancelaciones_sin_justificacion_count": number,"capacitacion_aprobada": boolean,"certificacion_pago": Database["public"]['Enums']["certificacion_conductor"],"ciudad_municipio": string | null,"codigo_postal": string | null,"colonia": string | null,"contacto_emergencia_nombre": string | null,"contacto_emergencia_telefono": string | null,"creado_en": string,"curp": string | null,"declara_sin_suspensiones": boolean,"documentos_vigentes": boolean,"empresa_id": string | null,"estado": Database["public"]['Enums']["estado_conductor"],"estado_expediente": Database["public"]['Enums']["estado_expediente_conductor"],"estado_residencia": string | null,"evaluacion_practica_aprobada": boolean,"foto_perfil_url": string | null,"id": string,"identidad_validada": boolean,"incidencias_graves_12m": number,"incidencias_graves_6m": number,"licencia_numero": string | null,"licencia_tipo": string | null,"licencia_validada": boolean,"licencia_vigencia": string | null,"licencia_vigente": boolean,"marca_terminos": string | null,"nivel_certificacion": number,"nivel_operativo_vigente": Database["public"]['Enums']["nivel_concer"] | null,"nivel_por_calificacion": Database["public"]['Enums']["nivel_concer"],"nivel_por_experiencia": Database["public"]['Enums']["nivel_concer"],"no_presentaciones_6m": number,"nombre": string,"numero": string | null,"prueba_manejo_aprobada": boolean,"referencias": string | null,"suspensiones_activas": number,"telefono": string | null,"terminos_aceptados_en": string | null,"traslados_completados": number,"version": number,"version_terminos_aceptada": number | null
                  }
                  Insert: {
                    "actualizado_en"?: string,"auth_user_id"?: string | null,"autoriza_verificacion_antecedentes"?: boolean,"calificacion_promedio"?: number,"calle"?: string | null,"cancelaciones_sin_justificacion_count"?: number,"capacitacion_aprobada"?: boolean,"certificacion_pago"?: Database["public"]['Enums']["certificacion_conductor"],"ciudad_municipio"?: string | null,"codigo_postal"?: string | null,"colonia"?: string | null,"contacto_emergencia_nombre"?: string | null,"contacto_emergencia_telefono"?: string | null,"creado_en"?: string,"curp"?: string | null,"declara_sin_suspensiones"?: boolean,"documentos_vigentes"?: boolean,"empresa_id"?: string | null,"estado"?: Database["public"]['Enums']["estado_conductor"],"estado_expediente"?: Database["public"]['Enums']["estado_expediente_conductor"],"estado_residencia"?: string | null,"evaluacion_practica_aprobada"?: boolean,"foto_perfil_url"?: string | null,"id"?: string,"identidad_validada"?: boolean,"incidencias_graves_12m"?: number,"incidencias_graves_6m"?: number,"licencia_numero"?: string | null,"licencia_tipo"?: string | null,"licencia_validada"?: boolean,"licencia_vigencia"?: string | null,"licencia_vigente"?: boolean,"marca_terminos"?: string | null,"nivel_certificacion"?: number,"nivel_operativo_vigente"?: never,"nivel_por_calificacion"?: Database["public"]['Enums']["nivel_concer"],"nivel_por_experiencia"?: Database["public"]['Enums']["nivel_concer"],"no_presentaciones_6m"?: number,"nombre": string,"numero"?: string | null,"prueba_manejo_aprobada"?: boolean,"referencias"?: string | null,"suspensiones_activas"?: number,"telefono"?: string | null,"terminos_aceptados_en"?: string | null,"traslados_completados"?: number,"version"?: number,"version_terminos_aceptada"?: number | null
                  }
                  Update: {
                    "actualizado_en"?: string,"auth_user_id"?: string | null,"autoriza_verificacion_antecedentes"?: boolean,"calificacion_promedio"?: number,"calle"?: string | null,"cancelaciones_sin_justificacion_count"?: number,"capacitacion_aprobada"?: boolean,"certificacion_pago"?: Database["public"]['Enums']["certificacion_conductor"],"ciudad_municipio"?: string | null,"codigo_postal"?: string | null,"colonia"?: string | null,"contacto_emergencia_nombre"?: string | null,"contacto_emergencia_telefono"?: string | null,"creado_en"?: string,"curp"?: string | null,"declara_sin_suspensiones"?: boolean,"documentos_vigentes"?: boolean,"empresa_id"?: string | null,"estado"?: Database["public"]['Enums']["estado_conductor"],"estado_expediente"?: Database["public"]['Enums']["estado_expediente_conductor"],"estado_residencia"?: string | null,"evaluacion_practica_aprobada"?: boolean,"foto_perfil_url"?: string | null,"id"?: string,"identidad_validada"?: boolean,"incidencias_graves_12m"?: number,"incidencias_graves_6m"?: number,"licencia_numero"?: string | null,"licencia_tipo"?: string | null,"licencia_validada"?: boolean,"licencia_vigencia"?: string | null,"licencia_vigente"?: boolean,"marca_terminos"?: string | null,"nivel_certificacion"?: number,"nivel_operativo_vigente"?: never,"nivel_por_calificacion"?: Database["public"]['Enums']["nivel_concer"],"nivel_por_experiencia"?: Database["public"]['Enums']["nivel_concer"],"no_presentaciones_6m"?: number,"nombre"?: string,"numero"?: string | null,"prueba_manejo_aprobada"?: boolean,"referencias"?: string | null,"suspensiones_activas"?: number,"telefono"?: string | null,"terminos_aceptados_en"?: string | null,"traslados_completados"?: number,"version"?: number,"version_terminos_aceptada"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "conductores_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"configuracion_admin": {
                  Row: {
                    "actualizada_en": string,"actualizada_por": string | null,"categoria": string,"clave": string,"descripcion": string,"nombre": string,"valor": NonNullable<Json>,"version": number
                  }
                  Insert: {
                    "actualizada_en"?: string,"actualizada_por"?: string | null,"categoria": string,"clave": string,"descripcion"?: string,"nombre": string,"valor"?: NonNullable<Json>,"version"?: number
                  }
                  Update: {
                    "actualizada_en"?: string,"actualizada_por"?: string | null,"categoria"?: string,"clave"?: string,"descripcion"?: string,"nombre"?: string,"valor"?: NonNullable<Json>,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "configuracion_admin_actualizada_por_fkey"
      columns: ["actualizada_por"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    }
                  ]
                },"configuracion_contactos_soporte": {
                  Row: {
                    "actualizado_en": string,"ambiente": string,"emergencia_telefono": string,"soporte_correo": string,"soporte_telefono": string
                  }
                  Insert: {
                    "actualizado_en"?: string,"ambiente": string,"emergencia_telefono": string,"soporte_correo": string,"soporte_telefono": string
                  }
                  Update: {
                    "actualizado_en"?: string,"ambiente"?: string,"emergencia_telefono"?: string,"soporte_correo"?: string,"soporte_telefono"?: string
                  }
                  Relationships: [
                    
                  ]
                },"consentimientos_usuario": {
                  Row: {
                    "aceptado_en": string,"auth_user_id": string,"canal": string,"hash_documento": string,"id": string,"solicitud_id": string | null,"tipo_documento": Database["public"]['Enums']["tipo_documento_consentimiento"],"version": number,"version_app": string
                  }
                  Insert: {
                    "aceptado_en"?: string,"auth_user_id": string,"canal": string,"hash_documento": string,"id"?: string,"solicitud_id"?: string | null,"tipo_documento": Database["public"]['Enums']["tipo_documento_consentimiento"],"version": number,"version_app": string
                  }
                  Update: {
                    "aceptado_en"?: string,"auth_user_id"?: string,"canal"?: string,"hash_documento"?: string,"id"?: string,"solicitud_id"?: string | null,"tipo_documento"?: Database["public"]['Enums']["tipo_documento_consentimiento"],"version"?: number,"version_app"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consentimientos_usuario_solicitud_id_fkey"
      columns: ["solicitud_id"]
isOneToOne: false
      referencedRelation: "solicitudes_conductor"
      referencedColumns: ["id"]
    }
                  ]
                },"cotizaciones": {
                  Row: {
                    "aceptada_en": string | null,"emitida_en": string,"emitida_por_admin_id": string | null,"estado": string,"expira_en": string | null,"id": string,"moneda": string,"politica_tarifa_version": number | null,"precio": number,"reglas_snapshot": NonNullable<Json>,"traslado_id": string,"version": number
                  }
                  Insert: {
                    "aceptada_en"?: string | null,"emitida_en"?: string,"emitida_por_admin_id"?: string | null,"estado"?: string,"expira_en"?: string | null,"id"?: string,"moneda"?: string,"politica_tarifa_version"?: number | null,"precio": number,"reglas_snapshot"?: NonNullable<Json>,"traslado_id": string,"version": number
                  }
                  Update: {
                    "aceptada_en"?: string | null,"emitida_en"?: string,"emitida_por_admin_id"?: string | null,"estado"?: string,"expira_en"?: string | null,"id"?: string,"moneda"?: string,"politica_tarifa_version"?: number | null,"precio"?: number,"reglas_snapshot"?: NonNullable<Json>,"traslado_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cotizaciones_emitida_por_admin_id_fkey"
      columns: ["emitida_por_admin_id"]
isOneToOne: false
      referencedRelation: "admins"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizaciones_politica_tarifa_version_fkey"
      columns: ["politica_tarifa_version"]
isOneToOne: false
      referencedRelation: "tarifas_politica_versiones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "obs_tracking_fallos"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "cotizaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "pasaporte_digital"
      referencedColumns: ["traslado_id"]
    },{
      foreignKeyName: "cotizaciones_traslado_id_fkey"
      columns: ["traslado_id"]
isOneToOne: false
      referencedRelation: "traslados"
      referencedColumns: ["id"]
    }
                  ]
                },"custodia_evento_fotos": {
                  Row: {
                    "evento_id": string,"foto_id": string
                  }
                  Insert: {
                    "evento_id": string,"foto_id": string
                  }
                  Update: {
                    "evento_id"?: string,"foto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "custodia_evento_fotos_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "custodia_eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "custodia_evento_fotos_foto_id_fkey"
      columns: ["foto_id"]
isOneToOne: false
      referencedRelation: "evidencia_fotos"
      referencedColumns: ["id"]
    }
                  ]
                },"custodia_eventos": {
                  Row: {
                    "actor_id": string | null,"actor_tipo": string,"combustible": string | null,"creado_en": string,"firma_metodo": string | null,"firma_referencia": string | null,"hash_cadena": string,"id": string,"inspeccion_id": string | null,"lat": number | null,"lng": number | null,"metadata": NonNullable<Json>,"n_orden": number,"notas": string | null,"ocurrido_en": string,"odometro": number | null,"pin_verificado": boolean,"prev_hash": string,"tipo": Database["public"]['Enums']["tipo_evento_custodia"],"traslado_id": string,"vehiculo_id": string | null
                  }
                  Insert: {
                    "actor_id"?: string | null,"actor_tipo"?: string,"combustible"?: string | null,"creado_en"?: string,"firma_metodo"?: string | null,"firma_referencia"?: string | null,"hash_cadena"?: string,"id"?: string,"inspeccion_id"?: string | null,"lat"?: number | null,"lng"?: number | null,"metadata"?: NonNullable<Json>,"n_orden"?: never,"notas"?: string | null,"ocurrido_en"?: string,"odometro"?: number | null,"pin_verificado"?: boolean,"prev_hash"?: string,"tipo": Database["public"]['Enums']["tipo_eventOmitting rest for brevity...