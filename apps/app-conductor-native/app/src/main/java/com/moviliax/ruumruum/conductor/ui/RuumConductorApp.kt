package com.moviliax.ruumruum.conductor.ui

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
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.data.Availability
import com.moviliax.ruumruum.conductor.data.DriverDocument
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
import java.util.Locale

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
private fun AuthenticatedApp(
    state: DriverUiState,
    viewModel: DriverViewModel,
    themePreference: RuumThemePreference,
) {
    var destination by remember { mutableStateOf(Destination.PANEL) }
    var safetyDialog by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val street = LocalRuumStreetMode.current
    LaunchedEffect(state.error, state.notice) {
        (state.error ?: state.notice)?.let { snackbar.showSnackbar(it) }
        if (state.error != null || state.notice != null) viewModel.clearMessage()
    }
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { RuumTopBar(destination.label, viewModel::refresh) },
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            if (street) {
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
            RuumBottomNavigation(destination) { destination = it }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (destination) {
                Destination.PANEL -> PanelScreen(state, viewModel::setAvailability)
                Destination.TRIPS -> TripsScreen(state, viewModel::requestTrip)
                Destination.EARNINGS -> EarningsScreen(state.payouts, state.acceptedTrips)
                Destination.ACCOUNT -> AccountScreen(state.documents, state.driver?.nombre.orEmpty(), themePreference, viewModel::signOut)
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
private fun PanelScreen(state: DriverUiState, onAvailability: (Availability) -> Unit) {
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
            state.acceptedTrips.firstOrNull()?.let { TripCard(it) } ?: RuumEmptyState(
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
private fun TripsScreen(state: DriverUiState, onRequest: (Trip) -> Unit) {
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
                TripCard(trip, if (tab == 0) ({ onRequest(trip) }) else null)
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
private fun TripCard(trip: Trip, onRequest: (() -> Unit)? = null) {
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
        item { SectionTitle("Tus documentos", "Estados y vigencias de tu expediente.") }
        if (documents.isEmpty()) item {
            RuumEmptyState("No hay documentos registrados", "Los documentos de tu expediente aparecerán aquí.", Icons.Default.Description)
        }
        items(documents, key = { it.id }) { document -> DocumentCard(document) }
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
