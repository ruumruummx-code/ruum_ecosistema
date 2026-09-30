package com.moviliax.ruumruum.conductor.domain

import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.Trip
import org.junit.Assert.assertEquals
import org.junit.Test

class DriverMetricsTest {
    @Test
    fun `uses frozen driver earning when available`() {
        assertEquals(900.0, estimatedEarning(Trip(gananciaConductor = 900.0, precioCotizado = 1_000.0)), 0.0)
    }

    @Test
    fun `estimates 85 percent when earning has not been frozen`() {
        assertEquals(850.0, estimatedEarning(Trip(precioCotizado = 1_000.0)), 0.0)
    }

    @Test
    fun `only processed payouts count as deposited`() {
        val payouts = listOf(
            payout("procesado", 1_250.0),
            payout("pendiente", 900.0),
            payout("revocado", 500.0),
        )
        assertEquals(1_250.0, totalDeposited(payouts), 0.0)
    }

    private fun payout(status: String, amount: Double) = Payout(
        id = "$status-$amount",
        conductorId = "driver-1",
        estado = status,
        montoBruto = amount,
        montoNeto = amount,
        ajustes = 0.0,
        periodoInicio = "2026-09-20",
        periodoFin = "2026-09-26",
    )
}
