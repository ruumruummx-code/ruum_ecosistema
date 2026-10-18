package com.moviliax.ruumruum.conductor.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumLogo
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun OnboardingScreen(onTerminar: () -> Unit, onAcceso: () -> Unit) {
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                RuumLogo(Modifier.size(96.dp), darkVariant = true)
                TextButton(onClick = onAcceso) { Text("Iniciar sesión") }
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Seguridad · Evidencia · Pago protegido", Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Conduce con Ruum Ruum.", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
                Text("Realiza traslados vehiculares como conductor certificado, con seguimiento y evidencia fotográfica de principio a fin. Tu pago se libera con evidencia validada.", Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "1,200 activos hoy · 4.8★ · Hasta $1,200/traslado",
                    Modifier.padding(top = RuumTokens.Space12),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumPrimaryButton(
                text = "Crear mi cuenta",
                onClick = onTerminar,
                modifier = Modifier.fillMaxWidth(),
            )
            TextButton(onClick = onAcceso, modifier = Modifier.fillMaxWidth()) {
                Text("Ya tengo una cuenta")
            }
        }
    }
}
