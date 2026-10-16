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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumLogo
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

data class PasoOnboarding(val tag: String, val titulo: String, val descripcion: String)

val PASOS_ONBOARDING = listOf(
    PasoOnboarding(
        "Seguridad · Evidencia · Trazabilidad",
        "No entregues tu auto a ciegas. Un traslado serio deja evidencia.",
        "Ruum Ruum es traslado vehicular con conductores certificados. Cada viaje inicia con evidencia, continúa con seguimiento y termina con confirmación.",
    ),
    PasoOnboarding(
        "Conductores certificados · Pago promedio $680",
        "No cualquiera mueve un Ruum Ruum.",
        "Cada conductor cumple validación, identidad y protocolo operativo. Gana en promedio $680 por traslado —hasta $1,200 en rutas largas— con pagos trazables y bitácora de principio a fin.",
    ),
    PasoOnboarding(
        "Evidencia documentada · Pago protegido",
        "Cada viaje se documenta.",
        "Kilometraje, carrocería, placas y entrega final con evidencia fotográfica. Tu pago se libera con evidencia validada — trazabilidad que protege tu ingreso.",
    ),
)

@Composable
fun OnboardingScreen(onTerminar: () -> Unit, onAcceso: () -> Unit) {
    var paso by remember { mutableIntStateOf(0) }
    val actual = PASOS_ONBOARDING[paso]
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
                TextButton(onClick = onAcceso) { Text("Omitir") }
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Paso ${paso + 1} de 3", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                Text(actual.tag, Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(actual.titulo, Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
                Text(actual.descripcion, Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "1,200 activos hoy · 4.8★ · Hasta $1,200/traslado",
                    Modifier.padding(top = RuumTokens.Space12),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumPrimaryButton(
                text = if (paso < 2) "Comenzar →" else "Crear mi cuenta",
                onClick = { if (paso < 2) paso++ else onTerminar() },
                modifier = Modifier.fillMaxWidth(),
            )
            TextButton(onClick = onAcceso, modifier = Modifier.fillMaxWidth()) {
                Text("Ya tengo una cuenta")
            }
        }
    }
}
