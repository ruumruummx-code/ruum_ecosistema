package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.moviliax.ruumruum.conductor.ui.common.defaultMinInputHeight
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun RecuperacionScreen(
    loading: Boolean,
    error: String?,
    notice: String?,
    onEnviar: (String) -> Unit,
    onConfirmar: (String, String, String) -> Unit,
    onVolver: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var codigo by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var enviado by remember { mutableStateOf(false) }
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
                Text("Recuperar contraseña", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Escribe el correo con el que te registraste y te enviamos un enlace seguro.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo electrónico") }, singleLine = true, shape = MaterialTheme.shapes.small,
                )
                if (!enviado) {
                    Spacer(Modifier.height(RuumTokens.Space16))
                    RuumPrimaryButton(
                        text = "Enviar enlace",
                        onClick = { onEnviar(email.trim()); enviado = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches(),
                        loading = loading,
                    )
                } else {
                    Text(
                        "Correo enviado a $email. Revisa tu bandeja incluyendo spam. En esta app confirma con el código y define tu nueva contraseña.",
                        Modifier.padding(top = RuumTokens.Space12),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    OutlinedTextField(
                        value = codigo,
                        onValueChange = { codigo = it.filter(Char::isDigit).take(6) },
                        modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                        label = { Text("Código de verificación") },
                        singleLine = true, shape = MaterialTheme.shapes.small,
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    OutlinedTextField(
                        value = password, onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                        label = { Text("Nueva contraseña") },
                        placeholder = { Text("Mínimo 8 caracteres") },
                        singleLine = true, shape = MaterialTheme.shapes.small,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                    Spacer(Modifier.height(RuumTokens.Space16))
                    RuumPrimaryButton(
                        text = "Guardar nueva contraseña",
                        onClick = { onConfirmar(email.trim(), codigo, password) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = codigo.length == 6 && password.length >= 8,
                        loading = loading,
                    )
                }
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                if (notice != null) RuumAlert(notice, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16))
                TextButton(onClick = onVolver, modifier = Modifier.fillMaxWidth()) {
                    Text("← Volver al inicio de sesión")
                }
            }
        }
    }
}
