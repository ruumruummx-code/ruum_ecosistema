package com.moviliax.ruumruum.conductor.ui.auth

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RequisitosPasswordTest {

    @Test
    fun `una contraseña vacía no cumple ningún requisito`() {
        val requisitos = evaluarRequisitosPassword("", "")

        assertFalse(requisitos.longitud)
        assertFalse(requisitos.numero)
        assertFalse(requisitos.mayusMinus)
        assertFalse(requisitos.coincide)
        assertFalse(requisitos.completos)
    }

    @Test
    fun `exige mínimo 8 caracteres`() {
        assertFalse(evaluarRequisitosPassword("Aa1b2c3", "Aa1b2c3").longitud)
        assertTrue(evaluarRequisitosPassword("Aa1b2c34", "Aa1b2c34").longitud)
    }

    @Test
    fun `exige al menos un número`() {
        assertFalse(evaluarRequisitosPassword("Abcdefgh", "Abcdefgh").numero)
        assertTrue(evaluarRequisitosPassword("Abcdefg1", "Abcdefg1").numero)
    }

    @Test
    fun `exige mayúscula y minúscula`() {
        assertFalse(evaluarRequisitosPassword("abcdefg1", "abcdefg1").mayusMinus)
        assertFalse(evaluarRequisitosPassword("ABCDEFG1", "ABCDEFG1").mayusMinus)
        assertTrue(evaluarRequisitosPassword("Abcdefg1", "Abcdefg1").mayusMinus)
    }

    @Test
    fun `la confirmación sólo cuenta si coincide exactamente`() {
        assertFalse(evaluarRequisitosPassword("Abcdefg1", "").coincide)
        assertFalse(evaluarRequisitosPassword("Abcdefg1", "Abcdefg2").coincide)
        assertTrue(evaluarRequisitosPassword("Abcdefg1", "Abcdefg1").coincide)
    }

    @Test
    fun `una contraseña válida con su confirmación completa todos los requisitos`() {
        assertTrue(evaluarRequisitosPassword("Conductor1", "Conductor1").completos)
    }
}
