package com.moviliax.ruumruum.conductor.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage
import io.github.jan.supabase.functions.functions
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.Instant
import java.util.UUID

class DriverRepository(private val supabase: SupabaseClient) {
    suspend fun hasSession(): Boolean = supabase.auth.currentUserOrNull() != null

    suspend fun signIn(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signOut() = supabase.auth.signOut()

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
    ) {
        require(type in DOCUMENT_TYPES) { "Tipo de documento inválido." }
        require(bytes.isNotEmpty() && bytes.size <= MAX_DOCUMENT_BYTES) { "El archivo debe pesar hasta 10 MB." }
        require(mimeType in DOCUMENT_MIME_TYPES) { "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }
        val boundary = "ruum-${UUID.randomUUID()}"
        val parts = formData {
            append("objetivo_id", driverId)
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

    suspend fun evidencePhotos(tripId: String, type: String): List<EvidencePhoto> =
        supabase.from("evidencia_fotos").select {
            filter {
                eq("traslado_id", tripId)
                eq("tipo", type)
            }
        }.decodeList()

    suspend fun captureEvidence(tripId: String, type: String, angle: String, bytes: ByteArray) {
        require(type == "inicial" || type == "final")
        require(angle in REQUIRED_EVIDENCE_ANGLES || angle == "dano_previo")
        val userId = supabase.auth.currentUserOrNull()?.id ?: error("Tu sesión terminó. Inicia sesión de nuevo.")
        val id = UUID.randomUUID().toString()
        val path = "$userId/$tripId/$type/$id-$angle.jpg"
        supabase.storage.from("evidencia").upload(path, bytes) { upsert = false }
        supabase.from("evidencia_fotos").insert(
            EvidenceInsert(
                id = id,
                tripId = tripId,
                tipo = type,
                angulo = angle,
                url = path,
                capturedAt = Instant.now().toString(),
            ),
        )
    }

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
        if (type == "inicial") {
            val paymentReady = supabase.postgrest.rpc(
                function = "traslado_tiene_metodo_pago_registrado",
                parameters = buildJsonObject { put("p_traslado_id", tripId) },
            ).decodeAs<Boolean>()
            check(paymentReady) {
                "No se puede completar el registro inicial: falta pago anticipado completado o método de pago al cierre."
            }
        }
        val captured = evidencePhotos(tripId, type)
            .filter { it.sincronizada }
            .map { it.angulo }
            .toSet()
        val missing = REQUIRED_EVIDENCE_ANGLES - captured
        check(missing.isEmpty()) { "Faltan fotografías obligatorias: ${missing.joinToString(", ")}." }

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
