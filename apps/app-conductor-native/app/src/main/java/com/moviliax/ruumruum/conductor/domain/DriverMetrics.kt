package com.moviliax.ruumruum.conductor.domain

import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.Trip

fun estimatedEarning(trip: Trip): Double =
    trip.gananciaConductor ?: (trip.precioCotizado ?: 0.0) * 0.85

fun totalDeposited(payouts: List<Payout>): Double =
    payouts.asSequence()
        .filter { it.estado == "procesado" }
        .sumOf { it.montoNeto }
