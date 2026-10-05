package com.moviliax.ruumruum.conductor.domain

import java.time.LocalDate

/**
 * Modelo 11 — Conductores certificados Ruum Ruum.
 * Réplica en Kotlin de packages/shared (niveles-certificacion.ts +
 * certificacion-conductor.ts): el nivel regula el alcance geográfico
 * habilitado (urbano -> interurbano -> interestatal) y es acumulativo.
 */

/** 11.3 — alerta operativa 15 días antes del vencimiento de licencia. */
const val DIAS_ALERTA_VENCIMIENTO_LICENCIA = 15

data class RequisitoCertificacion(
    val clave: String,
    val etiqueta: String,
    val bloqueante: Boolean = true,
)

/** 11.2 — Requisitos mínimos (checklist canónico). */
val REQUISITOS_MINIMOS_CERTIFICACION = listOf(
    RequisitoCertificacion("identificacion_oficial", "Identificación oficial vigente"),
    RequisitoCertificacion("licencia_vigente", "Licencia vigente del tipo compatible"),
    RequisitoCertificacion("comprobante_domicilio", "Comprobante de domicilio"),
    RequisitoCertificacion("constancia_fiscal", "Constancia de situación fiscal"),
    RequisitoCertificacion("cuenta_bancaria_propia", "Cuenta bancaria propia (CLABE)"),
    RequisitoCertificacion("smartphone_compatible", "Teléfono inteligente compatible"),
    RequisitoCertificacion("consentimiento_biometrico_geo", "Consentimiento expreso biométricos + geolocalización"),
    RequisitoCertificacion("consentimiento_antecedentes", "Consentimiento antecedentes penales e infracciones"),
    RequisitoCertificacion("capacitacion_aprobada", "Capacitación aprobada (MCE)"),
    RequisitoCertificacion("evaluacion_practica_aprobada", "Evaluación práctica de evidencia + manejo aprobadas"),
)

data class NivelServicio(
    val nivel: Int,
    val denominacion: String,
    val servicios: List<String>,
    val descripcion: String,
)

/** 11.5 — Niveles acumulativos de certificación por servicio. */
val NIVELES_CERTIFICACION_SERVICIO = listOf(
    NivelServicio(
        nivel = 1,
        denominacion = "Básico",
        servicios = listOf("Traslado urbano"),
        descripcion = "Traslados dentro de la misma ciudad / zona urbana.",
    ),
    NivelServicio(
        nivel = 2,
        denominacion = "Intermedio",
        servicios = listOf("Traslado urbano", "Traslado interurbano"),
        descripcion = "Incluye rutas interurbanas (< 100 km y rutas foráneas).",
    ),
    NivelServicio(
        nivel = 3,
        denominacion = "Avanzado",
        servicios = listOf("Traslado urbano", "Traslado interurbano", "Traslado interestatal"),
        descripcion = "Alcance nacional; exige historial ejemplar y evaluación complementaria.",
    ),
)

fun etiquetaNivelCertificacion(nivel: Int): String = when (nivel) {
    1 -> "Nivel 1 · Básico"
    2 -> "Nivel 2 · Intermedio"
    3 -> "Nivel 3 · Avanzado"
    else -> "Nivel $nivel"
}

/** 11.6 — Carta de derechos del conductor certificado. */
val CARTA_DERECHOS_CONDUCTOR = listOf(
    "Conocer tu pago antes de aceptar.",
    "Ver tus métricas de desempeño.",
    "Recibir explicación ante restricciones.",
    "Que toda suspensión o revocación sea revisada por una persona antes de ser definitiva.",
    "Conocer las penalizaciones aplicables y disputarlas con evidencia.",
    "Presentar aclaraciones.",
    "Recibir soporte humano.",
    "Activar protocolos de seguridad.",
    "Reportar corrupción sin represalias.",
    "Consultar historial de viajes y pagos.",
)

/** 11.7 — Compromisos del conductor. */
val COMPROMISOS_CONDUCTOR = listOf(
    "Capturar la evidencia completa en cada traslado.",
    "Cumplir los protocolos de seguridad.",
    "Mantener vigentes tus documentos.",
    "Tratar con respeto a clientes y equipo.",
    "Reportar incidentes de inmediato.",
    "No participar en prácticas prohibidas de asignación.",
)

/** Días entre hoy y una fecha ISO `YYYY-MM-DD`. Negativo = ya venció. */
fun diasParaVencerLicencia(fechaIso: String, hoy: LocalDate = LocalDate.now()): Int? {
    val vencimiento = runCatching { LocalDate.parse(fechaIso.take(10)) }.getOrNull() ?: return null
    return (vencimiento.toEpochDay() - hoy.toEpochDay()).toInt()
}

data class AlertaLicencia(
    val activa: Boolean,
    val dias: Int?,
    val mensaje: String?,
)

/** 11.3 — alerta 15 días antes; vencida deshabilita hasta renovar. */
fun alertaLicencia15Dias(vigencia: String?): AlertaLicencia {
    if (vigencia.isNullOrBlank()) return AlertaLicencia(false, null, null)
    val dias = diasParaVencerLicencia(vigencia) ?: return AlertaLicencia(false, null, null)
    if (dias < 0) return AlertaLicencia(
        activa = true,
        dias = dias,
        mensaje = "Tu licencia está vencida. Estás deshabilitado para traslados hasta renovarla.",
    )
    if (dias <= DIAS_ALERTA_VENCIMIENTO_LICENCIA) return AlertaLicencia(
        activa = true,
        dias = dias,
        mensaje = "Tu licencia vence en $dias día(s). Renuévala para no perder actividad (alerta 15 días).",
    )
    return AlertaLicencia(false, dias, null)
}

data class ResultadoMCE(val activo: Boolean, val motivo: String?)

/** 11.4 MCE — filtro progresivo: solo Activo cuando todo está aprobado. */
fun esActivoParaAsignacionMCE(
    identidadValidada: Boolean,
    licenciaValidada: Boolean,
    licenciaVigente: Boolean,
    capacitacionAprobada: Boolean,
    evaluacionPracticaAprobada: Boolean,
    pruebaManejoAprobada: Boolean,
    estado: String,
): ResultadoMCE {
    if (estado != "activo") return ResultadoMCE(false, "Conductor en estado: $estado")
    if (!identidadValidada) return ResultadoMCE(false, "Identidad sin validar (Didit pendiente o rechazada)")
    if (!licenciaValidada || !licenciaVigente) return ResultadoMCE(false, "Licencia sin validar o vencida")
    if (!capacitacionAprobada) return ResultadoMCE(false, "Capacitación MCE pendiente")
    if (!evaluacionPracticaAprobada) return ResultadoMCE(false, "Evaluación práctica de evidencia pendiente")
    if (!pruebaManejoAprobada) return ResultadoMCE(false, "Prueba práctica de manejo pendiente")
    return ResultadoMCE(true, null)
}

data class ResultadoAscenso(val puede: Boolean, val faltantes: List<String>)

/** 11.5 — Ascenso objetivo y visible. */
fun puedeAscenderNivel(
    nivelActual: Int,
    trasladosCompletados: Int,
    puntualidadPct: Double?,
    calidadEvidenciaPct: Double?,
    incidentesGravesImputables: Int,
    evaluacionComplementariaAprobada: Boolean,
): ResultadoAscenso {
    val faltantes = mutableListOf<String>()
    if (incidentesGravesImputables > 0) faltantes.add("Sin incidentes graves imputables")
    if (nivelActual >= 3) return ResultadoAscenso(false, listOf("Nivel máximo alcanzado"))
    val minimoTraslados = if (nivelActual == 1) 20 else 50
    if (trasladosCompletados < minimoTraslados) faltantes.add("Mínimo $minimoTraslados traslados completados")
    if ((puntualidadPct ?: 1.0) < 0.9) faltantes.add("Puntualidad ≥ 90%")
    if ((calidadEvidenciaPct ?: 1.0) < 0.95) faltantes.add("Calidad de evidencia ≥ 95%")
    if (nivelActual == 2 && !evaluacionComplementariaAprobada) {
        faltantes.add("Evaluación complementaria para Nivel 3")
    }
    return ResultadoAscenso(faltantes.isEmpty(), faltantes)
}
