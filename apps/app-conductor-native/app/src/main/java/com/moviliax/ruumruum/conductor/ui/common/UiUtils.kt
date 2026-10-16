package com.moviliax.ruumruum.conductor.ui.common

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import java.text.NumberFormat
import java.util.Locale

fun money(value: Double): String =
    NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-MX")).format(value)

fun Modifier.defaultMinInputHeight() = defaultMinSize(minHeight = RuumTokens.InputHeight)

@Composable
fun PillTab(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(RuumTokens.Touch),
        shape = CircleShape,
        color = if (selected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surface,
        contentColor = if (selected) RuumTokens.White else MaterialTheme.colorScheme.onSurfaceVariant,
        border = if (selected) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(label, style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Column(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
fun SectionTitle(title: String, supporting: String? = null) {
    Text(title, style = MaterialTheme.typography.headlineMedium)
    supporting?.let {
        Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun successBackground() = if (LocalRuumDarkMode.current) RuumTokens.DarkSuccessBg else RuumTokens.SuccessBg

@Composable
fun successForeground() = if (LocalRuumDarkMode.current) RuumTokens.DarkSuccessText else RuumTokens.SuccessText

fun JsonObject.str(key: String): String =
    (this[key] as? JsonPrimitive)?.contentOrNull.orEmpty()

fun telefonoE164Mx(raw: String): String {
    val d = raw.filter(Char::isDigit)
    if (d.startsWith("52") && d.length > 10) return "+$d"
    if (d.length == 10) return "+52$d"
    return if (raw.trim().startsWith("+")) raw.trim() else "+$d"
}

@SuppressLint("QueryPermissionsNeeded")
fun abrirMapa(context: Context, direccion: String) {
    val intent = Intent(Intent.ACTION_VIEW, "geo:0,0?q=${Uri.encode(direccion)}".toUri())
    if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
    }
}

suspend fun uploadSelectedDocument(
    context: Context,
    uri: Uri,
    type: String,
    onUpload: (String, String, String, ByteArray) -> Unit,
    onError: (String) -> Unit,
) = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
    runCatching {
        val mime = context.contentResolver.getType(uri) ?: error("No pudimos identificar el formato del archivo.")
        require(mime in setOf("image/jpeg", "image/png", "image/webp", "application/pdf")) {
            "Formato no permitido. Usa JPG, PNG, WEBP o PDF."
        }
        val name = context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val column = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (column >= 0 && cursor.moveToFirst()) cursor.getString(column) else null
        } ?: "${type}.${if (mime == "application/pdf") "pdf" else mime.substringAfter('/')}"
        val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
            val output = java.io.ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            var total = 0
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                total += read
                require(total <= 10 * 1024 * 1024) { "El archivo supera el límite de 10 MB." }
                output.write(buffer, 0, read)
            }
            output.toByteArray()
        } ?: error("No se pudo leer el archivo.")
        onUpload(type, name, mime, bytes)
    }.onFailure { onError(it.message ?: "No pudimos leer el archivo seleccionado.") }
}

