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
import com.moviliax.ruumruum.conductor.data.Trip
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

    fun refresh() = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching {
            val driver = repository.currentDriver()
                ?: error("La sesión no está asociada con un conductor.")
            val available = async { repository.availableTrips() }
            val accepted = async { repository.acceptedTrips(driver.id) }
            val payouts = async { repository.payouts(driver.id) }
            val documents = async { repository.documents(driver.id) }
            val availability = async { repository.availability(driver.id) }
            DriverUiState(
                checkingSession = false,
                configured = true,
                signedIn = true,
                loading = false,
                driver = driver,
                availability = if (accepted.await().any { it.estado == "traslado_en_curso" }) {
                    Availability.ON_TRIP
                } else availability.await(),
                availableTrips = available.await(),
                acceptedTrips = accepted.await(),
                payouts = payouts.await(),
                documents = documents.await(),
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
