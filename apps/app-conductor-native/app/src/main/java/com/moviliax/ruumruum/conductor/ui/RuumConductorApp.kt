package com.moviliax.ruumruum.conductor.ui

import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.ui.account.AccountScreen
import com.moviliax.ruumruum.conductor.ui.account.CertificacionScreen
import com.moviliax.ruumruum.conductor.ui.account.DocumentsScreen
import com.moviliax.ruumruum.conductor.ui.account.ModificacionPerfilScreen
import com.moviliax.ruumruum.conductor.ui.auth.AuthNav
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumTopBar
import com.moviliax.ruumruum.conductor.ui.earnings.EarningsScreen
import com.moviliax.ruumruum.conductor.ui.notifications.NotificacionesScreen
import com.moviliax.ruumruum.conductor.ui.onboarding.OnboardingScreen
import com.moviliax.ruumruum.conductor.ui.onboarding.RegistroWizardScreen
import com.moviliax.ruumruum.conductor.ui.panel.PanelScreen
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumStreetMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumTheme
import com.moviliax.ruumruum.conductor.ui.theme.RuumThemePreference
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import com.moviliax.ruumruum.conductor.ui.theme.rememberRuumThemePreference
import com.moviliax.ruumruum.conductor.ui.trips.TripDetailScreen
import com.moviliax.ruumruum.conductor.ui.trips.TripsScreen

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
