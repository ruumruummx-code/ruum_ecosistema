package com.moviliax.ruumruum.conductor.ui.onboarding

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import com.moviliax.ruumruum.conductor.BuildConfig
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.str
import com.moviliax.ruumruum.conductor.ui.common.telefonoE164Mx
import com.moviliax.ruumruum.conductor.ui.common.uploadSelectedDocument
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.components.RuumTopBar
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import java.time.LocalDate

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun RegistroWizardScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) {
        if (state.solicitud == null) viewModel.loadOrStartSolicitud()
    }
    var paso by remember { mutableIntStateOf(0) }
    // Paso 1 — identidad y domicilio
    var nombre by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var curp by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf(state.signupTelefono) }
    var codigoPostal by remember { mutableStateOf("") }
    var estadoMx by remember { mutableStateOf("") }
    var ciudad by remember { mutableStateOf("") }
    var colonia by remember { mutableStateOf("") }
    var calle by remember { mutableStateOf("") }
    var numero by remember { mutableStateOf("") }
    var referencias by remember { mutableStateOf("") }
    var contactoNombre by remember { mutableStateOf("") }
    var contactoTelefono by remember { mutableStateOf("") }
    // Paso 2 — licencia y consentimientos
    var numeroLicencia by remember { mutableStateOf("") }
    var tipoLicencia by remember { mutableStateOf("") }
    var vigenciaLicencia by remember { mutableStateOf("") }
    var autoriza by remember { mutableStateOf(false) }
    var declara by remember { mutableStateOf(false) }
    var aceptaTerminos by remember { mutableStateOf(false) }
    var confirmaPrivacidad by remember { mutableStateOf(false) }
    var prefilled by remember { mutableStateOf<String?>(null) }
    // Recuperación de borrador: prellenar una sola vez por solicitud.
    LaunchedEffect(state.solicitud?.id) {
        val sol = state.solicitud ?: return@LaunchedEffect
        if (prefilled == sol.id) return@LaunchedEffect
        prefilled = sol.id
        val personal = sol.datosPersonales
        val domicilio = sol.domicilio
        val licencia = sol.licencia
        val contacto = sol.contactoEmergencia
        val completo = personal.str("nombres").ifBlank { personal.str("nombre").substringBefore(" ") }
        nombre = completo.ifBlank { nombre }
        apellidos = personal.str("apellidos").ifBlank { apellidos }
        curp = personal.str("curp").ifBlank { curp }
        telefono = personal.str("telefono").removePrefix("+52").filter(Char::isDigit).takeLast(10).ifBlank { telefono }
        codigoPostal = domicilio.str("codigo_postal").ifBlank { codigoPostal }
        estadoMx = domicilio.str("estado").ifBlank { estadoMx }
        ciudad = domicilio.str("ciudad_municipio").ifBlank { ciudad }
        colonia = domicilio.str("colonia").ifBlank { colonia }
        calle = domicilio.str("calle").ifBlank { calle }
        numero = domicilio.str("numero").ifBlank { numero }
        referencias = domicilio.str("referencias").ifBlank { referencias }
        contactoNombre = contacto.str("nombre").ifBlank { contactoNombre }
        contactoTelefono = contacto.str("telefono").filter(Char::isDigit).takeLast(10).ifBlank { contactoTelefono }
        numeroLicencia = licencia.str("numero").ifBlank { numeroLicencia }
        tipoLicencia = licencia.str("tipo").ifBlank { tipoLicencia }
        vigenciaLicencia = licencia.str("vigencia").ifBlank { vigenciaLicencia }
        paso = ((sol.pasoActual - 1).coerceIn(0, 3))
    }

    fun expediente(): Array<JsonObject> {
        val nombreCompleto = "$nombre $apellidos".trim().replace(Regex("\\s+"), " ")
        val datosPersonales = buildJsonObject {
            put("nombre", JsonPrimitive(nombreCompleto))
            put("nombres", JsonPrimitive(nombre.trim()))
            put("apellidos", JsonPrimitive(apellidos.trim()))
            put("telefono", JsonPrimitive(telefonoE164Mx(telefono)))
            put("curp", JsonPrimitive(curp.trim().uppercase()))
            put("autoriza_verificacion_antecedentes", JsonPrimitive(autoriza))
            put("declara_sin_suspensiones", JsonPrimitive(declara))
            put("acepta_terminos_servicio", JsonPrimitive(aceptaTerminos))
            put("confirma_aviso_privacidad", JsonPrimitive(confirmaPrivacidad))
            put("version_terminos_aceptada", JsonPrimitive(1))
            put("version_aviso_privacidad", JsonPrimitive(1))
            put("marca_terminos", JsonPrimitive("ruum ruum by Movilia"))
        }
        val domicilio = buildJsonObject {
            put("codigo_postal", JsonPrimitive(codigoPostal.trim()))
            put("estado", JsonPrimitive(estadoMx.trim()))
            put("ciudad_municipio", JsonPrimitive(ciudad.trim()))
            put("colonia", JsonPrimitive(colonia.trim()))
            put("calle", JsonPrimitive(calle.trim()))
            put("numero", JsonPrimitive(numero.trim()))
            put("referencias", JsonPrimitive(referencias.trim()))
        }
        val licencia = buildJsonObject {
            put("numero", JsonPrimitive(numeroLicencia.trim()))
            put("tipo", JsonPrimitive(tipoLicencia.trim()))
            put("vigencia", JsonPrimitive(vigenciaLicencia.trim()))
        }
        val contacto = buildJsonObject {
            put("nombre", JsonPrimitive(contactoNombre.trim()))
            put("telefono", JsonPrimitive(contactoTelefono.filter(Char::isDigit)))
        }
        return arrayOf(datosPersonales, domicilio, licencia, contacto)
    }

    fun guardar(pasoActual: Int) {
        val (dp, dom, lic, ce) = expediente()
        viewModel.guardarBorrador(dp, dom, lic, ce, pasoActual)
    }

    val titulos = listOf("Cuenta", "Identidad y domicilio", "Licencia", "Documentos", "Revisión y envío")
    Scaffold(
        topBar = {
            RuumTopBar("Registro de conductor", viewModel::loadOrStartSolicitud)
        },
    ) { padding ->
        LazyColumn(
            Modifier.padding(padding).fillMaxSize(),
            contentPadding = PaddingValues(RuumTokens.Space20),
            verticalArrangement = Arrangement.spacedBy(RuumTokens.Space12),
        ) {
            item {
                Text(
                    "Paso ${paso + 2} de 5 — ${titulos[paso + 1]}",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
                if (state.solicitud != null) {
                    Text(
                        "Expediente ${state.solicitud.estado.replace('_', ' ')} · tu avance se guarda automáticamente.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (state.error != null) item { RuumAlert(state.error, Modifier.fillMaxWidth(), error = true) }
            if (state.notice != null) item { RuumAlert(state.notice, Modifier.fillMaxWidth()) }
            when (paso) {
                0 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            WizardField("Nombre(s)", nombre) { nombre = it }
                            WizardField("Apellidos", apellidos) { apellidos = it }
                            WizardField("CURP (18 caracteres)", curp) {
                                curp = it.uppercase().take(18)
                            }
                            WizardField("Teléfono (10 dígitos)", telefono) {
                                telefono = it.filter(Char::isDigit).take(10)
                            }
                            WizardField("Código postal", codigoPostal) {
                                codigoPostal = it.filter(Char::isDigit).take(5)
                            }
                            WizardField("Estado", estadoMx) { estadoMx = it }
                            WizardField("Ciudad o municipio", ciudad) { ciudad = it }
                            WizardField("Colonia", colonia) { colonia = it }
                            WizardField("Calle", calle) { calle = it }
                            WizardField("Número", numero) { numero = it }
                            WizardField("Referencias", referencias) { referencias = it }
                            WizardField("Contacto de emergencia · nombre", contactoNombre) {
                                contactoNombre = it
                            }
                            WizardField("Contacto de emergencia · teléfono", contactoTelefono) {
                                contactoTelefono = it.filter(Char::isDigit).take(10)
                            }
                        }
                    }
                }
                1 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            WizardField("Número de licencia", numeroLicencia) {
                                numeroLicencia = it
                            }
                            WizardField("Tipo y categoría de licencia", tipoLicencia) {
                                tipoLicencia = it
                            }
                            WizardField("Vigencia (AAAA-MM-DD)", vigenciaLicencia) {
                                vigenciaLicencia = it.take(10)
                            }
                            CheckRow(
                                "Autorizo la verificación de antecedentes penales e infracciones de conducción, y el tratamiento de mis datos biométricos y de geolocalización para Didit.",
                                autoriza,
                            ) { autoriza = it }
                            CheckRow(
                                "Declaro no tener suspensiones vigentes de licencia ni procesos legales activos relacionados con el manejo.",
                                declara,
                            ) { declara = it }
                            CheckRow("Acepto los términos del servicio.", aceptaTerminos) {
                                aceptaTerminos = it
                            }
                            CheckRow("Confirmo que leí el aviso de privacidad.", confirmaPrivacidad) {
                                confirmaPrivacidad = it
                            }
                        }
                    }
                }
                2 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            Text("Sube tus documentos", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Licencia (frente y reverso) e identificación oficial son obligatorios. Formatos JPG, PNG, WEBP o PDF hasta 10 MB.",
                                Modifier.padding(top = RuumTokens.Space4),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    listOf(
                        Triple("licencia_frente", "Foto de tu licencia (frente)", "Fotografía clara del frente de tu licencia vigente."),
                        Triple("licencia_reverso", "Foto de tu licencia (reverso)", "Fotografía clara del reverso de tu licencia vigente."),
                        Triple("identificacion_oficial", "Foto de tu Identificación oficial (INE/pasaporte)", "Identificación oficial vigente."),
                        Triple("constancia_situacion_fiscal", "Constancia de Situación Fiscal (SAT)", "Constancia actualizada del SAT en archivo PDF o imagen legible."),
                    ).forEach { (tipo, etiqueta, descripcion) ->
                        item {
                            WizardDocumentRow(
                                state = state,
                                viewModel = viewModel,
                                type = tipo,
                                label = etiqueta,
                                description = descripcion,
                            )
                        }
                    }
                }
                else -> {
                    if (state.solicitud?.estado == "en_revision") {
                        item {
                            RuumCard(Modifier.fillMaxWidth()) {
                                Text("Solicitud en revisión", style = MaterialTheme.typography.titleLarge)
                                Text(
                                    "Tu cuenta está pendiente de validación. Cuando la revisión esté completa, podrás consultar y aceptar Traslados.",
                                    Modifier.padding(top = RuumTokens.Space4),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            Text("Revisa tu información", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Verifica que todo sea correcto antes de enviar tu registro.",
                                Modifier.padding(top = RuumTokens.Space4),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text("Cuenta", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelLarge)
                            Text(telefonoE164Mx(telefono))
                            Text("Identidad", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
                            Text("$nombre $apellidos · CURP $curp")
                            Text("$calle $numero, $colonia, $ciudad, $estadoMx CP $codigoPostal")
                            Text("Licencia", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
                            Text("$numeroLicencia · $tipoLicencia · Vigente hasta $vigenciaLicencia")
                            Text(
                                "Al enviar aceptas términos, aviso de privacidad y autorizaciones marcadas.",
                                Modifier.padding(top = RuumTokens.Space8),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    if (state.solicitud?.estado == "en_revision" || state.diditUrl != null) {
                        item { DiditSection(state, viewModel) }
                    }
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    if (paso > 0) {
                        RuumSecondaryButton("Atrás", { paso-- }, Modifier.weight(1f))
                    }
                    if (paso < 3) {
                        RuumPrimaryButton(
                            text = "Continuar",
                            onClick = {
                                guardar(paso + 2)
                                if (paso < 3) paso++
                            },
                            modifier = Modifier.weight(1f),
                            enabled = pasoValido(
                                paso, nombre, apellidos, curp, telefono, codigoPostal, estadoMx,
                                ciudad, colonia, calle, numero, contactoNombre, contactoTelefono,
                                numeroLicencia, tipoLicencia, vigenciaLicencia,
                                autoriza, declara, aceptaTerminos, confirmaPrivacidad,
                                state,
                            ),
                            loading = state.loading,
                        )
                    } else {
                        RuumPrimaryButton(
                            text = "Enviar registro",
                            onClick = { viewModel.enviarSolicitud(BuildConfig.VERSION_NAME) },
                            modifier = Modifier.weight(1f),
                            enabled = aceptaTerminos && confirmaPrivacidad,
                            loading = state.loading || state.diditLoading,
                        )
                    }
                }
                if (state.loading) {
                    Box(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }
}

fun pasoValido(
    paso: Int,
    nombre: String, apellidos: String, curp: String, telefono: String,
    codigoPostal: String, estadoMx: String, ciudad: String, colonia: String,
    calle: String, numero: String, contactoNombre: String, contactoTelefono: String,
    numeroLicencia: String, tipoLicencia: String, vigenciaLicencia: String,
    autoriza: Boolean, declara: Boolean, aceptaTerminos: Boolean, confirmaPrivacidad: Boolean,
    state: DriverUiState,
): Boolean {
    if (paso == 0) {
        return nombre.isNotBlank() && apellidos.isNotBlank() && curp.length == 18 &&
            telefono.length == 10 && codigoPostal.length == 5 && estadoMx.isNotBlank() &&
            ciudad.isNotBlank() && colonia.isNotBlank() && calle.isNotBlank() &&
            numero.isNotBlank() && contactoNombre.isNotBlank() && contactoTelefono.length == 10
    }
    if (paso == 1) {
        val vigenciaOk = runCatching {
            !LocalDate.parse(vigenciaLicencia).isBefore(LocalDate.now())
        }.getOrDefault(false)
        return numeroLicencia.isNotBlank() && tipoLicencia.isNotBlank() && vigenciaOk &&
            autoriza && declara
    }
    if (paso == 2) {
        val tipos = state.solicitudDocumentos.filter { it.esActual }.map { it.tipo }.toSet()
        return "licencia_frente" in tipos && "licencia_reverso" in tipos && "identificacion_oficial" in tipos
    }
    return aceptaTerminos && confirmaPrivacidad
}

@Composable
fun WizardField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value, onValueChange = onChange,
        modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = RuumTokens.InputHeight).padding(vertical = RuumTokens.Space4),
        label = { Text(label) }, singleLine = true, shape = MaterialTheme.shapes.small,
        textStyle = MaterialTheme.typography.bodyLarge,
    )
}

@Composable
fun CheckRow(text: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(checked = checked, onCheckedChange = onChange)
        Text(text, Modifier.padding(start = RuumTokens.Space8), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun WizardDocumentRow(
    state: DriverUiState,
    viewModel: DriverViewModel,
    type: String,
    label: String,
    description: String,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var localError by remember { mutableStateOf<String?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            scope.launch {
                uploadSelectedDocument(context, uri, type, viewModel::uploadSolicitudDocument) { localError = it }
            }
        }
    }
    val document = state.solicitudDocumentos.filter { it.tipo == type && it.esActual }.maxByOrNull { it.version }
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                Text(label, style = MaterialTheme.typography.titleMedium)
                Text(description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            RuumStatusChip(document?.estado ?: "falta")
        }
        if (document != null) {
            Text(document.nombreArchivo, Modifier.padding(top = RuumTokens.Space8), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        localError?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), error = true) }
        RuumPrimaryButton(
            text = if (document == null) "Subir archivo" else "Reemplazar archivo",
            onClick = { picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf")) },
            modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
            loading = state.uploadingDocumentType == type,
        )
    }
}
