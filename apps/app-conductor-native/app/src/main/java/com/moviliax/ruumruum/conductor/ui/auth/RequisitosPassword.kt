package com.moviliax.ruumruum.conductor.ui.auth

/**
 * Requisitos de contraseña del flujo de alta del conductor.
 * Alineado con `packages/shared/src/utils/requisitos-password.ts` (app web):
 * mínimo 8 caracteres, al menos un número, mayúscula y minúscula, y la
 * contraseña debe confirmarse con el mismo valor.
 */
data class RequisitosPassword(
    val longitud: Boolean,
    val numero: Boolean,
    val mayusMinus: Boolean,
    val coincide: Boolean,
) {
    val completos: Boolean get() = longitud && numero && mayusMinus && coincide
}

/** Evalúa los cuatro requisitos que muestra el prototipo bajo los campos. */
fun evaluarRequisitosPassword(password: String, confirmacion: String): RequisitosPassword =
    RequisitosPassword(
        longitud = password.length >= 8,
        numero = password.any { it.isDigit() },
        mayusMinus = password.any { it.isUpperCase() } && password.any { it.isLowerCase() },
        coincide = confirmacion.isNotEmpty() && password == confirmacion,
    )
