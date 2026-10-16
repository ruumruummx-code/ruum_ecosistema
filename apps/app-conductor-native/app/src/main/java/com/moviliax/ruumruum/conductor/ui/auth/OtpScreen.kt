package com.moviliax.ruumruum.conductor.ui.auth

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.moviliax.ruumruum.conductor.ui.common.defaultMinInputHeight
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun OtpScreen(
    email: String,
    loading: Boolean,
    error: String?,
    onConfirmar: (String) -> Unit,
    onReenviar: () -> Unit,
    onVolver: () -> Unit,
) {
    var codigo by remember { mutableStateOf("") }
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
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Confirma tu correo", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Enviamos un código de 6 dígitos a $email. Escríbelo aquí para activar tu cuenta y subir tus documentos sin salir de la app.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = codigo,
                    onValueChange = { codigo = it.filter(Char::isDigit).take(6) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Código de verificación") },
                    supportingText = { Text("Revisa también tu carpeta de spam o promociones.") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = if (loading) "Verificando…" else "Confirmar y activar",
                    onClick = { onConfirmar(codigo) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = codigo.length == 6,
                    loading = loading,
                )
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    TextButton(onClick = onReenviar) { Text("Reenviar código") }
                    TextButton(onClick = onVolver) { Text("Volver") }
                }
            }
        }
    }
}
