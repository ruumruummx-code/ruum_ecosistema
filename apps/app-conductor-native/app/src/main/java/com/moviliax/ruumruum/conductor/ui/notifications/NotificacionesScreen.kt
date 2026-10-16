package com.moviliax.ruumruum.conductor.ui.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.PillTab
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun NotificacionesScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) { viewModel.loadNotificaciones() }
    var filtro by remember { mutableIntStateOf(0) }
    val sinLeer = state.notificaciones.filter { it.leidaEn == null }
    val leidas = state.notificaciones.filter { it.leidaEn != null }
    val visibles = when (filtro) {
        1 -> sinLeer
        2 -> leidas
        else -> state.notificaciones
    }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Notificaciones y Avisos", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Tus avisos y alertas operativas permanecen guardados en este centro.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Filtro de notificaciones",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (sinLeer.isNotEmpty()) {
                    TextButton(onClick = viewModel::marcarNotificacionesLeidas) {
                        Text("✓ Marcar todas como leídas")
                    }
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                PillTab("Todas (${state.notificaciones.size})", filtro == 0, { filtro = 0 }, Modifier.weight(1f))
                PillTab("Sin leer (${sinLeer.size})", filtro == 1, { filtro = 1 }, Modifier.weight(1f))
                PillTab("Leídas (${leidas.size})", filtro == 2, { filtro = 2 }, Modifier.weight(1f))
            }
        }
        if (visibles.isEmpty()) item {
            RuumEmptyState(
                "¡Todo al día!",
                "No tienes avisos pendientes por leer. Aquí aparecerán tus próximos avisos de servicio, ganancias y alertas operativas.",
                Icons.Default.Notifications,
            )
        }
        items(visibles, key = { it.id }) { aviso ->
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        aviso.tipo.replace('_', ' ').replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    if (aviso.leidaEn == null) RuumStatusChip("Nueva")
                }
                Text(aviso.titulo, Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.titleMedium)
                Text(aviso.cuerpo, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                aviso.creadoEn?.let {
                    Text(it.take(10), Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
