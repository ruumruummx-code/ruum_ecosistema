package com.moviliax.ruumruum.conductor.ui.account

import android.content.pm.PackageManager
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.moviliax.ruumruum.conductor.domain.CARTA_DERECHOS_CONDUCTOR
import com.moviliax.ruumruum.conductor.domain.COMPROMISOS_CONDUCTOR
import com.moviliax.ruumruum.conductor.domain.NIVELES_CERTIFICACION_SERVICIO
import com.moviliax.ruumruum.conductor.domain.REQUISITOS_MINIMOS_CERTIFICACION
import com.moviliax.ruumruum.conductor.domain.alertaLicencia15Dias
import com.moviliax.ruumruum.conductor.domain.esActivoParaAsignacionMCE
import com.moviliax.ruumruum.conductor.domain.etiquetaNivelCertificacion
import com.moviliax.ruumruum.conductor.domain.puedeAscenderNivel
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel
import com.moviliax.ruumruum.conductor.ui.common.SectionTitle
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

@Composable
fun CertificacionScreen(
    state: DriverUiState,
    viewModel: DriverViewModel,
    onOpenDocuments: () -> Unit,
) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { viewModel.loadCertificacion() }
    val driver = state.driver
    val docs = state.documents.filter { it.esActual }
    val aprobado = { tipo: String -> docs.any { it.tipo == tipo && it.estado == "aprobado" } }
    val licenciaDocsOk = aprobado("licencia_frente") && aprobado("licencia_reverso")
    val alerta = alertaLicencia15Dias(driver?.licenciaVigencia)
    val licenciaVigente = (alerta.dias ?: -1) >= 0 && licenciaDocsOk
    val smartphone = context.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
    val capacitacionOk = driver?.capacitacionAprobada == true ||
        state.capacitaciones.any { it.estado == "aprobado" }
    val checklist = mapOf(
        "identificacion_oficial" to aprobado("identificacion_oficial"),
        "licencia_vigente" to licenciaVigente,
        "comprobante_domicilio" to aprobado("documento_operativo"),
        "constancia_fiscal" to aprobado("constancia_situacion_fiscal"),
        "cuenta_bancaria_propia" to state.tieneBanco,
        "smartphone_compatible" to smartphone,
        "consentimiento_biometrico_geo" to
            (state.verificacionDidit?.estado == "aprobado" || aprobado("identificacion_oficial")),
        "consentimiento_antecedentes" to (state.solicitud != null || driver?.estado != "pendiente_verificacion"),
        "capacitacion_aprobada" to capacitacionOk,
        "evaluacion_practica_aprobada" to (driver?.evaluacionPracticaAprobada == true),
    )
    val mce = esActivoParaAsignacionMCE(
        identidadValidada = driver?.identidadValidada == true || aprobado("identificacion_oficial"),
        licenciaValidada = driver?.licenciaValidada == true || licenciaDocsOk,
        licenciaVigente = licenciaVigente,
        capacitacionAprobada = capacitacionOk,
        evaluacionPracticaAprobada = driver?.evaluacionPracticaAprobada == true,
        pruebaManejoAprobada = driver?.pruebaManejoAprobada == true,
        estado = driver?.estado ?: "pendiente_verificacion",
    )
    val nivel = driver?.nivelCertificacion ?: 1
    val ascenso = puedeAscenderNivel(
        nivelActual = nivel,
        trasladosCompletados = driver?.trasladosCompletados ?: 0,
        puntualidadPct = null,
        calidadEvidenciaPct = null,
        incidentesGravesImputables = 0,
        evaluacionComplementariaAprobada = false,
    )
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        if (alerta.activa) {
            item { RuumAlert(alerta.mensaje.orEmpty(), Modifier.fillMaxWidth(), error = (alerta.dias ?: 0) < 0) }
        }
        if (!mce.activo) {
            item {
                RuumAlert(
                    "Aún no estás Activo para asignación: ${mce.motivo}. Completa los pendientes.",
                    Modifier.fillMaxWidth(),
                )
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Requisitos mínimos", "${checklist.values.count { it }}/10 completados")
                Spacer(Modifier.height(RuumTokens.Space8))
                REQUISITOS_MINIMOS_CERTIFICACION.forEach { requisito ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(if (checklist[requisito.clave] == true) "✅" else "⬜")
                        Text(
                            requisito.etiqueta,
                            Modifier.padding(start = RuumTokens.Space8),
                            color = if (checklist[requisito.clave] == true) {
                                MaterialTheme.colorScheme.onSurface
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                        )
                    }
                    Spacer(Modifier.height(RuumTokens.Space4))
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Validación de identidad (Didit)")
                Text(
                    "Sin identidad y licencia validadas y vigentes no hay asignación.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                state.verificacionDidit?.let {
                    Text("Estado Didit: ${it.estado.replace('_', ' ')}", Modifier.padding(top = RuumTokens.Space8))
                }
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    RuumSecondaryButton("Documentos", onOpenDocuments, Modifier.weight(1f))
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Capacitación y evaluación (MCE)")
                val cursos = if (state.capacitaciones.isEmpty()) {
                    "Cursos obligatorios — pendiente"
                } else {
                    state.capacitaciones.joinToString("\n") { "· ${it.curso}: ${it.estado}" }
                }
                Text(cursos, Modifier.padding(top = RuumTokens.Space8))
                Text("Evaluación práctica de evidencia — ${if (driver?.evaluacionPracticaAprobada == true) "aprobada" else "pendiente"}")
                Text("Prueba práctica de manejo — ${if (driver?.pruebaManejoAprobada == true) "aprobada" else "pendiente"}")
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Nivel de certificación", "Actual: ${etiquetaNivelCertificacion(nivel)}")
                Spacer(Modifier.height(RuumTokens.Space8))
                NIVELES_CERTIFICACION_SERVICIO.forEach { info ->
                    Text("Nivel ${info.nivel} · ${info.denominacion}", style = MaterialTheme.typography.titleMedium)
                    Text(info.descripcion, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Habilita: ${info.servicios.joinToString(" · ")}", Modifier.padding(bottom = RuumTokens.Space8))
                }
                if (!ascenso.puede) {
                    Text(
                        "Para ascender te falta: ${ascenso.faltantes.joinToString(", ")}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Carta de derechos")
                Spacer(Modifier.height(RuumTokens.Space8))
                CARTA_DERECHOS_CONDUCTOR.forEach {
                    Text("· $it", Modifier.padding(bottom = RuumTokens.Space4))
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Compromisos")
                Spacer(Modifier.height(RuumTokens.Space8))
                COMPROMISOS_CONDUCTOR.forEach {
                    Text("· $it", Modifier.padding(bottom = RuumTokens.Space4))
                }
            }
        }
    }
}
