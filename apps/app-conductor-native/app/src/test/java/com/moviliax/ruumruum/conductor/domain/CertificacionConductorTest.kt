package com.moviliax.ruumruum.conductor.domain

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CertificacionConductorTest {

    @Test
    fun `alerta 15 dias antes del vencimiento`() {
        assertEquals(15, DIAS_ALERTA_VENCIMIENTO_LICENCIA)
        val hoy = LocalDate.of(2026, 10, 5)
        assertEquals(10, diasParaVencerLicencia("2026-10-15", hoy))
        assertEquals(-1, diasParaVencerLicencia("2026-10-04", hoy))
    }

    @Test
    fun `licencia vencida deshabilita con mensaje`() {
        val alerta = alertaLicencia15Dias("2000-01-01")
        assertTrue(alerta.activa)
        assertTrue((alerta.dias ?: 0) < 0)
        assertTrue(alerta.mensaje!!.contains("vencida"))
    }

    @Test
    fun `licencia lejana no genera alerta`() {
        val alerta = alertaLicencia15Dias("2999-01-01")
        assertFalse(alerta.activa)
    }

    @Test
    fun `sin vigencia no hay alerta`() {
        assertFalse(alertaLicencia15Dias(null).activa)
        assertFalse(alertaLicencia15Dias("").activa)
    }

    @Test
    fun `niveles acumulativos 1 a 3`() {
        assertEquals(3, NIVELES_CERTIFICACION_SERVICIO.size)
        assertEquals(listOf("Traslado urbano"), NIVELES_CERTIFICACION_SERVICIO[0].servicios)
        assertEquals(3, NIVELES_CERTIFICACION_SERVICIO[2].servicios.size)
        assertEquals("Nivel 1 · Básico", etiquetaNivelCertificacion(1))
        assertEquals("Nivel 3 · Avanzado", etiquetaNivelCertificacion(3))
    }

    @Test
    fun `diez requisitos minimos bloqueantes`() {
        assertEquals(10, REQUISITOS_MINIMOS_CERTIFICACION.size)
        assertTrue(REQUISITOS_MINIMOS_CERTIFICACION.all { it.bloqueante })
    }

    @Test
    fun `MCE exige todo aprobado y estado activo`() {
        val base = mapOf(
            "identidad" to true, "licencia" to true, "vigente" to true,
            "cap" to true, "eval" to true, "manejo" to true,
        )
        fun mce(m: Map<String, Boolean>, estado: String) = esActivoParaAsignacionMCE(
            identidadValidada = m.getValue("identidad"),
            licenciaValidada = m.getValue("licencia"),
            licenciaVigente = m.getValue("vigente"),
            capacitacionAprobada = m.getValue("cap"),
            evaluacionPracticaAprobada = m.getValue("eval"),
            pruebaManejoAprobada = m.getValue("manejo"),
            estado = estado,
        )
        assertTrue(mce(base, "activo").activo)
        assertFalse(mce(base, "pendiente_verificacion").activo)
        assertFalse(mce(base + ("identidad" to false), "activo").activo)
        assertTrue(mce(base + ("cap" to false), "activo").motivo!!.contains("Capacitación"))
    }

    @Test
    fun `ascenso exige criterios objetivos`() {
        val r = puedeAscenderNivel(
            nivelActual = 1, trasladosCompletados = 5, puntualidadPct = 0.99,
            calidadEvidenciaPct = 0.99, incidentesGravesImputables = 0,
            evaluacionComplementariaAprobada = true,
        )
        assertFalse(r.puede)
        assertTrue(r.faltantes.joinToString(" ").contains("traslados"))
        val tope = puedeAscenderNivel(3, 999, 1.0, 1.0, 0, true)
        assertFalse(tope.puede)
    }

    @Test
    fun `carta de derechos y compromisos completos`() {
        assertEquals(10, CARTA_DERECHOS_CONDUCTOR.size)
        assertEquals(6, COMPROMISOS_CONDUCTOR.size)
    }
}
