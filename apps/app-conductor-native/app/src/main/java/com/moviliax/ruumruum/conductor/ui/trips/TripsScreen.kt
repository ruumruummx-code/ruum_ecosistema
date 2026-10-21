package com.moviliax.ruumruum.conductor.ui.trips

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.data.Trip
import com.moviliax.ruumruum.conductor.domain.estimatedEarning
import com.moviliax.ruumruum.conductor.ui.DriverUiState
import com.moviliax.ruumruum.conductor.ui.common.defaultMinInputHeight
import com.moviliax.ruumruum.conductor.ui.common.money
import com.moviliax.ruumruum.conductor.ui.common.successBackground
import com.moviliax.ruumruum.conductor.ui.common.successForeground
import com.moviliax.ruumruum.conductor.ui.components.RuumCard
import com.moviliax.ruumruum.conductor.ui.components.RuumEmptyState
import com.moviliax.ruumruum.conductor.ui.components.RuumPrimaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumSecondaryButton
import com.moviliax.ruumruum.conductor.ui.components.RuumStatusChip
import com.moviliax.ruumruum.conductor.ui.theme.LocalRuumDarkMode
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteDark
import com.moviliax.ruumruum.conductor.ui.theme.RuumRouteLight
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

private val DIAS_CORTOS = listOf("DO", "LU", "MA", "MI", "JU", "VI", "SÁ")
private val MESES_CORTOS = listOf(
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
)

/**
 * Pantalla de Traslados (réplica del prototipo): cabecera con menú, estado en vivo y
 * recarga; buscador, tabs Ofertas/Aceptados, selector de día del semana, navegador de
 * fecha y empty state con acciones de orden y retorno al panel.
 */
@Composable
fun TripsScreen(
    state: DriverUiState,
    onRequest: (Trip) -> Unit,
    onTripSelected: (Trip) -> Unit,
    onReload: () -> Unit = {},
    onOpenPanel: () -> Unit = {},
    onOpenMenu: () -> Unit = {},
    onNotifications: () -> Unit = {},
) {
    var tab by remember { mutableIntStateOf(0) }
    var busqueda by remember { mutableStateOf("") }
    var ordenMayorGanancia by remember { mutableStateOf(false) }
    var fechaSeleccionada by remember { mutableStateOf(LocalDate.now()) }
    var ayudaAbierta by remember { mutableStateOf(false) }

    val base = if (tab == 0) state.availableTrips else state.acceptedTrips
    val filtrados = base.filter { trip ->
        val coincideBusqueda = busqueda.isBlank() ||
            listOfNotNull(trip.origenCiudad, trip.origenDireccion, trip.destinoCiudad, trip.destinoDireccion, trip.id)
                .joinToString(" ").contains(busqueda, ignoreCase = true)
        val coincideFecha = trip.creadoEn == null || trip.creadoEn?.take(10) == fechaSeleccionada.toString()
        coincideBusqueda && coincideFecha
    }.let { lista ->
        if (ordenMayorGanancia) lista.sortedByDescending { estimatedEarning(it) } else lista
    }

    Column(Modifier.fillMaxSize()) {
        TripsTopBar(
            onOpenMenu = onOpenMenu,
            onHelp = { ayudaAbierta = true },
            onNotifications = onNotifications,
            onReload = onReload,
        )
        OutlinedTextField(
            value = busqueda,
            onValueChange = { busqueda = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = RuumTokens.Space20)
                .defaultMinInputHeight(),
            placeholder = { Text("Buscar ofertas...") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant,
            ),
        )
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
            horizontalArrangement = Arrangement.spacedBy(RuumTokens.Space8),
        ) {
            SegmentTab("Ofertas (${state.availableTrips.size})", tab == 0, { tab = 0 }, Modifier.weight(1f))
            SegmentTab("Aceptados (${state.acceptedTrips.size})", tab == 1, { tab = 1 }, Modifier.weight(1f))
        }
        SemanaSelector(
            seleccion = fechaSeleccionada,
            onSelect = { fechaSeleccionada = it },
        )
        FechaNavegador(
            fecha = fechaSeleccionada,
            onAnterior = { fechaSeleccionada = fechaSeleccionada.minusDays(1) },
            onSiguiente = { fechaSeleccionada = fechaSeleccionada.plusDays(1) },
        )
        LazyColumn(
            Modifier.weight(1f),
            contentPadding = PaddingValues(RuumTokens.Space20),
            verticalArrangement = Arrangement.spacedBy(RuumTokens.Space16),
        ) {
            if (filtrados.isNotEmpty()) {
                item {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            when {
                                tab == 0 && filtrados.size == 1 -> "1 oferta disponible"
                                tab == 0 -> "${filtrados.size} ofertas disponibles"
                                filtrados.size == 1 -> "1 traslado aceptado"
                                else -> "${filtrados.size} traslados aceptados"
                            },
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.secondary,
                        )
                        TextButton(
                            onClick = { ordenMayorGanancia = !ordenMayorGanancia },
                            modifier = Modifier.defaultMinSize(minHeight = RuumTokens.Touch),
                        ) {
                            Icon(Icons.Default.SwapVert, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(RuumTokens.Space4))
                            Text(
                                if (ordenMayorGanancia) "Mayor ganancia" else "Recientes",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }
                }
            }
            if (filtrados.isEmpty()) {
                item {
                    TrasladosEmptyState(
                        conBusqueda = busqueda.isNotBlank(),
                        esTabAceptados = tab == 1,
                        onOrdenar = { ordenMayorGanancia = true },
                        onVolverAlPanel = onOpenPanel,
                    )
                }
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
    if (ayudaAbierta) AlertDialog(
        onDismissRequest = { ayudaAbierta = false },
        icon = { Icon(Icons.Outlined.HelpOutline, null, tint = MaterialTheme.colorScheme.primary) },
        title = { Text("Ayuda con traslados") },
        text = { Text("Revisa las ofertas del día, ordena por mayor ganancia y solicita la asignación desde cada oferta. Para soporte operativo, contacta a soporte desde Cuenta.") },
        confirmButton = { RuumPrimaryButton("Entendido", { ayudaAbierta = false }) },
    )
}

@Composable
private fun TripsTopBar(
    onOpenMenu: () -> Unit,
    onHelp: () -> Unit,
    onNotifications: () -> Unit,
    onReload: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(
            onClick = onOpenMenu,
            modifier = Modifier.size(RuumTokens.Touch),
        ) {
            Icon(Icons.Default.Menu, "Menú", tint = MaterialTheme.colorScheme.onBackground)
        }
        Column(Modifier.weight(1f).padding(horizontal = RuumTokens.Space8)) {
            Text(
                "CONDUCTOR",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                "Traslados",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(8.dp)
                        .background(RuumTokens.Teal, CircleShape),
                )
                Text(
                    "En vivo",
                    Modifier.padding(start = RuumTokens.Space4),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Surface(
                    onClick = onReload,
                    shape = CircleShape,
                    color = RuumTokens.ActionBg,
                    modifier = Modifier.padding(start = RuumTokens.Space8),
                ) {
                    Text(
                        "Recargar",
                        Modifier.padding(horizontal = RuumTokens.Space12, vertical = RuumTokens.Space4),
                        style = MaterialTheme.typography.labelMedium,
                        color = RuumTokens.Action,
                    )
                }
            }
        }
        CabeceraIconoAccion(Icons.Outlined.HelpOutline, "Ayuda", onHelp)
        CabeceraIconoAccion(Icons.Outlined.Notifications, "Notificaciones", onNotifications)
    }
}

@Composable
private fun CabeceraIconoAccion(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    description: String,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.padding(start = RuumTokens.Space8).size(RuumTokens.Touch),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                icon,
                description,
                Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

@Composable
private fun SegmentTab(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(RuumTokens.Touch),
        shape = MaterialTheme.shapes.medium,
        color = if (selected) RuumTokens.Teal else MaterialTheme.colorScheme.surfaceVariant,
        contentColor = if (selected) RuumTokens.Navy else MaterialTheme.colorScheme.onSurfaceVariant,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                label,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun SemanaSelector(seleccion: LocalDate, onSelect: (LocalDate) -> Unit) {
    val hoy = LocalDate.now()
    val domingo = hoy.minusDays((hoy.dayOfWeek.value % 7).toLong())
    val dias = (0 until 7).map { domingo.plusDays(it.toLong()) }
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = RuumTokens.Space20),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        dias.forEach { dia ->
            val etiquetaDia = when (dia.dayOfWeek.value % 7) {
                0 -> DIAS_CORTOS[0]
                1 -> DIAS_CORTOS[1]
                2 -> DIAS_CORTOS[2]
                3 -> DIAS_CORTOS[3]
                4 -> DIAS_CORTOS[4]
                5 -> DIAS_CORTOS[5]
                else -> DIAS_CORTOS[6]
            }
            val seleccionado = dia == seleccion
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.width(40.dp),
            ) {
                Text(
                    etiquetaDia,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = if (dia == hoy) FontWeight.Bold else FontWeight.Medium,
                    color = if (dia == hoy) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Surface(
                    onClick = { onSelect(dia) },
                    shape = CircleShape,
                    color = if (seleccionado) RuumTokens.Teal else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (seleccionado) RuumTokens.Navy else MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = RuumTokens.Space4).size(RuumTokens.Touch),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            dia.dayOfMonth.toString(),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FechaNavegador(fecha: LocalDate, onAnterior: () -> Unit, onSiguiente: () -> Unit) {
    Surface(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = RuumTokens.Space20, vertical = RuumTokens.Space12),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Row(
            Modifier.padding(horizontal = RuumTokens.Space8).height(52.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onAnterior, modifier = Modifier.size(RuumTokens.Touch)) {
                Icon(Icons.Default.ChevronLeft, "Día anterior", tint = MaterialTheme.colorScheme.onSurface)
            }
            Row(
                Modifier.weight(1f),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    etiquetaFechaLarga(fecha),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                if (fecha == LocalDate.now()) {
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary),
                        modifier = Modifier.padding(start = RuumTokens.Space8),
                    ) {
                        Text(
                            "HOY",
                            Modifier.padding(horizontal = RuumTokens.Space8, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
            IconButton(onClick = onSiguiente, modifier = Modifier.size(RuumTokens.Touch)) {
                Icon(Icons.Default.ChevronRight, "Día siguiente", tint = MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}

private fun etiquetaFechaLarga(fecha: LocalDate): String {
    val dia = when (fecha.dayOfWeek.value % 7) {
        0 -> "DOM"
        1 -> "LUN"
        2 -> "MAR"
        3 -> "MIÉ"
        4 -> "JUE"
        5 -> "VIE"
        else -> "SÁB"
    }
    return "$dia ${fecha.dayOfMonth} DE ${MESES_CORTOS[fecha.monthValue - 1]}"
}

@Composable
private fun TrasladosEmptyState(
    conBusqueda: Boolean,
    esTabAceptados: Boolean,
    onOrdenar: () -> Unit,
    onVolverAlPanel: () -> Unit,
) {
    Surface(
        Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Column(
            Modifier.padding(RuumTokens.Space24).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(120.dp)) {
                Box(
                    Modifier
                        .size(96.dp)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), CircleShape),
                )
                Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surface) {
                    Icon(
                        Icons.Default.LocalShipping,
                        contentDescription = null,
                        Modifier.padding(RuumTokens.Space16).size(32.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Text(
                when {
                    conBusqueda -> "Sin resultados con estos filtros"
                    esTabAceptados -> "Sin traslados aceptados"
                    else -> "Sin traslados para este día"
                },
                Modifier.padding(top = RuumTokens.Space16),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                when {
                    conBusqueda -> "Prueba limpiar la búsqueda o revisa otra fecha."
                    esTabAceptados -> "No tienes traslados aceptados para esta fecha. Acepta una oferta para verla aquí."
                    else -> "No hay ofertas programadas en esta fecha. Revisa otro día o cambia el orden a Mayor ganancia."
                },
                Modifier.padding(top = RuumTokens.Space8),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            RuumPrimaryButton(
                "Ordenar por mayor ganancia",
                onOrdenar,
                Modifier.fillMaxWidth().padding(top = RuumTokens.Space24),
                leadingIcon = Icons.Default.SwapVert,
            )
            RuumSecondaryButton(
                "Volver al panel",
                onVolverAlPanel,
                Modifier.fillMaxWidth().padding(top = RuumTokens.Space8),
            )
        }
    }
}

@Composable
fun OfertaCard(trip: Trip, onRequest: () -> Unit, onClick: () -> Unit) {
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
fun TripCard(
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

fun estadoTrasladoDescripcion(estado: String?): String = when (estado) {
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
