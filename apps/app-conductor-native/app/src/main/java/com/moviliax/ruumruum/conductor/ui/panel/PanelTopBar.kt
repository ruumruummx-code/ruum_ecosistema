package com.moviliax.ruumruum.conductor.ui.panel

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.moviliax.ruumruum.conductor.R
import com.moviliax.ruumruum.conductor.ui.theme.RuumTokens

/**
 * Cabecera del Dashboard (RC-2026-008): fondo navy de marca, logotipo Ruum Ruum a la
 * izquierda, campana de notificaciones con punto rojo y acceso a cuenta a la derecha.
 */
@Composable
fun PanelTopBar(
    unreadCount: Int,
    onNotifications: () -> Unit,
    onAccount: () -> Unit,
) {
    Surface(color = RuumTokens.Navy, contentColor = RuumTokens.White) {
        Row(
            Modifier
                .fillMaxWidth()
                .height(64.dp)
                .padding(horizontal = RuumTokens.Space16),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Image(
                    painter = painterResource(R.drawable.ruum_logo_login),
                    contentDescription = "Ruum Ruum Conductor",
                    modifier = Modifier.height(22.dp),
                    contentScale = ContentScale.Fit,
                    colorFilter = ColorFilter.tint(Color.White, BlendMode.SrcIn),
                )
                Text(
                    "Conductor",
                    style = MaterialTheme.typography.labelSmall,
                    color = RuumTokens.White.copy(alpha = 0.75f),
                )
            }
            Spacer(Modifier.weight(1f))
            IconButton(
                onClick = onNotifications,
                modifier = Modifier.size(RuumTokens.Touch),
            ) {
                if (unreadCount > 0) {
                    BadgedBox(badge = { Badge(containerColor = RuumTokens.Error) }) {
                        Icon(Icons.Default.Notifications, "Notificaciones ($unreadCount sin leer)", tint = RuumTokens.White)
                    }
                } else {
                    Icon(Icons.Default.Notifications, "Notificaciones", tint = RuumTokens.White)
                }
            }
            IconButton(
                onClick = onAccount,
                modifier = Modifier.size(RuumTokens.Touch),
            ) {
                Surface(shape = CircleShape, color = RuumTokens.White, modifier = Modifier.size(36.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Person, "Mi cuenta", Modifier.size(22.dp), tint = RuumTokens.Navy)
                    }
                }
            }
        }
    }
}
