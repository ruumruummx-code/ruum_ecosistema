package com.moviliax.ruumruum.conductor.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

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
            filter {
                eq("conductor_id", driverId)
                eq("es_actual", true)
            }
        }.decodeList()

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
}
