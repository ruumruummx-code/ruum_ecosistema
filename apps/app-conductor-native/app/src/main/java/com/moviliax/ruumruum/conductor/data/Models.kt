package com.moviliax.ruumruum.conductor.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Driver(
    val id: String,
    @SerialName("auth_user_id") val authUserId: String? = null,
    val nombre: String,
    val telefono: String? = null,
    val estado: String,
    @SerialName("estado_expediente") val estadoExpediente: String,
    @SerialName("licencia_vigencia") val licenciaVigencia: String? = null,
    @SerialName("documentos_vigentes") val documentosVigentes: Boolean = false,
    @SerialName("traslados_completados") val trasladosCompletados: Int = 0,
    @SerialName("calificacion_promedio") val calificacionPromedio: Double = 0.0,
    // Modelo 11 — columnas de certificación (con default para BD sin migrar).
    @SerialName("nivel_certificacion") val nivelCertificacion: Int = 1,
    @SerialName("identidad_validada") val identidadValidada: Boolean = false,
    @SerialName("licencia_validada") val licenciaValidada: Boolean = false,
    @SerialName("capacitacion_aprobada") val capacitacionAprobada: Boolean = false,
    @SerialName("evaluacion_practica_aprobada") val evaluacionPracticaAprobada: Boolean = false,
    @SerialName("prueba_manejo_aprobada") val pruebaManejoAprobada: Boolean = false,
)

@Serializable
data class Trip(
    @SerialName("traslado_id") val id: String? = null,
    val estado: String? = null,
    @SerialName("conductor_id") val conductorId: String? = null,
    @SerialName("origen_ciudad") val origenCiudad: String? = null,
    @SerialName("origen_direccion") val origenDireccion: String? = null,
    @SerialName("destino_ciudad") val destinoCiudad: String? = null,
    @SerialName("destino_direccion") val destinoDireccion: String? = null,
    @SerialName("distancia_km") val distanciaKm: Double? = null,
    @SerialName("tiempo_estimado_horas") val tiempoEstimadoHoras: Double? = null,
    @SerialName("ganancia_conductor") val gananciaConductor: Double? = null,
    @SerialName("precio_cotizado") val precioCotizado: Double? = null,
    @SerialName("precio_final") val precioFinal: Double? = null,
    @SerialName("creado_en") val creadoEn: String? = null,
    @SerialName("vehiculo_marca") val vehiculoMarca: String? = null,
    @SerialName("vehiculo_modelo") val vehiculoModelo: String? = null,
    @SerialName("vehiculo_anio") val vehiculoAnio: Int? = null,
    @SerialName("vehiculo_tipo") val vehiculoTipo: String? = null,
    @SerialName("tiene_incidencia_abierta") val tieneIncidenciaAbierta: Boolean? = null,
)

@Serializable
data class Payout(
    val id: String,
    @SerialName("conductor_id") val conductorId: String,
    val estado: String,
    @SerialName("monto_bruto") val montoBruto: Double,
    @SerialName("monto_neto") val montoNeto: Double,
    val ajustes: Double,
    @SerialName("periodo_inicio") val periodoInicio: String,
    @SerialName("periodo_fin") val periodoFin: String,
    @SerialName("procesado_en") val procesadoEn: String? = null,
    @SerialName("referencia_pago") val referenciaPago: String? = null,
)

@Serializable
data class DriverDocument(
    val id: String,
    val tipo: String,
    val estado: String,
    @SerialName("nombre_archivo") val nombreArchivo: String,
    @SerialName("expira_en") val expiraEn: String? = null,
    @SerialName("motivo_rechazo") val motivoRechazo: String? = null,
    @SerialName("es_actual") val esActual: Boolean = true,
    @SerialName("version") val version: Int = 1,
    @SerialName("notas_admin") val notasAdmin: String? = null,
    @SerialName("creado_en") val creadoEn: String? = null,
)

@Serializable
data class EvidencePhoto(
    val id: String,
    @SerialName("traslado_id") val tripId: String,
    val tipo: String,
    val angulo: String,
    val url: String? = null,
    @SerialName("capturada_en") val capturedAt: String,
    val sincronizada: Boolean = true,
)

@Serializable
data class EvidenceInsert(
    val id: String,
    @SerialName("traslado_id") val tripId: String,
    val tipo: String,
    val angulo: String,
    val url: String,
    @SerialName("capturada_en") val capturedAt: String,
    val sincronizada: Boolean = true,
)

@Serializable
data class OpenIncidentSummary(
    val tipo: String,
)

@Serializable
internal data class AvailabilityRow(
    @SerialName("conductor_id") val conductorId: String,
    @SerialName("modo_no_molestar") val doNotDisturb: Boolean,
)

/** Fila devuelta por iniciar/guardar/enviar solicitud de conductor. */
@Serializable
data class SolicitudResultado(
    @SerialName("solicitud_id") val solicitudId: String? = null,
    @SerialName("conductor_id") val conductorId: String? = null,
    val estado: String? = null,
    @SerialName("paso_actual") val pasoActual: Int = 0,
)

/** Expediente de solicitud para borrador y recuperación. */
@Serializable
data class SolicitudRow(
    val id: String,
    val estado: String,
    @SerialName("paso_actual") val pasoActual: Int = 1,
    @SerialName("datos_personales") val datosPersonales: kotlinx.serialization.json.JsonObject = kotlinx.serialization.json.JsonObject(emptyMap()),
    val domicilio: kotlinx.serialization.json.JsonObject = kotlinx.serialization.json.JsonObject(emptyMap()),
    val licencia: kotlinx.serialization.json.JsonObject = kotlinx.serialization.json.JsonObject(emptyMap()),
    @SerialName("contacto_emergencia") val contactoEmergencia: kotlinx.serialization.json.JsonObject = kotlinx.serialization.json.JsonObject(emptyMap()),
)

/** Respuesta de solicitar_cambio_expediente_conductor. */
@Serializable
data class ResultadoCambioExpediente(
    @SerialName("solicitud_id") val solicitudId: String? = null,
    val estado: String = "",
    val tipo: String = "",
    val mensaje: String = "",
)

@Serializable
data class SolicitudCambioRow(
    val id: String,
    @SerialName("conductor_id") val conductorId: String,
    val tipo: String,
    val estado: String,
    @SerialName("creado_en") val creadoEn: String,
    @SerialName("motivo_rechazo") val motivoRechazo: String? = null,
)

/** Fila de capacitaciones_conductor (MCE). */
@Serializable
data class CapacitacionRow(
    val id: String,
    val curso: String,
    val estado: String,
    val puntaje: Double? = null,
)

/** Última verificación Didit de una solicitud. */
@Serializable
data class VerificacionDiditRow(
    val id: String,
    @SerialName("session_id") val sessionId: String? = null,
    val estado: String,
)

enum class Availability { AVAILABLE, UNAVAILABLE, ON_TRIP }
