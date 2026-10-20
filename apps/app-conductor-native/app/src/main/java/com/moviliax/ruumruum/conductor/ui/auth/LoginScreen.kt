package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/** Rutas legales publicadas por la app de usuario. */
private const val BASE_URL_LEGAL = "https://usuario.ruumruum-moviliax.online"
private const val URL_TERMINOS = "$BASE_URL_LEGAL/legal/terminos"
private const val URL_PRIVACIDAD = "$BASE_URL_LEGAL/legal/privacidad"

// La pantalla de acceso mantiene la paleta clara del prototipo aun con tema oscuro.
private val Navy = RuumTokens.Navy
private val Muted = RuumTokens.Muted
private val BrandBlue = RuumTokens.Action
private val FieldBorder = Color(0xFFD9DFE8)
private val FieldIcon = Color(0xFF64748B)
private val InputRadius = 12.dp

@Composable
fun LoginScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    onRegistro: () -> Unit = {},
    onRecuperacion: () -> Unit = {},
) {
    var email by rememberSaveable { mutableStateOf("") }
    // La contraseña no se persiste en el estado guardado del proceso.
    var password by remember { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    var emailError by rememberSaveable { mutableStateOf<String?>(null) }
    var passwordError by rememberSaveable { mutableStateOf<String?>(null) }

    val focusManager = LocalFocusManager.current
    val submitRequester = remember { BringIntoViewRequester() }
    val density = LocalDensity.current
    // Algunos fabricantes reportan el alto de la barra de navegación como inset
    // del IME aún con el teclado oculto; solo contamos el teclado si lo supera.
    val imeVisible = WindowInsets.ime.getBottom(density) >
        WindowInsets.navigationBars.getBottom(density)

    fun submit() {
        val correo = email.trim()
        val correoInvalido = correo.isNotBlank() &&
            !android.util.Patterns.EMAIL_ADDRESS.matcher(correo).matches()
        emailError = when {
            correo.isBlank() -> "Ingresa tu correo."
            correoInvalido -> "Formato de correo inválido."
            else -> null
        }
        passwordError = if (password.isBlank()) "Ingresa tu contraseña." else null
        if (emailError == null && passwordError == null) {
            focusManager.clearFocus()
            onLogin(correo, password)
        }
    }

    LaunchedEffect(imeVisible) {
        // Reajuste elástico: con el teclado abierto el contenido se desplaza
        // para mantener visible el botón "Entrar".
        if (imeVisible) {
            withFrameNanos { }
            runCatching { submitRequester.bringIntoView() }
        }
    }

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(RuumTokens.White)
            .systemBarsPadding()
            .imePadding(),
    ) {
        val compact = imeVisible || maxHeight < 640.dp
        val scrollState = rememberScrollState()

        val content: @Composable ColumnScope.() -> Unit = {
            Spacer(Modifier.height(if (compact) RuumTokens.Space8 else RuumTokens.Space24))
            Image(
                painter = painterResource(R.drawable.ruum_logo_login),
                contentDescription = "Ruum Ruum",
                modifier = Modifier.align(Alignment.CenterHorizontally).width(154.dp).height(36.dp),
                contentScale = ContentScale.Fit,
            )
            Spacer(Modifier.height(if (compact) RuumTokens.Space16 else RuumTokens.Space24))
            Text(
                "Iniciar sesión",
                style = MaterialTheme.typography.displayLarge,
                color = Navy,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(RuumTokens.Space4))
            Text(
                "Ingresa para comenzar a conducir con nosotros",
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 18.sp, lineHeight = 24.sp),
                color = Muted,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(if (compact) RuumTokens.Space16 else RuumTokens.Space24))

            LoginField(
                value = email,
                onValueChange = { email = it; emailError = null },
                label = "Correo",
                placeholder = "tu@correo.com",
                icon = Icons.Outlined.Email,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) },
                ),
            )
            if (emailError != null) FieldError(emailError!!)
            Spacer(Modifier.height(RuumTokens.Space12))

            LoginField(
                value = password,
                onValueChange = { password = it; passwordError = null },
                label = "Contraseña",
                placeholder = "Ingresa tu contraseña",
                icon = Icons.Outlined.Lock,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(onDone = { submit() }),
                visualTransformation = if (passwordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    IconButton(
                        onClick = { passwordVisible = !passwordVisible },
                        modifier = Modifier.size(RuumTokens.Touch),
                    ) {
                        Icon(
                            imageVector = if (passwordVisible) {
                                Icons.Outlined.Visibility
                            } else {
                                Icons.Outlined.VisibilityOff
                            },
                            contentDescription = if (passwordVisible) {
                                "Ocultar contraseña"
                            } else {
                                "Mostrar contraseña"
                            },
                            tint = FieldIcon,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                },
            )
            if (passwordError != null) FieldError(passwordError!!)

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(
                    onClick = onRecuperacion,
                    modifier = Modifier.heightIn(min = RuumTokens.Touch),
                ) {
                    Text(
                        "¿Olvidaste tu contraseña?",
                        color = BrandBlue,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }

            if (error != null) {
                Text(
                    error,
                    Modifier.fillMaxWidth().padding(bottom = RuumTokens.Space8),
                    color = RuumTokens.Error,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                )
            }

            Button(
                onClick = { submit() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(RuumTokens.ButtonHeight)
                    .bringIntoViewRequester(submitRequester),
                enabled = !loading,
                shape = RoundedCornerShape(RuumTokens.RadiusLg),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandBlue,
                    contentColor = RuumTokens.White,
                    disabledContainerColor = BrandBlue.copy(alpha = 0.55f),
                    disabledContentColor = RuumTokens.White,
                ),
            ) {
                if (loading) {
                    CircularProgressIndicator(
                        Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = RuumTokens.White,
                    )
                } else {
                    Text(
                        "Entrar",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            Spacer(Modifier.height(RuumTokens.Space16))
            LegalNotice()

            if (compact) {
                Spacer(Modifier.height(RuumTokens.Space16))
            } else {
                Spacer(Modifier.weight(1f))
            }

            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                HorizontalDivider(Modifier.weight(1f), 1.dp, FieldBorder)
                Text(
                    "¿Aún no tienes una cuenta?",
                    Modifier.padding(horizontal = RuumTokens.Space12),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                )
                HorizontalDivider(Modifier.weight(1f), 1.dp, FieldBorder)
            }
            TextButton(
                onClick = onRegistro,
                modifier = Modifier.fillMaxWidth().heightIn(min = RuumTokens.Touch),
            ) {
                Text(
                    "Crea tu cuenta",
                    color = BrandBlue,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }

        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
            if (compact) {
                Column(
                    Modifier
                        .fillMaxHeight()
                        .widthIn(max = 440.dp)
                        .verticalScroll(scrollState)
                        .padding(horizontal = RuumTokens.Space32),
                    content = content,
                )
            } else {
                Column(
                    Modifier
                        .fillMaxHeight()
                        .widthIn(max = 440.dp)
                        .padding(horizontal = RuumTokens.Space32),
                    content = content,
                )
            }
        }
    }
}

@Composable
private fun LoginField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    icon: ImageVector,
    keyboardOptions: KeyboardOptions,
    modifier: Modifier = Modifier,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: (@Composable () -> Unit)? = null,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val focused by interactionSource.collectIsFocusedAsState()
    val shape = RoundedCornerShape(InputRadius)

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth().semantics { contentDescription = label },
        textStyle = MaterialTheme.typography.bodyLarge.copy(color = Navy),
        singleLine = true,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        cursorBrush = SolidColor(BrandBlue),
        interactionSource = interactionSource,
        decorationBox = { innerTextField ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 64.dp)
                    .clip(shape)
                    .background(RuumTokens.White)
                    .border(1.dp, if (focused) BrandBlue else FieldBorder, shape)
                    .padding(start = RuumTokens.Space16, end = if (trailingIcon == null) RuumTokens.Space16 else 0.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(24.dp), tint = FieldIcon)
                Spacer(Modifier.width(RuumTokens.Space16))
                Column(Modifier.weight(1f).padding(vertical = 10.dp)) {
                    Text(
                        label,
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 12.sp),
                        color = Navy,
                        maxLines = 1,
                    )
                    Spacer(Modifier.height(2.dp))
                    Box(Modifier.heightIn(min = 24.dp), contentAlignment = Alignment.CenterStart) {
                        if (value.isEmpty()) {
                            Text(
                                placeholder,
                                style = MaterialTheme.typography.bodyLarge,
                                color = Muted,
                                maxLines = 1,
                            )
                        }
                        innerTextField()
                    }
                }
                trailingIcon?.invoke()
            }
        },
    )
}

@Composable
private fun FieldError(message: String) {
    Text(
        message,
        Modifier.padding(top = RuumTokens.Space4),
        color = RuumTokens.Error,
        style = MaterialTheme.typography.bodySmall,
    )
}

@Composable
private fun LegalNotice() {
    val linkStyle = TextLinkStyles(
        style = SpanStyle(color = BrandBlue, textDecoration = TextDecoration.Underline),
    )
    Text(
        text = buildAnnotatedString {
            append("Al entrar aceptas los ")
            withLink(LinkAnnotation.Url(URL_TERMINOS, linkStyle)) {
                append("Términos y Condiciones")
            }
            append("\ny el ")
            withLink(LinkAnnotation.Url(URL_PRIVACIDAD, linkStyle)) {
                append("Aviso de Privacidad")
            }
            append(".")
        },
        modifier = Modifier.fillMaxWidth(),
        style = MaterialTheme.typography.bodySmall.copy(lineHeight = 18.sp),
        color = Muted,
        textAlign = TextAlign.Center,
    )
}
