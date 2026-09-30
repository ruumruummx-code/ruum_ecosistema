package com.moviliax.ruumruum.conductor.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moviliax.ruumruum.conductor.core.SupabaseProvider
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.Driver
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.data.DriverRepository
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

    fun signOut() = viewModelScope.launch {
        runCatching { repository.signOut() }
        _state.value = DriverUiState(checkingSession = false, configured = true)
    }

    fun clearMessage() = _state.update { it.copy(error = null, notice = null) }

    private fun failure(error: Throwable, fallback: String) {
        _state.update { it.copy(error = error.message?.takeIf(String::isNotBlank) ?: fallback, loading = false) }
    }
}
