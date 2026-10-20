package com.moviliax.ruumruum.conductor.ui.panel

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.GpsOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.alertaLicencia15Dias
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.account.DOCUMENT_REQUIREMENTS
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.common.successBackground
import com.moviliax.ruumruum.conductor.ui.common.successForeground
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import com.moviliax.ruumruum.conductor.ui.trips.TripCard

/** Meta diaria de traslados para el bono (RC-2026-008). */
private const val META_TRASLADOS_DIARIOS = 3

/**
 * Dashboard de inicio del conductor (RC-2026-008) — réplica del prototipo:
 * saludo + chip Conectado, tarjeta de disponibilidad con switch verde,
 * tarjeta de traslados con acción "Buscar ahora", métricas gemenas y
 * salud operacional en lista.
 */
@Composable
fun PanelScreen(
    state: DriverUiState,
    onAvailability: (Availability) -> Unit,
    onTripSelected: (Trip) -> Unit,
    onOpenDocuments: () -> Unit = {},
    onOpenEarnings: () -> Unit = {},
    onOpenTraslados: () -> Unit = {},
    onSearch: () -> Unit = {},
) {
    val available = state.availability == Availability.AVAILABLE
    val onTrip = state.availability == Availability.ON_TRIP
    val earnings = state.payouts.filter { it.estado != "revocado" }.sumOf { it.montoNeto }
    val viajeActivo = state.acceptedTrips.firstOrNull { it.estado == "traslado_en_curso" }
    var confirmarNoDisponible by remember { mutableStateOf(false) }
    var ultimaBusquedaMillis by remember { mutableLongStateOf(0L) }
    val docsPendientes = DOCUMENT_REQUIREMENTS.count { requirement ->
        state.documents.none { it.tipo == requirement.type && it.esActual && it.estado == "aprobado" }
    }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        // Modelo 11.3 — alerta 15 días antes del vencimiento de licencia.
        alertaLicencia15Dias(state.driver?.licenciaVigencia).takeIf { it.activa }?.let { alerta ->
            item {
                RuumAlert(
                    alerta.mensaje.orEmpty(),
                    Modifier.fillMaxWidth(),
                    error = (alerta.dias ?: 0) < 0,
                )
            }
        }
        item {
            SaludoBlock(nombre = state.driver?.nombre?.substringBefore(' '))
        }
        item {
            EstadoDisponibilidadCard(
                available = available,
                onTrip = onTrip,
                onToggle = {
                    if (!it) confirmarNoDisponible = true
                    else onAvailability(Availability.AVAILABLE)
                },
            )
        }
        viajeActivo?.let { viaje ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("Traslado activo", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                    Text(
                        "${viaje.vehiculoMarca.orEmpty()} ${viaje.vehiculoModelo.orEmpty()}".trim().ifBlank { "Traslado en curso" },
                        style = MaterialTheme.typography.titleLarge,
                    )
                    RuumPrimaryButton(
                        "Continuar traslado →",
                        { onTripSelected(viaje) },
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                    )
                }
            }
        }
        if (viajeActivo == null) {
            item {
                TrasladosCard(
                    disponibles = state.availableTrips.size,
                    disponible = available,
                    buscando = state.loading,
                    ultimaBusquedaMillis = ultimaBusquedaMillis,
                    onBuscar = {
                        ultimaBusquedaMillis = System.currentTimeMillis()
                        onSearch()
                    },
                    onVerBandeja = onOpenTraslados,
                )
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space12)) {
                MetricCard(
                    label = "Ganancias del día",
                    value = money(earnings),
                    caption = if (earnings <= 0.0) "Sin cierres aún" else "Acumulado del día",
                    icon = Icons.Default.TrendingUp,
                    modifier = Modifier.weight(1f).clickable(onClick = onOpenEarnings),
                )
                MetricCard(
                    label = "Traslados hoy",
                    value = state.acceptedTrips.size.toString(),
                    caption = bonusCaption(state.acceptedTrips.size),
                    badge = "${state.acceptedTrips.size} / $META_TRASLADOS_DIARIOS",
                    icon = Icons.Default.DirectionsCar,
                    modifier = Modifier.weight(1f).clickable(onClick = onOpenTraslados),
                )
            }
        }
        item {
            SaludOperacionalCard(
                docsPendientes = docsPendientes,
                perfilActivo = state.driver?.estado == "activo",
                onVerDetalle = onOpenDocuments,
                onOpenDocuments = onOpenDocuments,
            )
        }
        item {
            state.acceptedTrips.firstOrNull()?.let { TripCard(it, onClick = { onTripSelected(it) }) }
        }
    }
    if (confirmarNoDisponible) AlertDialog(
        onDismissRequest = { confirmarNoDisponible = false },
        title = { Text("¿Pasas a no disponible?") },
        text = { Text("Dejarás de recibir traslados nuevos hasta que reactives tu disponibilidad.") },
        confirmButton = {
            RuumPrimaryButton("Confirmar", {
                confirmarNoDisponible = false
                onAvailability(Availability.UNAVAILABLE)
            })
        },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmarNoDisponible = false }) },
    )
}

private fun bonusCaption(trasladosHoy: Int): String {
    val faltan = (META_TRASLADOS_DIARIOS - trasladosHoy.coerceAtLeast(0)).coerceAtLeast(0)
    return if (faltan == 0) "¡Bono desbloqueado!" else "Faltan $faltan para bono"
}

@Composable
private fun SaludoBlock(nombre: String?) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(
                "¡Hola, ${nombre ?: "Conductor"}!",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "Todo listo para tu jornada.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        ConectadoChip()
    }
}

@Composable
private fun ConectadoChip() {
    Surface(shape = CircleShape, color = successBackground(), contentColor = successForeground()) {
        Row(
            Modifier.padding(horizontal = RuumTokens.Space12, vertical = RuumTokens.Space8),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space4),
        ) {
            Box(Modifier.size(8.dp).background(successForeground(), CircleShape))
            Text("Conectado", style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun EstadoDisponibilidadCard(
    available: Boolean,
    onTrip: Boolean,
    onToggle: (Boolean) -> Unit,
) {
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            RoundedIconBox(
                icon = Icons.Default.Campaign,
                tint = if (available) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
                background = if (available) successBackground() else MaterialTheme.colorScheme.surfaceVariant,
            )
            Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
                Text(
                    "Estado de disponibilidad",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    if (available) "DISPONIBLE" else if (onTrip) "EN VIAJE" else "NO DISPONIBLE",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    when {
                        onTrip -> "Traslado activo — disponibilidad bloqueada"
                        available -> "Recibiendo solicitudes de traslado."
                        else -> "No recibirás traslados hasta reactívarte"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(
                checked = available,
                enabled = !onTrip,
                onCheckedChange = onToggle,
                colors = SwitchDefaults.colors(
                    checkedTrackColor = successForeground(),
                    checkedBorderColor = Color.Transparent,
                    uncheckedTrackColor = MaterialTheme.colorScheme.surfaceVariant,
                    uncheckedBorderColor = Color.Transparent,
                    uncheckedThumbColor = MaterialTheme.colorScheme.onSurfaceVariant,
                ),
                thumbContent = if (available) {
                    {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            Modifier.size(18.dp),
                            tint = Color.White,
                        )
                    }
                } else null,
            )
        }
    }
}

@Composable
private fun TrasladosCard(
    disponibles: Int,
    disponible: Boolean,
    buscando: Boolean,
    ultimaBusquedaMillis: Long,
    onBuscar: () -> Unit,
    onVerBandeja: () -> Unit,
) {
    val context = LocalContext.current
    Surface(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(RuumTokens.RadiusXl),
        color = MaterialTheme.colorScheme.surfaceVariant,
        contentColor = MaterialTheme.colorScheme.onSurface,
    ) {
        Column(Modifier.padding(RuumTokens.Space16)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RoundedIconBox(icon = Icons.Default.DirectionsCar, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.padding(start = RuumTokens.Space12)) {
                    Text(
                        "Traslados de ahora",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        if (disponibles > 0) "$disponibles traslados disponibles en tu zona" else "Sin traslados por ahora",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        lastSearchLabel(context, ultimaBusquedaMillis),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            RuumPrimaryButton(
                if (disponible) "Buscar ahora" else "Activarme y buscar ahora",
                onBuscar,
                Modifier.fillMaxWidth().padding(top = RuumTokens.Space16),
                loading = buscando,
                leadingIcon = Icons.Default.Search,
            )
            RuumSecondaryButton(
                "Ver bandeja",
                onVerBandeja,
                Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                leadingIcon = Icons.Default.ChevronRight,
            )
        }
    }
}

private fun lastSearchLabel(context: Context, ultimaBusquedaMillis: Long): String {
    if (ultimaBusquedaMillis <= 0L) return "Todavía no has buscado traslados."
    val minutos = ((System.currentTimeMillis() - ultimaBusquedaMillis) / 60_000L).coerceAtLeast(0)
    return when (minutos) {
        0L -> "Última búsqueda hace instantes."
        1L -> "Última búsqueda hace 1 min."
        else -> "Última búsqueda hace $minutos min."
    }
}

@Composable
private fun MetricCard(
    label: String,
    value: String,
    caption: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    badge: String? = null,
) {
    Surface(
        modifier.defaultMinSize(minHeight = RuumTokens.Touch),
        shape = MaterialTheme.shapes.large,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(Modifier.padding(RuumTokens.Space16)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RoundedIconBox(icon = icon, tint = MaterialTheme.colorScheme.primary)
                if (badge != null) {
                    Spacer(Modifier.width(RuumTokens.Space8))
                    Text(
                        badge,
                        Modifier.weight(1f),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
            Text(
                label,
                Modifier.padding(top = RuumTokens.Space12),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
            Text(
                caption,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SaludOperacionalCard(
    docsPendientes: Int,
    perfilActivo: Boolean,
    onVerDetalle: () -> Unit,
    onOpenDocuments: () -> Unit,
) {
    val context = LocalContext.current
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Salud operacional",
                Modifier.weight(1f),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Row(
                Modifier
                    .defaultMinSize(minHeight = RuumTokens.Touch)
                    .clickable(onClick = onVerDetalle)
                    .padding(horizontal = RuumTokens.Space8),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Ver detalle",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
        }
        Spacer(Modifier.height(RuumTokens.Space8))
        SaludRow(
            icon = Icons.Default.Description,
            titulo = "Documentos",
            ok = docsPendientes == 0,
            valor = if (docsPendientes == 0) "Vigentes" else "Pendientes ($docsPendientes)",
            onClick = onOpenDocuments,
        )
        SaludRow(
            icon = Icons.Default.Person,
            titulo = "Perfil",
            ok = perfilActivo,
            valor = if (perfilActivo) "Habilitado" else "En validación",
        )
        SaludRow(
            icon = if (tienePermisoUbicacion(context)) Icons.Default.GpsFixed else Icons.Default.GpsOff,
            titulo = "GPS",
            ok = tienePermisoUbicacion(context),
            valor = if (tienePermisoUbicacion(context)) "Activo" else "Requiere permiso",
        )
        val online = isOnline(context)
        SaludRow(
            icon = if (online) Icons.Default.Wifi else Icons.Default.WifiOff,
            titulo = "Conexión",
            ok = online,
            valor = if (online) "Conectado" else "Sin conexión",
        )
    }
}

@Composable
private fun SaludRow(
    icon: ImageVector,
    titulo: String,
    valor: String,
    ok: Boolean,
    onClick: (() -> Unit)? = null,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = RuumTokens.Touch)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(vertical = RuumTokens.Space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RoundedIconBox(
            icon = icon,
            tint = if (ok) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
            background = if (ok) successBackground() else MaterialTheme.colorScheme.surfaceVariant,
        )
        Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
            Text(titulo, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (ok) Icons.Default.CheckCircle else Icons.Default.ChevronRight,
                    contentDescription = null,
                    Modifier.size(14.dp),
                    tint = if (ok) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    valor,
                    Modifier.padding(start = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (ok) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Icon(
            Icons.Default.ChevronRight,
            contentDescription = null,
            Modifier.size(18.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun RoundedIconBox(
    icon: ImageVector,
    tint: Color,
    background: Color = MaterialTheme.colorScheme.primaryContainer,
) {
    Surface(
        shape = RoundedCornerShape(RuumTokens.RadiusMd),
        color = background,
        modifier = Modifier.size(44.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, Modifier.size(22.dp), tint = tint)
        }
    }
}

private fun tienePermisoUbicacion(context: Context): Boolean =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

private fun isOnline(context: Context): Boolean {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
    return cm?.activeNetwork != null
}
