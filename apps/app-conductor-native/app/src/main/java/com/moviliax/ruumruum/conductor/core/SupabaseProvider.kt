package com.moviliax.ruumruum.conductor.core

import com.moviliax.ruumruum.conductor.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage

object SupabaseProvider {
    val isConfigured: Boolean
        get() {
            val url = BuildConfig.SUPABASE_URL.trim()
            val validScheme = url.startsWith("https://") || (BuildConfig.DEBUG && url.startsWith("http://"))
            return validScheme && BuildConfig.SUPABASE_PUBLISHABLE_KEY.isNotBlank()
        }

    val client: SupabaseClient by lazy {
        check(isConfigured) {
            "Configura SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en local.properties."
        }
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY,
        ) {
            install(Auth)
            install(Postgrest)
            install(Realtime)
            install(Storage)
            install(Functions)
        }
    }
}
