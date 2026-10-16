package com.moviliax.ruumruum.conductor.ui.panel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.alertaLicencia15Dias
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.account.DOCUMENT_REQUIREMENTS
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.common.successBackground
import com.moviliax.ruumruum.conductor.ui.common.successForeground
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import com.moviliax.ruumruum.conductor.ui.trips.TripCard

@Composable
fun PanelScreen(
    state: DriverUiState,
    onAvailability: (Availability) -> Unit,
    onTripSelected: (Trip) -> Unit,
    onOpenDocuments: () -> Unit = {},
) {
    val available = state.availability == Availability.AVAILABLE
    val onTrip = state.availability == Availability.ON_TRIP
    val earnings = state.payouts.filter { it.estado != "revocado" }.sumOf { it.montoNeto }
    val viajeActivo = state.acceptedTrips.firstOrNull { it.estado == "traslado_en_curso" }
    var confirmarNoDisponible by remember { mutableStateOf(false) }
    val docsPendientes = DOCUMENT_REQUIREMENTS.count { requirement ->
        state.documents.none { it.tipo == requirement.type && it.esActual && it.estado == "aprobado" }
    }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Hola, ${state.driver?.nombre?.substringBefore(' ') ?: "conductor"}", style = MaterialTheme.typography.headlineLarge)
        }
        // Modelo 11.3 — alerta 15 días antes del vencimiento de licencia.
        alertaLicencia15Dias(state.driver?.licenciaVigencia).takeIf { it.activa }?.let { alerta ->
            item {
                RuumAlert(
                    alerta.mensaje.orEmpty(),
                    Modifier.fillMaxWidth(),
                    error = (alerta.dias ?: 0) < 0,
                )
            }
        }
        viajeActivo?.let { viaje ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("Traslado activo", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                    Text(
                        "${viaje.vehiculoMarca.orEmpty()} ${viaje.vehiculoModelo.orEmpty()}".trim().ifBlank { "Traslado en curso" },
                        style = MaterialTheme.typography.titleLarge,
                    )
                    RuumPrimaryButton(
                        "Continuar traslado →",
                        { onTripSelected(viaje) },
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                    )
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = if (available) successBackground() else MaterialTheme.colorScheme.surfaceVariant) {
                        Icon(
                            if (available) Icons.Default.CheckCircle else Icons.Default.Schedule,
                            null,
                            Modifier.padding(RuumTokens.Space12).size(24.dp),
                            tint = if (available) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
                        Text(
                            when (state.availability) {
                                Availability.AVAILABLE -> "Disponible"
                                Availability.UNAVAILABLE -> "No Disponible"
                                Availability.ON_TRIP -> "En viaje"
                            },
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            when (state.availability) {
                                Availability.AVAILABLE -> "Recibiendo solicitudes · Te avisaremos con sonido"
                                Availability.UNAVAILABLE -> "No recibirás traslados hasta activarte"
                                Availability.ON_TRIP -> "Traslado activo — disponibilidad bloqueada"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = available,
                        enabled = !onTrip,
                        onCheckedChange = {
                            if (!it) confirmarNoDisponible = true
                            else onAvailability(Availability.AVAILABLE)
                        },
                    )
                }
            }
        }
        if (viajeActivo == null) {
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    val n = state.availableTrips.size
                    Text(
                        if (available) "Traslados disponibles" else "Modo no disponible",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    Text(
                        if (n > 0) "$n traslados disponibles en tu zona" else "Sin traslados por ahora",
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        if (n > 0) "Revisa los detalles y toma el traslado que mejor se ajuste a tu ruta."
                        else "Actívate y empieza a ganar",
                        Modifier.padding(top = RuumTokens.Space4),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (!available) {
                        RuumPrimaryButton(
                            "Activarme ahora →",
                            { onAvailability(Availability.AVAILABLE) },
                            Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        )
                    }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space12)) {
                MetricCard("Ganancias del día", money(earnings), Icons.Default.AttachMoney, Modifier.weight(1f))
                MetricCard("Traslados hoy", state.acceptedTrips.size.toString(), Icons.Default.DirectionsCar, Modifier.weight(1f))
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Salud Operacional")
                Spacer(Modifier.height(RuumTokens.Space8))
                SaludRow("Documentos", if (docsPendientes == 0) "Vigentes" else "Pendientes ($docsPendientes)")
                SaludRow(
                    "Perfil",
                    if (state.driver?.estado == "activo") "Habilitado" else "En validación",
                )
                SaludRow("Conexión", "Conectado")
                if (docsPendientes > 0) {
                    RuumSecondaryButton(
                        "Ir a mi cuenta →",
                        onOpenDocuments,
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                    )
                }
            }
        }
        item {
            SectionTitle("Tu siguiente viaje", "Consulta el estado y el siguiente paso.")
            Spacer(Modifier.height(RuumTokens.Space12))
            state.acceptedTrips.firstOrNull()?.let { TripCard(it, onClick = { onTripSelected(it) }) } ?: RuumEmptyState(
                "Sin Traslados aceptados",
                "Cuando te asignen un traslado aparecerá aquí.",
                Icons.Default.DirectionsCar,
            )
        }
    }
    if (confirmarNoDisponible) AlertDialog(
        onDismissRequest = { confirmarNoDisponible = false },
        title = { Text("¿Pasas a no disponible?") },
        text = { Text("Dejarás de recibir traslados nuevos hasta que reactives tu disponibilidad.") },
        confirmButton = {
            RuumPrimaryButton("Confirmar", {
                confirmarNoDisponible = false
                onAvailability(Availability.UNAVAILABLE)
            })
        },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmarNoDisponible = false }) },
    )
}

@Composable
fun SaludRow(etiqueta: String, valor: String) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space4),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(etiqueta, style = MaterialTheme.typography.bodyMedium)
        Text(valor, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun MetricCard(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    RuumCard(modifier) {
        Icon(icon, null, Modifier.size(22.dp), tint = MaterialTheme.colorScheme.secondary)
        Text(label, Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.headlineSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
