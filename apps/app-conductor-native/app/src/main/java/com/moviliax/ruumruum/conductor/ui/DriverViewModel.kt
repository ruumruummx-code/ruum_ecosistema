package com.moviliax.ruumruum.conductor.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moviliax.ruumruum.conductor.core.SupabaseProvider
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.Driver
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.data.DriverRepository
import com.moviliax.ruumruum.conductor.data.EvidencePhoto
import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.CapacitacionRow
import com.moviliax.ruumruum.conductor.data.NotificacionConductor
import com.moviliax.ruumruum.conductor.data.SolicitudCambioRow
import com.moviliax.ruumruum.conductor.data.SolicitudResultado
import com.moviliax.ruumruum.conductor.data.SolicitudRow
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.data.VerificacionDiditRow
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DriverUiState(
    val checkingSession: Boolean = true,
    val configured: Boolean = SupabaseProvider.isConfigured,
    val signedIn: Boolean = false,
    val loading: Boolean = false,
    val driver: Driver? = null,
    val availability: Availability = Availability.UNAVAILABLE,
    val availableTrips: List<Trip> = emptyList(),
    val acceptedTrips: List<Trip> = emptyList(),
    val payouts: List<Payout> = emptyList(),
    val documents: List<DriverDocument> = emptyList(),
    val evidenceTripId: String? = null,
    val evidenceType: String? = null,
    val evidencePhotos: List<EvidencePhoto> = emptyList(),
    val evidenceLoading: Boolean = false,
    val evidenceSaving: Boolean = false,
    val uploadingDocumentType: String? = null,
    val error: String? = null,
    val notice: String? = null,
    // Registro / recuperación
    val needsOnboarding: Boolean = false,
    val signupNeedsOtp: Boolean = false,
    val signupEmail: String = "",
    val signupTelefono: String = "",
    val solicitud: SolicitudRow? = null,
    val solicitudDocumentos: List<DriverDocument> = emptyList(),
    val diditUrl: String? = null,
    val diditLoading: Boolean = false,
    val verificacionDidit: VerificacionDiditRow? = null,
    // Modificación
    val solicitudesCambio: List<SolicitudCambioRow> = emptyList(),
    // Certificación (Modelo 11)
    val capacitaciones: List<CapacitacionRow> = emptyList(),
    val tieneBanco: Boolean = false,
    // Notificaciones
    val notificaciones: List<NotificacionConductor> = emptyList(),
)

class DriverViewModel : ViewModel() {
    private val repository by lazy { DriverRepository(SupabaseProvider.client) }
    private val _state = MutableStateFlow(DriverUiState())
    val state: StateFlow<DriverUiState> = _state.asStateFlow()

    init {
        if (!SupabaseProvider.isConfigured) {
            _state.update { it.copy(checkingSession = false) }
        } else {
            viewModelScope.launch {
                val hasSession = runCatching { repository.hasSession() }.getOrDefault(false)
                _state.update { it.copy(checkingSession = false, signedIn = hasSession) }
                if (hasSession) refresh()
            }
        }
    }

    fun signIn(email: String, password: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.signIn(email, password) }
            .onSuccess {
                _state.update { it.copy(signedIn = true) }
                refresh()
            }
            .onFailure { failure(it, "No pudimos iniciar sesión.") }
        _state.update { it.copy(loading = false) }
    }

    // ── Registro ──────────────────────────────────────────────

    /** Crea la cuenta; si exige OTP, marca signupNeedsOtp para la pantalla de código. */
    fun signUp(email: String, password: String, telefono: String = "") = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null, signupNeedsOtp = false, signupEmail = email, signupTelefono = telefono) }
        runCatching { repository.signUp(email, password) }
            .onSuccess { sessionActive ->
                if (sessionActive) {
                    _state.update { it.copy(signedIn = true) }
                    refresh()
                } else {
                    _state.update { it.copy(signupNeedsOtp = true) }
                }
            }
            .onFailure { failure(it, "No pudimos crear tu cuenta.") }
        _state.update { it.copy(loading = false) }
    }

    fun verifySignupOtp(code: String) = viewModelScope.launch {
        val email = _state.value.signupEmail
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.verifySignupOtp(email, code) }
            .onSuccess {
                _state.update { it.copy(signedIn = true, signupNeedsOtp = false) }
                refresh()
            }
            .onFailure { failure(it, "El código no es válido. Revisa e intenta de nuevo.") }
        _state.update { it.copy(loading = false) }
    }

    fun resendSignupOtp() = viewModelScope.launch {
        runCatching { repository.resendSignupOtp(_state.value.signupEmail) }
            .onSuccess { _state.update { it.copy(notice = "Enviamos un nuevo código a tu correo.") } }
            .onFailure { failure(it, "No pudimos reenviar el código.") }
    }

    /** Carga la solicitud vigente (recuperación de borrador) o inicia una nueva. */
    fun loadOrStartSolicitud() = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching {
            val actual = repository.solicitudActual()
            if (actual != null) {
                val docs = repository.documentosSolicitud(actual.id)
                _state.update { it.copy(solicitud = actual, solicitudDocumentos = docs) }
            } else {
                val inicio: SolicitudResultado = repository.iniciarSolicitud()
                if (inicio.solicitudId == null && inicio.conductorId == null) {
                    error("No pudimos iniciar la solicitud.")
                }
                val creada = repository.solicitudActual()
                _state.update { it.copy(solicitud = creada) }
            }
        }.onFailure { failure(it, "No pudimos recuperar tu expediente.") }
        _state.update { it.copy(loading = false) }
    }

    fun guardarBorrador(
        datosPersonales: kotlinx.serialization.json.JsonObject,
        domicilio: kotlinx.serialization.json.JsonObject,
        licencia: kotlinx.serialization.json.JsonObject,
        contactoEmergencia: kotlinx.serialization.json.JsonObject,
        pasoActual: Int,
    ) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching {
            repository.guardarBorrador(datosPersonales, domicilio, licencia, contactoEmergencia, pasoActual)
        }.onFailure { failure(it, "No pudimos guardar tu avance.") }
        _state.update { it.copy(loading = false) }
    }

    /** Registra consentimientos, envía la solicitud e inicia Didit. */
    fun enviarSolicitud(versionApp: String) = viewModelScope.launch {
        val solicitudId = _state.value.solicitud?.id ?: return@launch
        _state.update { it.copy(loading = true, error = null) }
        runCatching {
            repository.registrarConsentimientos(
                solicitudId,
                listOf("terminos_servicio", "aviso_privacidad", "autorizacion_antecedentes", "declaracion_suspensiones"),
                versionApp,
            )
            val resultado = repository.enviarSolicitud()
            val actual = repository.solicitudActual()
            _state.update { it.copy(solicitud = actual) }
            resultado
        }.onSuccess { iniciarDidit() }
            .onFailure { failure(it, "No pudimos enviar tu solicitud.") }
        _state.update { it.copy(loading = false) }
    }

    fun reloadSolicitudDocumentos() = viewModelScope.launch {
        val id = _state.value.solicitud?.id ?: return@launch
        runCatching { repository.documentosSolicitud(id) }
            .onSuccess { docs -> _state.update { it.copy(solicitudDocumentos = docs) } }
    }

    fun uploadSolicitudDocument(type: String, fileName: String, mimeType: String, bytes: ByteArray) =
        viewModelScope.launch {
            val solicitudId = _state.value.solicitud?.id ?: return@launch
            val previousId = _state.value.solicitudDocumentos
                .filter { it.tipo == type && it.esActual }
                .maxByOrNull { it.version }?.id
            _state.update { it.copy(uploadingDocumentType = type, error = null, notice = null) }
            runCatching {
                repository.uploadSolicitudDocument(solicitudId, type, fileName, mimeType, bytes, previousId)
            }.onSuccess {
                _state.update { it.copy(notice = "Documento cargado.") }
                reloadSolicitudDocumentos()
            }.onFailure { failure(it, "No pudimos registrar el documento.") }
            _state.update { it.copy(uploadingDocumentType = null) }
        }

    // ── Didit ─────────────────────────────────────────────────

    fun iniciarDidit() = viewModelScope.launch {
        val solicitudId = _state.value.solicitud?.id ?: return@launch
        _state.update { it.copy(diditLoading = true, error = null, diditUrl = null) }
        runCatching { repository.iniciarVerificacionDidit(solicitudId) }
            .onSuccess { (url, _) -> _state.update { it.copy(diditUrl = url) } }
            .onFailure { failure(it, "No pudimos iniciar la verificación de identidad.") }
        _state.update { it.copy(diditLoading = false) }
    }

    fun clearDidit() = _state.update { it.copy(diditUrl = null) }

    /** Consulta el estado Didit tras volver del navegador. */
    fun pollVerificacionDidit() = viewModelScope.launch {
        val solicitudId = _state.value.solicitud?.id ?: return@launch
        runCatching { repository.estadoVerificacionDidit(solicitudId) }
            .onSuccess { verificacion ->
                _state.update { it.copy(verificacionDidit = verificacion) }
                if (verificacion?.estado == "aprobado") {
                    _state.update { it.copy(notice = "Identidad verificada. Tu solicitud está en revisión.") }
                    refresh()
                }
            }
    }

    // ── Recuperación de acceso ────────────────────────────────

    fun sendPasswordReset(email: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.sendPasswordReset(email) }
            .onSuccess { _state.update { it.copy(notice = "Revisa tu correo: enviamos instrucciones y un código.") } }
            .onFailure { failure(it, "No pudimos enviar el correo de recuperación.") }
        _state.update { it.copy(loading = false) }
    }

    fun confirmRecoveryOtpAndSetPassword(email: String, code: String, password: String) =
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching {
                repository.verifyRecoveryOtp(email, code)
                repository.updatePassword(password)
            }.onSuccess {
                _state.update { it.copy(notice = "Contraseña actualizada. Inicia sesión.") }
            }.onFailure { failure(it, "No pudimos validar el código o la contraseña.") }
            _state.update { it.copy(loading = false) }
        }

    // ── Modificación del expediente ───────────────────────────

    fun loadSolicitudesCambio() = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        runCatching { repository.solicitudesCambio(driver.id) }
            .onSuccess { lista -> _state.update { it.copy(solicitudesCambio = lista) } }
    }

    fun solicitarCambio(cambios: Map<String, String?>, onDone: (String) -> Unit) =
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { repository.solicitarCambioExpediente(cambios) }
                .onSuccess { resultado ->
                    _state.update { it.copy(notice = resultado.mensaje.ifBlank { "Solicitud enviada a revisión." }) }
                    loadSolicitudesCambio()
                    refresh()
                    onDone(resultado.mensaje)
                }
                .onFailure { failure(it, "No pudimos enviar tu solicitud de cambio.") }
            _state.update { it.copy(loading = false) }
        }

    fun cancelarCambio(solicitudId: String) = viewModelScope.launch {
        runCatching { repository.cancelarSolicitudCambio(solicitudId) }
            .onSuccess {
                _state.update { it.copy(notice = "Solicitud de cambio cancelada.") }
                loadSolicitudesCambio()
            }
            .onFailure { failure(it, "No pudimos cancelar la solicitud.") }
    }

    // ── Certificación (Modelo 11) ─────────────────────────────

    fun loadCertificacion() = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        runCatching {
            val caps = repository.capacitaciones(driver.id)
            val banco = repository.tieneDatosBancarios(driver.id)
            val solicitud = repository.solicitudActual()
            val verificacion = solicitud?.let { repository.estadoVerificacionDidit(it.id) }
            _state.update {
                it.copy(
                    capacitaciones = caps,
                    tieneBanco = banco,
                    solicitud = solicitud ?: it.solicitud,
                    verificacionDidit = verificacion ?: it.verificacionDidit,
                )
            }
        }
        loadSolicitudesCambio()
    }

    // ── Notificaciones ────────────────────────────────────

    fun loadNotificaciones() = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        runCatching { repository.notificaciones(driver.id) }
            .onSuccess { lista -> _state.update { it.copy(notificaciones = lista) } }
            .onFailure { failure(it, "No pudimos cargar tus notificaciones.") }
    }

    fun marcarNotificacionesLeidas() = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        runCatching { repository.marcarNotificacionesLeidas(driver.id) }
            .onSuccess { loadNotificaciones() }
            .onFailure { failure(it, "No pudimos actualizar tus avisos.") }
    }

    fun refresh() = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching {
            val driver = repository.currentDriver()
            if (driver == null) {
                // Sesión sin conductor: corresponde al flujo de registro.
                val solicitud = repository.solicitudActual()
                val docs = solicitud?.let { repository.documentosSolicitud(it.id) } ?: emptyList()
                _state.update {
                    it.copy(
                        loading = false,
                        driver = null,
                        needsOnboarding = true,
                        solicitud = solicitud,
                        solicitudDocumentos = docs,
                    )
                }
                return@launch
            }
            val available = async { repository.availableTrips() }
            val accepted = async { repository.acceptedTrips(driver.id) }
            val payouts = async { repository.payouts(driver.id) }
            val documents = async { repository.documents(driver.id) }
            val availability = async { repository.availability(driver.id) }
            val notificaciones = async {
                runCatching { repository.notificaciones(driver.id) }.getOrDefault(emptyList())
            }
            DriverUiState(
                checkingSession = false,
                configured = true,
                signedIn = true,
                loading = false,
                needsOnboarding = false,
                driver = driver,
                availability = if (accepted.await().any { it.estado == "traslado_en_curso" }) {
                    Availability.ON_TRIP
                } else availability.await(),
                availableTrips = available.await(),
                acceptedTrips = accepted.await(),
                payouts = payouts.await(),
                documents = documents.await(),
                notificaciones = notificaciones.await(),
            )
        }.onSuccess { loaded -> _state.value = loaded }
            .onFailure { failure(it, "No pudimos actualizar tu información.") }
        _state.update { it.copy(loading = false) }
    }

    fun setAvailability(value: Availability) = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        val previous = _state.value.availability
        _state.update { it.copy(availability = value, error = null) }
        runCatching { repository.setAvailability(driver.id, value) }
            .onFailure {
                _state.update { state -> state.copy(availability = previous) }
                failure(it, "No pudimos cambiar tu disponibilidad.")
            }
    }

    fun requestTrip(trip: Trip) = viewModelScope.launch {
        val id = trip.id ?: return@launch
        _state.update { it.copy(loading = true, error = null, notice = null) }
        runCatching { repository.requestTrip(id) }
            .onSuccess {
                _state.update { it.copy(notice = "Solicitud enviada. Te avisaremos cuando se asigne el viaje.") }
                refresh()
            }
            .onFailure { failure(it, "No pudimos solicitar este viaje.") }
        _state.update { it.copy(loading = false) }
    }

    fun loadEvidence(tripId: String, type: String) = viewModelScope.launch {
        _state.update { it.copy(evidenceTripId = tripId, evidenceType = type, evidenceLoading = true, error = null) }
        runCatching { repository.evidencePhotos(tripId, type) }
            .onSuccess { photos ->
                _state.update { it.copy(evidencePhotos = photos, evidenceLoading = false) }
            }
            .onFailure { failure(it, "No pudimos cargar la evidencia del traslado.") }
        _state.update { it.copy(evidenceLoading = false) }
    }

    fun captureEvidence(tripId: String, type: String, angle: String, bytes: ByteArray) = viewModelScope.launch {
        _state.update { it.copy(evidenceSaving = true, error = null, notice = null) }
        runCatching { repository.captureEvidence(tripId, type, angle, bytes) }
            .onSuccess {
                _state.update { it.copy(notice = "Fotografía de ${angle.replace('_', ' ')} guardada.") }
                loadEvidence(tripId, type)
            }
            .onFailure { failure(it, "No pudimos guardar la fotografía.") }
        _state.update { it.copy(evidenceSaving = false) }
    }

    fun confirmEvidence(tripId: String, type: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null, notice = null) }
        runCatching { repository.confirmEvidence(tripId, type) }
            .onSuccess {
                _state.update { it.copy(notice = "Registro ${type} completado.") }
                refresh()
            }
            .onFailure { failure(it, "No pudimos completar la evidencia.") }
        _state.update { it.copy(loading = false) }
    }

    fun uploadDocument(type: String, fileName: String, mimeType: String, bytes: ByteArray) = viewModelScope.launch {
        val driver = _state.value.driver ?: return@launch
        val previousId = _state.value.documents
            .filter { it.tipo == type && it.esActual }
            .maxByOrNull { it.version }?.id
        _state.update { it.copy(uploadingDocumentType = type, error = null, notice = null) }
        runCatching { repository.uploadDocument(driver.id, type, fileName, mimeType, bytes, previousId) }
            .onSuccess {
                _state.update { it.copy(notice = "Documento cargado y enviado a revisión.") }
                refresh()
            }
            .onFailure { failure(it, "No pudimos registrar el documento.") }
        _state.update { it.copy(uploadingDocumentType = null) }
    }

    fun advanceTrip(tripId: String, event: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null, notice = null) }
        runCatching { repository.advanceTrip(tripId, event) }
            .onSuccess {
                _state.update { it.copy(notice = "Estado del traslado actualizado.") }
                refresh()
            }
            .onFailure { failure(it, "No pudimos actualizar el traslado.") }
        _state.update { it.copy(loading = false) }
    }

    fun confirmDestinationArrival(tripId: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null, notice = null) }
        runCatching { repository.confirmDestinationArrival(tripId) }
            .onSuccess {
                _state.update { it.copy(notice = "Llegada al destino registrada.") }
                refresh()
            }
            .onFailure { failure(it, "No pudimos confirmar la llegada al destino.") }
        _state.update { it.copy(loading = false) }
    }

    fun signOut() = viewModelScope.launch {
        runCatching { repository.signOut() }
        _state.value = DriverUiState(checkingSession = false, configured = true)
    }

    fun clearMessage() = _state.update { it.copy(error = null, notice = null) }

    private fun failure(error: Throwable, fallback: String) {
        _state.update { it.copy(error = error.message?.takeIf(String::isNotBlank) ?: fallback, loading = false) }
    }
}
