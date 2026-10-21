package com.moviliax.ruumruum.conductor.ui.account

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.SupportAgent
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.ui.common.successBackground
import com.moviliax.ruumruum.conductor.ui.common.successForeground
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

private val ColorPerfil = Color(0xFF6D43D6)
private val ColorDocumentos = Color(0xFF8B93B8)
private val ColorCertificacion = Color(0xFFE8930C)
private val ColorBancario = Color(0xFF1DAEDD)

/**
 * Pantalla de Cuenta (réplica del prototipo): cabecera con logotipo, campana con punto
 * rojo, soporte y avatar de iniciales; título con bajada, banner de sincronización,
 * tarjetas de navegación (Perfil, Documentos, Certificación, Datos bancarios) y
 * acción de cerrar sesión.
 */
@Composable
fun AccountScreen(
    driverName: String,
    tieneBanco: Boolean,
    sincronizado: Boolean,
    unreadCount: Int,
    onSignOut: () -> Unit,
    onOpenDocuments: () -> Unit,
    onOpenCertificacion: () -> Unit,
    onOpenPerfil: () -> Unit,
    onNotifications: () -> Unit = {},
) {
    var confirmSignOut by remember { mutableStateOf(false) }
    var mostrarSoporte by remember { mutableStateOf(false) }
    var mostrarBanco by remember { mutableStateOf(false) }

    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            CuentaTopBar(
                driverName = driverName,
                unreadCount = unreadCount,
                onNotifications = onNotifications,
                onSupport = { mostrarSoporte = true },
            )
        }
        item {
            Column {
                Text(
                    "Cuenta",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    "Administra tu información y configuración",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        item {
            BannerSincronizado(sincronizado = sincronizado)
        }
        item {
            CuentaTarjeta(
                icon = Icons.Default.Person,
                iconTint = ColorPerfil,
                titulo = "Perfil",
                descripcion = "Tu información personal",
                onClick = onOpenPerfil,
            )
        }
        item {
            CuentaTarjeta(
                icon = Icons.Default.Description,
                iconTint = ColorDocumentos,
                titulo = "Documentos",
                descripcion = "Carga y revisa tus documentos",
                onClick = onOpenDocuments,
            )
        }
        item {
            CuentaTarjeta(
                icon = Icons.Default.MilitaryTech,
                iconTint = ColorCertificacion,
                titulo = "Certificación",
                descripcion = "Estado y detalles de tu certificación",
                onClick = onOpenCertificacion,
            )
        }
        item {
            CuentaTarjeta(
                icon = Icons.Default.CreditCard,
                iconTint = ColorBancario,
                titulo = "Datos bancarios",
                descripcion = "Administra tu cuenta de depósito",
                onClick = { mostrarBanco = true },
            )
        }
        item {
            BotonCerrarSesion(onClick = { confirmSignOut = true })
        }
    }
    if (confirmSignOut) AlertDialog(
        onDismissRequest = { confirmSignOut = false },
        title = { Text("¿Cerrar sesión?") },
        text = { Text("Saldrás de tu cuenta de conductor en este dispositivo.") },
        confirmButton = { RuumPrimaryButton("Sí, cerrar sesión", onSignOut) },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmSignOut = false }) },
    )
    if (mostrarSoporte) AlertDialog(
        onDismissRequest = { mostrarSoporte = false },
        icon = { Icon(Icons.Outlined.SupportAgent, null, tint = MaterialTheme.colorScheme.primary) },
        title = { Text("Centro de Soporte") },
        text = { Text("Canales oficiales de asistencia operativa, ayuda en ruta y gestión de tu cuenta. Si tienes un viaje en curso o alguna eventualidad, usa el botón Seguridad durante el traslado.") },
        confirmButton = { RuumPrimaryButton("Entendido", { mostrarSoporte = false }) },
    )
    if (mostrarBanco) AlertDialog(
        onDismissRequest = { mostrarBanco = false },
        icon = { Icon(Icons.Default.CreditCard, null, tint = MaterialTheme.colorScheme.primary) },
        title = { Text("Datos bancarios") },
        text = {
            Text(
                if (tieneBanco) {
                    "Tu cuenta de depósito está registrada y asociada a tu perfil de conductor. Los pagos se depositan a esta cuenta."
                } else {
                    "Aún no registras una cuenta de depósito. Completa tus datos bancarios en Certificación para poder recibir pagos."
                },
            )
        },
        confirmButton = { RuumPrimaryButton("Entendido", { mostrarBanco = false }) },
    )
}

@Composable
private fun CuentaTopBar(
    driverName: String,
    unreadCount: Int,
    onNotifications: () -> Unit,
    onSupport: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = RuumTokens.Space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(
            painter = painterResource(R.drawable.ruum_logo_login),
            contentDescription = "Ruum Ruum Driver Service",
            modifier = Modifier.height(36.dp),
            contentScale = ContentScale.Fit,
        )
        Spacer(Modifier.weight(1f))
        IconButton(
            onClick = onNotifications,
            modifier = Modifier.size(RuumTokens.Touch),
        ) {
            if (unreadCount > 0) {
                BadgedBox(badge = { Badge(containerColor = RuumTokens.Error) }) {
                    Icon(
                        Icons.Outlined.Notifications,
                        "Notificaciones ($unreadCount sin leer)",
                        Modifier.size(22.dp),
                        tint = MaterialTheme.colorScheme.onSurface,
                    )
                }
            } else {
                Icon(
                    Icons.Outlined.Notifications,
                    "Notificaciones",
                    Modifier.size(22.dp),
                    tint = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
        IconButton(
            onClick = onSupport,
            modifier = Modifier.size(RuumTokens.Touch),
        ) {
            Icon(
                Icons.Outlined.SupportAgent,
                "Soporte",
                Modifier.size(22.dp),
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
        AvatarIniciales(driverName)
    }
}

@Composable
private fun AvatarIniciales(driverName: String) {
    Surface(
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.padding(start = RuumTokens.Space4).size(RuumTokens.Touch),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                iniciales(driverName),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

private fun iniciales(nombre: String?): String {
    val partes = nombre.orEmpty().trim().split(Regex("\\s+")).filter { it.isNotBlank() }
    return when {
        partes.isEmpty() -> "RC"
        partes.size == 1 -> partes[0].take(2).uppercase()
        else -> (partes[0].take(1) + partes[1].take(1)).uppercase()
    }
}

@Composable
private fun BannerSincronizado(sincronizado: Boolean) {
    Surface(
        Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = successBackground(),
        contentColor = successForeground(),
    ) {
        Row(
            Modifier.padding(horizontal = RuumTokens.Space16, vertical = RuumTokens.Space12),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                Modifier.size(20.dp),
                tint = successForeground(),
            )
            Text(
                if (sincronizado) "Sincronizado — todo al día" else "Sincronizando pendientes…",
                Modifier.padding(start = RuumTokens.Space8),
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = successForeground(),
            )
        }
    }
}

@Composable
private fun CuentaTarjeta(
    icon: ImageVector,
    iconTint: Color,
    titulo: String,
    descripcion: String,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = RuumTokens.Touch),
        shape = MaterialTheme.shapes.large,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            Modifier.padding(RuumTokens.Space16),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, Modifier.size(28.dp), tint = iconTint)
            Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
                Text(
                    titulo,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    descripcion,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = "Abrir $titulo",
                Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun BotonCerrarSesion(onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = RuumTokens.Touch),
        shape = MaterialTheme.shapes.medium,
        border = BorderStroke(1.5.dp, RuumTokens.Error),
        color = MaterialTheme.colorScheme.surface,
        contentColor = RuumTokens.Error,
    ) {
        Row(
            Modifier.padding(vertical = RuumTokens.Space16),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, Modifier.size(20.dp))
            Spacer(Modifier.width(RuumTokens.Space8))
            Text("Cerrar sesión", style = MaterialTheme.typography.labelLarge)
        }
    }
}
