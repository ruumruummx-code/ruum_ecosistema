package com.moviliax.ruumruum.conductor.ui.onboarding

import android.content.Intent
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.net.toUri
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/** Verificación de identidad con Didit: se abre en el navegador y se confirma al volver. */
@Composable
fun DiditSection(state: DriverUiState, viewModel: DriverViewModel) {
    val context = LocalContext.current
    RuumCard(Modifier.fillMaxWidth()) {
        Text("Verificación de identidad (Didit)", style = MaterialTheme.typography.titleMedium)
        Text(
            "Agiliza la validación de tu cuenta completando la prueba de vida y validación biométrica con Didit.",
            Modifier.padding(top = RuumTokens.Space4),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        state.verificacionDidit?.let {
            Text(
                "Estado: ${it.estado.replace('_', ' ')}",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (state.diditLoading && state.diditUrl == null) {
            Text(
                "Iniciando verificación de identidad… Conectando con el servicio seguro de Didit.",
                Modifier.padding(top = RuumTokens.Space8),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (state.diditUrl != null) {
            Text(
                "Prueba de vida y validación biométrica",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
            RuumPrimaryButton(
                text = "Abrir verificación",
                onClick = {
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW, state.diditUrl.toUri()))
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
            )
            Text(
                "Se detectará automáticamente al concluir en Didit.",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            RuumSecondaryButton(
                text = "Ya completé la verificación",
                onClick = viewModel::pollVerificacionDidit,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
            )
            Text(
                "También puedes completar la verificación más tarde desde tu panel de conductor.",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            RuumPrimaryButton(
                text = if (state.diditLoading) "Iniciando verificación…" else "Completar verificación de identidad",
                onClick = viewModel::iniciarDidit,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                loading = state.diditLoading,
            )
        }
    }
}
