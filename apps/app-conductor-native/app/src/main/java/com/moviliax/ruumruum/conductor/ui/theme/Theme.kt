package com.moviliax.ruumruum.conductor.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.moviliax.ruumruum.conductor.R

enum class RuumThemeMode { SYSTEM, LIGHT, DARK }

val LocalRuumStreetMode = compositionLocalOf { false }
val LocalRuumDarkMode = compositionLocalOf { false }

val RuumCtaLight = Brush.horizontalGradient(listOf(RuumTokens.TealDeep, RuumTokens.Action))
val RuumCtaDark = Brush.horizontalGradient(listOf(RuumTokens.DarkTealDeep, RuumTokens.DarkAction))
val RuumRouteLight = Brush.horizontalGradient(listOf(RuumTokens.Teal, RuumTokens.Action))
val RuumRouteDark = Brush.horizontalGradient(listOf(RuumTokens.Teal, RuumTokens.DarkAction))

private val Inter = FontFamily(
    Font(R.font.inter_variable, FontWeight.Normal),
    Font(R.font.inter_variable, FontWeight.Medium),
    Font(R.font.inter_variable, FontWeight.SemiBold),
    Font(R.font.inter_variable, FontWeight.Bold),
    Font(R.font.inter_variable, FontWeight.ExtraBold),
)

private val RuumTypography = Typography(
    displayLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Bold, fontSize = RuumTokens.Display, lineHeight = 48.sp),
    headlineLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Bold, fontSize = RuumTokens.H1, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.H2, lineHeight = 32.sp),
    headlineSmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.H3, lineHeight = 26.sp),
    titleLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.H3, lineHeight = 26.sp),
    titleMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.Body, lineHeight = 24.sp),
    titleSmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.Small, lineHeight = 20.sp),
    bodyLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = RuumTokens.Body, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = RuumTokens.Small, lineHeight = 20.sp),
    bodySmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = RuumTokens.Caption, lineHeight = 18.sp),
    labelLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.Body, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.Small, lineHeight = 18.sp),
    labelSmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = RuumTokens.Caption, lineHeight = 16.sp),
)

private val RuumShapes = Shapes(
    extraSmall = RoundedCornerShape(RuumTokens.RadiusSm),
    small = RoundedCornerShape(RuumTokens.RadiusMd),
    medium = RoundedCornerShape(RuumTokens.RadiusLg),
    large = RoundedCornerShape(RuumTokens.RadiusXl),
    extraLarge = RoundedCornerShape(RuumTokens.RadiusXl),
)

private val LightColors = lightColorScheme(
    primary = RuumTokens.Action,
    onPrimary = RuumTokens.White,
    primaryContainer = RuumTokens.ActionBg,
    onPrimaryContainer = RuumTokens.Navy,
    secondary = RuumTokens.TealDeep,
    onSecondary = RuumTokens.White,
    tertiary = RuumTokens.Teal,
    onTertiary = RuumTokens.Navy,
    background = RuumTokens.Canvas,
    onBackground = RuumTokens.Navy,
    surface = RuumTokens.White,
    onSurface = RuumTokens.Navy,
    surfaceVariant = RuumTokens.NeutralBg,
    onSurfaceVariant = RuumTokens.Muted,
    outline = RuumTokens.BorderInput,
    outlineVariant = RuumTokens.Border,
    error = RuumTokens.Error,
    onError = RuumTokens.White,
    errorContainer = RuumTokens.ErrorBg,
    onErrorContainer = RuumTokens.Error,
)

private val DarkColors = darkColorScheme(
    primary = RuumTokens.DarkAction,
    onPrimary = RuumTokens.DarkBg,
    primaryContainer = RuumTokens.DarkSurfaceElevated,
    onPrimaryContainer = RuumTokens.DarkActionHover,
    secondary = RuumTokens.DarkTealDeep,
    onSecondary = RuumTokens.DarkBg,
    tertiary = RuumTokens.Teal,
    onTertiary = RuumTokens.DarkBg,
    background = RuumTokens.DarkBg,
    onBackground = RuumTokens.DarkTextPrimary,
    surface = RuumTokens.DarkSurface,
    onSurface = RuumTokens.DarkTextPrimary,
    surfaceVariant = RuumTokens.DarkSurfaceElevated,
    onSurfaceVariant = RuumTokens.DarkTextSecondary,
    outline = RuumTokens.DarkBorderInput,
    outlineVariant = RuumTokens.DarkBorder,
    error = RuumTokens.DarkErrorText,
    onError = RuumTokens.DarkBg,
    errorContainer = RuumTokens.DarkErrorBg,
    onErrorContainer = RuumTokens.DarkErrorText,
)

@Composable
fun RuumTheme(
    mode: RuumThemeMode = RuumThemeMode.SYSTEM,
    streetMode: Boolean = false,
    content: @Composable () -> Unit,
) {
    val dark = when (mode) {
        RuumThemeMode.SYSTEM -> isSystemInDarkTheme()
        RuumThemeMode.LIGHT -> false
        RuumThemeMode.DARK -> true
    }
    CompositionLocalProvider(
        LocalRuumStreetMode provides streetMode,
        LocalRuumDarkMode provides dark,
    ) {
        MaterialTheme(
            colorScheme = if (dark) DarkColors else LightColors,
            typography = RuumTypography,
            shapes = RuumShapes,
            content = content,
        )
    }
}
