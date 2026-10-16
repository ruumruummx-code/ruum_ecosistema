package com.moviliax.ruumruum.conductor.ui.account

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.core.content.FileProvider
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.domain.diasParaVencerLicencia
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.common.uploadSelectedDocument
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate

data class DocumentRequirement(val type: String, val label: String, val description: String, val required: Boolean)

val DOCUMENT_REQUIREMENTS = listOf(
    DocumentRequirement("licencia_frente", "Licencia - Frente", "Fotografía clara del frente de tu licencia vigente.", true),
    DocumentRequirement("licencia_reverso", "Licencia - Reverso", "Fotografía clara del reverso de tu licencia vigente.", true),
    DocumentRequirement("identificacion_oficial", "Identificación Oficial (INE / Pasaporte)", "Identificación oficial vigente por ambos lados o pasaporte.", true),
    DocumentRequirement("constancia_situacion_fiscal", "Constancia de Situación Fiscal (SAT)", "Constancia actualizada del SAT en archivo PDF o imagen legible.", true),
    DocumentRequirement("documento_operativo", "Comprobante de domicilio", "Recibo reciente (luz, agua, predial) que acredite tu domicilio registrado.", true),
)

@Composable
fun DocumentsScreen(state: DriverUiState, onUpload: (String, String, String, ByteArray) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedType by remember { mutableStateOf<String?>(null) }
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var photoFile by remember { mutableStateOf<File?>(null) }
    var localError by remember { mutableStateOf<String?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        val type = selectedType
        selectedType = null
        if (uri != null && type != null) {
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            scope.launch { uploadSelectedDocument(context, uri, type, onUpload) { localError = it } }
        }
    }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { captured ->
        val type = selectedType
        val uri = photoUri
        photoUri = null
        selectedType = null
        if (captured && uri != null && type != null) {
            scope.launch { uploadSelectedDocument(context, uri, type, onUpload) { localError = it } }
        }
        photoFile?.delete()
        photoFile = null
    }
    val today = LocalDate.now()
    val diasLicencia = state.driver?.licenciaVigencia?.let { diasParaVencerLicencia(it, today) }
    val licenseExpired = (diasLicencia ?: 0) < 0
    val licensePorVencer = diasLicencia != null && diasLicencia in 0..30
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    "Expediente digital del Conductor",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text("Documentos requeridos para operar", style = MaterialTheme.typography.titleLarge)
                Text(
                    "Los documentos bloqueantes deben estar vigentes para recibir traslados.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "Formatos JPG, PNG, WEBP o PDF hasta 10 MB.",
                    Modifier.padding(top = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        localError?.let { message -> item { RuumAlert(message, Modifier.fillMaxWidth(), error = true) } }
        val pendientes = DOCUMENT_REQUIREMENTS.filter { requirement ->
            val document = state.documents.filter { it.tipo == requirement.type && it.esActual }.maxByOrNull { it.version }
            document?.estado != "aprobado"
        }
        if (pendientes.any { it.required }) {
            item {
                RuumAlert(
                    "Atención requerida y pendientes · Bloquea recepción de Traslados",
                    Modifier.fillMaxWidth(),
                    error = true,
                )
            }
        }
        items(DOCUMENT_REQUIREMENTS, key = { it.type }) { requirement ->
            val document = state.documents.filter { it.tipo == requirement.type && it.esActual }.maxByOrNull { it.version }
            val esLicencia = requirement.type.startsWith("licencia_")
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                        Text(requirement.label, style = MaterialTheme.typography.titleMedium)
                        Text(requirement.description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    RuumStatusChip(documentStatus(document, esLicencia && licenseExpired, esLicencia && licensePorVencer))
                }
                if (document != null) {
                    Text("Archivo registrado", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(document.nombreArchivo, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Versión ${document.version}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    if (document.estado == "rechazado") {
                        (document.motivoRechazo ?: document.notasAdmin)?.let {
                            Text(
                                "Motivo de rechazo por operación:",
                                Modifier.padding(top = RuumTokens.Space8),
                                style = MaterialTheme.typography.labelLarge,
                            )
                            RuumAlert(it, Modifier.fillMaxWidth(), error = true)
                        }
                    }
                } else {
                    Text("— Sin registrar", Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text("Bloqueante", Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                Text(
                    "Captura o selecciona el nuevo archivo para actualizar",
                    Modifier.padding(top = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    RuumSecondaryButton("📸 Tomar foto con cámara", onClick = {
                        runCatching {
                            val directory = File(context.cacheDir, "documents").apply { mkdirs() }
                            val file = File.createTempFile("ruum-document-", ".jpg", directory)
                            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                            selectedType = requirement.type
                            photoFile = file
                            photoUri = uri
                            camera.launch(uri)
                        }.onFailure { localError = "No se pudo abrir la cámara." }
                    }, Modifier.weight(1f), enabled = state.uploadingDocumentType == null)
                    RuumPrimaryButton("📁 Subir imagen o PDF", onClick = {
                        selectedType = requirement.type
                        picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf"))
                    }, Modifier.weight(1f), enabled = state.uploadingDocumentType == null, loading = state.uploadingDocumentType == requirement.type)
                }
            }
        }
        val aprobados = DOCUMENT_REQUIREMENTS.filter { requirement ->
            state.documents.any { it.tipo == requirement.type && it.esActual && it.estado == "aprobado" }
        }
        if (aprobados.isNotEmpty()) {
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("Documentos Aprobados (${aprobados.size})", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Puedes subir una nueva versión cuando renueves tu documento.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

fun documentStatus(document: DriverDocument?, licenseExpired: Boolean, licensePorVencer: Boolean = false): String = when {
    licenseExpired -> "Vencido"
    document == null -> "Falta documento"
    document.estado == "rechazado" -> "Rechazado"
    document.estado == "aprobado" && licensePorVencer -> "Por vencer"
    document.estado == "aprobado" -> "Aprobado"
    document.estado == "en_revision" -> "En revisión"
    else -> "Cargado"
}
