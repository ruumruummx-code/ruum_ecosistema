# Ruum Ruum Conductor — Android nativo

Aplicación Android nativa para el conductor, separada del cliente web/Capacitor que vive en
`apps/app-conductor`. Conserva `com.moviliax.ruumruum.conductor` como `applicationId` de release
para permitir una migración futura en el mismo canal de distribución. El variant `debug` agrega
`.native.debug`, por lo que puede instalarse junto al contenedor actual.

## Stack

- Kotlin 2.4.20 y Gradle Kotlin DSL.
- Android Gradle Plugin 9.2.1 y Gradle 9.7.
- Jetpack Compose + Material 3 con MVVM.
- `supabase-kt` 3.8.0: Auth, PostgREST, Realtime, Storage y Functions.
- Ktor Android 3.5.1.

Nota: Supabase documenta y recomienda `supabase-kt` para Kotlin, pero el propio sitio de Supabase
lo clasifica como cliente mantenido por la comunidad, no como SDK oficial de primera parte.

## Configuración local

1. Copia `local.properties.example` como `local.properties`.
2. Ajusta `sdk.dir`.
3. Define `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.

También se aceptan esas dos claves como variables de entorno. Nunca coloques una clave
`service_role` o secret en la aplicación. La clave publicable identifica el proyecto; la
autorización real permanece en Auth + RLS.

## Comandos desde la raíz del monorepo

```bash
pnpm android:native:build
pnpm android:native:test
pnpm android:native:lint
```

Desde esta carpeta también puedes usar `gradlew.bat` en Windows o `./gradlew` en macOS/Linux.

## Arquitectura

- `core/`: inicialización única del cliente Supabase.
- `data/`: DTO serializables y repositorio; reutiliza los contratos existentes del backend.
- `ui/DriverViewModel.kt`: estado y casos de uso de presentación.
- `ui/RuumConductorApp.kt`: login, panel, disponibilidad, Traslados, ganancias y documentos.
- `ui/theme/`: tokens, tipografía Inter y temas claro/oscuro del sistema de diseño.
- `ui/components/`: botones, tarjetas, alertas, estados, logotipo y vacíos reutilizables.

## Sistema de diseño

La interfaz replica los tokens canónicos de `design-system/tokens/tokens.json`: paleta Ruum,
grilla de 8 dp, margen móvil de 20 dp, tarjetas de 24 dp y controles táctiles de 56 dp en modo
calle. La preferencia de tema (sistema, claro u oscuro) se conserva entre sesiones. Durante un
traslado en curso se activa el modo calle, con tipografía reforzada, acciones mayores y acceso
persistente a Seguridad.

La fuente Inter se distribuye bajo SIL Open Font License; consulta `INTER_FONT_LICENSE.txt`.

El flujo de oferta usa `conductor_solicita_asignacion`, el RPC transaccional vigente del backend,
en vez de escribir directamente en `traslados`. La disponibilidad se guarda en
`preferencias_conductor.modo_no_molestar`, igual que en el cliente web existente.

## Alcance inicial

Esta base entrega navegación, sesión persistente, consultas reales, cambio de disponibilidad y
solicitud de viaje. La captura de evidencia, carga/reemplazo de documentos, incidencias, avance de
estados y push requieren sus flujos nativos de permisos/cámara/selector de archivos y deben
conectarse a los Edge Functions/RPC ya existentes antes de retirar el contenedor Capacitor.
