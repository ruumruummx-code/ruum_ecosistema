package com.moviliax.ruumruum.conductor.ui.theme

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext

class RuumThemePreference internal constructor(
    initialMode: RuumThemeMode,
    private val save: (RuumThemeMode) -> Unit,
) {
    var mode by mutableStateOf(initialMode)
        private set

    fun update(value: RuumThemeMode) {
        mode = value
        save(value)
    }
}

@Composable
fun rememberRuumThemePreference(): RuumThemePreference {
    val context = LocalContext.current
    return remember {
        val preferences = context.getSharedPreferences("ruum_conductor_preferences", Context.MODE_PRIVATE)
        val initial = runCatching {
            RuumThemeMode.valueOf(preferences.getString("theme_mode", RuumThemeMode.LIGHT.name).orEmpty())
        }.getOrDefault(RuumThemeMode.LIGHT)
        RuumThemePreference(initial) { mode ->
            preferences.edit().putString("theme_mode", mode.name).apply()
        }
    }
}
