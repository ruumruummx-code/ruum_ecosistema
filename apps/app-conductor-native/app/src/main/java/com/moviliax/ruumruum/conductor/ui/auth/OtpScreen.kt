package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.ui.components.RuumCtaButton
import com.moviliax.ruumruum.conductor.ui.components.RuumDenseField
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistrationHeader
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistroTitulo
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/**
 * Verificación del correo del paso 1 de 5. Comparte la cabecera y el estilo del
 * resto del flujo para que el usuario no perciba un salto de pantalla.
 */
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
            .systemBarsPadding()
            .imePadding(),
    ) {
        RuumRegistrationHeader(paso = 1, total = 5, onAtras = onVolver)

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = RuumTokens.Space20),
        ) {
            RuumRegistroTitulo(
                titulo = "Confirma tu correo",
                subtitulo = "Enviamos un código de 6 dígitos a $email para activar tu cuenta.",
            )
            Spacer(Modifier.height(RuumTokens.Space20))
            RuumDenseField(
                valor = codigo,
                onValorChange = { codigo = it.filter(Char::isDigit).take(6) },
                etiqueta = "Código de verificación",
                placeholder = "000000",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            )
            if (error != null) {
                Spacer(Modifier.height(RuumTokens.Space12))
                Text(
                    error,
                    style = MaterialTheme.typography.bodySmall,
                    color = RuumTokens.Error,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space12))
            Text(
                "Revisa también tu carpeta de spam o promociones.",
                style = MaterialTheme.typography.bodySmall,
                color = RuumTokens.RegistrationTextSecondary,
            )
            Spacer(Modifier.height(RuumTokens.Space16))
        }

        Column(Modifier.padding(horizontal = RuumTokens.Space20)) {
            RuumCtaButton(
                text = "Confirmar y activar",
                onClick = { onConfirmar(codigo) },
                enabled = codigo.length == 6,
                loading = loading,
            )
            Row(Modifier.fillMaxWidth()) {
                TextButton(
                    onClick = onReenviar,
                    modifier = Modifier.weight(1f).height(RuumTokens.Touch),
                ) {
                    Text("Resenviar código", color = RuumTokens.Action)
                }
                TextButton(
                    onClick = onVolver,
                    modifier = Modifier.weight(1f).height(RuumTokens.Touch),
                ) {
                    Text("Volver", color = RuumTokens.RegistrationTextSecondary)
                }
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }
    }
}
