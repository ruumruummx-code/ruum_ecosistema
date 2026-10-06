package com.moviliax.ruumruum.conductor.ui

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.moviliax.ruumruum.conductor.BuildConfig
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.data.EvidencePhoto
import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.CARTA_DERECHOS_CONDUCTOR
import com.moviliax.ruumruum.conductor.domain.COMPROMISOS_CONDUCTOR
import com.moviliax.ruumruum.conductor.domain.NIVELES_CERTIFICACION_SERVICIO
import com.moviliax.ruumruum.conductor.domain.REQUISITOS_MINIMOS_CERTIFICACION
import com.moviliax.ruumruum.conductor.domain.alertaLicencia15Dias
import com.moviliax.ruumruum.conductor.domain.esActivoParaAsignacionMCE
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
import com.moviliax.ruumruum.conductor.domain.etiquetaNivelCertificacion
import com.moviliax.ruumruum.conductor.domain.puedeAscenderNivel
import com.moviliax.ruumruum.conductor.domain.totalDeposited
import com.moviliax.ruumruum.conductor.ui.components.RuumAlert
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumLogo
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumStreetMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteDark
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteLight
import com.moviliax.ruumruum.conductor.ui.theme.RuumTheme
import com.moviliax.ruumruum.conductor.ui.theme.RuumThemeMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumThemePreference
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import com.moviliax.ruumruum.conductor.ui.theme.rememberRuumThemePreference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.NumberFormat
import java.time.LocalDate
import java.util.Locale
import androidx.core.graphics.scale
import androidx.core.net.toUri

private enum class Destination(val label: String) {
    PANEL("Inicio"), TRIPS("Traslados"), EARNINGS("Ganancias"), NOTIFICATIONS("Notificaciones"), ACCOUNT("Cuenta")
}

@Composable
fun RuumConductorApp(viewModel: DriverViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val prefs = remember {
        context.getSharedPreferences("ruum_conductor_prefs", Context.MODE_PRIVATE)
    }
    var onboardingVisto by remember {
        mutableStateOf(prefs.getBoolean("onboarding_visto", false))
    }
    val themePreference = rememberRuumThemePreference()
    val streetMode = state.acceptedTrips.any { it.estado == "traslado_en_curso" }
    RuumTheme(mode = themePreference.mode, streetMode = streetMode) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            when {
                state.checkingSession -> CenteredProgress()
                !state.configured -> ConfigMissingScreen()
                !onboardingVisto -> OnboardingScreen(
                    onTerminar = {
                        prefs.edit().putBoolean("onboarding_visto", true).apply()
                        onboardingVisto = true
                    },
                    onAcceso = {
                        prefs.edit().putBoolean("onboarding_visto", true).apply()
                        onboardingVisto = true
                    },
                )
                !state.signedIn -> AuthNav(state, viewModel)
                state.needsOnboarding -> RegistroWizardScreen(state, viewModel)
                else -> AuthenticatedApp(state, viewModel, themePreference)
            }
        }
    }
}

private data class PasoOnboarding(val tag: String, val titulo: String, val descripcion: String)

private val PASOS_ONBOARDING = listOf(
    PasoOnboarding(
        "Seguridad · Evidencia · Trazabilidad",
        "No entregues tu auto a ciegas. Un traslado serio deja evidencia.",
        "Ruum Ruum es traslado vehicular con conductores certificados. Cada viaje inicia con evidencia, continúa con seguimiento y termina con confirmación.",
    ),
    PasoOnboarding(
        "Conductores certificados · Pago promedio $680",
        "No cualquiera mueve un Ruum Ruum.",
        "Cada conductor cumple validación, identidad y protocolo operativo. Gana en promedio $680 por traslado —hasta $1,200 en rutas largas— con pagos trazables y bitácora de principio a fin.",
    ),
    PasoOnboarding(
        "Evidencia documentada · Pago protegido",
        "Cada viaje se documenta.",
        "Kilometraje, carrocería, placas y entrega final con evidencia fotográfica. Tu pago se libera con evidencia validada — trazabilidad que protege tu ingreso.",
    ),
)

@Composable
private fun OnboardingScreen(onTerminar: () -> Unit, onAcceso: () -> Unit) {
    var paso by remember { mutableIntStateOf(0) }
    val actual = PASOS_ONBOARDING[paso]
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                RuumLogo(Modifier.size(96.dp), darkVariant = true)
                TextButton(onClick = onAcceso) { Text("Omitir") }
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Paso ${paso + 1} de 3", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                Text(actual.tag, Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(actual.titulo, Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
                Text(actual.descripcion, Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "1,200 activos hoy · 4.8★ · Hasta $1,200/traslado",
                    Modifier.padding(top = RuumTokens.Space12),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumPrimaryButton(
                text = if (paso < 2) "Comenzar →" else "Crear mi cuenta",
                onClick = { if (paso < 2) paso++ else onTerminar() },
                modifier = Modifier.fillMaxWidth(),
            )
            TextButton(onClick = onAcceso, modifier = Modifier.fillMaxWidth()) {
                Text("Ya tengo una cuenta")
            }
        }
    }
}

private enum class AuthRoute { LOGIN, REGISTRO, OTP, RECUPERACION }

@Composable
private fun AuthNav(state: DriverUiState, viewModel: DriverViewModel) {
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
            onCrear = viewModel::signUp,
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

@Composable
private fun CenteredProgress() = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
    CircularProgressIndicator(color = MaterialTheme.colorScheme.secondary)
}

@Composable
private fun ConfigMissingScreen() {
    Box(Modifier.fillMaxSize().padding(RuumTokens.Space20), contentAlignment = Alignment.Center) {
        RuumCard(Modifier.fillMaxWidth()) {
            Icon(Icons.Default.Sync, null, Modifier.size(32.dp), tint = MaterialTheme.colorScheme.primary)
            Text("Falta configurar Supabase", Modifier.padding(top = RuumTokens.Space16), style = MaterialTheme.typography.headlineSmall)
            Text(
                "Copia local.properties.example como local.properties y agrega la URL y la clave publicable del proyecto.",
                Modifier.padding(top = RuumTokens.Space8),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun LoginScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    onRegistro: () -> Unit = {},
    onRecuperacion: () -> Unit = {},
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    fun validarEmail(valor: String) {
        emailError = if (valor.isNotBlank() &&
            !android.util.Patterns.EMAIL_ADDRESS.matcher(valor).matches()
        ) {
            "Formato de correo inválido"
        } else {
            null
        }
    }
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            RuumLogo(Modifier.size(152.dp), darkVariant = true)
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Seguridad, evidencia y trazabilidad en cada viaje.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(RuumTokens.Space16))
                Text("Iniciar sesión", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Solo conductores verificados. Tu sesión inicia trazabilidad.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "Evidencia · GPS · Pagos trazables",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
                Spacer(Modifier.height(RuumTokens.Space20))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; validarEmail(it) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
                    isError = emailError != null,
                    supportingText = emailError?.let { { Text(it) } },
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Contraseña") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = "Entrar",
                    onClick = { onLogin(email.trim(), password) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = email.isNotBlank() && password.isNotBlank() && emailError == null,
                    loading = loading,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                Text(
                    "Al continuar aceptas los Términos y el Aviso de Privacidad.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            RuumCard(Modifier.fillMaxWidth().padding(top = RuumTokens.Space16)) {
                Text("¿Aún no estás certificado?")
                RuumSecondaryButton(
                    text = "Crea tu cuenta →",
                    onClick = onRegistro,
                    modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                )
                Text(
                    "Validación de identidad en minutos. Sin costo de registro.",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            TextButton(onClick = onRecuperacion, modifier = Modifier.fillMaxWidth()) {
                Text("¿Olvidaste tu contraseña?")
            }
            Text(
                "¿Problemas para entrar? Escríbenos por WhatsApp soporte desde la pantalla de ayuda.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun Modifier.defaultMinInputHeight() = height(RuumTokens.InputHeight)

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun AuthenticatedApp(
    state: DriverUiState,
    viewModel: DriverViewModel,
    themePreference: RuumThemePreference,
) {
    var destination by remember { mutableStateOf(Destination.PANEL) }
    var selectedTrip by remember { mutableStateOf<Trip?>(null) }
    var showingDocuments by remember { mutableStateOf(false) }
    var showingCertificacion by remember { mutableStateOf(false) }
    var showingPerfil by remember { mutableStateOf(false) }
    var safetyDialog by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val street = LocalRuumStreetMode.current
    LaunchedEffect(state.acceptedTrips) {
        selectedTrip?.id?.let { selectedId ->
            state.acceptedTrips.firstOrNull { it.id == selectedId }?.let { selectedTrip = it }
        }
    }
    LaunchedEffect(state.error, state.notice) {
        (state.error ?: state.notice)?.let { snackbar.showSnackbar(it) }
        if (state.error != null || state.notice != null) viewModel.clearMessage()
    }
    val inOverlay = selectedTrip != null || showingDocuments || showingCertificacion || showingPerfil
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (inOverlay) {
                TopAppBar(
                    title = {
                        Text(
                            when {
                                selectedTrip != null -> "Detalle del traslado"
                                showingDocuments -> "Expediente de documentos"
                                showingCertificacion -> "Certificación Ruum"
                                else -> "Modificar perfil"
                            },
                            style = MaterialTheme.typography.titleLarge,
                        )
                    },
                    navigationIcon = {
                        IconButton(
                            onClick = {
                                selectedTrip = null
                                showingDocuments = false
                                showingCertificacion = false
                                showingPerfil = false
                            },
                            modifier = Modifier.size(RuumTokens.Touch),
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver")
                        }
                    },
                    actions = {
                        IconButton(onClick = viewModel::refresh, modifier = Modifier.size(RuumTokens.Touch)) {
                            Icon(Icons.Default.Refresh, "Actualizar")
                        }
                    },
                )
            } else RuumTopBar(destination.label, viewModel::refresh)
        },
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            if (street && !inOverlay) {
                ExtendedFloatingActionButton(
                    onClick = { safetyDialog = true },
                    containerColor = if (LocalRuumDarkMode.current) RuumTokens.DarkEmergency else RuumTokens.Emergency,
                    contentColor = RuumTokens.White,
                    icon = { Icon(Icons.Default.Shield, null) },
                    text = { Text("Seguridad", fontWeight = FontWeight.Bold) },
                )
            }
        },
        bottomBar = {
            if (!inOverlay) {
                val sinLeer = state.notificaciones.count { it.leidaEn == null }
                RuumBottomNavigation(
                    selected = destination,
                    unreadCount = sinLeer,
                    onSelect = { destino -> destination = destino },
                )
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when {
                selectedTrip != null -> TripDetailScreen(selectedTrip!!, state, viewModel)
                showingDocuments -> DocumentsScreen(state, viewModel::uploadDocument)
                showingCertificacion -> CertificacionScreen(state, viewModel, onOpenDocuments = {
                    showingCertificacion = false
                    showingDocuments = true
                })
                showingPerfil -> ModificacionPerfilScreen(state, viewModel)
                else -> when (destination) {
                    Destination.PANEL -> PanelScreen(
                        state,
                        viewModel::setAvailability,
                        onTripSelected = { selectedTrip = it },
                        onOpenDocuments = { showingDocuments = true },
                    )
                    Destination.TRIPS -> TripsScreen(state, viewModel::requestTrip, onTripSelected = { selectedTrip = it })
                    Destination.EARNINGS -> EarningsScreen(state.payouts, state.acceptedTrips)
                    Destination.NOTIFICATIONS -> NotificacionesScreen(state, viewModel)
                    Destination.ACCOUNT -> AccountScreen(
                        documents = state.documents,
                        driverName = state.driver?.nombre.orEmpty(),
                        themePreference = themePreference,
                        onSignOut = viewModel::signOut,
                        onOpenDocuments = { showingDocuments = true },
                        onOpenCertificacion = { showingCertificacion = true },
                        onOpenPerfil = { showingPerfil = true },
                    )
                }
            }
            if (state.loading) CircularProgressIndicator(Modifier.align(Alignment.TopCenter).padding(top = RuumTokens.Space8))
        }
    }
    if (safetyDialog) AlertDialog(
        onDismissRequest = { safetyDialog = false },
        icon = { Icon(Icons.Default.Shield, null, tint = MaterialTheme.colorScheme.error) },
        title = { Text("Ayuda durante el viaje") },
        text = { Text("Si existe peligro inmediato, llama al 911. Para una incidencia operativa, contacta a soporte desde Cuenta.") },
        confirmButton = { RuumPrimaryButton("Entendido", { safetyDialog = false }) },
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun RuumTopBar(title: String, onRefresh: () -> Unit) {
    TopAppBar(
        title = {
            Column {
                Text("RUUM RUUM", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                Text(title, style = MaterialTheme.typography.titleLarge)
            }
        },
        actions = {
            IconButton(onClick = onRefresh, modifier = Modifier.size(RuumTokens.Touch)) {
                Icon(Icons.Default.Refresh, "Actualizar")
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
        ),
    )
}

@Composable
private fun RuumBottomNavigation(
    selected: Destination,
    onSelect: (Destination) -> Unit,
    unreadCount: Int = 0,
) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface, tonalElevation = 0.dp) {
        listOf(
            Triple(Destination.PANEL, Icons.Default.Home, "Inicio"),
            Triple(Destination.TRIPS, Icons.Default.DirectionsCar, "Traslados"),
            Triple(Destination.EARNINGS, Icons.Default.AttachMoney, "Ganancias"),
            Triple(Destination.NOTIFICATIONS, Icons.Default.Notifications, "Notificaciones"),
            Triple(Destination.ACCOUNT, Icons.Default.AccountCircle, "Cuenta"),
        ).forEach { (item, icon, label) ->
            NavigationBarItem(
                selected = selected == item,
                onClick = { onSelect(item) },
                icon = {
                    if (item == Destination.NOTIFICATIONS && unreadCount > 0) {
                        BadgedBox(badge = { Badge { Text("$unreadCount") } }) {
                            Icon(icon, label)
                        }
                    } else {
                        Icon(icon, label)
                    }
                },
                label = { Text(label, maxLines = 1) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.secondary,
                    selectedTextColor = MaterialTheme.colorScheme.secondary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                ),
            )
        }
    }
}

@Composable
private fun PanelScreen(
    state: DriverUiState,
    onAvailability: (Availability) -> Unit,
    onTripSelected: (Trip) -> Unit,
    onOpenDocuments: () -> Unit = {},
) {
    val available = state.availability == Availability.AVAILABLE
    val onTrip = state.availability == Availability.ON_TRIP
    val earnings = state.payouts.filter { it.estado != "revocado" }.sumOf { it.montoNeto }
    val viajeActivo = state.acceptedTrips.firstOrNull { it.estado == "traslado_en_curso" }
    var confirmarNoDisponible by remember { mutableStateOf(false) }
    val docsPendientes = DOCUMENT_REQUIREMENTS.count { requirement ->
        state.documents.none { it.tipo == requirement.type && it.esActual && it.estado == "aprobado" }
    }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Hola, ${state.driver?.nombre?.substringBefore(' ') ?: "conductor"}", style = MaterialTheme.typography.headlineLarge)
        }
        // Modelo 11.3 — alerta 15 días antes del vencimiento de licencia.
        alertaLicencia15Dias(state.driver?.licenciaVigencia).takeIf { it.activa }?.let { alerta ->
            item {
                RuumAlert(
                    alerta.mensaje.orEmpty(),
                    Modifier.fillMaxWidth(),
                    error = (alerta.dias ?: 0) < 0,
                )
            }
        }
        viajeActivo?.let { viaje ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("Traslado activo", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                    Text(
                        "${viaje.vehiculoMarca.orEmpty()} ${viaje.vehiculoModelo.orEmpty()}".trim().ifBlank { "Traslado en curso" },
                        style = MaterialTheme.typography.titleLarge,
                    )
                    RuumPrimaryButton(
                        "Continuar traslado →",
                        { onTripSelected(viaje) },
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                    )
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = if (available) successBackground() else MaterialTheme.colorScheme.surfaceVariant) {
                        Icon(
                            if (available) Icons.Default.CheckCircle else Icons.Default.Schedule,
                            null,
                            Modifier.padding(RuumTokens.Space12).size(24.dp),
                            tint = if (available) successForeground() else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
                        Text(
                            when (state.availability) {
                                Availability.AVAILABLE -> "Disponible"
                                Availability.UNAVAILABLE -> "No Disponible"
                                Availability.ON_TRIP -> "En viaje"
                            },
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            when (state.availability) {
                                Availability.AVAILABLE -> "Recibiendo solicitudes · Te avisaremos con sonido"
                                Availability.UNAVAILABLE -> "No recibirás traslados hasta activarte"
                                Availability.ON_TRIP -> "Traslado activo — disponibilidad bloqueada"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = available,
                        enabled = !onTrip,
                        onCheckedChange = {
                            if (!it) confirmarNoDisponible = true
                            else onAvailability(Availability.AVAILABLE)
                        },
                    )
                }
            }
        }
        if (viajeActivo == null) {
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    val n = state.availableTrips.size
                    Text(
                        if (available) "Traslados disponibles" else "Modo no disponible",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    Text(
                        if (n > 0) "$n traslados disponibles en tu zona" else "Sin traslados por ahora",
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        if (n > 0) "Revisa los detalles y toma el traslado que mejor se ajuste a tu ruta."
                        else "Actívate y empieza a ganar",
                        Modifier.padding(top = RuumTokens.Space4),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (!available) {
                        RuumPrimaryButton(
                            "Activarme ahora →",
                            { onAvailability(Availability.AVAILABLE) },
                            Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        )
                    }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space12)) {
                MetricCard("Ganancias del día", money(earnings), Icons.Default.AttachMoney, Modifier.weight(1f))
                MetricCard("Traslados hoy", state.acceptedTrips.size.toString(), Icons.Default.DirectionsCar, Modifier.weight(1f))
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Salud Operacional")
                Spacer(Modifier.height(RuumTokens.Space8))
                SaludRow("Documentos", if (docsPendientes == 0) "Vigentes" else "Pendientes ($docsPendientes)")
                SaludRow(
                    "Perfil",
                    if (state.driver?.estado == "activo") "Habilitado" else "En validación",
                )
                SaludRow("Conexión", "Conectado")
                if (docsPendientes > 0) {
                    RuumSecondaryButton(
                        "Ir a mi cuenta →",
                        onOpenDocuments,
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                    )
                }
            }
        }
        item {
            SectionTitle("Tu siguiente viaje", "Consulta el estado y el siguiente paso.")
            Spacer(Modifier.height(RuumTokens.Space12))
            state.acceptedTrips.firstOrNull()?.let { TripCard(it, onClick = { onTripSelected(it) }) } ?: RuumEmptyState(
                "Sin Traslados aceptados",
                "Cuando te asignen un traslado aparecerá aquí.",
                Icons.Default.DirectionsCar,
            )
        }
    }
    if (confirmarNoDisponible) AlertDialog(
        onDismissRequest = { confirmarNoDisponible = false },
        title = { Text("¿Pasas a no disponible?") },
        text = { Text("Dejarás de recibir traslados nuevos hasta que reactives tu disponibilidad.") },
        confirmButton = {
            RuumPrimaryButton("Confirmar", {
                confirmarNoDisponible = false
                onAvailability(Availability.UNAVAILABLE)
            })
        },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmarNoDisponible = false }) },
    )
}

@Composable
private fun SaludRow(etiqueta: String, valor: String) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space4),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(etiqueta, style = MaterialTheme.typography.bodyMedium)
        Text(valor, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun MetricCard(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
    RuumCard(modifier) {
        Icon(icon, null, Modifier.size(22.dp), tint = MaterialTheme.colorScheme.secondary)
        Text(label, Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.headlineSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SectionTitle(title: String, supporting: String? = null) {
    Text(title, style = MaterialTheme.typography.headlineMedium)
    supporting?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium) }
}

@Composable
private fun TripsScreen(state: DriverUiState, onRequest: (Trip) -> Unit, onTripSelected: (Trip) -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    var busqueda by remember { mutableStateOf("") }
    var ordenMayorGanancia by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        Text(
            "Traslados",
            Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            style = MaterialTheme.typography.headlineLarge,
        )
        OutlinedTextField(
            value = busqueda,
            onValueChange = { busqueda = it },
            modifier = Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20).defaultMinInputHeight(),
            placeholder = { Text("Buscar ofertas...") },
            singleLine = true,
            shape = MaterialTheme.shapes.small,
        )
        Row(
            Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            PillTab("Ofertas (${state.availableTrips.size})", tab == 0, { tab = 0 }, Modifier.weight(1f))
            PillTab("Aceptados (${state.acceptedTrips.size})", tab == 1, { tab = 1 }, Modifier.weight(1f))
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            FilterChip(
                selected = !ordenMayorGanancia,
                onClick = { ordenMayorGanancia = false },
                label = { Text("Recientes") },
                modifier = Modifier.height(RuumTokens.Touch),
            )
            FilterChip(
                selected = ordenMayorGanancia,
                onClick = { ordenMayorGanancia = true },
                label = { Text("Mayor ganancia") },
                modifier = Modifier.height(RuumTokens.Touch),
            )
        }
        val base = if (tab == 0) state.availableTrips else state.acceptedTrips
        val filtrados = base.filter { trip ->
            busqueda.isBlank() ||
                listOfNotNull(trip.origenCiudad, trip.origenDireccion, trip.destinoCiudad, trip.destinoDireccion, trip.id)
                    .joinToString(" ").contains(busqueda, ignoreCase = true)
        }.let { lista ->
            if (ordenMayorGanancia) lista.sortedByDescending { estimatedEarning(it) } else lista
        }
        if (tab == 0 && filtrados.isNotEmpty()) {
            Text(
                if (filtrados.size == 1) "1 oferta disponible" else "${filtrados.size} ofertas disponibles",
                Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        if (tab == 1 && filtrados.isNotEmpty()) {
            Text(
                if (filtrados.size == 1) "1 traslado aceptado" else "${filtrados.size} traslados aceptados",
                Modifier.padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
            if (filtrados.isEmpty()) item {
                RuumEmptyState(
                    if (busqueda.isNotBlank()) "Sin resultados con estos filtros" else "Sin traslados para este día",
                    if (busqueda.isNotBlank()) "Prueba limpiar filtros."
                    else if (tab == 0) "No hay ofertas programadas en esta fecha. Revisa otro día o cambia el orden a Mayor ganancia."
                    else "No tienes traslados aceptados para esta fecha. Acepta una oferta para verla aquí.",
                    Icons.Default.DirectionsCar,
                )
            }
            items(filtrados, key = { it.id ?: it.hashCode().toString() }) { trip ->
                if (tab == 0) {
                    OfertaCard(trip, onRequest = { onRequest(trip) }, onClick = { onTripSelected(trip) })
                } else {
                    TripCard(trip, onClick = { onTripSelected(trip) }, esAceptado = true)
                }
            }
        }
    }
}

@Composable
private fun PillTab(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(RuumTokens.Touch),
        shape = CircleShape,
        color = if (selected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surface,
        contentColor = if (selected) RuumTokens.White else MaterialTheme.colorScheme.onSurfaceVariant,
        border = if (selected) null else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(label, style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
    }
}

@Composable
private fun OfertaCard(trip: Trip, onRequest: () -> Unit, onClick: () -> Unit) {
    RuumCard(Modifier.fillMaxWidth()) {
        Box(
            Modifier.fillMaxWidth().height(3.dp).background(if (LocalRuumDarkMode.current) RuumRouteDark else RuumRouteLight),
        )
        Spacer(Modifier.height(RuumTokens.Space16))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text("Oferta disponible", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
            trip.id?.let { Text("ID ${it.take(8).uppercase()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
        Spacer(Modifier.height(RuumTokens.Space8))
        Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.headlineMedium)
        Text(
            listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString()).joinToString(" ").ifBlank { "Vehículo por confirmar" },
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.bodyLarge,
        )
        Text("Origen", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelLarge)
        Text(
            trip.origenDireccion ?: "Origen por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            trip.origenCiudad ?: "Ciudad / Municipio por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text("Destino", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
        Text(
            trip.destinoDireccion ?: "Destino por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            trip.destinoCiudad ?: "Ciudad / Municipio por confirmar",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "Inicio ${trip.creadoEn?.take(10) ?: "Por confirmar"} · " +
                "${trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Distancia por confirmar"} · " +
                "${trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Duración por confirmar"}",
            Modifier.padding(top = RuumTokens.Space8),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
            RuumPrimaryButton("Ver oferta →", onClick, Modifier.weight(1f))
        }
        RuumSecondaryButton(
            "Solicitar asignación →",
            onRequest,
            Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
        )
    }
}

@Composable
private fun TripCard(
    trip: Trip,
    onRequest: (() -> Unit)? = null,
    onClick: (() -> Unit)? = null,
    esAceptado: Boolean = false,
) {
    RuumCard(Modifier.fillMaxWidth()) {
        Box(
            Modifier.fillMaxWidth().height(3.dp).background(if (LocalRuumDarkMode.current) RuumRouteDark else RuumRouteLight),
        )
        Spacer(Modifier.height(RuumTokens.Space16))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text(
                "${trip.origenCiudad ?: "Origen"} → ${trip.destinoCiudad ?: "Destino"}",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.weight(1f).padding(end = RuumTokens.Space8),
            )
            trip.estado?.let { RuumStatusChip(if (esAceptado) "ACEPTADO · $it" else it) }
        }
        Text(
            estadoTrasladoDescripcion(trip.estado),
            Modifier.padding(top = RuumTokens.Space4),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        if (onClick != null) {
            TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
                Text(if (esAceptado) "INICIAR TRASLADO →" else "Ver detalle del traslado")
            }
        }
        Text(
            "Vehículo",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
        )
        Text(
            listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString()).joinToString(" ").ifBlank { "Vehículo por confirmar" },
            style = MaterialTheme.typography.bodyLarge,
        )
        Text(
            "Origen → Destino",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
        )
        Text(
            "${trip.origenCiudad ?: "Por confirmar"} → ${trip.destinoCiudad ?: "Por confirmar"}",
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            "${trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Distancia por confirmar"} · ${trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Duración por confirmar"}",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        Surface(
            Modifier.fillMaxWidth().padding(top = RuumTokens.Space16),
            shape = MaterialTheme.shapes.medium,
            color = successBackground(),
            contentColor = successForeground(),
        ) {
            Column(Modifier.padding(RuumTokens.Space16)) {
                Text("Ganancia estimada", style = MaterialTheme.typography.labelMedium)
                Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.headlineMedium)
            }
        }
        if (onRequest != null) {
            Spacer(Modifier.height(RuumTokens.Space16))
            RuumPrimaryButton("Solicitar viaje", onRequest, Modifier.fillMaxWidth(), leadingIcon = Icons.Default.ChevronRight)
        }
    }
}

private fun estadoTrasladoDescripcion(estado: String?): String = when (estado) {
    "pendiente_de_conductor" -> "Oferta disponible."
    "conductor_asignado" -> "Dirígete al punto de origen."
    "conductor_en_camino_al_origen" -> "Dirígete al punto de recolección."
    "conductor_en_punto_de_recoleccion", "verificacion_vehiculo_en_proceso",
    "evidencia_inicial_en_proceso", "evidencia_inicial_completada" -> "Realiza la recepción y evidencia del vehículo."
    "vehiculo_recibido", "traslado_en_curso" -> "Conduce de forma segura al destino."
    "llegada_a_destino", "evidencia_final_en_proceso" -> "Entrega la unidad y registra la evidencia final."
    "evidencia_final_completada", "entrega_confirmada", "servicio_cerrado" -> "El traslado ha sido concluido."
    "servicio_cancelado", "traslado_fallido" -> "Este traslado ya no está activo."
    else -> "Consulta el detalle para tu siguiente paso."
}

@Suppress("UnusedExpression")
@Composable
private fun TripDetailScreen(trip: Trip, state: DriverUiState, viewModel: DriverViewModel) {
    val context = LocalContext.current
    val evidenceType = when (trip.estado) {
        "evidencia_inicial_en_proceso" -> "inicial"
        "evidencia_inicial_completada", "vehiculo_recibido", "traslado_en_curso" -> null
        "evidencia_final_en_proceso" -> "final"
        else -> null
    }
    LaunchedEffect(trip.id, evidenceType) {
        val id = trip.id
        if (id != null && evidenceType != null) viewModel.loadEvidence(id, evidenceType)
    }
    val milestones = listOf(
        "conductor_asignado" to "Traslado asignado",
        "conductor_en_camino_al_origen" to "En camino al punto de recolección",
        "conductor_en_punto_de_recoleccion" to "Llegada al punto de recolección",
        "verificacion_vehiculo_en_proceso" to "Verificación del vehículo",
        "evidencia_inicial_en_proceso" to "Evidencia inicial",
        "evidencia_inicial_completada" to "Revisión inicial completada",
        "vehiculo_recibido" to "Vehículo recibido",
        "traslado_en_curso" to "Traslado en curso",
        "llegada_a_destino" to "Llegada al destino",
        "evidencia_final_en_proceso" to "Evidencia final",
        "evidencia_final_completada" to "Evidencia final completada",
        "entrega_confirmada" to "Entrega confirmada",
        "servicio_cerrado" to "Traslado cerrado",
    )
    val currentMilestone = milestones.indexOfFirst { it.first == trip.estado }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    encabezadoDetalle(trip.estado),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary,
                )
                Text(
                    "${trip.origenCiudad ?: "Origen"} → ${trip.destinoCiudad ?: "Destino"}",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.headlineMedium,
                )
                trip.estado?.let { RuumStatusChip(it) }
                trip.id?.let { Text("ID ${it.take(8).uppercase()}", Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }
        nextTripAction(trip.estado)?.let { action ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("TU PRÓXIMA ACCIÓN", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(action.second, Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    RuumPrimaryButton(
                        action.first,
                        onClick = {
                            trip.id?.let {
                                if (action.third == "confirmar_llegada_destino") viewModel.confirmDestinationArrival(it)
                                else viewModel.advanceTrip(it, action.third)
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        loading = state.loading,
                    )
                }
            }
        }
        if (evidenceType != null) {
            item {
                val tripId = trip.id
                if (tripId != null) EvidenceCaptureSection(
                    tripId = tripId,
                    type = evidenceType,
                    photos = if (state.evidenceTripId == tripId && state.evidenceType == evidenceType) state.evidencePhotos else emptyList(),
                    loading = state.evidenceLoading,
                    saving = state.evidenceSaving,
                    onCapture = { id, evidence, angle, bytes ->
                        viewModel.captureEvidence(id, evidence, angle, bytes)
                        Unit
                    },
                    onConfirm = { viewModel.confirmEvidence(tripId, evidenceType) },
                    confirming = state.loading,
                )
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Progreso del traslado")
                milestones.forEachIndexed { index, (_, label) ->
                    val reached = currentMilestone >= 0 && index <= currentMilestone
                    Row(
                        Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            if (reached) Icons.Default.CheckCircle else Icons.Default.Schedule,
                            contentDescription = null,
                            tint = if (reached) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp),
                        )
                        Text(
                            label,
                            Modifier.padding(start = RuumTokens.Space12),
                            color = if (reached) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
                if (currentMilestone < 0) {
                    Text(
                        "El detalle operativo de este estado aparecerá cuando el traslado sea asignado.",
                        Modifier.padding(top = RuumTokens.Space12),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("VEHÍCULO A TRASLADAR")
                Text(
                    listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString())
                        .joinToString(" ").ifBlank { "Vehículo por confirmar" },
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.titleMedium,
                )
                trip.vehiculoTipo?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("PUNTO DE RECOLECCIÓN")
                DetailRow("Dirección", trip.origenDireccion ?: trip.origenCiudad ?: "Origen por confirmar")
                val origin = listOfNotNull(trip.origenDireccion, trip.origenCiudad).joinToString(", ")
                if (origin.isNotBlank()) {
                    RuumSecondaryButton(
                        "NAVEGAR AL ORIGEN",
                        onClick = { abrirMapa(context, origin) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                SectionTitle("PUNTO DE ENTREGA")
                DetailRow("Dirección", trip.destinoDireccion ?: trip.destinoCiudad ?: "Destino por confirmar")
                val destination = listOfNotNull(trip.destinoDireccion, trip.destinoCiudad).joinToString(", ")
                if (destination.isNotBlank()) {
                    RuumSecondaryButton(
                        "NAVEGAR AL DESTINO",
                        onClick = { abrirMapa(context, destination) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                DetailRow("Distancia total", trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Por confirmar")
                DetailRow("Tiempo estimado", trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Por confirmar")
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Ganancia Neta Conductor")
                Text("Tarifa base garantizada + bonos operativos", Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(money(estimatedEarning(trip)), Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
            }
        }
    }
}

private fun encabezadoDetalle(estado: String?): String = when (estado) {
    "evidencia_final_completada", "entrega_confirmada", "servicio_cerrado" -> "Cierre de Traslado"
    "pendiente_de_conductor" -> "DETALLES DEL TRASLADO"
    "servicio_cancelado", "traslado_fallido" -> "Traslado concluido o cancelado"
    else -> "TRASLADO ACTIVO"
}

private fun nextTripAction(state: String?): Triple<String, String, String>? = when (state) {
    "conductor_asignado" -> Triple("ESTOY EN CAMINO AL ORIGEN →", "Prepárate para salir. Revisa la información del vehículo y el contacto.", "conductor_en_camino")
    "conductor_en_camino_al_origen" -> Triple("HE LLEGADO AL ORIGEN", "Navega hacia el punto de recolección y registra tu llegada.", "llegada_origen")
    "conductor_en_punto_de_recoleccion" -> Triple("INICIAR INSPECCIÓN Y EVIDENCIA", "Localiza la unidad e inicia la inspección del vehículo.", "iniciar_verificacion")
    "verificacion_vehiculo_en_proceso" -> Triple("CONTINUAR INSPECCIÓN", "Completa las fotos y checklist de recolección.", "iniciar_evidencia_inicial")
    "evidencia_inicial_completada" -> Triple("INICIAR TRAYECTO AL DESTINO →", "El registro inicial está completo. Inicia el trayecto.", "vehiculo_recibido")
    "vehiculo_recibido" -> Triple("INICIAR TRAYECTO AL DESTINO →", "Confirma el inicio del trayecto.", "iniciar_traslado")
    "traslado_en_curso" -> Triple("HE LLEGADO AL DESTINO", "Conduce con precaución hacia el punto de entrega.", "confirmar_llegada_destino")
    "llegada_a_destino" -> Triple("INICIAR EVIDENCIA DE ENTREGA", "Registra las fotografías finales del vehículo.", "iniciar_evidencia_final")
    "evidencia_final_completada" -> Triple("SÍ, ENTREGAR", "Confirma la entrega con evidencia completa.", "confirmar_entrega")
    "entrega_confirmada" -> Triple("FINALIZAR Y ENTREGAR VEHÍCULO", "Finaliza el flujo del traslado.", "cerrar_viaje")
    else -> null
}

@Composable
private fun EvidenceCaptureSection(
    tripId: String,
    type: String,
    photos: List<EvidencePhoto>,
    loading: Boolean,
    saving: Boolean,
    confirming: Boolean,
    onCapture: (String, String, String, ByteArray) -> Unit,
    onConfirm: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedAngle by remember { mutableStateOf<String?>(null) }
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var photoFile by remember { mutableStateOf<File?>(null) }
    var captureError by remember { mutableStateOf<String?>(null) }
    val required = listOf(
        Triple("frente", "Frente", "Defensa + placas centradas, a 1.5 m"),
        Triple("lado_piloto", "Lado piloto", "De espejo a defensa, placa legible"),
        Triple("lado_copiloto", "Lado copiloto", "De espejo a defensa, placa legible"),
        Triple("trasera", "Trasera", "Cajuela + defensa, placa legible"),
        Triple("tablero", "Tablero", "Odómetro sin reflejo"),
    )
    val optional = if (type == "final") "dano_previo" to "Daño visible (opcional)" else null
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { captured ->
        val uri = photoUri
        val angle = selectedAngle
        val file = photoFile
        photoUri = null
        photoFile = null
        selectedAngle = null
        if (captured && uri != null && angle != null) {
            scope.launch {
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { compressEvidence(it.readBytes()) }
                }
                if (bytes == null || bytes.isEmpty()) captureError = "No se pudo leer la fotografía. Intenta capturarla de nuevo."
                else onCapture(tripId, type, angle, bytes)
                file?.delete()
            }
        } else file?.delete()
    }
    val savedAngles = photos.filter { it.sincronizada }.map { it.angulo }.toSet()
    val complete = required.all { it.first in savedAngles }

    RuumCard(Modifier.fillMaxWidth()) {
        SectionTitle(
            if (type == "inicial") "Checklist de Origen" else "Checklist de Destino",
            if (type == "inicial") "Verificación y evidencia de salida" else "Verificación y evidencia de entrega",
        )
        Text(
            "FOTOGRAFÍAS DEL VEHÍCULO · ${savedAngles.size}/5 fotos",
            Modifier.padding(top = RuumTokens.Space8),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.secondary,
        )
        if (loading) {
            CircularProgressIndicator(Modifier.padding(top = RuumTokens.Space12))
        } else {
            required.forEach { (angle, label, guia) ->
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(label, style = MaterialTheme.typography.titleSmall)
                        Text(
                            if (angle in savedAngles) "Foto capturada, toca para reemplazar" else "Toca para capturar fotografía",
                            color = if (angle in savedAngles) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Text(guia, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    }
                    RuumSecondaryButton(
                        if (angle in savedAngles) "Repetir foto" else "Tomar foto",
                        onClick = {
                            runCatching {
                                val directory = File(context.cacheDir, "evidence").apply { mkdirs() }
                                val file = File.createTempFile("ruum-evidence-", ".jpg", directory)
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                                selectedAngle = angle
                                photoFile = file
                                photoUri = uri
                                camera.launch(uri)
                            }.onFailure { captureError = "No se pudo abrir la cámara. Revisa que haya una app de cámara disponible." }
                        },
                        enabled = !saving,
                    )
                }
            }
            optional?.let { (angle, label) ->
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(label, style = MaterialTheme.typography.titleSmall)
                        Text(
                            if (angle in savedAngles) "Fotografía guardada" else "Solo si detectas daño",
                            color = if (angle in savedAngles) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    RuumSecondaryButton(
                        if (angle in savedAngles) "Repetir" else "Capturar",
                        onClick = {
                            runCatching {
                                val directory = File(context.cacheDir, "evidence").apply { mkdirs() }
                                val file = File.createTempFile("ruum-evidence-", ".jpg", directory)
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                                selectedAngle = angle
                                photoFile = file
                                photoUri = uri
                                camera.launch(uri)
                            }.onFailure { captureError = "No se pudo abrir la cámara. Revisa que haya una app de cámara disponible." }
                        },
                        enabled = !saving,
                    )
                }
            }
            captureError?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), error = true) }
            val faltantes = required.map { it.first }.filter { it !in savedAngles }
            if (faltantes.isNotEmpty()) {
                Text(
                    "Faltan fotografías obligatorias: ${faltantes.joinToString(", ")}.",
                    Modifier.padding(top = RuumTokens.Space12),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Text(
                "Toca para capturar · “PENDIENTE” se sincroniza sola. Si la foto sale borrosa u oscura, repítela a 1–2 m con el teléfono firme.",
                Modifier.padding(top = RuumTokens.Space12),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            RuumPrimaryButton(
                if (confirming) "Enviando…" else if (complete) "Finalizar evidencias ✓" else "Finalizar evidencias (${savedAngles.size}/5)",
                onClick = onConfirm,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                enabled = complete && !saving,
                loading = confirming,
            )
        }
    }
}

private fun compressEvidence(bytes: ByteArray): ByteArray {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return bytes
    val longest = maxOf(bounds.outWidth, bounds.outHeight)
    val sample = Integer.highestOneBit((longest / 1600).coerceAtLeast(1))
    val bitmap = BitmapFactory.decodeByteArray(
        bytes,
        0,
        bytes.size,
        BitmapFactory.Options().apply { inSampleSize = sample },
    ) ?: return bytes
    val scale = minOf(1f, 1600f / maxOf(bitmap.width, bitmap.height))
    val resized = if (scale < 1f) bitmap.scale((bitmap.width * scale).toInt(), (bitmap.height * scale).toInt()) else bitmap
    return ByteArrayOutputStream().use { output ->
        resized.compress(Bitmap.CompressFormat.JPEG, 82, output)
        if (resized !== bitmap) bitmap.recycle()
        resized.recycle()
        output.toByteArray()
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Column(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

@SuppressLint("QueryPermissionsNeeded")
private fun abrirMapa(context: Context, direccion: String) {
    val intent = Intent(Intent.ACTION_VIEW, "geo:0,0?q=${Uri.encode(direccion)}".toUri())
    if (intent.resolveActivity(context.packageManager) != null) context.startActivity(intent)
}

@Composable
private fun EarningsScreen(payouts: List<Payout>, trips: List<Trip>) {
    val total = totalDeposited(payouts)
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            Text("Mis ganancias y pagos", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Evidencia financiera de cada traslado. Trazabilidad y cierre documentado.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Depósito acumulado", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                Text(money(total), style = MaterialTheme.typography.displayLarge)
                if (trips.isNotEmpty()) {
                    RuumAlert("${trips.size} viaje(s) siguen en proceso y aún no forman parte del depósito.", Modifier.fillMaxWidth().padding(top = RuumTokens.Space16))
                }
            }
        }
        item { SectionTitle("Desglose por viaje", "${trips.size} traslado(s)") }
        if (trips.isEmpty()) item {
            RuumEmptyState(
                "Aún no hay ganancias registradas",
                "Completa tu primer traslado para comenzar a acumular ganancias. Al finalizar cada viaje, verás aquí el desglose detallado y el estatus de tu depósito bancario.",
                Icons.Default.AttachMoney,
            )
        }
        items(trips, key = { it.id ?: it.hashCode().toString() }) { trip ->
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo).joinToString(" ").ifBlank { "Vehículo por confirmar" },
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    "${trip.origenCiudad ?: "Origen"} ➔ ${trip.destinoCiudad ?: "Destino"}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Ganancia", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                    Text(money(estimatedEarning(trip)), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                }
                trip.estado?.let { RuumStatusChip(it) }
            }
        }
        item { SectionTitle("Depósitos del periodo") }
        if (payouts.isEmpty()) item {
            Text("No hay depósitos en este periodo.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(payouts, key = { it.id }) { payout -> PayoutCard(payout) }
    }
}

@Composable
private fun NotificacionesScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) { viewModel.loadNotificaciones() }
    var filtro by remember { mutableIntStateOf(0) }
    val sinLeer = state.notificaciones.filter { it.leidaEn == null }
    val leidas = state.notificaciones.filter { it.leidaEn != null }
    val visibles = when (filtro) {
        1 -> sinLeer
        2 -> leidas
        else -> state.notificaciones
    }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Notificaciones y Avisos", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Tus avisos y alertas operativas permanecen guardados en este centro.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Filtro de notificaciones",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (sinLeer.isNotEmpty()) {
                    TextButton(onClick = viewModel::marcarNotificacionesLeidas) {
                        Text("✓ Marcar todas como leídas")
                    }
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                PillTab("Todas (${state.notificaciones.size})", filtro == 0, { filtro = 0 }, Modifier.weight(1f))
                PillTab("Sin leer (${sinLeer.size})", filtro == 1, { filtro = 1 }, Modifier.weight(1f))
                PillTab("Leídas (${leidas.size})", filtro == 2, { filtro = 2 }, Modifier.weight(1f))
            }
        }
        if (visibles.isEmpty()) item {
            RuumEmptyState(
                "¡Todo al día!",
                "No tienes avisos pendientes por leer. Aquí aparecerán tus próximos avisos de servicio, ganancias y alertas operativas.",
                Icons.Default.Notifications,
            )
        }
        items(visibles, key = { it.id }) { aviso ->
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        aviso.tipo.replace('_', ' ').replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    if (aviso.leidaEn == null) RuumStatusChip("Nueva")
                }
                Text(aviso.titulo, Modifier.padding(top = RuumTokens.Space4), style = MaterialTheme.typography.titleMedium)
                Text(aviso.cuerpo, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                aviso.creadoEn?.let {
                    Text(it.take(10), Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun PayoutCard(payout: Payout) {
    RuumCard(Modifier.fillMaxWidth()) {
        Text("Periodo Operativo", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
        Text("${payout.periodoInicio.take(10)} ➔ ${payout.periodoFin.take(10)}", style = MaterialTheme.typography.titleMedium)
        Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Monto Neto", style = MaterialTheme.typography.bodyMedium)
            Text(money(payout.montoNeto), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
        DetailRow("Monto Bruto", money(payout.montoBruto))
        DetailRow("Ajustes", money(payout.ajustes))
        payout.referenciaPago?.let { DetailRow("SPEI", it) }
        RuumStatusChip(payout.estado)
    }
}

@Composable
private fun AccountScreen(
    documents: List<DriverDocument>,
    driverName: String,
    themePreference: RuumThemePreference,
    onSignOut: () -> Unit,
    onOpenDocuments: () -> Unit,
    onOpenCertificacion: () -> Unit,
    onOpenPerfil: () -> Unit,
) {
    var confirmSignOut by remember { mutableStateOf(false) }
    var mostrarSoporte by remember { mutableStateOf(false) }
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            Text("Cuenta", style = MaterialTheme.typography.headlineLarge)
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(R.drawable.ruum_logo_avatar),
                        contentDescription = "Ruum Ruum",
                        modifier = Modifier.size(56.dp).clip(CircleShape),
                    )
                    Column(Modifier.padding(start = RuumTokens.Space12)) {
                        Text(driverName, style = MaterialTheme.typography.titleLarge)
                        Text("Conductor certificado", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                RuumPrimaryButton("Ver mi certificación", onOpenCertificacion, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12))
            }
        }
        item {
            Text(
                "Gestión Operativa",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                CuentaFila("Perfil", "Datos personales y contacto de emergencia.", onOpenPerfil)
                CuentaFila("Documentos", "Licencia, identificación y vigencia.", onOpenDocuments)
                val current = documents.filter { it.esActual }.distinctBy { it.tipo }
                Text(
                    "${current.size} tipo(s) de documento registrados",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        item {
            Text(
                "Ajustes de Cuenta",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Apariencia y Visualización", "Modo de Pantalla (Tema)")
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    ThemeChip("Sistema", Icons.Default.Sync, RuumThemeMode.SYSTEM, themePreference, Modifier.weight(1f))
                    ThemeChip("Claro", Icons.Default.LightMode, RuumThemeMode.LIGHT, themePreference, Modifier.weight(1f))
                    ThemeChip("Oscuro", Icons.Default.DarkMode, RuumThemeMode.DARK, themePreference, Modifier.weight(1f))
                }
            }
        }
        item {
            Text(
                "Ayuda y Legal",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(RuumTokens.Space8))
            RuumCard(Modifier.fillMaxWidth()) {
                CuentaFila("Soporte", "WhatsApp 24/7 y ayuda en ruta.") { mostrarSoporte = true }
                CuentaFila("Marco Legal", "Términos y aviso de privacidad.") { }
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Cerrar Sesión Activa")
                Text(
                    "Saldrás de tu cuenta en este dispositivo. Deberás iniciar sesión para operar.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                RuumSecondaryButton("Cerrar sesión", { confirmSignOut = true }, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12))
            }
        }
    }
    if (confirmSignOut) AlertDialog(
        onDismissRequest = { confirmSignOut = false },
        title = { Text("¿Cerrar sesión?") },
        text = { Text("Saldrás de tu cuenta de conductor en este dispositivo.") },
        confirmButton = { RuumPrimaryButton("Sí, cerrar sesión", onSignOut) },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmSignOut = false }) },
    )
    if (mostrarSoporte) AlertDialog(
        onDismissRequest = { mostrarSoporte = false },
        title = { Text("Centro de Soporte") },
        text = { Text("Canales oficiales de asistencia operativa, ayuda en ruta y gestión de tu cuenta. Si tienes un viaje en curso o alguna eventualidad, usa el botón Seguridad durante el traslado.") },
        confirmButton = { RuumPrimaryButton("Entendido", { mostrarSoporte = false }) },
    )
}

@Composable
private fun CuentaFila(titulo: String, descripcion: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space8),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
            Text(titulo, style = MaterialTheme.typography.titleMedium)
            Text(descripcion, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        IconButton(onClick = onClick, modifier = Modifier.size(RuumTokens.Touch)) {
            Icon(Icons.Default.ChevronRight, "Abrir $titulo")
        }
    }
}

private data class DocumentRequirement(val type: String, val label: String, val description: String, val required: Boolean)

private val DOCUMENT_REQUIREMENTS = listOf(
    DocumentRequirement("licencia_frente", "Licencia - Frente", "Fotografía clara del frente de tu licencia vigente.", true),
    DocumentRequirement("licencia_reverso", "Licencia - Reverso", "Fotografía clara del reverso de tu licencia vigente.", true),
    DocumentRequirement("identificacion_oficial", "Identificación Oficial (INE / Pasaporte)", "Identificación oficial vigente por ambos lados o pasaporte.", true),
    DocumentRequirement("constancia_situacion_fiscal", "Constancia de Situación Fiscal (SAT)", "Constancia actualizada del SAT en archivo PDF o imagen legible.", true),
    DocumentRequirement("documento_operativo", "Comprobante de domicilio", "Recibo reciente (luz, agua, predial) que acredite tu domicilio registrado.", true),
)

@Composable
private fun DocumentsScreen(state: DriverUiState, onUpload: (String, String, String, ByteArray) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedType by remember { mutableStateOf<String?>(null) }
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var photoFile by remember { mutableStateOf<File?>(null) }
    var localError by remember { mutableStateOf<String?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        val type = selectedType
        selectedType = null
        if (uri != null && type != null) {
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            scope.launch { uploadSelectedDocument(context, uri, type, onUpload) { localError = it } }
        }
    }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { captured ->
        val type = selectedType
        val uri = photoUri
        photoUri = null
        selectedType = null
        if (captured && uri != null && type != null) {
            scope.launch { uploadSelectedDocument(context, uri, type, onUpload) { localError = it } }
        }
        photoFile?.delete()
        photoFile = null
    }
    val today = LocalDate.now()
    val diasLicencia = state.driver?.licenciaVigencia?.let { com.moviliax.ruumruum.conductor.domain.diasParaVencerLicencia(it, today) }
    val licenseExpired = (diasLicencia ?: 0) < 0
    val licensePorVencer = diasLicencia != null && diasLicencia in 0..30
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text(
                    "Expediente digital del Conductor",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text("Documentos requeridos para operar", style = MaterialTheme.typography.titleLarge)
                Text(
                    "Los documentos bloqueantes deben estar vigentes para recibir traslados.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "Formatos JPG, PNG, WEBP o PDF hasta 10 MB.",
                    Modifier.padding(top = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        localError?.let { message -> item { RuumAlert(message, Modifier.fillMaxWidth(), error = true) } }
        val pendientes = DOCUMENT_REQUIREMENTS.filter { requirement ->
            val document = state.documents.filter { it.tipo == requirement.type && it.esActual }.maxByOrNull { it.version }
            document?.estado != "aprobado"
        }
        if (pendientes.any { it.required }) {
            item {
                RuumAlert(
                    "Atención requerida y pendientes · Bloquea recepción de Traslados",
                    Modifier.fillMaxWidth(),
                    error = true,
                )
            }
        }
        items(DOCUMENT_REQUIREMENTS, key = { it.type }) { requirement ->
            val document = state.documents.filter { it.tipo == requirement.type && it.esActual }.maxByOrNull { it.version }
            val esLicencia = requirement.type.startsWith("licencia_")
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                        Text(requirement.label, style = MaterialTheme.typography.titleMedium)
                        Text(requirement.description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    RuumStatusChip(documentStatus(document, esLicencia && licenseExpired, esLicencia && licensePorVencer))
                }
                if (document != null) {
                    Text("Archivo registrado", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(document.nombreArchivo, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Versión ${document.version}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    if (document.estado == "rechazado") {
                        (document.motivoRechazo ?: document.notasAdmin)?.let {
                            Text(
                                "Motivo de rechazo por operación:",
                                Modifier.padding(top = RuumTokens.Space8),
                                style = MaterialTheme.typography.labelLarge,
                            )
                            RuumAlert(it, Modifier.fillMaxWidth(), error = true)
                        }
                    }
                } else {
                    Text("— Sin registrar", Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text("Bloqueante", Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                Text(
                    "Captura o selecciona el nuevo archivo para actualizar",
                    Modifier.padding(top = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    RuumSecondaryButton("📸 Tomar foto con cámara", onClick = {
                        runCatching {
                            val directory = File(context.cacheDir, "documents").apply { mkdirs() }
                            val file = File.createTempFile("ruum-document-", ".jpg", directory)
                            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                            selectedType = requirement.type
                            photoFile = file
                            photoUri = uri
                            camera.launch(uri)
                        }.onFailure { localError = "No se pudo abrir la cámara." }
                    }, Modifier.weight(1f), enabled = state.uploadingDocumentType == null)
                    RuumPrimaryButton("📁 Subir imagen o PDF", onClick = {
                        selectedType = requirement.type
                        picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf"))
                    }, Modifier.weight(1f), enabled = state.uploadingDocumentType == null, loading = state.uploadingDocumentType == requirement.type)
                }
            }
        }
        val aprobados = DOCUMENT_REQUIREMENTS.filter { requirement ->
            state.documents.any { it.tipo == requirement.type && it.esActual && it.estado == "aprobado" }
        }
        if (aprobados.isNotEmpty()) {
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    Text("Documentos Aprobados (${aprobados.size})", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Puedes subir una nueva versión cuando renueves tu documento.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

private suspend fun uploadSelectedDocument(
    context: Context,
    uri: Uri,
    type: String,
    onUpload: (String, String, String, ByteArray) -> Unit,
    onError: (String) -> Unit,
) = withContext(Dispatchers.IO) {
    runCatching {
        val mime = context.contentResolver.getType(uri) ?: error("No pudimos identificar el formato del archivo.")
        require(mime in setOf("image/jpeg", "image/png", "image/webp", "application/pdf")) { "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }
        val name = context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val column = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (column >= 0 && cursor.moveToFirst()) cursor.getString(column) else null
        } ?: "${type}.${if (mime == "application/pdf") "pdf" else mime.substringAfter('/') }"
        val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            var total = 0
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                total += read
                require(total <= 10 * 1024 * 1024) { "El archivo supera el límite de 10 MB." }
                output.write(buffer, 0, read)
            }
            output.toByteArray()
        } ?: error("No se pudo leer el archivo.")
        onUpload(type, name, mime, bytes)
    }.onFailure { onError(it.message ?: "No pudimos leer el archivo seleccionado.") }
}

private fun documentStatus(document: DriverDocument?, licenseExpired: Boolean, licensePorVencer: Boolean = false): String = when {
    licenseExpired -> "Vencido"
    document == null -> "Falta documento"
    document.estado == "rechazado" -> "Rechazado"
    document.estado == "aprobado" && licensePorVencer -> "Por vencer"
    document.estado == "aprobado" -> "Aprobado"
    document.estado == "en_revision" -> "En revisión"
    else -> "Cargado"
}

@Composable
private fun ThemeChip(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    mode: RuumThemeMode,
    preference: RuumThemePreference,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = preference.mode == mode,
        onClick = { preference.update(mode) },
        label = { Text(label, maxLines = 1) },
        leadingIcon = { Icon(icon, null, Modifier.size(18.dp)) },
        modifier = modifier.height(RuumTokens.Touch),
    )
}

@Composable
private fun DocumentCard(document: DriverDocument) {
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                Text(document.tipo.replace('_', ' '), style = MaterialTheme.typography.titleMedium)
                Text(document.nombreArchivo, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            RuumStatusChip(document.estado)
        }
        document.motivoRechazo?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), error = true) }
    }
}

@Composable
private fun SupportRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, description: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space8), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
        Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space12)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun successBackground() = if (LocalRuumDarkMode.current) RuumTokens.DarkSuccessBg else RuumTokens.SuccessBg

@Composable
private fun successForeground() = if (LocalRuumDarkMode.current) RuumTokens.DarkSuccessText else RuumTokens.SuccessText

private fun money(value: Double): String =
    NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-MX")).format(value)

// —─ Registro de cuenta —─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─

@Composable
private fun RegistroScreen(
    loading: Boolean,
    error: String?,
    onCrear: (String, String, String) -> Unit,
    onVolver: () -> Unit,
) {
    var telefono by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    val passOk = password.length >= 8 &&
        password.any(Char::isLowerCase) && password.any(Char::isUpperCase) && password.any(Char::isDigit)
    val emailOk = android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()
    val valido = telefono.length == 10 && emailOk && passOk && password == confirm
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            RuumLogo(Modifier.size(120.dp), darkVariant = true)
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Registro de conductor", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Crea tu cuenta para poder iniciar sesión.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = telefono,
                    onValueChange = { telefono = it.filter(Char::isDigit).take(10) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Teléfono móvil") },
                    placeholder = { Text("(55) 1234-5678") },
                    supportingText = { Text("Formato estándar 10 dígitos (ej. (55) 1234-5678).") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo electrónico") },
                    placeholder = { Text("conductor@ejemplo.com") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = password, onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Crea tu contraseña") },
                    placeholder = { Text("Ingresa tu contraseña") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                Spacer(Modifier.height(RuumTokens.Space8))
                Text("Requisitos de contraseña:", style = MaterialTheme.typography.labelLarge)
                RequisitoRow("Mínimo 8 caracteres", password.length >= 8)
                RequisitoRow("Al menos un número (0-9)", password.any(Char::isDigit))
                RequisitoRow("Al menos una letra mayúscula (A-Z)", password.any(Char::isUpperCase))
                Spacer(Modifier.height(RuumTokens.Space12))
                OutlinedTextField(
                    value = confirm, onValueChange = { confirm = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Confirma tu contraseña") },
                    placeholder = { Text("Repite tu contraseña") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                    visualTransformation = PasswordVisualTransformation(),
                )
                Text(
                    "Tus datos personales y contraseña se transmiten y almacenan con cifrado de grado bancario (SSL/TLS).",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = "Crear cuenta y continuar",
                    onClick = { onCrear(email.trim(), password, telefono) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = valido,
                    loading = loading,
                )
                TextButton(onClick = onVolver, modifier = Modifier.fillMaxWidth()) {
                    Text("¿Ya tienes cuenta? Inicia sesión")
                }
            }
        }
    }
}

@Composable
private fun RequisitoRow(texto: String, cumplido: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(if (cumplido) "✓" else "○", color = MaterialTheme.colorScheme.secondary)
        Text(texto, Modifier.padding(start = RuumTokens.Space8), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun OtpScreen(
    email: String,
    loading: Boolean,
    error: String?,
    onConfirmar: (String) -> Unit,
    onReenviar: () -> Unit,
    onVolver: () -> Unit,
) {
    var codigo by remember { mutableStateOf("") }
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Confirma tu correo", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Enviamos un código de 6 dígitos a $email. Escríbelo aquí para activar tu cuenta y subir tus documentos sin salir de la app.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = codigo,
                    onValueChange = { codigo = it.filter(Char::isDigit).take(6) },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Código de verificación") },
                    supportingText = { Text("Revisa también tu carpeta de spam o promociones.") },
                    singleLine = true, shape = MaterialTheme.shapes.small,
                )
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                Spacer(Modifier.height(RuumTokens.Space20))
                RuumPrimaryButton(
                    text = if (loading) "Verificando…" else "Confirmar y activar",
                    onClick = { onConfirmar(codigo) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = codigo.length == 6,
                    loading = loading,
                )
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    TextButton(onClick = onReenviar) { Text("Reenviar código") }
                    TextButton(onClick = onVolver) { Text("Volver") }
                }
            }
        }
    }
}

// —─ Recuperación de acceso —─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─

@Composable
private fun RecuperacionScreen(
    loading: Boolean,
    error: String?,
    notice: String?,
    onEnviar: (String) -> Unit,
    onConfirmar: (String, String, String) -> Unit,
    onVolver: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var codigo by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var enviado by remember { mutableStateOf(false) }
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Recuperar contraseña", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Escribe el correo con el que te registraste y te enviamos un enlace seguro.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space16))
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo electrónico") }, singleLine = true, shape = MaterialTheme.shapes.small,
                )
                if (!enviado) {
                    Spacer(Modifier.height(RuumTokens.Space16))
                    RuumPrimaryButton(
                        text = "Enviar enlace",
                        onClick = { onEnviar(email.trim()); enviado = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches(),
                        loading = loading,
                    )
                } else {
                    Text(
                        "Correo enviado a $email. Revisa tu bandeja incluyendo spam. En esta app confirma con el código y define tu nueva contraseña.",
                        Modifier.padding(top = RuumTokens.Space12),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    OutlinedTextField(
                        value = codigo,
                        onValueChange = { codigo = it.filter(Char::isDigit).take(6) },
                        modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                        label = { Text("Código de verificación") },
                        singleLine = true, shape = MaterialTheme.shapes.small,
                    )
                    Spacer(Modifier.height(RuumTokens.Space12))
                    OutlinedTextField(
                        value = password, onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                        label = { Text("Nueva contraseña") },
                        placeholder = { Text("Mínimo 8 caracteres") },
                        singleLine = true, shape = MaterialTheme.shapes.small,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                    Spacer(Modifier.height(RuumTokens.Space16))
                    RuumPrimaryButton(
                        text = "Guardar nueva contraseña",
                        onClick = { onConfirmar(email.trim(), codigo, password) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = codigo.length == 6 && password.length >= 8,
                        loading = loading,
                    )
                }
                if (error != null) RuumAlert(error, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16), error = true)
                if (notice != null) RuumAlert(notice, Modifier.fillMaxWidth().padding(top = RuumTokens.Space16))
                TextButton(onClick = onVolver, modifier = Modifier.fillMaxWidth()) {
                    Text("← Volver al inicio de sesión")
                }
            }
        }
    }
}

// —─ Asistente de registro (solicitud de conductor) —─—─—─—─—─—─

private fun JsonObject.str(key: String): String =
    (this[key] as? JsonPrimitive)?.contentOrNull.orEmpty()

private fun telefonoE164Mx(raw: String): String {
    val d = raw.filter(Char::isDigit)
    if (d.startsWith("52") && d.length > 10) return "+$d"
    if (d.length == 10) return "+52$d"
    return if (raw.trim().startsWith("+")) raw.trim() else "+$d"
}

@Composable
private fun RegistroWizardScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) {
        if (state.solicitud == null) viewModel.loadOrStartSolicitud()
    }
    var paso by remember { mutableIntStateOf(0) }
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
    var aceptaTerminos by remember { mutableStateOf(false) }
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
        paso = ((sol.pasoActual - 1).coerceIn(0, 3))
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

    val titulos = listOf("Cuenta", "Identidad y domicilio", "Licencia", "Documentos", "Revisión y envío")
    Scaffold(
        topBar = {
            RuumTopBar("Registro de conductor", viewModel::loadOrStartSolicitud)
        },
    ) { padding ->
        LazyColumn(
            Modifier.padding(padding).fillMaxSize(),
            contentPadding = PaddingValues(RuumTokens.Space20),
            verticalArrangement = Arrangement.spacedBy(RuumTokens.Space12),
        ) {
            item {
                Text(
                    "Paso ${paso + 2} de 5 — ${titulos[paso + 1]}",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
                if (state.solicitud != null) {
                    Text(
                        "Expediente ${state.solicitud.estado.replace('_', ' ')} · tu avance se guarda automáticamente.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (state.error != null) item { RuumAlert(state.error, Modifier.fillMaxWidth(), error = true) }
            if (state.notice != null) item { RuumAlert(state.notice, Modifier.fillMaxWidth()) }
            when (paso) {
                0 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            WizardField("Nombre(s)", nombre) { nombre = it }
                            WizardField("Apellidos", apellidos) { apellidos = it }
                            WizardField("CURP (18 caracteres)", curp) {
                                curp = it.uppercase().take(18)
                            }
                            WizardField("Teléfono (10 dígitos)", telefono) {
                                telefono = it.filter(Char::isDigit).take(10)
                            }
                            WizardField("Código postal", codigoPostal) {
                                codigoPostal = it.filter(Char::isDigit).take(5)
                            }
                            WizardField("Estado", estadoMx) { estadoMx = it }
                            WizardField("Ciudad o municipio", ciudad) { ciudad = it }
                            WizardField("Colonia", colonia) { colonia = it }
                            WizardField("Calle", calle) { calle = it }
                            WizardField("Número", numero) { numero = it }
                            WizardField("Referencias", referencias) { referencias = it }
                            WizardField("Contacto de emergencia · nombre", contactoNombre) {
                                contactoNombre = it
                            }
                            WizardField("Contacto de emergencia · teléfono", contactoTelefono) {
                                contactoTelefono = it.filter(Char::isDigit).take(10)
                            }
                        }
                    }
                }
                1 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            WizardField("Número de licencia", numeroLicencia) {
                                numeroLicencia = it
                            }
                            WizardField("Tipo y categoría de licencia", tipoLicencia) {
                                tipoLicencia = it
                            }
                            WizardField("Vigencia (AAAA-MM-DD)", vigenciaLicencia) {
                                vigenciaLicencia = it.take(10)
                            }
                            CheckRow(
                                "Autorizo la verificación de antecedentes penales e infracciones de conducción, y el tratamiento de mis datos biométricos y de geolocalización para Didit.",
                                autoriza,
                            ) { autoriza = it }
                            CheckRow(
                                "Declaro no tener suspensiones vigentes de licencia ni procesos legales activos relacionados con el manejo.",
                                declara,
                            ) { declara = it }
                            CheckRow("Acepto los términos del servicio.", aceptaTerminos) {
                                aceptaTerminos = it
                            }
                            CheckRow("Confirmo que leí el aviso de privacidad.", confirmaPrivacidad) {
                                confirmaPrivacidad = it
                            }
                        }
                    }
                }
                2 -> {
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            Text("Sube tus documentos", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Licencia (frente y reverso) e identificación oficial son obligatorios. Formatos JPG, PNG, WEBP o PDF hasta 10 MB.",
                                Modifier.padding(top = RuumTokens.Space4),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    listOf(
                        Triple("licencia_frente", "Foto de tu licencia (frente)", "Fotografía clara del frente de tu licencia vigente."),
                        Triple("licencia_reverso", "Foto de tu licencia (reverso)", "Fotografía clara del reverso de tu licencia vigente."),
                        Triple("identificacion_oficial", "Foto de tu Identificación oficial (INE/pasaporte)", "Identificación oficial vigente."),
                        Triple("constancia_situacion_fiscal", "Constancia de Situación Fiscal (SAT)", "Constancia actualizada del SAT en archivo PDF o imagen legible."),
                    ).forEach { (tipo, etiqueta, descripcion) ->
                        item {
                            WizardDocumentRow(
                                state = state,
                                viewModel = viewModel,
                                type = tipo,
                                label = etiqueta,
                                description = descripcion,
                            )
                        }
                    }
                }
                else -> {
                    if (state.solicitud?.estado == "en_revision") {
                        item {
                            RuumCard(Modifier.fillMaxWidth()) {
                                Text("Solicitud en revisión", style = MaterialTheme.typography.titleLarge)
                                Text(
                                    "Tu cuenta está pendiente de validación. Cuando la revisión esté completa, podrás consultar y aceptar Traslados.",
                                    Modifier.padding(top = RuumTokens.Space4),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                    item {
                        RuumCard(Modifier.fillMaxWidth()) {
                            Text("Revisa tu información", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Verifica que todo sea correcto antes de enviar tu registro.",
                                Modifier.padding(top = RuumTokens.Space4),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text("Cuenta", Modifier.padding(top = RuumTokens.Space12), style = MaterialTheme.typography.labelLarge)
                            Text(telefonoE164Mx(telefono))
                            Text("Identidad", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
                            Text("$nombre $apellidos · CURP $curp")
                            Text("$calle $numero, $colonia, $ciudad, $estadoMx CP $codigoPostal")
                            Text("Licencia", Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.labelLarge)
                            Text("$numeroLicencia · $tipoLicencia · Vigente hasta $vigenciaLicencia")
                            Text(
                                "Al enviar aceptas términos, aviso de privacidad y autorizaciones marcadas.",
                                Modifier.padding(top = RuumTokens.Space8),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    if (state.solicitud?.estado == "en_revision" || state.diditUrl != null) {
                        item { DiditSection(state, viewModel) }
                    }
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    if (paso > 0) {
                        RuumSecondaryButton("Atrás", { paso-- }, Modifier.weight(1f))
                    }
                    if (paso < 3) {
                        RuumPrimaryButton(
                            text = "Continuar",
                            onClick = {
                                guardar(paso + 2)
                                if (paso < 3) paso++
                            },
                            modifier = Modifier.weight(1f),
                            enabled = pasoValido(
                                paso, nombre, apellidos, curp, telefono, codigoPostal, estadoMx,
                                ciudad, colonia, calle, numero, contactoNombre, contactoTelefono,
                                numeroLicencia, tipoLicencia, vigenciaLicencia,
                                autoriza, declara, aceptaTerminos, confirmaPrivacidad,
                                state,
                            ),
                            loading = state.loading,
                        )
                    } else {
                        RuumPrimaryButton(
                            text = "Enviar registro",
                            onClick = { viewModel.enviarSolicitud(BuildConfig.VERSION_NAME) },
                            modifier = Modifier.weight(1f),
                            enabled = aceptaTerminos && confirmaPrivacidad,
                            loading = state.loading || state.diditLoading,
                        )
                    }
                }
                if (state.loading) {
                    Box(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }
}

private fun pasoValido(
    paso: Int,
    nombre: String, apellidos: String, curp: String, telefono: String,
    codigoPostal: String, estadoMx: String, ciudad: String, colonia: String,
    calle: String, numero: String, contactoNombre: String, contactoTelefono: String,
    numeroLicencia: String, tipoLicencia: String, vigenciaLicencia: String,
    autoriza: Boolean, declara: Boolean, aceptaTerminos: Boolean, confirmaPrivacidad: Boolean,
    state: DriverUiState,
): Boolean {
    if (paso == 0) {
        return nombre.isNotBlank() && apellidos.isNotBlank() && curp.length == 18 &&
            telefono.length == 10 && codigoPostal.length == 5 && estadoMx.isNotBlank() &&
            ciudad.isNotBlank() && colonia.isNotBlank() && calle.isNotBlank() &&
            numero.isNotBlank() && contactoNombre.isNotBlank() && contactoTelefono.length == 10
    }
    if (paso == 1) {
        val vigenciaOk = runCatching {
            !LocalDate.parse(vigenciaLicencia).isBefore(LocalDate.now())
        }.getOrDefault(false)
        return numeroLicencia.isNotBlank() && tipoLicencia.isNotBlank() && vigenciaOk &&
            autoriza && declara
    }
    if (paso == 2) {
        val tipos = state.solicitudDocumentos.filter { it.esActual }.map { it.tipo }.toSet()
        return "licencia_frente" in tipos && "licencia_reverso" in tipos && "identificacion_oficial" in tipos
    }
    return aceptaTerminos && confirmaPrivacidad
}

@Composable
private fun WizardField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value, onValueChange = onChange,
        modifier = Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space4),
        label = { Text(label) }, singleLine = true, shape = MaterialTheme.shapes.small,
    )
}

@Composable
private fun CheckRow(text: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = RuumTokens.Space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(checked = checked, onCheckedChange = onChange)
        Text(text, Modifier.padding(start = RuumTokens.Space8), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun WizardDocumentRow(
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
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                Text(label, style = MaterialTheme.typography.titleMedium)
                Text(description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            RuumStatusChip(document?.estado ?: "falta")
        }
        if (document != null) {
            Text(document.nombreArchivo, Modifier.padding(top = RuumTokens.Space8), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        localError?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), error = true) }
        RuumPrimaryButton(
            text = if (document == null) "Subir archivo" else "Reemplazar archivo",
            onClick = { picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf")) },
            modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
            loading = state.uploadingDocumentType == type,
        )
    }
}

/** Verificación de identidad con Didit: se abre en el navegador y se confirma al volver. */
@Composable
private fun DiditSection(state: DriverUiState, viewModel: DriverViewModel) {
    val context = LocalContext.current
    RuumCard(Modifier.fillMaxWidth()) {
        Text("Verificación de identidad (Didit)", style = MaterialTheme.typography.titleMedium)
        Text(
            "Agiliza la validación de tu cuenta completando la prueba de vida y validación biométrica con Didit.",
            Modifier.padding(top = RuumTokens.Space4),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        state.verificacionDidit?.let {
            Text(
                "Estado: ${it.estado.replace('_', ' ')}",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (state.diditLoading && state.diditUrl == null) {
            Text(
                "Iniciando verificación de identidad… Conectando con el servicio seguro de Didit.",
                Modifier.padding(top = RuumTokens.Space8),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (state.diditUrl != null) {
            Text(
                "Prueba de vida y validación biométrica",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
            )
            RuumPrimaryButton(
                text = "Abrir verificación",
                onClick = {
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW, state.diditUrl.toUri()))
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
            )
            Text(
                "Se detectará automáticamente al concluir en Didit.",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            RuumSecondaryButton(
                text = "Ya completé la verificación",
                onClick = viewModel::pollVerificacionDidit,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
            )
            Text(
                "También puedes completar la verificación más tarde desde tu panel de conductor.",
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            RuumPrimaryButton(
                text = if (state.diditLoading) "Iniciando verificación…" else "Completar verificación de identidad",
                onClick = viewModel::iniciarDidit,
                modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space12),
                loading = state.diditLoading,
            )
        }
    }
}

// —─ Certificación (Modelo 11) —─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—

@Composable
private fun CertificacionScreen(
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

// —─ Modificación del perfil —─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—─—

@Composable
private fun ModificacionPerfilScreen(state: DriverUiState, viewModel: DriverViewModel) {
    LaunchedEffect(Unit) { viewModel.loadSolicitudesCambio() }
    var tab by remember { mutableIntStateOf(0) }
    var telefono by remember { mutableStateOf("") }
    var codigoPostal by remember { mutableStateOf("") }
    var estadoMx by remember { mutableStateOf("") }
    var ciudad by remember { mutableStateOf("") }
    var colonia by remember { mutableStateOf("") }
    var calle by remember { mutableStateOf("") }
    var numero by remember { mutableStateOf("") }
    var referencias by remember { mutableStateOf("") }
    var contactoNombre by remember { mutableStateOf("") }
    var contactoTelefono by remember { mutableStateOf("") }
    val hayCambios = listOf(
        telefono, codigoPostal, estadoMx, ciudad, colonia, calle, numero,
        referencias, contactoNombre, contactoTelefono,
    ).any { it.isNotBlank() }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Perfil del Conductor", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Administra tus datos personales, documentación y contactos operativos.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (hayCambios) {
            item {
                RuumAlert(
                    "Hay cambios pendientes por guardar. Al guardar, tu perfil será enviado a revisión operativa.",
                    Modifier.fillMaxWidth(),
                )
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                PillTab("Identidad", tab == 0, { tab = 0 }, Modifier.weight(1f))
                PillTab("Ubicación", tab == 1, { tab = 1 }, Modifier.weight(1f))
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                when (tab) {
                    0 -> {
                        SectionTitle("Identidad", "Fotografía, datos personales y teléfono de contacto.")
                        Spacer(Modifier.height(RuumTokens.Space8))
                        Text(
                            "Nombre: ${state.driver?.nombre.orEmpty()}",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                        )
                        WizardField("Teléfono (10 dígitos)", telefono) {
                            telefono = it.filter(Char::isDigit).take(10)
                        }
                        Text(
                            "La CURP, la licencia y la fotografía solo se modifican con revisión operativa desde el expediente.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    else -> {
                        SectionTitle("Ubicación y emergencia", "Domicilio particular y contacto de emergencia.")
                        Spacer(Modifier.height(RuumTokens.Space8))
                        WizardField("Código postal", codigoPostal) {
                            codigoPostal = it.filter(Char::isDigit).take(5)
                        }
                        WizardField("Estado", estadoMx) { estadoMx = it }
                        WizardField("Ciudad o municipio", ciudad) { ciudad = it }
                        WizardField("Colonia", colonia) { colonia = it }
                        WizardField("Calle", calle) { calle = it }
                        WizardField("Número", numero) { numero = it }
                        WizardField("Referencias", referencias) { referencias = it }
                        WizardField("Contacto de emergencia (nombre)", contactoNombre) {
                            contactoNombre = it
                        }
                        WizardField("Teléfono de emergencia", contactoTelefono) {
                            contactoTelefono = it.filter(Char::isDigit).take(10)
                        }
                    }
                }
                Spacer(Modifier.height(RuumTokens.Space8))
                RuumPrimaryButton(
                    text = if (state.loading) "Guardando perfil..." else "Guardar perfil",
                    onClick = {
                        val cambios = mutableMapOf<String, String?>()
                        if (telefono.isNotBlank()) cambios["telefono"] = telefonoE164Mx(telefono)
                        if (codigoPostal.isNotBlank()) cambios["codigo_postal"] = codigoPostal
                        if (estadoMx.isNotBlank()) cambios["estado_residencia"] = estadoMx
                        if (ciudad.isNotBlank()) cambios["ciudad_municipio"] = ciudad
                        if (colonia.isNotBlank()) cambios["colonia"] = colonia
                        if (calle.isNotBlank()) cambios["calle"] = calle
                        if (numero.isNotBlank()) cambios["numero"] = numero
                        if (referencias.isNotBlank()) cambios["referencias"] = referencias
                        if (contactoNombre.isNotBlank()) cambios["contacto_emergencia_nombre"] = contactoNombre
                        if (contactoTelefono.isNotBlank()) cambios["contacto_emergencia_telefono"] = telefonoE164Mx(contactoTelefono)
                        viewModel.solicitarCambio(cambios) { }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = hayCambios,
                    loading = state.loading,
                )
                if (!hayCambios) {
                    Text(
                        "Sin cambios detectados",
                        Modifier.padding(top = RuumTokens.Space8),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        if (state.solicitudesCambio.isNotEmpty()) {
            item { SectionTitle("Solicitudes de cambio", "Cancela la pendiente si necesitas corregirla.") }
            items(state.solicitudesCambio, key = { it.id }) { solicitud ->
                RuumCard(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(solicitud.tipo.replace('_', ' '), style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${solicitud.estado} · ${solicitud.creadoEn.take(10)}",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            solicitud.motivoRechazo?.let {
                                Text(it, color = MaterialTheme.colorScheme.error)
                            }
                        }
                        RuumStatusChip(solicitud.estado)
                    }
                    if (solicitud.estado == "pendiente") {
                        RuumSecondaryButton(
                            text = "Cancelar",
                            onClick = { viewModel.cancelarCambio(solicitud.id) },
                            modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                        )
                    }
                }
            }
        }
    }
}
