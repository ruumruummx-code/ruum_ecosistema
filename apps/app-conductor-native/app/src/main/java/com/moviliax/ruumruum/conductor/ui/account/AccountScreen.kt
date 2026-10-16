package com.moviliax.ruumruum.conductor.ui.account

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumThemeMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumThemePreference
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun AccountScreen(
    documents: List<DriverDocument>,
    driverName: String,
    themePreference: RuumThemePreference,
    onSignOut: () -> Unit,
    onOpenDocuments: () -> Unit,
    onOpenCertificacion: () -> Unit,
    onOpenPerfil: () -> Unit,
) {
    var confirmSignOut by remember { mutableStateOf(false) }
    var mostrarSoporte by remember { mutableStateOf(false) }
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            Text("Cuenta", style = MaterialTheme.typography.headlineLarge)
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(R.drawable.ruum_logo_avatar),
                        contentDescription = "Ruum Ruum",
                        modifier = Modifier.size(56.dp).clip(CircleShape),
                    )
                    Column(Modifier.padding(start = RuumTokens.Space12)) {
                        Text(driverName, style = MaterialTheme.typography.titleLarge)
                        Text("Conductor certificado", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                RuumPrimaryButton("Ver mi certificación", onOpenCertificacion, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12))
            }
        }
        item {
            Text(
                "Gestión Operativa",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                CuentaFila("Perfil", "Datos personales y contacto de emergencia.", onOpenPerfil)
                CuentaFila("Documentos", "Licencia, identificación y vigencia.", onOpenDocuments)
                val current = documents.filter { it.esActual }.distinctBy { it.tipo }
                Text(
                    "${current.size} tipo(s) de documento registrados",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        item {
            Text(
                "Ajustes de Cuenta",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Apariencia y Visualización", "Modo de Pantalla (Tema)")
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    ThemeChip("Sistema", Icons.Default.Sync, RuumThemeMode.SYSTEM, themePreference, Modifier.weight(1f))
                    ThemeChip("Claro", Icons.Default.LightMode, RuumThemeMode.LIGHT, themePreference, Modifier.weight(1f))
                    ThemeChip("Oscuro", Icons.Default.DarkMode, RuumThemeMode.DARK, themePreference, Modifier.weight(1f))
                }
            }
        }
        item {
            Text(
                "Ayuda y Legal",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                CuentaFila("Soporte", "WhatsApp 24/7 y ayuda en ruta.") { mostrarSoporte = true }
                CuentaFila("Marco Legal", "Términos y aviso de privacidad.") { }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Cerrar Sesión Activa")
                Text(
                    "Saldrás de tu cuenta en este dispositivo. Deberás iniciar sesión para operar.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                RuumSecondaryButton("Cerrar sesión", { confirmSignOut = true }, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12))
            }
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
        title = { Text("Centro de Soporte") },
        text = { Text("Canales oficiales de asistencia operativa, ayuda en ruta y gestión de tu cuenta. Si tienes un viaje en curso o alguna eventualidad, usa el botón Seguridad durante el traslado.") },
        confirmButton = { RuumPrimaryButton("Entendido", { mostrarSoporte = false }) },
    )
}

@Composable
fun CuentaFila(titulo: String, descripcion: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space8),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
            Text(titulo, style = MaterialTheme.typography.titleMedium)
            Text(descripcion, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        IconButton(onClick = onClick, modifier = Modifier.size(RuumTokens.Touch)) {
            Icon(Icons.Default.ChevronRight, "Abrir $titulo")
        }
    }
}

@Composable
fun ThemeChip(
    label: String,
    icon: ImageVector,
    mode: RuumThemeMode,
    preference: RuumThemePreference,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = preference.mode == mode,
        onClick = { preference.update(mode) },
        label = { Text(label, maxLines = 1) },
        leadingIcon = { Icon(icon, null, Modifier.size(18.dp)) },
        modifier = modifier.height(RuumTokens.Touch),
    )
}

@Composable
fun DocumentCard(document: DriverDocument) {
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                Text(document.tipo.replace('_', ' '), style = MaterialTheme.typography.titleMedium)
                Text(document.nombreArchivo, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            RuumStatusChip(document.estado)
        }
        document.motivoRechazo?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), error = true) }
    }
}

@Composable
fun SupportRow(icon: ImageVector, title: String, description: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space8), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
        Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
