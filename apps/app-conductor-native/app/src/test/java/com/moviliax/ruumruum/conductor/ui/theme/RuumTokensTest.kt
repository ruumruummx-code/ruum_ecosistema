package com.moviliax.ruumruum.conductor.ui.theme

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class RuumTokensTest {
    @Test
    fun streetModeUsesAccessibleTouchTarget() {
        assertEquals(56f, RuumTokens.TouchStreet.value)
        assertEquals(56f, RuumTokens.ButtonHeightStreet.value)
    }

    @Test
    fun darkThemeAvoidsPureBlack() {
        assertNotEquals(Color.Black, RuumTokens.DarkBg)
        assertNotEquals(Color.Black, RuumTokens.DarkSurface)
    }

    @Test
    fun layoutUsesEightPointGridAndMobileMargin() {
        assertEquals(8f, RuumTokens.Space8.value)
        assertEquals(20f, RuumTokens.Space20.value)
        assertEquals(24f, RuumTokens.RadiusXl.value)
    }
}
