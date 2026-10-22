package com.moviliax.ruumruum.conductor.ui.auth

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.DriverViewModel

enum class AuthRoute { LOGIN, REGISTRO, OTP, RECUPERACION }

@Composable
fun AuthNav(state: DriverUiState, viewModel: DriverViewModel) {
    var route by remember { mutableStateOf(AuthRoute.LOGIN) }
    // Tras crear cuenta con OTP pendiente, ir al código automáticamente.
    LaunchedEffect(state.signupNeedsOtp) {
        if (state.signupNeedsOtp) route = AuthRoute.OTP
    }
    when (route) {
        AuthRoute.LOGIN -> LoginScreen(
            loading = state.loading,
            error = state.error,
            onLogin = viewModel::signIn,
            onRegistro = { route = AuthRoute.REGISTRO },
            onRecuperacion = { route = AuthRoute.RECUPERACION },
        )
        AuthRoute.REGISTRO -> RegistroScreen(
            loading = state.loading,
            error = state.error,
            onCrear = { email, password, telefono, aceptaTerminos ->
                viewModel.signUp(email, password, telefono, aceptaTerminos)
            },
            onVolver = { route = AuthRoute.LOGIN },
        )
        AuthRoute.OTP -> OtpScreen(
            email = state.signupEmail,
            loading = state.loading,
            error = state.error,
            onConfirmar = viewModel::verifySignupOtp,
            onReenviar = viewModel::resendSignupOtp,
            onVolver = { route = AuthRoute.LOGIN },
        )
        AuthRoute.RECUPERACION -> RecuperacionScreen(
            loading = state.loading,
            error = state.error,
            notice = state.notice,
            onEnviar = viewModel::sendPasswordReset,
            onConfirmar = viewModel::confirmRecoveryOtpAndSetPassword,
            onVolver = { route = AuthRoute.LOGIN },
        )
    }
}
