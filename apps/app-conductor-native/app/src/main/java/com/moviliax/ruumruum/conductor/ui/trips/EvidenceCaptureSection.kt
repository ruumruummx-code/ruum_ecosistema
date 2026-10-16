package com.moviliax.ruumruum.conductor.ui.trips

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.core.content.FileProvider
import androidx.core.graphics.scale
import com.moviliax.ruumruum.conductor.data.EvidencePhoto
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

@Composable
fun EvidenceCaptureSection(
    tripId: String,
    type: String,
    photos: List<EvidencePhoto>,
    loading: Boolean,
    saving: Boolean,
    confirming: Boolean,
    syncing: Boolean = false,
    onCapture: (String, String, String, ByteArray) -> Unit,
    onConfirm: () -> Unit,
    onSyncPending: () -> Unit = {},
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedAngle by remember { mutableStateOf<String?>(null) }
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var photoFile by remember { mutableStateOf<File?>(null) }
    var captureError by remember { mutableStateOf<String?>(null) }
    val required = listOf(
        Triple("frente", "Frente", "Defensa + placas centradas, a 1.5 m"),
        Triple("lado_piloto", "Lado piloto", "De espejo a defensa, placa legible"),
        Triple("lado_copiloto", "Lado copiloto", "De espejo a defensa, placa legible"),
        Triple("trasera", "Trasera", "Cajuela + defensa, placa legible"),
        Triple("tablero", "Tablero", "Odómetro sin reflejo"),
    )
    val optional = if (type == "final") "dano_previo" to "Daño visible (opcional)" else null
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { captured ->
        val uri = photoUri
        val angle = selectedAngle
        val file = photoFile
        photoUri = null
        photoFile = null
        selectedAngle = null
        if (captured && uri != null && angle != null) {
            scope.launch {
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { compressEvidence(it.readBytes()) }
                }
                if (bytes == null || bytes.isEmpty()) captureError = "No se pudo leer la fotografía. Intenta capturarla de nuevo."
                else onCapture(tripId, type, angle, bytes)
                file?.delete()
            }
        } else file?.delete()
    }
    val capturedAngles = photos.map { it.angulo }.toSet()
    val syncedAngles = photos.filter { it.sincronizada }.map { it.angulo }.toSet()
    val pendingPhotos = photos.filterNot { it.sincronizada }
    val pendingAngles = pendingPhotos.map { it.angulo }.toSet()
    val complete = required.all { it.first in capturedAngles }

    RuumCard(Modifier.fillMaxWidth()) {
        SectionTitle(
            if (type == "inicial") "Checklist de Origen" else "Checklist de Destino",
            if (type == "inicial") "Verificación y evidencia de salida" else "Verificación y evidencia de entrega",
        )
        Text(
            "FOTOGRAFÍAS DEL VEHÍCULO · ${capturedAngles.size}/5 fotos" +
                if (pendingAngles.isNotEmpty()) " (${pendingAngles.size} pendientes de sincronizar)" else "",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
            color = if (pendingAngles.isNotEmpty()) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary,
        )
        if (loading) {
            CircularProgressIndicator(Modifier.padding(top = RuumTokens.Space12))
        } else {
            if (pendingAngles.isNotEmpty()) {
                RuumCard(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12)) {
                    Text(
                        "COLA DE FOTOS LOCALES",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    Text(
                        "Tienes ${pendingAngles.size} foto(s) guardadas en el teléfono. Se sincronizarán automáticamente al reconectar internet.",
                        Modifier.padding(top = RuumTokens.Space4),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    RuumSecondaryButton(
                        if (syncing) "Sincronizando fotos…" else "Sincronizar ahora",
                        onClick = onSyncPending,
                        modifier = Modifier.padding(top = RuumTokens.Space8),
                        enabled = !syncing && !saving,
                    )
                }
            }

            required.forEach { (angle, label, guia) ->
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
                        ) {
                            Text(label, style = MaterialTheme.typography.titleSmall)
                            if (angle in syncedAngles) {
                                RuumStatusChip("sincronizada")
                            } else if (angle in pendingAngles) {
                                RuumStatusChip("pendiente")
                            }
                        }
                        Text(
                            when {
                                angle in syncedAngles -> "Foto sincronizada en la nube ✓"
                                angle in pendingAngles -> "Foto guardada localmente (pendiente de subir)"
                                else -> "Toca para capturar fotografía"
                            },
                            color = when {
                                angle in syncedAngles -> MaterialTheme.colorScheme.secondary
                                angle in pendingAngles -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Text(guia, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    }
                    RuumSecondaryButton(
                        if (angle in capturedAngles) "Repetir" else "Tomar foto",
                        onClick = {
                            runCatching {
                                val directory = File(context.cacheDir, "evidence").apply { mkdirs() }
                                val file = File.createTempFile("ruum-evidence-", ".jpg", directory)
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                                selectedAngle = angle
                                photoFile = file
                                photoUri = uri
                                camera.launch(uri)
                            }.onFailure { captureError = "No se pudo abrir la cámara. Revisa que haya una app de cámara disponible." }
                        },
                        enabled = !saving && !syncing,
                    )
                }
            }
            optional?.let { (angle, label) ->
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
                        ) {
                            Text(label, style = MaterialTheme.typography.titleSmall)
                            if (angle in syncedAngles) {
                                RuumStatusChip("sincronizada")
                            } else if (angle in pendingAngles) {
                                RuumStatusChip("pendiente")
                            }
                        }
                        Text(
                            when {
                                angle in syncedAngles -> "Fotografía sincronizada en nube"
                                angle in pendingAngles -> "Fotografía guardada localmente"
                                else -> "Solo si detectas daño"
                            },
                            color = when {
                                angle in syncedAngles -> MaterialTheme.colorScheme.secondary
                                angle in pendingAngles -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    RuumSecondaryButton(
                        if (angle in capturedAngles) "Repetir" else "Capturar",
                        onClick = {
                            runCatching {
                                val directory = File(context.cacheDir, "evidence").apply { mkdirs() }
                                val file = File.createTempFile("ruum-evidence-", ".jpg", directory)
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                                selectedAngle = angle
                                photoFile = file
                                photoUri = uri
                                camera.launch(uri)
                            }.onFailure { captureError = "No se pudo abrir la cámara. Revisa que haya una app de cámara disponible." }
                        },
                        enabled = !saving && !syncing,
                    )
                }
            }
            captureError?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), error = true) }
            val faltantes = required.map { it.first }.filter { it !in capturedAngles }
            if (faltantes.isNotEmpty()) {
                Text(
                    "Faltan fotografías obligatorias: ${faltantes.joinToString(", ")}.",
                    Modifier.padding(top = RuumTokens.Space12),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Text(
                "Toca para capturar · Las fotos pendientes se sincronizan en cuanto haya conexión a internet. Si la foto sale borrosa u oscura, repítela a 1–2 m con el teléfono firme.",
                Modifier.padding(top = RuumTokens.Space12),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            RuumPrimaryButton(
                when {
                    confirming -> "Enviando…"
                    syncing -> "Sincronizando fotos…"
                    !complete -> "Finalizar evidencias (${capturedAngles.size}/5)"
                    pendingAngles.isNotEmpty() -> "Sincronizar y finalizar ✓"
                    else -> "Finalizar evidencias ✓"
                },
                onClick = onConfirm,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                enabled = complete && !saving && !syncing,
                loading = confirming || syncing,
            )
        }
    }
}

fun compressEvidence(bytes: ByteArray): ByteArray {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return bytes
    val longest = maxOf(bounds.outWidth, bounds.outHeight)
    val sample = Integer.highestOneBit((longest / 1600).coerceAtLeast(1))
    val bitmap = BitmapFactory.decodeByteArray(
        bytes,
        0,
        bytes.size,
        BitmapFactory.Options().apply { inSampleSize = sample },
    ) ?: return bytes
    val scale = minOf(1f, 1600f / maxOf(bitmap.width, bitmap.height))
    val resized = if (scale < 1f) bitmap.scale((bitmap.width * scale).toInt(), (bitmap.height * scale).toInt()) else bitmap
    return ByteArrayOutputStream().use { output ->
        resized.compress(Bitmap.CompressFormat.JPEG, 82, output)
        if (resized !== bitmap) bitmap.recycle()
        resized.recycle()
        output.toByteArray()
    }
}
