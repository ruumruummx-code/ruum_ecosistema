package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.background
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
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun RegistroScreen(
    loading: Boolean,
    error: String?,
    onCrear: (String, String, String) -> Unit,
    onVolver: () -> Unit,
) {
    var telefono by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    val passOk = password.length >= 8 &&
        password.any(Char::isLowerCase) && password.any(Char::isUpperCase) && password.any(Char::isDigit)
    val emailOk = android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()
    val valido = telefono.length == 10 && emailOk && passOk && password == confirm
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
            RuumLogo(Modifier.size(120.dp), darkVariant = true)
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Registro de conductor", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Crea tu cuenta para poder iniciar sesión.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = telefono,
                    onValueChange = { telefono = it.filter(Char::isDigit).take(10) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Teléfono móvil") },
                    placeholder = { Text("(55) 1234-5678") },
                    supportingText = { Text("Formato estándar 10 dígitos (ej. (55) 1234-5678).") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo electrónico") },
                    placeholder = { Text("conductor@ejemplo.com") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = password, onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Crea tu contraseña") },
                    placeholder = { Text("Ingresa tu contraseña") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                Spacer(Modifier.height(RuumTokens.Space8))
                Text("Requisitos de contraseña:", style = MaterialTheme.typography.labelLarge)
                RequisitoRow("Mínimo 8 caracteres", password.length >= 8)
                RequisitoRow("Al menos un número (0-9)", password.any(Char::isDigit))
                RequisitoRow("Al menos una letra mayúscula (A-Z)", password.any(Char::isUpperCase))
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = confirm, onValueChange = { confirm = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Confirma tu contraseña") },
                    placeholder = { Text("Repite tu contraseña") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                Text(
                    "Tus datos personales y contraseña se transmiten y almacenan con cifrado de grado bancario (SSL/TLS).",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = "Crear cuenta y continuar",
                    onClick = { onCrear(email.trim(), password, telefono) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = valido,
                    loading = loading,
                )
                TextButton(onClick = onVolver, modifier = Modifier.fillMaxWidth()) {
                    Text("¿Ya tienes cuenta? Inicia sesión")
                }
            }
        }
    }
}

@Composable
fun RequisitoRow(texto: String, cumplido: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(if (cumplido) "✓" else "○", color = MaterialTheme.colorScheme.secondary)
        Text(texto, Modifier.padding(start = RuumTokens.Space8), style = MaterialTheme.typography.bodyMedium)
    }
}
