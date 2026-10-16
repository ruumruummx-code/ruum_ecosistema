package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.ui.common.defaultMinInputHeight
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumLogo
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun LoginScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    onRegistro: () -> Unit = {},
    onRecuperacion: () -> Unit = {},
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    fun validarEmail(valor: String) {
        emailError = if (valor.isNotBlank() &&
            !android.util.Patterns.EMAIL_ADDRESS.matcher(valor).matches()
        ) {
            "Formato de correo inválido"
        } else {
            null
        }
    }
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
            RuumLogo(Modifier.size(152.dp), darkVariant = true)
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Seguridad, evidencia y trazabilidad en cada viaje.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(RuumTokens.Space16))
                Text("Iniciar sesión", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Solo conductores verificados. Tu sesión inicia trazabilidad.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "Evidencia · GPS · Pagos trazables",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
                Spacer(Modifier.height(RuumTokens.Space20))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; validarEmail(it) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
                    isError = emailError != null,
                    supportingText = emailError?.let { { Text(it) } },
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Contraseña") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = "Entrar",
                    onClick = { onLogin(email.trim(), password) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = email.isNotBlank() && password.isNotBlank() && emailError == null,
                    loading = loading,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                Text(
                    "Al continuar aceptas los Términos y el Aviso de Privacidad.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            RuumCard(Modifier.fillMaxWidth().padding(top = RuumTokens.Space16)) {
                Text("¿Aún no estás certificado?")
                RuumSecondaryButton(
                    text = "Crea tu cuenta →",
                    onClick = onRegistro,
                    modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                )
                Text(
                    "Validación de identidad en minutos. Sin costo de registro.",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            TextButton(onClick = onRecuperacion, modifier = Modifier.fillMaxWidth()) {
                Text("¿Olvidaste tu contraseña?")
            }
            Text(
                "¿Problemas para entrar? Escríbenos por WhatsApp soporte desde la pantalla de ayuda.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
