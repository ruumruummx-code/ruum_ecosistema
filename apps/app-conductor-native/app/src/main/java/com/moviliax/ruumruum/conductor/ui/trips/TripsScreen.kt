package com.moviliax.ruumruum.conductor.ui.trips

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.common.PillTab
import com.moviliax.ruumruum.conductor.ui.common.defaultMinInputHeight
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.common.successBackground
import com.moviliax.ruumruum.conductor.ui.common.successForeground
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteDark
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteLight
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun TripsScreen(state: DriverUiState, onRequest: (Trip) -> Unit, onTripSelected: (Trip) -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    var busqueda by remember { mutableStateOf("") }
    var ordenMayorGanancia by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        Text(
            "Traslados",
            Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            style = MaterialTheme.typography.headlineLarge,
        )
        OutlinedTextField(
            value = busqueda,
            onValueChange = { busqueda = it },
            modifier = Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20).defaultMinInputHeight(),
            placeholder = { Text("Buscar ofertas...") },
            singleLine = true,
            shape = MaterialTheme.shapes.small,
        )
        Row(
            Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            PillTab("Ofertas (${state.availableTrips.size})", tab == 0, { tab = 0 }, Modifier.weight(1f))
            PillTab("Aceptados (${state.acceptedTrips.size})", tab == 1, { tab = 1 }, Modifier.weight(1f))
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            FilterChip(
                selected = !ordenMayorGanancia,
                onClick = { ordenMayorGanancia = false },
                label = { Text("Recientes") },
                modifier = Modifier.height(RuumTokens.Touch),
            )
            FilterChip(
                selected = ordenMayorGanancia,
                onClick = { ordenMayorGanancia = true },
                label = { Text("Mayor ganancia") },
                modifier = Modifier.height(RuumTokens.Touch),
            )
        }
        val base = if (tab == 0) state.availableTrips else state.acceptedTrips
        val filtrados = base.filter { trip ->
            busqueda.isBlank() ||
                listOfNotNull(trip.origenCiudad, trip.origenDireccion, trip.destinoCiudad, trip.destinoDireccion, trip.id)
                    .joinToString(" ").contains(busqueda, ignoreCase = true)
        }.let { lista ->
            if (ordenMayorGanancia) lista.sortedByDescending { estimatedEarning(it) } else lista
        }
        if (tab == 0 && filtrados.isNotEmpty()) {
            Text(
                if (filtrados.size == 1) "1 oferta disponible" else "${filtrados.size} ofertas disponibles",
                Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        if (tab == 1 && filtrados.isNotEmpty()) {
            Text(
                if (filtrados.size == 1) "1 traslado aceptado" else "${filtrados.size} traslados aceptados",
                Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
            if (filtrados.isEmpty()) item {
                RuumEmptyState(
                    if (busqueda.isNotBlank()) "Sin resultados con estos filtros" else "Sin traslados para este día",
                    if (busqueda.isNotBlank()) "Prueba limpiar filtros."
                    else if (tab == 0) "No hay ofertas programadas en esta fecha. Revisa otro día o cambia el orden a Mayor ganancia."
                    else "No tienes traslados aceptados para esta fecha. Acepta una oferta para verla aquí.",
                    Icons.Default.DirectionsCar,
                )
            }
            items(filtrados, key = { it.id ?: it.hashCode().toString() }) { trip ->
                if (tab == 0) {
                    OfertaCard(trip, onRequest = { onRequest(trip) }, onClick = { onTripSelected(trip) })
                } else {
                    TripCard(trip, onClick = { onTripSelected(trip) }, esAceptado = true)
                }
            }
        }
    }
}

@Composable
fun OfertaCard(trip: Trip, onRequest: () -> Unit, onClick: () -> Unit) {
    RuumCard(Modifier.fillMaxWidth()) {
        Box(
            Modifier.fillMaxWidth().height(3.dp).background(if (LocalRuumDarkMode.current) RuumRouteDark else RuumRouteLight),
        )
        Spacer(Modifier.height(RuumTokens.Space16))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text("Oferta disponible", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
            trip.id?.let { Text("ID ${it.take(8).uppercase()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
        Spacer(Modifier.height(RuumTokens.Space8))
        Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.headlineMedium)
        Text(
            listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString()).joinToString(" ").ifBlank { "Vehículo por confirmar" },
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.bodyLarge,
        )
        Text("Origen", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelLarge)
        Text(
            trip.origenDireccion ?: "Origen por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            trip.origenCiudad ?: "Ciudad / Municipio por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text("Destino", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
        Text(
            trip.destinoDireccion ?: "Destino por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            trip.destinoCiudad ?: "Ciudad / Municipio por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "Inicio ${trip.creadoEn?.take(10) ?: "Por confirmar"} · " +
                "${trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Distancia por confirmar"} · " +
                "${trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Duración por confirmar"}",
            Modifier.padding(top = RuumTokens.Space8),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
            RuumPrimaryButton("Ver oferta →", onClick, Modifier.weight(1f))
        }
        RuumSecondaryButton(
            "Solicitar asignación →",
            onRequest,
            Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
        )
    }
}

@Composable
fun TripCard(
    trip: Trip,
    onRequest: (() -> Unit)? = null,
    onClick: (() -> Unit)? = null,
    esAceptado: Boolean = false,
) {
    RuumCard(Modifier.fillMaxWidth()) {
        Box(
            Modifier.fillMaxWidth().height(3.dp).background(if (LocalRuumDarkMode.current) RuumRouteDark else RuumRouteLight),
        )
        Spacer(Modifier.height(RuumTokens.Space16))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text(
                "${trip.origenCiudad ?: "Origen"} → ${trip.destinoCiudad ?: "Destino"}",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.weight(1f).padding(end = RuumTokens.Space8),
            )
            trip.estado?.let { RuumStatusChip(if (esAceptado) "ACEPTADO · $it" else it) }
        }
        Text(
            estadoTrasladoDescripcion(trip.estado),
            Modifier.padding(top = RuumTokens.Space4),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        if (onClick != null) {
            TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
                Text(if (esAceptado) "INICIAR TRASLADO →" else "Ver detalle del traslado")
            }
        }
        Text(
            "Vehículo",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
        )
        Text(
            listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString()).joinToString(" ").ifBlank { "Vehículo por confirmar" },
            style = MaterialTheme.typography.bodyLarge,
        )
        Text(
            "Origen → Destino",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
        )
        Text(
            "${trip.origenCiudad ?: "Por confirmar"} → ${trip.destinoCiudad ?: "Por confirmar"}",
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            "${trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Distancia por confirmar"} · ${trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Duración por confirmar"}",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        Surface(
            Modifier.fillMaxWidth().padding(top = RuumTokens.Space16),
            shape = MaterialTheme.shapes.medium,
            color = successBackground(),
            contentColor = successForeground(),
        ) {
            Column(Modifier.padding(RuumTokens.Space16)) {
                Text("Ganancia estimada", style = MaterialTheme.typography.labelMedium)
                Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.headlineMedium)
            }
        }
        if (onRequest != null) {
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumPrimaryButton("Solicitar viaje", onRequest, Modifier.fillMaxWidth(), leadingIcon = Icons.Default.ChevronRight)
        }
    }
}

fun estadoTrasladoDescripcion(estado: String?): String = when (estado) {
    "pendiente_de_conductor" -> "Oferta disponible."
    "conductor_asignado" -> "Dirígete al punto de origen."
    "conductor_en_camino_al_origen" -> "Dirígete al punto de recolección."
    "conductor_en_punto_de_recoleccion", "verificacion_vehiculo_en_proceso",
    "evidencia_inicial_en_proceso", "evidencia_inicial_completada" -> "Realiza la recepción y evidencia del vehículo."
    "vehiculo_recibido", "traslado_en_curso" -> "Conduce de forma segura al destino."
    "llegada_a_destino", "evidencia_final_en_proceso" -> "Entrega la unidad y registra la evidencia final."
    "evidencia_final_completada", "entrega_confirmada", "servicio_cerrado" -> "El traslado ha sido concluido."
    "servicio_cancelado", "traslado_fallido" -> "Este traslado ya no está activo."
    else -> "Consulta el detalle para tu siguiente paso."
}
