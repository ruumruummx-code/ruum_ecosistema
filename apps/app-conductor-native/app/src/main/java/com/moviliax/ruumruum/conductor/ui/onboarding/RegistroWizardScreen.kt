package com.moviliax.ruumruum.conductor.ui.onboarding

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import com.moviliax.ruumruum.conductor.BuildConfig
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.str
import com.moviliax.ruumruum.conductor.ui.common.telefonoE164Mx
import com.moviliax.ruumruum.conductor.ui.common.uploadSelectedDocument
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCtaButton
import com.moviliax.ruumruum.conductor.ui.components.RuumDenseField
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistrationHeader
import com.moviliax.ruumruum.conductor.ui.components.RuumResumenAccion
import com.moviliax.ruumruum.conductor.ui.components.RuumRegistroTitulo
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import java.time.LocalDate

/** Páginas internas del expediente. El overall step va de 1 a 5 ( Cuenta → Revisión ). */
private const val PAGINA_CUENTA = 0
private const val PAGINA_IDENTIDAD = 1
private const val PAGINA_LICENCIA = 2
private const val PAGINA_DOCUMENTOS = 3
private const val PAGINA_REVISION = 4

private data class PasoRegistro(val titulo: String, val subtitulo: String)

private val PASOS_REGISTRO = listOf(
    PasoRegistro("Tu cuenta", "Cuenta creada y verificada con tu correo"),
    PasoRegistro("Identidad", "Cuéntanos más sobre ti"),
    PasoRegistro("Licencia", "Registra tu licencia vigente"),
    PasoRegistro("Documentos", "Carga tus archivos"),
    PasoRegistro("Revisión", "Revisa tus datos antes de enviarlo"),
)

/**
 * Expediente del conductor: pasos 1..5 del flujo de registro.
 *
 * - Página 0 (1 de 5): resumen de la cuenta ya creada.
 * - Página 1 (2 de 5): identidad (nombre, apellido, CURP, domicilio, contacto de emergencia).
 * - Página 2 (3 de 5): licencia y autorizaciones.
 * - Página 3 (4 de 5): documentos.
 * - Página 4 (5 de 5): revisión y envío.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegistroWizardScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) {
        if (state.solicitud == null) viewModel.loadOrStartSolicitud()
    }
    // La primera entradavisible es Identidad (2 de 5); la cuenta ya quedó creada.
    var paso by remember { mutableIntStateOf(PAGINA_IDENTIDAD) }
    var hoja by remember { mutableStateOf<String?>(null) }
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
    var aceptaTerminos by remember { mutableStateOf(state.signupAceptaTerminos) }
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
        if (personal.containsKey("acepta_terminos_servicio")) {
            aceptaTerminos = personal.str("acepta_terminos_servicio").toBoolean()
        }
        if (personal.containsKey("confirma_aviso_privacidad")) {
            confirmaPrivacidad = personal.str("confirma_aviso_privacidad").toBoolean()
        }
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
        // Nunca se entra por la página de cuenta: el expediente arranca en Identidad.
        paso = ((sol.pasoActual - 1).coerceIn(PAGINA_IDENTIDAD, PAGINA_REVISION))
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

    val domicilioCompleto = codigoPostal.length == 5 && estadoMx.isNotBlank() && ciudad.isNotBlank() &&
        colonia.isNotBlank() && calle.isNotBlank() && numero.isNotBlank()
    val contactoCompleto = contactoNombre.isNotBlank() && contactoTelefono.length == 10
    val definicion = PASOS_REGISTRO[paso]

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .systemBarsPadding()
            .imePadding(),
    ) {
        RuumRegistrationHeader(
            paso = paso + 1,
            total = 5,
            onAtras = { if (paso > PAGINA_CUENTA) paso-- },
        )

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = RuumTokens.Space20),
        ) {
            RuumRegistroTitulo(
                titulo = definicion.titulo,
                subtitulo = definicion.subtitulo,
            )
            if (state.solicitud != null) {
                Spacer(Modifier.height(RuumTokens.Space4))
                Text(
                    "Expediente ${state.solicitud.estado.replace('_', ' ')} · tu avance se guarda automáticamente.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))

            if (state.error != null) {
                RuumAlert(state.error, Modifier.fillMaxWidth(), error = true)
                Spacer(Modifier.height(RuumTokens.Space12))
            }
            if (state.notice != null) {
                RuumAlert(state.notice, Modifier.fillMaxWidth())
                Spacer(Modifier.height(RuumTokens.Space12))
            }

            when (paso) {
                PAGINA_CUENTA -> {
                    RuumDatoResumen("Teléfono", telefonoE164Mx(telefono))
                    Spacer(Modifier.height(RuumTokens.Space8))
                    RuumDatoResumen("Correo", state.signupEmail.ifBlank { "Verificado por correo" })
                    Spacer(Modifier.height(RuumTokens.Space8))
                    RuumDatoResumen("Estado", "Cuenta verificada")
                }

                PAGINA_IDENTIDAD -> {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                        RuumDenseField(
                            valor = nombre,
                            onValorChange = { nombre = it },
                            etiqueta = "Nombre",
                            placeholder = "Como en tu identificación",
                            modifier = Modifier.weight(1f),
                        )
                        RuumDenseField(
                            valor = apellidos,
                            onValorChange = { apellidos = it },
                            etiqueta = "Apellido",
                            placeholder = "Como en tu identificación",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Spacer(Modifier.height(RuumTokens.Space12))
                    RuumDenseField(
                        valor = curp,
                        onValorChange = { curp = it.uppercase().filter { c -> c.isLetterOrDigit() }.take(18) },
                        etiqueta = "CURP",
                        placeholder = "Ej. ABCD123456HDFEFG01",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    RuumResumenAccion(
                        icono = Icons.Default.LocationOn,
                        titulo = "Domicilio",
                        accion = if (domicilioCompleto) "Editar domicilio" else "Agregar domicilio",
                        onClick = { hoja = "domicilio" },
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    RuumResumenAccion(
                        icono = Icons.Default.Phone,
                        titulo = "Contacto de emergencia",
                        accion = if (contactoCompleto) "Editar contacto" else "Agregar contacto",
                        onClick = { hoja = "contacto" },
                    )
                }

                PAGINA_LICENCIA -> {
                    RuumDenseField(
                        valor = numeroLicencia,
                        onValorChange = { numeroLicencia = it },
                        etiqueta = "Número de licencia",
                        placeholder = "Como aparece en tu licencia",
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    RuumDenseField(
                        valor = tipoLicencia,
                        onValorChange = { tipoLicencia = it },
                        etiqueta = "Tipo y categoría",
                        placeholder = "Ej. Automóvil particular",
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    RuumDenseField(
                        valor = vigenciaLicencia,
                        onValorChange = { vigenciaLicencia = it.take(10) },
                        etiqueta = "Vigencia",
                        placeholder = "AAAA-MM-DD",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    )
                    Spacer(Modifier.height(RuumTokens.Space16))
                    CheckRow(
                        "Autorizo la verificación de antecedentes penales e infracciones de conducción, y el tratamiento de mis datos biométricos y de geolocalización para Didit.",
                        autoriza,
                    ) { autoriza = it }
                    CheckRow(
                        "Declaro no tener suspensiones vigentes de licencia ni procesos legales activos relacionados con el manejo.",
                        declara,
                    ) { declara = it }
                }

                PAGINA_DOCUMENTOS -> {
                    Text(
                        "Licencia (frente y reverso) e identificación oficial son obligatorios. Formatos JPG, PNG, WEBP o PDF hasta 10 MB.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    listOf(
                        Triple("licencia_frente", "Foto de tu licencia (frente)", "Fotografía clara del frente de tu licencia vigente."),
                        Triple("licencia_reverso", "Foto de tu licencia (reverso)", "Fotografía clara del reverso de tu licencia vigente."),
                        Triple("identificacion_oficial", "Foto de tu Identificación oficial (INE/pasaporte)", "Identificación oficial vigente."),
                        Triple("constancia_situacion_fiscal", "Constancia de Situación Fiscal (SAT)", "Constancia actualizada del SAT en archivo PDF o imagen legible."),
                    ).forEach { (tipo, etiqueta, descripcion) ->
                        WizardDocumentRow(
                            state = state,
                            viewModel = viewModel,
                            type = tipo,
                            label = etiqueta,
                            description = descripcion,
                        )
                        Spacer(Modifier.height(RuumTokens.Space12))
                    }
                }

                else -> {
                    if (state.solicitud?.estado == "en_revision") {
                        Text(
                            "Tu cuenta está pendiente de validación. Cuando la revisión esté completa, podrás consultar y aceptar Traslados.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(RuumTokens.Space12))
                    }
                    RuumDatoResumen("Cuenta", telefonoE164Mx(telefono))
                    Spacer(Modifier.height(RuumTokens.Space8))
                    RuumDatoResumen("Identidad", "$nombre $apellidos · CURP $curp")
                    Spacer(Modifier.height(RuumTokens.Space8))
                    RuumDatoResumen(
                        "Domicilio",
                        "$calle $numero, $colonia, $ciudad, $estadoMx CP $codigoPostal",
                    )
                    Spacer(Modifier.height(RuumTokens.Space8))
                    RuumDatoResumen(
                        "Licencia",
                        "$numeroLicencia · $tipoLicencia · Vigente hasta $vigenciaLicencia",
                    )
                    Spacer(Modifier.height(RuumTokens.Space16))
                    CheckRow("Acepto los términos del servicio.", aceptaTerminos) { aceptaTerminos = it }
                    CheckRow("Confirmo que leí el aviso de privacidad.", confirmaPrivacidad) { confirmaPrivacidad = it }
                    if (state.solicitud?.estado == "en_revision" || state.diditUrl != null) {
                        Spacer(Modifier.height(RuumTokens.Space12))
                        DiditSection(state, viewModel)
                    }
                }
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }

        Column(Modifier.padding(horizontal = RuumTokens.Space20)) {
            when (paso) {
                PAGINA_REVISION -> RuumCtaButton(
                    text = "Enviar registro",
                    onClick = {
                        viewModel.enviarSolicitud(BuildConfig.VERSION_NAME, aceptaTerminos, confirmaPrivacidad)
                    },
                    enabled = aceptaTerminos && confirmaPrivacidad,
                    loading = state.loading || state.diditLoading,
                )
                else -> RuumCtaButton(
                    text = if (paso == PAGINA_CUENTA) "Continuar" else "Guardar y continuar",
                    onClick = {
                        guardar(paso + 1)
                        if (paso < PAGINA_REVISION) paso++
                    },
                    enabled = pasoValido(
                        paso, nombre, apellidos, curp, telefono, codigoPostal, estadoMx,
                        ciudad, colonia, calle, numero, contactoNombre, contactoTelefono,
                        numeroLicencia, tipoLicencia, vigenciaLicencia,
                        autoriza, declara, state,
                    ),
                    loading = state.loading,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
        }
    }

    if (hoja == "domicilio") {
        ModalBottomSheet(
            onDismissRequest = { hoja = null },
            containerColor = MaterialTheme.colorScheme.surface,
        ) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = RuumTokens.Space20)
                    .padding(bottom = RuumTokens.Space24),
            ) {
                Text("Domicilio", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = codigoPostal,
                    onValorChange = { codigoPostal = it.filter(Char::isDigit).take(5) },
                    etiqueta = "Código postal",
                    placeholder = "00000",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = estadoMx,
                    onValorChange = { estadoMx = it },
                    etiqueta = "Estado",
                    placeholder = "Ciudad de México",
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = ciudad,
                    onValorChange = { ciudad = it },
                    etiqueta = "Ciudad o municipio",
                    placeholder = "Álvaro Obregón",
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = colonia,
                    onValorChange = { colonia = it },
                    etiqueta = "Colonia",
                    placeholder = "San Ángel",
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    RuumDenseField(
                        valor = calle,
                        onValorChange = { calle = it },
                        etiqueta = "Calle",
                        placeholder = "Av. Río Mixcoac",
                        modifier = Modifier.weight(1f),
                    )
                    RuumDenseField(
                        valor = numero,
                        onValorChange = { numero = it },
                        etiqueta = "Número",
                        placeholder = "123",
                        modifier = Modifier.weight(1f),
                    )
                }
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = referencias,
                    onValorChange = { referencias = it },
                    etiqueta = "Referencias",
                    placeholder = "Entre calles, portón azul…",
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    TextButton(
                        onClick = { hoja = null },
                        modifier = Modifier.weight(1f).height(RuumTokens.Touch),
                    ) {
                        Text("Cancelar", color = RuumTokens.RegistrationTextSecondary)
                    }
                    RuumCtaButton(
                        text = "Guardar",
                        onClick = { hoja = null },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }

    if (hoja == "contacto") {
        ModalBottomSheet(
            onDismissRequest = { hoja = null },
            containerColor = MaterialTheme.colorScheme.surface,
        ) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = RuumTokens.Space20)
                    .padding(bottom = RuumTokens.Space24),
            ) {
                Text("Contacto de emergencia", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = contactoNombre,
                    onValorChange = { contactoNombre = it },
                    etiqueta = "Nombre del contacto",
                    placeholder = "Nombre completo",
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                RuumDenseField(
                    valor = contactoTelefono,
                    onValorChange = { contactoTelefono = it.filter(Char::isDigit).take(10) },
                    etiqueta = "Teléfono del contacto",
                    placeholder = "10 dígitos",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    TextButton(
                        onClick = { hoja = null },
                        modifier = Modifier.weight(1f).height(RuumTokens.Touch),
                    ) {
                        Text("Cancelar", color = RuumTokens.RegistrationTextSecondary)
                    }
                    RuumCtaButton(
                        text = "Guardar",
                        onClick = { hoja = null },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

/**
 * Campo de formulario clásico (Material 3 outlined). Se conserva para las
 * pantallas de gestión de expediente, que no siguen el flujo de alta.
 */
@Composable
fun WizardField(label: String, value: String, onChange: (String) -> Unit) {
    androidx.compose.material3.OutlinedTextField(
        value = value, onValueChange = onChange,
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = RuumTokens.InputHeight)
            .padding(vertical = RuumTokens.Space4),
        label = { Text(label) }, singleLine = true, shape = MaterialTheme.shapes.small,
        textStyle = MaterialTheme.typography.bodyLarge,
    )
}

/** Fila de resumen usada en la página de cuenta y en la de revisión. */
@Composable
private fun RuumDatoResumen(etiqueta: String, valor: String) {    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = RuumTokens.Space4),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            etiqueta,
            modifier = Modifier.weight(0.4f),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            valor,
            modifier = Modifier.weight(0.6f),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

fun pasoValido(
    paso: Int,
    nombre: String, apellidos: String, curp: String, telefono: String,
    codigoPostal: String, estadoMx: String, ciudad: String, colonia: String,
    calle: String, numero: String, contactoNombre: String, contactoTelefono: String,
    numeroLicencia: String, tipoLicencia: String, vigenciaLicencia: String,
    autoriza: Boolean, declara: Boolean,
    state: DriverUiState,
): Boolean {
    if (paso == PAGINA_CUENTA) return true
    if (paso == PAGINA_IDENTIDAD) {
        return nombre.isNotBlank() && apellidos.isNotBlank() && curp.length == 18 &&
            telefono.length == 10 && codigoPostal.length == 5 && estadoMx.isNotBlank() &&
            ciudad.isNotBlank() && colonia.isNotBlank() && calle.isNotBlank() &&
            numero.isNotBlank() && contactoNombre.isNotBlank() && contactoTelefono.length == 10
    }
    if (paso == PAGINA_LICENCIA) {
        val vigenciaOk = runCatching {
            !LocalDate.parse(vigenciaLicencia).isBefore(LocalDate.now())
        }.getOrDefault(false)
        return numeroLicencia.isNotBlank() && tipoLicencia.isNotBlank() && vigenciaOk &&
            autoriza && declara
    }
    if (paso == PAGINA_DOCUMENTOS) {
        val tipos = state.solicitudDocumentos.filter { it.esActual }.map { it.tipo }.toSet()
        return "licencia_frente" in tipos && "licencia_reverso" in tipos && "identificacion_oficial" in tipos
    }
    return true
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
    Column(
        Modifier
            .fillMaxWidth()
            .padding(vertical = RuumTokens.Space4),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                Text(label, style = MaterialTheme.typography.titleSmall)
                Text(description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            RuumStatusChip(document?.estado ?: "falta")
        }
        if (document != null) {
            Text(document.nombreArchivo, Modifier.padding(top = RuumTokens.Space8), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        localError?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), error = true) }
        TextButton(
            onClick = { picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf")) },
            modifier = Modifier.fillMaxWidth().height(RuumTokens.Touch),
        ) {
            Text(
                if (document == null) "Subir archivo" else "Reemplazar archivo",
                color = RuumTokens.Action,
            )
        }
    }
}
