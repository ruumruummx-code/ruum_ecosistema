package com.moviliax.ruumruum.conductor.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.PillTab
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.common.telefonoE164Mx
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.onboarding.WizardField
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun ModificacionPerfilScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) { viewModel.loadSolicitudesCambio() }
    var tab by remember { mutableIntStateOf(0) }
    var telefono by remember { mutableStateOf("") }
    var codigoPostal by remember { mutableStateOf("") }
    var estadoMx by remember { mutableStateOf("") }
    var ciudad by remember { mutableStateOf("") }
    var colonia by remember { mutableStateOf("") }
    var calle by remember { mutableStateOf("") }
    var numero by remember { mutableStateOf("") }
    var referencias by remember { mutableStateOf("") }
    var contactoNombre by remember { mutableStateOf("") }
    var contactoTelefono by remember { mutableStateOf("") }
    val hayCambios = listOf(
        telefono, codigoPostal, estadoMx, ciudad, colonia, calle, numero,
        referencias, contactoNombre, contactoTelefono,
    ).any { it.isNotBlank() }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Perfil del Conductor", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Administra tus datos personales, documentación y contactos operativos.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (hayCambios) {
            item {
                RuumAlert(
                    "Hay cambios pendientes por guardar. Al guardar, tu perfil será enviado a revisión operativa.",
                    Modifier.fillMaxWidth(),
                )
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                PillTab("Identidad", tab == 0, { tab = 0 }, Modifier.weight(1f))
                PillTab("Ubicación", tab == 1, { tab = 1 }, Modifier.weight(1f))
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                when (tab) {
                    0 -> {
                        SectionTitle("Identidad", "Fotografía, datos personales y teléfono de contacto.")
                        Spacer(Modifier.height(RuumTokens.Space8))
                        Text(
                            "Nombre: ${state.driver?.nombre.orEmpty()}",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                        )
                        WizardField("Teléfono (10 dígitos)", telefono) {
                            telefono = it.filter(Char::isDigit).take(10)
                        }
                        Text(
                            "La CURP, la licencia y la fotografía solo se modifican con revisión operativa desde el expediente.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    else -> {
                        SectionTitle("Ubicación y emergencia", "Domicilio particular y contacto de emergencia.")
                        Spacer(Modifier.height(RuumTokens.Space8))
                        WizardField("Código postal", codigoPostal) {
                            codigoPostal = it.filter(Char::isDigit).take(5)
                        }
                        WizardField("Estado", estadoMx) { estadoMx = it }
                        WizardField("Ciudad o municipio", ciudad) { ciudad = it }
                        WizardField("Colonia", colonia) { colonia = it }
                        WizardField("Calle", calle) { calle = it }
                        WizardField("Número", numero) { numero = it }
                        WizardField("Referencias", referencias) { referencias = it }
                        WizardField("Contacto de emergencia (nombre)", contactoNombre) {
                            contactoNombre = it
                        }
                        WizardField("Teléfono de emergencia", contactoTelefono) {
                            contactoTelefono = it.filter(Char::isDigit).take(10)
                        }
                    }
                }
                Spacer(Modifier.height(RuumTokens.Space8))
                RuumPrimaryButton(
                    text = if (state.loading) "Guardando perfil..." else "Guardar perfil",
                    onClick = {
                        val cambios = mutableMapOf<String, String?>()
                        if (telefono.isNotBlank()) cambios["telefono"] = telefonoE164Mx(telefono)
                        if (codigoPostal.isNotBlank()) cambios["codigo_postal"] = codigoPostal
                        if (estadoMx.isNotBlank()) cambios["estado_residencia"] = estadoMx
                        if (ciudad.isNotBlank()) cambios["ciudad_municipio"] = ciudad
                        if (colonia.isNotBlank()) cambios["colonia"] = colonia
                        if (calle.isNotBlank()) cambios["calle"] = calle
                        if (numero.isNotBlank()) cambios["numero"] = numero
                        if (referencias.isNotBlank()) cambios["referencias"] = referencias
                        if (contactoNombre.isNotBlank()) cambios["contacto_emergencia_nombre"] = contactoNombre
                        if (contactoTelefono.isNotBlank()) cambios["contacto_emergencia_telefono"] = telefonoE164Mx(contactoTelefono)
                        viewModel.solicitarCambio(cambios) { }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = hayCambios,
                    loading = state.loading,
                )
                if (!hayCambios) {
                    Text(
                        "Sin cambios detectados",
                        Modifier.padding(top = RuumTokens.Space8),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        if (state.solicitudesCambio.isNotEmpty()) {
            item { SectionTitle("Solicitudes de cambio", "Cancela la pendiente si necesitas corregirla.") }
            items(state.solicitudesCambio, key = { it.id }) { solicitud ->
                RuumCard(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(solicitud.tipo.replace('_', ' '), style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${solicitud.estado} · ${solicitud.creadoEn.take(10)}",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            solicitud.motivoRechazo?.let {
                                Text(it, color = MaterialTheme.colorScheme.error)
                            }
                        }
                        RuumStatusChip(solicitud.estado)
                    }
                    if (solicitud.estado == "pendiente") {
                        RuumSecondaryButton(
                            text = "Cancelar",
                            onClick = { viewModel.cancelarCambio(solicitud.id) },
                            modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                        )
                    }
                }
            }
        }
    }
}
