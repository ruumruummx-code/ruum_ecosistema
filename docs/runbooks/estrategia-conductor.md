# Estrategia conductor: Capacitor (productivo) vs nativo (en construcción)

## Decisión

**`apps/app-conductor` (web + Capacitor) es el canal productivo** y lo sigue
siendo hasta que la nativa alcance paridad verificada. Fundamento:

- Capacitor publica hoy con el `applicationId` release
  `com.moviliax.ruumruum.conductor` y cubre el flujo completo (registro,
  Didit, documentos, viajes, cuenta, pagos, chat/llamada).
- `apps/app-conductor-native` (Kotlin/Compose) cubre: navegación, sesión
  persistente, consultas, disponibilidad y solicitud de viaje. Le falta
  (ver su README): captura de evidencia, carga de documentos, incidencias,
  avance de estados y push — debe conectarse a los Edge Functions/RPC
  existentes **antes** de retirar el contenedor.

## Contrato compartido (ambos clientes)

- Auth + RLS; en cliente solo la **publishable key** (`SUPABASE_PUBLISHABLE_KEY`
  vía BuildConfig / `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Jamás `service_role`.
- Escrituras sensibles vía RPC transaccionales (`conductor_solicita_asignacion`,
  `preparar_conductor_e2e` en tests), no escrituras directas.
- Mismo canal de distribución: el release nativo conserva el
  `applicationId`; `debug` usa `.native.debug` para coexistir instalado.

## Checklist de paridad para retirar Capacitor

1. Evidencia (foto) + upload a Storage con reintentos.
2. Documentos: carga/reemplazo vía `validar-documento-conductor`.
3. Incidencias + avance de estados del traslado.
4. Push FCM (`despachar-notificaciones-push`) con permisos nativos.
5. Paridad de UI crítica (tokens `design-system`, modo calle, offline).
6. `android:test` + `android:lint` en verde y `check:native` en CI.

## Controles

- `pnpm check:native` (`scripts/check-native.mjs`, corre en CI sin SDK):
  applicationId, sufijo debug, sin secretos en `app/src/main`, manifest sin
  cleartext, `versionName` sobre `config/app-version.json`.
- `pnpm scan:secrets` cubre `.kt`/`.kts`/`.java`.
- Controles pesados solo locales (requieren Android SDK):
  `pnpm android:native:build|lint|test`.
