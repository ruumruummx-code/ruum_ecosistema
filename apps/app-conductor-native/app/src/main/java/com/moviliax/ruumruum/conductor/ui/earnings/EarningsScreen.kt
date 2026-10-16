package com.moviliax.ruumruum.conductor.ui.earnings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
import com.moviliax.ruumruum.conductor.domain.totalDeposited
import com.moviliax.ruumruum.conductor.ui.common.DetailRow
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun EarningsScreen(payouts: List<Payout>, trips: List<Trip>) {
    val total = totalDeposited(payouts)
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            Text("Mis ganancias y pagos", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Evidencia financiera de cada traslado. Trazabilidad y cierre documentado.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Depósito acumulado", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                Text(money(total), style = MaterialTheme.typography.displayLarge)
                if (trips.isNotEmpty()) {
                    RuumAlert("${trips.size} viaje(s) siguen en proceso y aún no forman parte del depósito.", Modifier.fillMaxWidth().padding(top = RuumTokens.Space16))
                }
            }
        }
        item { SectionTitle("Desglose por viaje", "${trips.size} traslado(s)") }
        if (trips.isEmpty()) item {
            RuumEmptyState(
                "Aún no hay ganancias registradas",
                "Completa tu primer traslado para comenzar a acumular ganancias. Al finalizar cada viaje, verás aquí el desglose detallado y el estatus de tu depósito bancario.",
                Icons.Default.AttachMoney,
            )
        }
        items(trips, key = { it.id ?: it.hashCode().toString() }) { trip ->
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo).joinToString(" ").ifBlank { "Vehículo por confirmar" },
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    "${trip.origenCiudad ?: "Origen"} ➔ ${trip.destinoCiudad ?: "Destino"}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Ganancia", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                    Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                }
                trip.estado?.let { RuumStatusChip(it) }
            }
        }
        item { SectionTitle("Depósitos del periodo") }
        if (payouts.isEmpty()) item {
            Text("No hay depósitos en este periodo.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(payouts, key = { it.id }) { payout -> PayoutCard(payout) }
    }
}

@Composable
fun PayoutCard(payout: Payout) {
    RuumCard(Modifier.fillMaxWidth()) {
        Text("Periodo Operativo", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
        Text("${payout.periodoInicio.take(10)} ➔ ${payout.periodoFin.take(10)}", style = MaterialTheme.typography.titleMedium)
        Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Monto Neto", style = MaterialTheme.typography.bodyMedium)
            Text(money(payout.montoNeto), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
        DetailRow("Monto Bruto", money(payout.montoBruto))
        DetailRow("Ajustes", money(payout.ajustes))
        payout.referenciaPago?.let { DetailRow("SPEI", it) }
        RuumStatusChip(payout.estado)
    }
}
