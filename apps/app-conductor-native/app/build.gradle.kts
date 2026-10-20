import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use(::load)
}

fun secret(name: String): String =
    (localProperties.getProperty(name) ?: providers.environmentVariable(name).orNull ?: "")
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")

android {
    namespace = "com.moviliax.ruumruum.conductor"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.moviliax.ruumruum.conductor"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0.0-native"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
        buildConfigField("String", "SUPABASE_URL", "\"${secret("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${secret("SUPABASE_PUBLISHABLE_KEY")}\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging.resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"

    buildTypes {
        debug {
            applicationIdSuffix = ".native.debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
}

dependencies {
    implementation(libs.androidx.compose.bom)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.core.ktx)
    implementation(alias(libs.plugins.compose.material3))
    implementation(alias(libs.plugins.compose.material))
    implementation(alias(libs.plugins.compose.ui))
    implementation(alias(libs.plugins.androidx.compose.ui))
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.bom)
    implementation(alias(libs.plugins.github.jan.tennert.supabase))
    implementation(alias(libs.plugins.io.github.jan.tennert.supabase))
    implementation(alias(libs.plugins.io.github.jan.tennert.supabaseX2))
    implementation(alias(libs.plugins.io.github.jan.tennert.supabaseX3))
    implementation(alias(libs.plugins.io.github.jan.tennert.supabaseX4))
    implementation(libs.ktor.client.android)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.compose.bom)
    androidTestImplementation(alias(libs.plugins.androidx.compose.uiX2))
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(alias(libs.plugins.androidx.compose.uiX3))
    debugImplementation(alias(libs.plugins.androidx.compose.uiX4))
}
