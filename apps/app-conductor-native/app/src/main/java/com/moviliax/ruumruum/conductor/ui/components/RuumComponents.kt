package com.moviliax.ruumruum.conductor.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumStreetMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumCtaDark
import com.moviliax.ruumruum.conductor.ui.theme.RuumCtaLight
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun RuumPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    leadingIcon: ImageVector? = null,
) {
    val street = LocalRuumStreetMode.current
    val dark = LocalRuumDarkMode.current
    val height = if (street) RuumTokens.ButtonHeightStreet else RuumTokens.ButtonHeight
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier
            .height(height)
            .clip(MaterialTheme.shapes.medium)
            .background(if (dark) RuumCtaDark else RuumCtaLight),
        shape = MaterialTheme.shapes.medium,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            contentColor = if (dark) RuumTokens.DarkBg else RuumTokens.White,
            disabledContainerColor = Color.Transparent,
            disabledContentColor = if (dark) RuumTokens.DarkBg else RuumTokens.White,
        ),
    ) {
        if (loading) {
            CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = localContentColor())
        } else {
            leadingIcon?.let {
                Icon(it, null, Modifier.size(20.dp))
                Spacer(Modifier.size(RuumTokens.Space8))
            }
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun localContentColor(): Color = if (LocalRuumDarkMode.current) RuumTokens.DarkBg else RuumTokens.White

@Composable
fun RuumSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
) {
    val street = LocalRuumStreetMode.current
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(if (street) RuumTokens.ButtonHeightStreet else RuumTokens.ButtonHeight),
        shape = MaterialTheme.shapes.medium,
        border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary),
    ) {
        leadingIcon?.let {
            Icon(it, null, Modifier.size(20.dp))
            Spacer(Modifier.size(RuumTokens.Space8))
        }
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun RuumCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.large,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(RuumTokens.Space20), content = content)
    }
}

private enum class ChipTone { NEUTRAL, ACTION, WARNING, SUCCESS, ERROR }

private data class ChipStyle(
    val label: String,
    val tone: ChipTone,
    val icon: ImageVector,
)

private fun chipStyle(value: String): ChipStyle {
    val normalized = value.lowercase()
    return when {
        normalized in setOf("procesado", "pagado", "aprobado", "servicio_cerrado", "entrega_confirmada", "disponible") ->
            ChipStyle(value, ChipTone.SUCCESS, Icons.Default.CheckCircle)
        normalized.contains("pendiente") || normalized.contains("revision") || normalized == "programado" ->
            ChipStyle(value, ChipTone.WARNING, Icons.Default.Schedule)
        normalized.contains("error") || normalized.contains("rechaz") || normalized.contains("cancel") || normalized.contains("fallido") ->
            ChipStyle(value, ChipTone.ERROR, Icons.Default.Error)
        normalized.contains("curso") || normalized.contains("asignado") || normalized.contains("viaje") ->
            ChipStyle(value, ChipTone.ACTION, Icons.Default.DirectionsCar)
        else -> ChipStyle(value, ChipTone.NEUTRAL, Icons.Default.Info)
    }
}

@Composable
fun RuumStatusChip(value: String, modifier: Modifier = Modifier) {
    val style = chipStyle(value)
    val dark = LocalRuumDarkMode.current
    val colors = when (style.tone) {
        ChipTone.NEUTRAL -> if (dark) RuumTokens.DarkSurfaceElevated to RuumTokens.DarkTextSecondary else RuumTokens.NeutralBg to RuumTokens.Muted
        ChipTone.ACTION -> if (dark) RuumTokens.DarkSurfaceElevated to RuumTokens.DarkActionHover else RuumTokens.ActionBg to Color(0xFF1461E0)
        ChipTone.WARNING -> if (dark) RuumTokens.DarkWarningBg to RuumTokens.DarkWarningText else RuumTokens.WarningBg to RuumTokens.WarningText
        ChipTone.SUCCESS -> if (dark) RuumTokens.DarkSuccessBg to RuumTokens.DarkSuccessText else RuumTokens.SuccessBg to RuumTokens.SuccessText
        ChipTone.ERROR -> if (dark) RuumTokens.DarkErrorBg to RuumTokens.DarkErrorText else RuumTokens.ErrorBg to RuumTokens.Error
    }
    Surface(modifier, shape = CircleShape, color = colors.first, contentColor = colors.second) {
        Row(
            Modifier.padding(horizontal = RuumTokens.Space12, vertical = RuumTokens.Space8),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space4),
        ) {
            Icon(style.icon, null, Modifier.size(14.dp))
            Text(style.label.replace('_', ' '), style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
fun RuumAlert(
    message: String,
    modifier: Modifier = Modifier,
    error: Boolean = false,
) {
    val dark = LocalRuumDarkMode.current
    val background = when {
        error && dark -> RuumTokens.DarkErrorBg
        error -> RuumTokens.ErrorBg
        dark -> RuumTokens.DarkSurfaceElevated
        else -> RuumTokens.ActionBg
    }
    val foreground = when {
        error && dark -> RuumTokens.DarkErrorText
        error -> RuumTokens.Error
        dark -> RuumTokens.DarkActionHover
        else -> Color(0xFF1461E0)
    }
    Surface(modifier, shape = MaterialTheme.shapes.medium, color = background, contentColor = foreground) {
        Row(Modifier.padding(RuumTokens.Space16), verticalAlignment = Alignment.CenterVertically) {
            Icon(if (error) Icons.Default.Error else Icons.Default.Info, null, Modifier.size(20.dp))
            Text(message, Modifier.padding(start = RuumTokens.Space12), style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun RuumEmptyState(
    title: String,
    description: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier.fillMaxWidth().padding(vertical = RuumTokens.Space32),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer) {
            Icon(icon, null, Modifier.padding(RuumTokens.Space16).size(28.dp), tint = MaterialTheme.colorScheme.primary)
        }
        Spacer(Modifier.height(RuumTokens.Space16))
        Text(title, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
        Text(
            description,
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun RuumLogo(
    modifier: Modifier = Modifier,
    darkVariant: Boolean = LocalRuumDarkMode.current,
    contentDescription: String = "Ruum Ruum Driveaway Service",
) {
    @DrawableRes val resource = if (darkVariant) R.drawable.ruum_logo_dark else R.drawable.ruum_logo_horizontal
    Image(
        painter = painterResource(resource),
        contentDescription = contentDescription,
        modifier = modifier,
        contentScale = ContentScale.Fit,
    )
}
