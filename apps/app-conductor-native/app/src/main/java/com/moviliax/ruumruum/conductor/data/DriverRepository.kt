package com.moviliax.ruumruum.conductor.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.OtpType
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.postgrest.query.filter.FilterOperator
import io.github.jan.supabase.storage.storage
import io.github.jan.supabase.functions.functions
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import java.io.File
import java.time.Instant
import java.util.UUID

class DriverRepository(
    private val supabase: SupabaseClient,
    private val syncManager: EvidenceSyncManager? = null,
) {
    suspend fun hasSession(): Boolean = supabase.auth.currentUserOrNull() != null

    suspend fun signIn(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signOut() = supabase.auth.signOut()

    // ── Registro ──────────────────────────────────────────────

    /** Crea la cuenta de conductor. Devuelve true si la sesión quedó activa (sin OTP). */
    suspend fun signUp(email: String, password: String): Boolean {
        supabase.auth.signUpWith(Email) {
            this.email = email.trim().lowercase()
            this.password = password
            this.data = buildJsonObject {
                put("tipo_registro", "conductor")
                put("version_registro", 2)
            }
        }
        return supabase.auth.currentSessionOrNull() != null
    }

    /** Confirma la cuenta con el código de 6 dígitos enviado al correo. */
    suspend fun verifySignupOtp(email: String, code: String) {
        supabase.auth.verifyEmailOtp(
            type = OtpType.Email.SIGNUP,
            email = email.trim().lowercase(),
            token = code.trim(),
        )
    }

    /** Reenvía el código de confirmación (flujo signup). */
    suspend fun resendSignupOtp(email: String) {
        supabase.auth.resendEmail(OtpType.Email.SIGNUP, email.trim().lowercase())
    }

    // ── Recuperación de acceso ────────────────────────────────

    /** Envía correo de recuperación (enlace + código según configuración del proyecto). */
    suspend fun sendPasswordReset(email: String) {
        supabase.auth.resetPasswordForEmail(email.trim().lowercase())
    }

    /** Valida el código de recuperación y deja la sesión lista para definir contraseña. */
    suspend fun verifyRecoveryOtp(email: String, code: String) {
        supabase.auth.verifyEmailOtp(
            type = OtpType.Email.RECOVERY,
            email = email.trim().lowercase(),
            token = code.trim(),
        )
    }

    /** Define la nueva contraseña (sesión de recuperación o sesión activa). */
    suspend fun updatePassword(password: String) {
        supabase.auth.updateUser {
            this.password = password
        }
    }

    // ── Solicitud de conductor (registro / recuperación de borrador) ──

    suspend fun iniciarSolicitud(): SolicitudResultado =
        supabase.postgrest.rpc("iniciar_solicitud_conductor")
            .decodeList<SolicitudResultado>().firstOrNull()
            ?: error("No pudimos iniciar la solicitud.")

    suspend fun solicitudActual(): SolicitudRow? {
        val uid = supabase.auth.currentUserOrNull()?.id ?: return null
        return supabase.from("solicitudes_conductor").select {
            filter { eq("auth_user_id", uid) }
            order("actualizado_en", Order.DESCENDING)
            limit(1)
        }.decodeSingleOrNull<SolicitudRow>()
    }

    suspend fun guardarBorrador(
        datosPersonales: JsonObject,
        domicilio: JsonObject,
        licencia: JsonObject,
        contactoEmergencia: JsonObject,
        pasoActual: Int,
    ): SolicitudResultado =
        supabase.postgrest.rpc(
            function = "guardar_borrador_conductor",
            parameters = buildJsonObject {
                put("p_paso_actual", pasoActual)
                put("p_datos_personales", datosPersonales)
                put("p_domicilio", domicilio)
                put("p_licencia", licencia)
                put("p_contacto_emergencia", contactoEmergencia)
            },
        ).decodeList<SolicitudResultado>().firstOrNull()
            ?: error("No pudimos guardar el borrador.")

    suspend fun registrarConsentimientos(
        solicitudId: String,
        tipos: List<String>,
        versionApp: String,
    ) {
        supabase.postgrest.rpc(
            function = "registrar_consentimientos_conductor",
            parameters = buildJsonObject {
                put("p_solicitud_id", solicitudId)
                putJsonArray("p_consentimientos") {
                    tipos.forEach { tipo ->
                        add(buildJsonObject { put("tipo_documento", tipo); put("version", 1) })
                    }
                }
                put("p_canal", "android")
                put("p_version_app", versionApp)
            },
        )
    }

    suspend fun enviarSolicitud(): SolicitudResultado =
        supabase.postgrest.rpc("enviar_solicitud_conductor")
            .decodeList<SolicitudResultado>().firstOrNull()
            ?: error("No pudimos enviar la solicitud.")

    /** Sube un documento del expediente de solicitud (objetivo = solicitud_id). */
    suspend fun uploadSolicitudDocument(
        solicitudId: String,
        type: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
        previousDocumentId: String?,
    ) = uploadTo(solicitudId, type, fileName, mimeType, bytes, previousDocumentId)

    suspend fun documentosSolicitud(solicitudId: String): List<DriverDocument> =
        supabase.from("documentos_conductor").select {
            filter { eq("solicitud_id", solicitudId) }
        }.decodeList()

    // ── Verificación Didit ────────────────────────────────────

    /** Inicia sesión Didit para una solicitud en revisión. Devuelve url y sessionId. */
    suspend fun iniciarVerificacionDidit(solicitudId: String): Pair<String, String?> {
        val response = supabase.functions.invoke("iniciar-verificacion-didit") {
            method = HttpMethod.Post
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject { put("solicitud_id", solicitudId) }.toString())
        }
        val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
        val url = (json["url"] ?: json["session_url"])?.jsonPrimitive?.contentOrNull
            ?: error("No se recibió una URL válida del servicio de verificación.")
        require(url.startsWith("https://")) { "No se recibió una URL válida del servicio de verificación." }
        val sessionId = (json["session_id"] ?: json["sessionId"])?.jsonPrimitive?.contentOrNull
        return url to sessionId
    }

    suspend fun estadoVerificacionDidit(solicitudId: String): VerificacionDiditRow? =
        supabase.from("verificaciones_identidad_didit").select {
            filter { eq("solicitud_id", solicitudId) }
            order("creado_en", Order.DESCENDING)
            limit(1)
        }.decodeSingleOrNull<VerificacionDiditRow>()

    // ── Modificación del expediente ───────────────────────────

    /**
     * Solicita cambios de perfil. Teléfono/domicilio/contacto se aplican
     * directo; identidad/CURP/licencia/foto van a revisión operativa.
     */
    suspend fun solicitarCambioExpediente(cambios: Map<String, String?>): ResultadoCambioExpediente {
        val payload = buildJsonObject {
            cambios.forEach { (clave, valor) ->
                if (valor == null) put(clave, JsonNull) else put(clave, valor)
            }
        }
        return supabase.postgrest.rpc(
            function = "solicitar_cambio_expediente_conductor",
            parameters = buildJsonObject { put("p_cambios", payload) },
        ).decodeAs<ResultadoCambioExpediente>()
    }

    suspend fun solicitudesCambio(conductorId: String): List<SolicitudCambioRow> =
        supabase.from("solicitudes_cambio_conductor").select {
            filter { eq("conductor_id", conductorId) }
            order("creado_en", Order.DESCENDING)
        }.decodeList()

    suspend fun cancelarSolicitudCambio(solicitudId: String) {
        supabase.postgrest.rpc(
            function = "cancelar_solicitud_cambio_conductor",
            parameters = buildJsonObject { put("p_solicitud_id", solicitudId) },
        )
    }

    // ── Certificación (Modelo 11) ─────────────────────────────

    suspend fun capacitaciones(conductorId: String): List<CapacitacionRow> =
        supabase.from("capacitaciones_conductor").select {
            filter { eq("conductor_id", conductorId) }
        }.decodeList()

    suspend fun tieneDatosBancarios(conductorId: String): Boolean {
        val row = supabase.from("datos_bancarios_conductor").select {
            filter { eq("conductor_id", conductorId) }
            limit(1)
        }.decodeSingleOrNull<JsonObject>()
        return row != null
    }

    // ── Notificaciones ────────────────────────────────────

    suspend fun notificaciones(conductorId: String): List<NotificacionConductor> =
        supabase.from("notificaciones_conductor").select {
            filter { eq("conductor_id", conductorId) }
            order("creado_en", Order.DESCENDING)
            limit(50)
        }.decodeList()

    suspend fun marcarNotificacionesLeidas(conductorId: String) {
        val ahora = Instant.now().toString()
        supabase.from("notificaciones_conductor").update(
            buildJsonObject { put("leida_en", ahora) },
        ) {
            filter {
                eq("conductor_id", conductorId)
                filter("leida_en", FilterOperator.IS, null)
            }
        }
    }

    suspend fun currentDriver(): Driver? {
        val userId = supabase.auth.currentUserOrNull()?.id ?: return null
        return supabase.from("conductores").select {
            filter { eq("auth_user_id", userId) }
            limit(1)
        }.decodeSingleOrNull<Driver>()
    }

    suspend fun availableTrips(): List<Trip> =
        supabase.from("pasaporte_digital").select {
            filter { eq("estado", "pendiente_de_conductor") }
        }.decodeList()

    suspend fun acceptedTrips(driverId: String): List<Trip> =
        supabase.from("pasaporte_digital").select {
            filter { eq("conductor_id", driverId) }
        }.decodeList()

    suspend fun payouts(driverId: String): List<Payout> =
        supabase.from("payouts_conductor").select {
            filter { eq("conductor_id", driverId) }
        }.decodeList()

    suspend fun documents(driverId: String): List<DriverDocument> =
        supabase.from("documentos_conductor").select {
            filter { eq("conductor_id", driverId) }
        }.decodeList()

    suspend fun uploadDocument(
        driverId: String,
        type: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
        previousDocumentId: String?,
    ) = uploadTo(driverId, type, fileName, mimeType, bytes, previousDocumentId)

    private suspend fun uploadTo(
        objetivoId: String,
        type: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
        previousDocumentId: String?,
    ) {
        require(type in DOCUMENT_TYPES) { "Tipo de documento inválido." }
        require(bytes.isNotEmpty() && bytes.size <= MAX_DOCUMENT_BYTES) { "El archivo debe pesar hasta 10 MB." }
        require(mimeType in DOCUMENT_MIME_TYPES) { "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }
        val boundary = "ruum-${UUID.randomUUID()}"
        val parts = formData {
            append("objetivo_id", objetivoId)
            append("tipo", type)
            if (!previousDocumentId.isNullOrBlank()) append("documento_anterior_id", previousDocumentId)
            append("archivo", bytes, Headers.build {
                append(HttpHeaders.ContentType, mimeType)
                append(HttpHeaders.ContentDisposition, "filename=\"${fileName.replace("\"", "")}" + "\"")
            })
        }
        supabase.functions.invoke(
            function = "validar-documento-conductor",
            body = MultiPartFormDataContent(parts, boundary),
            headers = Headers.build { append(HttpHeaders.ContentType, "multipart/form-data; boundary=$boundary") },
        )
    }

    suspend fun availability(driverId: String): Availability {
        val row = supabase.from("preferencias_conductor").select {
            filter { eq("conductor_id", driverId) }
            limit(1)
        }.decodeSingleOrNull<AvailabilityRow>()
        return if (row?.doNotDisturb == true) Availability.UNAVAILABLE else Availability.AVAILABLE
    }

    suspend fun setAvailability(driverId: String, availability: Availability) {
        require(availability != Availability.ON_TRIP)
        supabase.from("preferencias_conductor").upsert(
            AvailabilityRow(driverId, availability == Availability.UNAVAILABLE),
        ) { onConflict = "conductor_id" }
    }

    suspend fun requestTrip(tripId: String) {
        supabase.postgrest.rpc(
            function = "conductor_solicita_asignacion",
            parameters = buildJsonObject {
                put("p_traslado_id", tripId)
                put("p_lat", null as Double?)
                put("p_lng", null as Double?)
            },
        )
    }

    suspend fun evidencePhotos(tripId: String, type: String): List<EvidencePhoto> {
        val remotePhotos = runCatching {
            supabase.from("evidencia_fotos").select {
                filter {
                    eq("traslado_id", tripId)
                    eq("tipo", type)
                }
            }.decodeList<EvidencePhoto>()
        }.getOrDefault(emptyList())

        val localRecords = syncManager?.getLocalPhotos(tripId, type) ?: emptyList()
        val remoteAngles = remotePhotos.map { it.angulo }.toSet()

        val pendingPhotos = localRecords
            .filterNot { it.angle in remoteAngles }
            .map { record ->
                EvidencePhoto(
                    id = record.id,
                    tripId = record.tripId,
                    tipo = record.type,
                    angulo = record.angle,
                    url = record.filePath,
                    capturedAt = record.capturedAt,
                    sincronizada = record.synced,
                )
            }

        return remotePhotos + pendingPhotos
    }

    suspend fun captureEvidence(tripId: String, type: String, angle: String, bytes: ByteArray): Boolean {
        require(type == "inicial" || type == "final")
        require(angle in REQUIRED_EVIDENCE_ANGLES || angle == "dano_previo")
        val userId = supabase.auth.currentUserOrNull()?.id ?: error("Tu sesión terminó. Inicia sesión de nuevo.")

        // 1. Persistencia local inmediata (resiliencia offline)
        val localRecord = syncManager?.saveLocally(tripId, type, angle, bytes)
        val id = localRecord?.id ?: UUID.randomUUID().toString()
        val path = "$userId/$tripId/$type/$id-$angle.jpg"

        // 2. Intento de subida inmediata a Supabase
        return try {
            supabase.storage.from("evidencia").upload(path, bytes) { upsert = true }
            supabase.from("evidencia_fotos").upsert(
                EvidenceInsert(
                    id = id,
                    tripId = tripId,
                    tipo = type,
                    angulo = angle,
                    url = path,
                    capturedAt = localRecord?.capturedAt ?: Instant.now().toString(),
                ),
            )
            syncManager?.markAsSynced(id)
            true
        } catch (_: Exception) {
            // Sin conexión: queda asegurado en la cola local
            false
        }
    }

    suspend fun syncPendingEvidence(tripId: String? = null): SyncResult {
        val manager = syncManager ?: return SyncResult(0, 0, 0)
        val pending = manager.getPendingRecords(tripId)
        if (pending.isEmpty()) return SyncResult(0, 0, 0)

        val userId = supabase.auth.currentUserOrNull()?.id ?: return SyncResult(pending.size, 0, pending.size)
        var synced = 0
        var failed = 0

        for (record in pending) {
            val file = File(record.filePath)
            if (!file.exists()) {
                manager.removeRecord(record.id)
                continue
            }
            val path = "$userId/${record.tripId}/${record.type}/${record.id}-${record.angle}.jpg"
            val success = runCatching {
                val bytes = file.readBytes()
                supabase.storage.from("evidencia").upload(path, bytes) { upsert = true }
                supabase.from("evidencia_fotos").upsert(
                    EvidenceInsert(
                        id = record.id,
                        tripId = record.tripId,
                        tipo = record.type,
                        angulo = record.angle,
                        url = path,
                        capturedAt = record.capturedAt,
                    ),
                )
                manager.markAsSynced(record.id)
            }.isSuccess

            if (success) synced++ else failed++
        }

        return SyncResult(pending.size, synced, failed)
    }

    suspend fun pendingEvidenceCount(tripId: String? = null): Int =
        syncManager?.getPendingRecords(tripId)?.size ?: 0

    suspend fun advanceTrip(tripId: String, event: String) {
        require(event in ALLOWED_DRIVER_EVENTS) { "Acción no permitida." }
        supabase.postgrest.rpc(
            function = "conductor_avanza_traslado",
            parameters = buildJsonObject {
                put("p_traslado_id", tripId)
                put("p_evento", event)
            },
        )
    }

    suspend fun confirmDestinationArrival(tripId: String) {
        supabase.postgrest.rpc(
            function = "conductor_confirmar_llegada_destino",
            parameters = buildJsonObject {
                put("p_traslado_id", tripId)
                put("p_fuera_geocerca", false)
                put("p_distancia_m", null as Double?)
            },
        )
    }

    suspend fun confirmEvidence(tripId: String, type: String) {
        require(type == "inicial" || type == "final")
        // Intenta sincronizar pendientes antes de validar
        syncPendingEvidence(tripId)

        if (type == "inicial") {
            val paymentReady = supabase.postgrest.rpc(
                function = "traslado_tiene_metodo_pago_registrado",
                parameters = buildJsonObject { put("p_traslado_id", tripId) },
            ).decodeAs<Boolean>()
            check(paymentReady) {
                "No se puede completar el registro inicial: falta pago anticipado completado o método de pago al cierre."
            }
        }
        val photos = evidencePhotos(tripId, type)
        val capturedAngles = photos.map { it.angulo }.toSet()
        val missing = REQUIRED_EVIDENCE_ANGLES - capturedAngles
        check(missing.isEmpty()) { "Faltan fotografías obligatorias: ${missing.joinToString(", ")}." }

        val unsynced = photos.filterNot { it.sincronizada }
        check(unsynced.isEmpty()) {
            "Falta sincronizar ${unsynced.size} fotografía(s) a la nube. Conéctate a internet para completar el envío."
        }

        advanceTrip(tripId, if (type == "inicial") "evidencia_inicial_completada" else "evidencia_final_completada")
        if (type == "final") evaluateUnreportedDamage(tripId)
    }

    private suspend fun evaluateUnreportedDamage(tripId: String) {
        val initial = evidencePhotos(tripId, "inicial")
        val final = evidencePhotos(tripId, "final")
        if (final.none { it.angulo == "dano_previo" && it.sincronizada }) return
        if (initial.any { it.angulo == "dano_previo" && it.sincronizada }) return

        val openIncidents = supabase.from("incidencias").select {
            filter {
                eq("traslado_id", tripId)
                eq("resuelta", false)
            }
        }.decodeList<OpenIncidentSummary>()
        if (openIncidents.any { it.tipo != "dano_no_reportado" }) return

        supabase.postgrest.rpc(
            function = "crear_incidencia_sistema_dano_no_reportado",
            parameters = buildJsonObject {
                put("p_traslado_id", tripId)
                put(
                    "p_descripcion",
                    "El registro final del vehículo incluye daño visible que no aparece en el registro inicial y no fue reportado durante el traslado.",
                )
            },
        )
    }

    private companion object {
        const val MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
        val DOCUMENT_TYPES = setOf(
            "licencia_frente", "licencia_reverso", "identificacion_oficial",
            "constancia_situacion_fiscal", "documento_operativo",
        )
        val DOCUMENT_MIME_TYPES = setOf("image/jpeg", "image/png", "image/webp", "application/pdf")
        val REQUIRED_EVIDENCE_ANGLES = setOf("frente", "lado_piloto", "lado_copiloto", "trasera", "tablero")
        val ALLOWED_DRIVER_EVENTS = setOf(
            "conductor_en_camino", "llegada_origen", "iniciar_verificacion", "iniciar_evidencia_inicial",
            "evidencia_inicial_completada", "vehiculo_recibido", "iniciar_traslado", "llegada_destino",
            "iniciar_evidencia_final", "evidencia_final_completada", "confirmar_entrega", "cerrar_viaje",
        )
    }
}
