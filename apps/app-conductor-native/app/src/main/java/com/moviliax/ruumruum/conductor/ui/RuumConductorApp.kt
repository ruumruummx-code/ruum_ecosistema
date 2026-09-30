package com.moviliax.ruumruum.conductor.ui

import android.content.Intent
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.core.content.FileProvider
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.DriverDocument
import com.moviliax.ruumruum.conductor.data.EvidencePhoto
import com.moviliax.ruumruum.conductor.data.Payout
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
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
import java.text.NumberFormat
import java.io.File
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private enum class Destination(val label: String) {
    PANEL("Inicio"), TRIPS("Traslados"), EARNINGS("Ganancias"), ACCOUNT("Cuenta")
}

@Composable
fun RuumConductorApp(viewModel: DriverViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val themePreference = rememberRuumThemePreference()
    val streetMode = state.acceptedTrips.any { it.estado == "traslado_en_curso" }
    RuumTheme(mode = themePreference.mode, streetMode = streetMode) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            when {
                state.checkingSession -> CenteredProgress()
                !state.configured -> ConfigMissingScreen()
                !state.signedIn -> LoginScreen(state.loading, state.error, viewModel::signIn)
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
private fun LoginScreen(loading: Boolean, error: String?, onLogin: (String, String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(RuumTokens.Navy, Color(0xFF0F2D52))),
        ).padding(RuumTokens.Space20),
        contentAlignment = Alignment.Center,
    ) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            RuumLogo(Modifier.size(152.dp), darkVariant = true)
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Bienvenido", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Entra para ver tus Traslados y próximos depósitos.",
                    Modifier.padding(top = RuumTokens.Space4),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(RuumTokens.Space24))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth().defaultMinInputHeight(),
                    label = { Text("Correo") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
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
                    text = "Iniciar sesión",
                    onClick = { onLogin(email, password) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = email.isNotBlank() && password.isNotBlank(),
                    loading = loading,
                )
            }
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
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (selectedTrip != null || showingDocuments) {
                androidx.compose.material3.TopAppBar(
                    title = { Text(if (selectedTrip != null) "Detalle del traslado" else "Expediente de documentos", style = MaterialTheme.typography.titleLarge) },
                    navigationIcon = {
                        IconButton(onClick = { selectedTrip = null; showingDocuments = false }, modifier = Modifier.size(RuumTokens.Touch)) {
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
            if (street && selectedTrip == null && !showingDocuments) {
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
            if (selectedTrip == null && !showingDocuments) RuumBottomNavigation(destination) { destination = it }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            if (selectedTrip != null) {
                TripDetailScreen(selectedTrip!!, state, viewModel)
            } else if (showingDocuments) {
                DocumentsScreen(state, viewModel::uploadDocument)
            } else when (destination) {
                Destination.PANEL -> PanelScreen(state, viewModel::setAvailability, onTripSelected = { selectedTrip = it })
                Destination.TRIPS -> TripsScreen(state, viewModel::requestTrip, onTripSelected = { selectedTrip = it })
                Destination.EARNINGS -> EarningsScreen(state.payouts, state.acceptedTrips)
                Destination.ACCOUNT -> AccountScreen(state.documents, state.driver?.nombre.orEmpty(), themePreference, viewModel::signOut) { showingDocuments = true }
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
private fun RuumBottomNavigation(selected: Destination, onSelect: (Destination) -> Unit) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface, tonalElevation = 0.dp) {
        listOf(
            Triple(Destination.PANEL, Icons.Default.Home, "Inicio"),
            Triple(Destination.TRIPS, Icons.Default.DirectionsCar, "Traslados"),
            Triple(Destination.EARNINGS, Icons.Default.AttachMoney, "Ganancias"),
            Triple(Destination.ACCOUNT, Icons.Default.AccountCircle, "Cuenta"),
        ).forEach { (item, icon, label) ->
            NavigationBarItem(
                selected = selected == item,
                onClick = { onSelect(item) },
                icon = { Icon(icon, label) },
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
private fun PanelScreen(state: DriverUiState, onAvailability: (Availability) -> Unit, onTripSelected: (Trip) -> Unit) {
    val available = state.availability == Availability.AVAILABLE
    val earnings = state.payouts.filter { it.estado != "revocado" }.sumOf { it.montoNeto }
    LazyColumn(
        contentPadding = PaddingValues(RuumTokens.Space20),
        verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
    ) {
        item {
            Text("Hola, ${state.driver?.nombre?.substringBefore(' ') ?: "conductor"}", style = MaterialTheme.typography.headlineLarge)
            Text("Esto es lo que requiere tu atención hoy.", color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                                Availability.UNAVAILABLE -> "No disponible"
                                Availability.ON_TRIP -> "En viaje"
                            },
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            if (available) "Puedes recibir nuevas ofertas" else "No recibirás nuevas ofertas",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = available,
                        enabled = state.availability != Availability.ON_TRIP,
                        onCheckedChange = { onAvailability(if (it) Availability.AVAILABLE else Availability.UNAVAILABLE) },
                    )
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space12)) {
                MetricCard("Traslados activos", state.acceptedTrips.size.toString(), Icons.Default.DirectionsCar, Modifier.weight(1f))
                MetricCard("Disponibles", state.availableTrips.size.toString(), Icons.Default.Schedule, Modifier.weight(1f))
            }
        }
        item { MetricCard("Próximo depósito", money(earnings), Icons.Default.AttachMoney, Modifier.fillMaxWidth()) }
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
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            PillTab("Solicitados", state.availableTrips.size, tab == 0, { tab = 0 }, Modifier.weight(1f))
            PillTab("Aceptados", state.acceptedTrips.size, tab == 1, { tab = 1 }, Modifier.weight(1f))
        }
        val trips = if (tab == 0) state.availableTrips else state.acceptedTrips
        LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
            if (trips.isEmpty()) item {
                RuumEmptyState(
                    if (tab == 0) "No hay Traslados disponibles" else "Aún no tienes Traslados aceptados",
                    if (tab == 0) "Actualiza en unos minutos para revisar nuevas rutas." else "Los Traslados asignados aparecerán en esta pestaña.",
                    Icons.Default.DirectionsCar,
                )
            }
            items(trips, key = { it.id ?: it.hashCode().toString() }) { trip ->
                TripCard(trip, if (tab == 0) ({ onRequest(trip) }) else null, onClick = { onTripSelected(trip) })
            }
        }
    }
}

@Composable
private fun PillTab(label: String, count: Int, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(RuumTokens.Touch),
        shape = CircleShape,
        color = if (selected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surface,
        contentColor = if (selected) RuumTokens.White else MaterialTheme.colorScheme.onSurfaceVariant,
        border = if (selected) null else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text("$label  $count", style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
    }
}

@Composable
private fun TripCard(trip: Trip, onRequest: (() -> Unit)? = null, onClick: (() -> Unit)? = null) {
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
            trip.estado?.let { RuumStatusChip(it) }
        }
        if (onClick != null) {
            androidx.compose.material3.TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
                Text("Ver detalle del traslado")
            }
        }
        Text(
            listOfNotNull(trip.vehiculoMarca, trip.vehiculoModelo, trip.vehiculoAnio?.toString()).joinToString(" ").ifBlank { "Vehículo por confirmar" },
            Modifier.padding(top = RuumTokens.Space12),
            style = MaterialTheme.typography.bodyLarge,
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
                Text("RUTA", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                Text(
                    "${trip.origenCiudad ?: "Origen"} → ${trip.destinoCiudad ?: "Destino"}",
                    Modifier.padding(top = RuumTokens.Space8),
                    style = MaterialTheme.typography.headlineMedium,
                )
                trip.estado?.let { RuumStatusChip(it) }
            }
        }
        nextTripAction(trip.estado)?.let { action ->
            item {
                RuumCard(Modifier.fillMaxWidth()) {
                    SectionTitle("Siguiente paso")
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
                SectionTitle("Vehículo")
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
                SectionTitle("Puntos del traslado")
                DetailRow("Recoger", trip.origenDireccion ?: trip.origenCiudad ?: "Pendiente de confirmar")
                val origin = listOfNotNull(trip.origenDireccion, trip.origenCiudad).joinToString(", ")
                if (origin.isNotBlank()) {
                    RuumSecondaryButton(
                        "Navegar al origen",
                        onClick = { abrirMapa(context, origin) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                DetailRow("Entregar", trip.destinoDireccion ?: trip.destinoCiudad ?: "Pendiente de confirmar")
                val destination = listOfNotNull(trip.destinoDireccion, trip.destinoCiudad).joinToString(", ")
                if (destination.isNotBlank()) {
                    RuumSecondaryButton(
                        "Navegar al destino",
                        onClick = { abrirMapa(context, destination) },
                        modifier = Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    )
                }
                DetailRow("Distancia", trip.distanciaKm?.let { "%.1f km".format(it) } ?: "Por confirmar")
                DetailRow("Duración estimada", trip.tiempoEstimadoHoras?.let { "%.1f h".format(it) } ?: "Por confirmar")
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Pago estimado")
                Text(money(estimatedEarning(trip)), Modifier.padding(top = RuumTokens.Space8), style = MaterialTheme.typography.headlineMedium)
            }
        }
    }
}

private fun nextTripAction(state: String?): Triple<String, String, String>? = when (state) {
    "conductor_asignado" -> Triple("Iniciar navegación al origen", "Abre el paso de recogida del vehículo.", "conductor_en_camino")
    "conductor_en_camino_al_origen" -> Triple("Registrar llegada al origen", "Confirma que llegaste al punto de recolección.", "llegada_origen")
    "conductor_en_punto_de_recoleccion" -> Triple("Iniciar inspección del vehículo", "Comienza la revisión previa a recibir la unidad.", "iniciar_verificacion")
    "verificacion_vehiculo_en_proceso" -> Triple("Iniciar registro fotográfico", "Captura la evidencia inicial antes de recibir el vehículo.", "iniciar_evidencia_inicial")
    "evidencia_inicial_completada" -> Triple("Confirmar recepción del vehículo", "Registra que recibiste la unidad después de la inspección.", "vehiculo_recibido")
    "vehiculo_recibido" -> Triple("Iniciar traslado al destino", "Confirma el inicio del trayecto.", "iniciar_traslado")
    "traslado_en_curso" -> Triple("Registrar llegada al destino", "Confirma que llegaste al punto de entrega.", "confirmar_llegada_destino")
    "llegada_a_destino" -> Triple("Iniciar evidencia de entrega", "Registra las fotografías finales del vehículo.", "iniciar_evidencia_final")
    "evidencia_final_completada" -> Triple("Confirmar entrega", "Confirma la entrega con evidencia completa.", "confirmar_entrega")
    "entrega_confirmada" -> Triple("Cerrar traslado", "Finaliza el flujo del traslado.", "cerrar_viaje")
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
        "frente" to "Frente",
        "lado_piloto" to "Lado del conductor",
        "lado_copiloto" to "Lado del copiloto",
        "trasera" to "Parte trasera",
        "tablero" to "Tablero",
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
        SectionTitle(if (type == "inicial") "Evidencia inicial" else "Evidencia final", "Captura los cinco ángulos requeridos del vehículo.")
        if (loading) {
            CircularProgressIndicator(Modifier.padding(top = RuumTokens.Space12))
        } else {
            required.forEach { (angle, label) ->
                Row(
                    Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(label, style = MaterialTheme.typography.titleSmall)
                        Text(
                            if (angle in savedAngles) "Fotografía guardada" else "Pendiente",
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
            Text(
                if (type == "inicial") "La confirmación también valida el método de pago registrado." else "La evidencia final queda asociada al traslado para revisión.",
                Modifier.padding(top = RuumTokens.Space12),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            RuumPrimaryButton(
                if (confirming) "Confirmando…" else "Completar evidencia",
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
    val resized = if (scale < 1f) Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).toInt(), (bitmap.height * scale).toInt(), true) else bitmap
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

private fun abrirMapa(context: android.content.Context, direccion: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(direccion)}"))
    if (intent.resolveActivity(context.packageManager) != null) context.startActivity(intent)
}

@Composable
private fun EarningsScreen(payouts: List<Payout>, trips: List<Trip>) {
    val total = totalDeposited(payouts)
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("PAGO PARA TI", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                Text(money(total), style = MaterialTheme.typography.displayLarge)
                Text("Total depositado", color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (trips.isNotEmpty()) {
                    RuumAlert("${trips.size} viaje(s) siguen en proceso y aún no forman parte del depósito.", Modifier.fillMaxWidth().padding(top = RuumTokens.Space16))
                }
            }
        }
        item { SectionTitle("Pagos por semana", "Consulta monto, ajustes y estado.") }
        if (payouts.isEmpty()) item {
            RuumEmptyState("Aún no hay depósitos", "Tus Traslados cerrados aparecerán aquí cuando se programe el pago.", Icons.Default.AttachMoney)
        }
        items(payouts, key = { it.id }) { payout -> PayoutCard(payout) }
    }
}

@Composable
private fun PayoutCard(payout: Payout) {
    RuumCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("${payout.periodoInicio.take(10)} – ${payout.periodoFin.take(10)}", style = MaterialTheme.typography.labelMedium)
            RuumStatusChip(payout.estado)
        }
        Text("Depósito ${money(payout.montoNeto)}", Modifier.padding(top = RuumTokens.Space16), style = MaterialTheme.typography.headlineSmall)
        Text("Bruto ${money(payout.montoBruto)} · Ajustes ${money(payout.ajustes)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun AccountScreen(
    documents: List<DriverDocument>,
    driverName: String,
    themePreference: RuumThemePreference,
    onSignOut: () -> Unit,
    onOpenDocuments: () -> Unit,
) {
    var confirmSignOut by remember { mutableStateOf(false) }
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
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
            }
        }
        item {
            SectionTitle("Apariencia", "Tu elección prevalece sobre la del sistema.")
            Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space12), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                ThemeChip("Sistema", Icons.Default.Sync, RuumThemeMode.SYSTEM, themePreference, Modifier.weight(1f))
                ThemeChip("Claro", Icons.Default.LightMode, RuumThemeMode.LIGHT, themePreference, Modifier.weight(1f))
                ThemeChip("Oscuro", Icons.Default.DarkMode, RuumThemeMode.DARK, themePreference, Modifier.weight(1f))
            }
        }
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                SectionTitle("Tus documentos", "Consulta estados y actualiza tu expediente.")
                val current = documents.filter { it.esActual }.distinctBy { it.tipo }
                Text("${current.size} tipo(s) de documento registrados", Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
                RuumPrimaryButton("Gestionar documentos", onOpenDocuments, Modifier.fillMaxWidth().padding(top = RuumTokens.Space12))
            }
        }
        item {
            SectionTitle("Soporte")
            Spacer(Modifier.height(RuumTokens.Space12))
            RuumCard(Modifier.fillMaxWidth()) {
                SupportRow(Icons.AutoMirrored.Filled.Help, "Preguntas frecuentes", "Resuelve dudas sobre Traslados y pagos")
                SupportRow(Icons.Default.SupportAgent, "Contactar a soporte", "Recibe ayuda con tu cuenta")
                SupportRow(Icons.Default.Error, "Reportar un problema", "Describe una falla o incidencia")
            }
        }
        item { RuumSecondaryButton("Cerrar sesión", { confirmSignOut = true }, Modifier.fillMaxWidth()) }
    }
    if (confirmSignOut) AlertDialog(
        onDismissRequest = { confirmSignOut = false },
        title = { Text("¿Cerrar sesión?") },
        text = { Text("Tendrás que volver a escribir tus credenciales.") },
        confirmButton = { RuumPrimaryButton("Cerrar sesión", onSignOut) },
        dismissButton = { RuumSecondaryButton("Cancelar", { confirmSignOut = false }) },
    )
}

private data class DocumentRequirement(val type: String, val label: String, val description: String, val required: Boolean)

private val DOCUMENT_REQUIREMENTS = listOf(
    DocumentRequirement("licencia_frente", "Licencia · frente", "Fotografía clara del frente de tu licencia vigente.", true),
    DocumentRequirement("licencia_reverso", "Licencia · reverso", "Fotografía clara del reverso de tu licencia vigente.", true),
    DocumentRequirement("identificacion_oficial", "Identificación oficial", "INE o pasaporte vigente.", true),
    DocumentRequirement("constancia_situacion_fiscal", "Constancia de Situación Fiscal", "Archivo PDF o imagen legible.", false),
    DocumentRequirement("documento_operativo", "Documento operativo adicional", "Solo si el equipo de operación solicita un respaldo extra.", false),
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
    val today = java.time.LocalDate.now()
    val licenseExpired = state.driver?.licenciaVigencia?.let {
        runCatching { java.time.LocalDate.parse(it.take(10)).isBefore(today) }.getOrDefault(false)
    } == true
    LazyColumn(contentPadding = PaddingValues(RuumTokens.Space20), verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16)) {
        item {
            RuumCard(Modifier.fillMaxWidth()) {
                Text("Expediente digital del conductor", style = MaterialTheme.typography.titleLarge)
                Text("Los documentos obligatorios deben estar vigentes para recibir traslados. Formatos JPG, PNG, WEBP o PDF hasta 10 MB.", Modifier.padding(top = RuumTokens.Space8), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        localError?.let { message -> item { RuumAlert(message, Modifier.fillMaxWidth(), error = true) } }
        items(DOCUMENT_REQUIREMENTS, key = { it.type }) { requirement ->
            val document = state.documents.filter { it.tipo == requirement.type && it.esActual }.maxByOrNull { it.version }
            RuumCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f).padding(end = RuumTokens.Space8)) {
                        Text(requirement.label, style = MaterialTheme.typography.titleMedium)
                        Text(requirement.description, Modifier.padding(top = RuumTokens.Space4), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    RuumStatusChip(documentStatus(document, licenseExpired && requirement.type.startsWith("licencia_")))
                }
                if (document != null) {
                    Text(document.nombreArchivo, Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Versión ${document.version}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    (document.motivoRechazo ?: document.notasAdmin)?.let { RuumAlert(it, Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), error = document.estado == "rechazado") }
                }
                Text(if (requirement.required) "Documento obligatorio" else "Documento opcional", Modifier.padding(top = RuumTokens.Space12), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                Row(Modifier.fillMaxWidth().padding(top = RuumTokens.Space8), horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8)) {
                    RuumSecondaryButton("Tomar foto", onClick = {
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
                    RuumPrimaryButton("Subir archivo", onClick = {
                        selectedType = requirement.type
                        picker.launch(arrayOf("image/jpeg", "image/png", "image/webp", "application/pdf"))
                    }, Modifier.weight(1f), enabled = state.uploadingDocumentType == null, loading = state.uploadingDocumentType == requirement.type)
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

private fun documentStatus(document: DriverDocument?, licenseExpired: Boolean): String = when {
    licenseExpired -> "vencido"
    document == null -> "falta"
    document.estado == "rechazado" -> "rechazado"
    document.estado == "aprobado" -> "aprobado"
    document.estado == "en_revision" -> "en revisión"
    else -> "cargado"
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
