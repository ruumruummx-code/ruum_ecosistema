package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.ui.components.RuumCountryPicker
import com.moviliax.ruumruum.conductor.ui.components.RuumCtaButton
import com.moviliax.ruumruum.conductor.ui.components.RuumDenseField
import com.moviliax.ruumruum.conductor.ui.components.RuumDividerConTexto
import com.moviliax.ruumruum.conductor.ui.components.RuumLegal
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistrationHeader
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistroTitulo
import com.moviliax.ruumruum.conductor.ui.components.RuumRequisito
import com.moviliax.ruumruum.conductor.ui.components.RuumTogglePassword
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/**
 * Paso 1 de 5 — "Crea tu cuenta".
 * Rediseño alineado al prototipo de registro (cabecera con progreso segmentado,
 * campos densos con adornos, requisitos de contraseña en dos columnas y CTA con flecha).
 */
@Composable
fun RegistroScreen(
    loading: Boolean,
    error: String?,
    onCrear: (String, String, String, Boolean) -> Unit,
    onVolver: () -> Unit,
) {
    var telefono by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmVisible by remember { mutableStateOf(false) }
    var aceptaTerminos by remember { mutableStateOf(false) }

    val requisitos = evaluarRequisitosPassword(password, confirm)
    val emailOk = android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()
    val valido = telefono.length == 10 && emailOk && requisitos.completos && aceptaTerminos

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
                titulo = "Crea tu cuenta",
                subtitulo = "Comienza a conducir con nosotros",
            )
            Spacer(Modifier.height(RuumTokens.Space20))

            RuumDenseField(
                valor = telefono,
                onValorChange = { telefono = it.filter(Char::isDigit).take(10) },
                etiqueta = "Teléfono",
                placeholder = "10 dígitos",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                leading = { RuumCountryPicker() },
                trailing = {
                    Icon(
                        Icons.Outlined.Phone,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = RuumTokens.RegistrationTextSecondary,
                    )
                },
            )
            Spacer(Modifier.height(RuumTokens.Space12))

            RuumDenseField(
                valor = email,
                onValorChange = { email = it },
                etiqueta = "Correo",
                placeholder = "tu@correo.com",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                leading = {
                    Icon(
                        Icons.Outlined.Email,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = RuumTokens.RegistrationTextSecondary,
                    )
                },
            )
            Spacer(Modifier.height(RuumTokens.Space12))

            RuumDenseField(
                valor = password,
                onValorChange = { password = it },
                etiqueta = "Contraseña",
                placeholder = "Mínimo 8 caracteres",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                leading = {
                    Icon(
                        Icons.Outlined.Lock,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = RuumTokens.RegistrationTextSecondary,
                    )
                },
                trailing = {
                    RuumTogglePassword(
                        visible = passwordVisible,
                        onToggle = { passwordVisible = !passwordVisible },
                    )
                },
            )
            Spacer(Modifier.height(RuumTokens.Space12))

            RuumDenseField(
                valor = confirm,
                onValorChange = { confirm = it },
                etiqueta = "Confirmar contraseña",
                placeholder = "Repite tu contraseña",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                visualTransformation = if (confirmVisible) VisualTransformation.None else PasswordVisualTransformation(),
                leading = {
                    Icon(
                        Icons.Outlined.Lock,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = RuumTokens.RegistrationTextSecondary,
                    )
                },
                trailing = {
                    RuumTogglePassword(
                        visible = confirmVisible,
                        onToggle = { confirmVisible = !confirmVisible },
                        descripcion = "Mostrar confirmación de contraseña",
                    )
                },
            )
            Spacer(Modifier.height(RuumTokens.Space16))

            Text(
                "Tu contraseña debe:",
                style = MaterialTheme.typography.bodyMedium,
                color = RuumTokens.RegistrationTextSecondary,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            Row(Modifier.fillMaxWidth()) {
                Column(
                    Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
                ) {
                    RuumRequisito("Mínimo 8 caracteres", requisitos.longitud)
                    RuumRequisito("Mayús. y minús.", requisitos.mayusMinus)
                }
                Column(
                    Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
                ) {
                    RuumRequisito("Un número", requisitos.numero)
                    RuumRequisito("Coinciden", requisitos.coincide)
                }
            }
            Spacer(Modifier.height(RuumTokens.Space16))

            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(checked = aceptaTerminos, onCheckedChange = { aceptaTerminos = it })
                Spacer(Modifier.size(RuumTokens.Space8))
                Text(
                    text = buildAnnotatedString {
                        append("Acepto los ")
                        withLink(
                            LinkAnnotation.Url(
                                RuumLegal.TERMINOS,
                                TextLinkStyles(style = SpanStyle(textDecoration = TextDecoration.Underline)),
                            )
                        ) {
                            append("Términos y Condiciones")
                        }
                        append(" y el ")
                        withLink(
                            LinkAnnotation.Url(
                                RuumLegal.PRIVACIDAD,
                                TextLinkStyles(style = SpanStyle(textDecoration = TextDecoration.Underline)),
                            )
                        ) {
                            append("Aviso de Privacidad")
                        }
                        append(".")
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            if (error != null) {
                Spacer(Modifier.height(RuumTokens.Space12))
                Text(
                    error,
                    style = MaterialTheme.typography.bodySmall,
                    color = RuumTokens.Error,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }

        Column(Modifier.padding(horizontal = RuumTokens.Space20)) {
            RuumCtaButton(
                text = "Crear cuenta y continuar",
                onClick = { onCrear(email.trim(), password, telefono, aceptaTerminos) },
                enabled = valido,
                loading = loading,
            )
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumDividerConTexto("¿Ya tienes una cuenta?")
            TextButton(
                onClick = onVolver,
                modifier = Modifier.fillMaxWidth().height(RuumTokens.Touch),
            ) {
                Text(
                    "Entrar",
                    style = MaterialTheme.typography.labelLarge,
                    color = RuumTokens.Action,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }
    }
}
