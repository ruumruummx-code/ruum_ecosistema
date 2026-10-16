package com.moviliax.ruumruum.conductor.ui.trips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.DetailRow
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.common.abrirMapa
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun TripDetailScreen(trip: Trip, state: DriverUiState, viewModel: DriverViewModel) {
    val context = LocalContext.current
    val evidenceType = when (trip.estado) {
        "evidencia_inicial_en_proceso" -> "inicial"
        "evidencia_inicial_completada", "vehiculo_recibido", "traslado_en_curso" -> null
        "evidencia_final_en_proceso" -> "final"
        else -> null
    }
    LaunchedEffect(trip.id, evidenceType) {
        val id = trip.id
        if (id != null && evidenceType != null) viewModel.loadEvidence(id, evidenceType)
    }
    val milestones = listOf(
        "conductor_asignado" to "Traslado asignado",
        "conductor_en_camino_al_origen" to "En camino al punto de recolección",
        "conductor_en_punto_de_recoleccion" to "Llegada al punto de recolección",
        "verificacion_vehiculo_en_proceso" to "Verificación del vehículo",
        "evidencia_inicial_en_proceso" to "Evidencia inicial",
        "evidencia_inicial_completada" to "Revisión inicial completada",
        "vehiculo_recibido" to "Vehículo recibido",
        "traslado_en_curso" to "Traslado en curso",
        "llegada_a_destino" to "Llegada al destino",
        "evidencia_final_en_proceso" to "Evidencia final",
        "evidencia_final_completada" to "Evidencia final completada",
        "entrega_confirmada" to "Entrega confirmada",
        "servicio_cerrado" to "Traslado cerrado",
    )
    val currentMilestone = milestones.indexOfFirst { it.first == trip.estado }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    encabezadoDetalle(trip.estado),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary,
                )
                Text(
                    "${trip.origenCiudad ?: "Origen"} → ${trip.destinoCiudad ?: "Destino"}",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.headlineMedium,
                )
                trip.estado?.let { RuumStatusChip(it) }
                trip.id?.let {
                    Text(
                        "ID ${it.take(8).uppercase()}",
                        Modifier.padding(top = RuumTokens.Space4),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        nextTripAction(trip.estado)?.let { action ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("TU PRÓXIMA ACCIÓN", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(action.second, Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    RuumPrimaryButton(
                        action.first,
                        onClick = {
                            trip.id?.let {
                                if (action.third == "confirmar_llegada_destino") viewModel.confirmDestinationArrival(it)
                                else viewModel.advanceTrip(it, action.third)
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        loading = state.loading,
                    )
                }
            }
        }
        if (evidenceType != null) {
            item {
                val tripId = trip.id
                if (tripId != null) EvidenceCaptureSection(
                    tripId = tripId,
                    type = evidenceType,
                    photos = if (state.evidenceTripId == tripId && state.evidenceType == evidenceType) state.evidencePhotos else emptyList(),
                    loading = state.evidenceLoading,
                    saving = state.evidenceSaving,
                    syncing = state.evidenceSyncing,
                    confirming = state.loading,
                    onCapture = { id, evidence, angle, bytes ->
                        viewModel.captureEvidence(id, evidence, angle, bytes)
                    },
                    onConfirm = { viewModel.confirmEvidence(tripId, evidenceType) },
                    onSyncPending = { viewModel.syncPendingEvidence(tripId) },
                )
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Progreso del traslado")
                milestones.forEachIndexed { index, (_, label) ->
                    val reached = currentMilestone >= 0 && index <= currentMilestone
                    Row(
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            if (reached) Icons.Default.CheckCircle else Icons.Default.Schedule,
                            contentDescription = null,
                            tint = if (reached) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp),
                        )
                        Text(
                            label,
                            Modifier.padding(start = RuumTokens.Space12),
                            color = if (reached) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
                if (currentMilestone < 0) {
                    Text(
                        "El detalle operativo de este estado aparecerá cuando el traslado sea asignado.",
                        Modifier.padding(top = RuumTokens.Space12),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("VEHÍCULO A TRASLADAR")
                Text(
                    listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString())
                        .joinToString(" ").ifBlank { "Vehículo por confirmar" },
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.titleMedium,
                )
                trip.vehiculoTipo?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("PUNTO DE RECOLECCIÓN")
                DetailRow("Dirección", trip.origenDireccion ?: trip.origenCiudad ?: "Origen por confirmar")
                val origin = listOfNotNull(trip.origenDireccion, trip.origenCiudad).joinToString(", ")
                if (origin.isNotBlank()) {
                    RuumSecondaryButton(
                        "NAVEGAR AL ORIGEN",
                        onClick = { abrirMapa(context, origin) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                SectionTitle("PUNTO DE ENTREGA")
                DetailRow("Dirección", trip.destinoDireccion ?: trip.destinoCiudad ?: "Destino por confirmar")
                val destination = listOfNotNull(trip.destinoDireccion, trip.destinoCiudad).joinToString(", ")
                if (destination.isNotBlank()) {
                    RuumSecondaryButton(
                        "NAVEGAR AL DESTINO",
                        onClick = { abrirMapa(context, destination) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                DetailRow("Distancia total", trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Por confirmar")
                DetailRow("Tiempo estimado", trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Por confirmar")
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Ganancia Neta Conductor")
                Text("Tarifa base garantizada + bonos operativos", Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(money(estimatedEarning(trip)), Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
            }
        }
    }
}

fun encabezadoDetalle(estado: String?): String = when (estado) {
    "evidencia_final_completada", "entrega_confirmada", "servicio_cerrado" -> "Cierre de Traslado"
    "pendiente_de_conductor" -> "DETALLES DEL TRASLADO"
    "servicio_cancelado", "traslado_fallido" -> "Traslado concluido o cancelado"
    else -> "TRASLADO ACTIVO"
}

fun nextTripAction(state: String?): Triple<String, String, String>? = when (state) {
    "conductor_asignado" -> Triple("ESTOY EN CAMINO AL ORIGEN →", "Prepárate para salir. Revisa la información del vehículo y el contacto.", "conductor_en_camino")
    "conductor_en_camino_al_origen" -> Triple("HE LLEGADO AL ORIGEN", "Navega hacia el punto de recolección y registra tu llegada.", "llegada_origen")
    "conductor_en_punto_de_recoleccion" -> Triple("INICIAR INSPECCIÓN Y EVIDENCIA", "Localiza la unidad e inicia la inspección del vehículo.", "iniciar_verificacion")
    "verificacion_vehiculo_en_proceso" -> Triple("CONTINUAR INSPECCIÓN", "Completa las fotos y checklist de recolección.", "iniciar_evidencia_inicial")
    "evidencia_inicial_completada" -> Triple("INICIAR TRAYECTO AL DESTINO →", "El registro inicial está completo. Inicia el trayecto.", "vehiculo_recibido")
    "vehiculo_recibido" -> Triple("INICIAR TRAYECTO AL DESTINO →", "Confirma el inicio del trayecto.", "iniciar_traslado")
    "traslado_en_curso" -> Triple("HE LLEGADO AL DESTINO", "Conduce con precaución hacia el punto de entrega.", "confirmar_llegada_destino")
    "llegada_a_destino" -> Triple("INICIAR EVIDENCIA DE ENTREGA", "Registra las fotografías finales del vehículo.", "iniciar_evidencia_final")
    "evidencia_final_completada" -> Triple("SÍ, ENTREGAR", "Confirma la entrega con evidencia completa.", "confirmar_entrega")
    "entrega_confirmada" -> Triple("FINALIZAR Y ENTREGAR VEHÍCULO", "Finaliza el flujo del traslado.", "cerrar_viaje")
    else -> null
}
