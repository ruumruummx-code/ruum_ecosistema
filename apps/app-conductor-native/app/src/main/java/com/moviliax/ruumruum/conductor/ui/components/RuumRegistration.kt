package com.moviliax.ruumruum.conductor.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/** Rutas legales publicadas por la app de usuario (mismo origen que el prototipo web). */
object RuumLegal {
    const val BASE_URL = "https://usuario.ruumruum-moviliax.online"
    const val TERMINOS = "$BASE_URL/legal/terminos"
    const val PRIVACIDAD = "$BASE_URL/legal/privacidad"
}

/**
 * Cabecera del flujo de registro: "‹ Atrás" a la izquierda, logo al centro y
 * progreso segmentado "X de 5" a la derecha (espejo de RegistrationAccessHeader).
 */
@Composable
fun RuumRegistrationHeader(
    paso: Int,
    total: Int = 5,
    onAtras: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = RuumTokens.Space16, vertical = RuumTokens.Space8),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(RuumTokens.RadiusSm))
                .clickable(onClick = onAtras)
                .heightIn(min = RuumTokens.Touch),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Atrás",
                modifier = Modifier.size(20.dp),
                tint = RuumTokens.Action,
            )
            Spacer(Modifier.width(RuumTokens.Space4))
            Text(
                "Atrás",
                style = MaterialTheme.typography.labelLarge,
                color = RuumTokens.Action,
            )
        }
        Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
            Image(
                painter = painterResource(R.drawable.ruum_logo_horizontal),
                contentDescription = "Ruum Ruum",
                modifier = Modifier.width(112.dp).height(30.dp),
                contentScale = ContentScale.Fit,
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                "$paso de $total",
                style = MaterialTheme.typography.labelMedium,
                color = RuumTokens.RegistrationTextSecondary,
            )
            Spacer(Modifier.height(RuumTokens.Space4))
            Row(
                modifier = Modifier.width(72.dp),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                repeat(total) { indice ->
                    Box(
                        Modifier
                            .weight(1f)
                            .height(5.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                if (indice < paso) RuumTokens.Action else RuumTokens.RegistrationProgressIdle
                            )
                    )
                }
            }
        }
    }
}

/**
 * Campo denso del prototipo: etiqueta pequeña dentro del recuadro, valor (o
 * placeholder) debajo y adornos opcionales a la izquierda y a la derecha.
 */
@Composable
fun RuumDenseField(
    valor: String,
    onValorChange: (String) -> Unit,
    etiqueta: String,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    singleLine: Boolean = true,
    minHeight: Dp = RuumTokens.RegistrationFieldHeight,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val focused by interactionSource.collectIsFocusedAsState()
    val shape = RoundedCornerShape(RuumTokens.RegistrationFieldRadius)
    val borde = if (focused) RuumTokens.Action else RuumTokens.RegistrationFieldBorder

    BasicTextField(
        value = valor,
        onValueChange = onValorChange,
        modifier = modifier.fillMaxWidth(),
        textStyle = MaterialTheme.typography.bodyLarge.copy(color = MaterialTheme.colorScheme.onSurface),
        singleLine = singleLine,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        cursorBrush = SolidColor(RuumTokens.Action),
        interactionSource = interactionSource,
        decorationBox = { campo ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = minHeight)
                    .clip(shape)
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, borde, shape)
                    .padding(
                        start = RuumTokens.Space12,
                        end = if (trailing == null) RuumTokens.Space12 else 0.dp,
                    ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                leading?.let {
                    it()
                    Spacer(Modifier.width(RuumTokens.Space8))
                }
                Column(Modifier.weight(1f).padding(vertical = 8.dp)) {
                    Text(
                        etiqueta,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                    )
                    Box(Modifier.heightIn(min = 22.dp), contentAlignment = Alignment.CenterStart) {
                        if (valor.isEmpty() && placeholder.isNotEmpty()) {
                            Text(
                                placeholder,
                                style = MaterialTheme.typography.bodyMedium,
                                color = RuumTokens.RegistrationPlaceholder,
                                maxLines = 1,
                            )
                        }
                        campo()
                    }
                }
                trailing?.invoke()
            }
        },
    )
}

/** Requisito de contraseña: círculo que se marca en verde cuando se cumple. */
@Composable
fun RuumRequisito(texto: String, cumplido: Boolean, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(18.dp)
                .clip(CircleShape)
                .border(
                    width = 1.5.dp,
                    color = if (cumplido) RuumTokens.Success else RuumTokens.RegistrationFieldBorder,
                    shape = CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            if (cumplido) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp),
                    tint = RuumTokens.Success,
                )
            }
        }
        Spacer(Modifier.width(RuumTokens.Space8))
        Text(
            texto,
            style = MaterialTheme.typography.bodySmall,
            color = if (cumplido) RuumTokens.Success else MaterialTheme.colorScheme.onSurface,
        )
    }
}

/** Botón principal del flujo de registro, con flecha a la derecha. */
@Composable
fun RuumCtaButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier
            .fillMaxWidth()
            .height(RuumTokens.ButtonHeight),
        shape = RoundedCornerShape(RuumTokens.RegistrationFieldRadius),
        colors = ButtonDefaults.buttonColors(
            containerColor = RuumTokens.Action,
            contentColor = RuumTokens.White,
            disabledContainerColor = RuumTokens.Action.copy(alpha = 0.4f),
            disabledContentColor = RuumTokens.White,
        ),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = RuumTokens.White,
            )
        } else {
            Text(text, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.width(RuumTokens.Space8))
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}

/**
 * Resumen accionable del paso de identidad (domicilio / contacto de
 * emergencia): icono, título, acción y chevron.
 */
@Composable
fun RuumResumenAccion(
    icono: ImageVector,
    titulo: String,
    accion: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(RuumTokens.RegistrationFieldRadius))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                width = 1.dp,
                color = RuumTokens.RegistrationFieldBorder,
                shape = RoundedCornerShape(RuumTokens.RegistrationFieldRadius),
            )
            .clickable(onClick = onClick)
            .padding(RuumTokens.Space12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icono, contentDescription = null, modifier = Modifier.size(20.dp), tint = RuumTokens.RegistrationAccent)
        Spacer(Modifier.width(RuumTokens.Space12))
        Column(Modifier.weight(1f)) {
            Text(titulo, style = MaterialTheme.typography.titleSmall)
            Text(
                accion,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = RuumTokens.RegistrationTextSecondary,
        )
    }
}

/** Selector de país del campo de teléfono (solo México en el piloto). */
@Composable
fun RuumCountryPicker(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.heightIn(min = 40.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_bandera_mx),
            contentDescription = "México",
            modifier = Modifier.width(27.dp).height(18.dp),
            contentScale = ContentScale.Fit,
        )
        Spacer(Modifier.width(RuumTokens.Space4))
        Text(
            "⌄",
            style = MaterialTheme.typography.bodyMedium,
            color = RuumTokens.RegistrationTextSecondary,
        )
    }
}

/** Botón de alternar visibilidad de contraseña. */
@Composable
fun RuumTogglePassword(
    visible: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    descripcion: String = "Mostrar contraseña",
) {
    Box(
        modifier = modifier
            .size(44.dp)
            .clip(RoundedCornerShape(RuumTokens.RadiusSm))
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
            contentDescription = descripcion,
            modifier = Modifier.size(22.dp),
            tint = RuumTokens.RegistrationTextSecondary,
        )
    }
}

/** Divisor con texto centrado (piezas del prototipo, p. ej. "¿Ya tienes una cuenta?"). */
@Composable
fun RuumDividerConTexto(texto: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .weight(1f)
                .height(1.dp)
                .background(RuumTokens.RegistrationFieldBorder)
        )
        Text(
            texto,
            modifier = Modifier.padding(horizontal = RuumTokens.Space12),
            style = MaterialTheme.typography.bodyMedium,
            color = RuumTokens.RegistrationTextSecondary,
        )
        Box(
            Modifier
                .weight(1f)
                .height(1.dp)
                .background(RuumTokens.RegistrationFieldBorder)
        )
    }
}

/** Título grande del paso (p. ej. "Crea tu cuenta"). */
@Composable
fun RuumRegistroTitulo(titulo: String, subtitulo: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            titulo,
            style = MaterialTheme.typography.displayLarge.copy(fontSize = 32.sp),
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(Modifier.height(RuumTokens.Space4))
        Text(
            subtitulo,
            style = MaterialTheme.typography.bodyLarge,
            color = RuumTokens.RegistrationTextSecondary,
        )
    }
}

/** Azul de marca reutilizable por los textos del flujo de registro. */
val RuumBrandBlue: Color = RuumTokens.Action
