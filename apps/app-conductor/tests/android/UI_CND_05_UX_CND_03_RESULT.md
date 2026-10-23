# UI-CND-05 / UX-CND-03 — resultado del intento Android

Fecha: 23 de octubre de 2026. Decisión: **NO-GO; validación Android pendiente**.

## Candidato y evidencias

- HEAD inspeccionado: `959eee42c9aa9d429fd2ce8d284d8406384ebed9`, rama `main`.
- El árbol de trabajo tiene cambios de UI sin publicar. El CI de ese HEAD no certifica todavía esos cambios.
- APK local encontrado: `android/app/build/outputs/apk/debug/app-debug.apk`, versión 1.0.0, versionCode 10000, generado el 21 de octubre. Es un artefacto debug previo a los últimos cambios; no se presentó como candidato firmado de producción ni se instaló durante este intento.
- SHA-256 de ese APK: `bc117b6759af7e0832e885761f879e4da1588d298d7e8be409db74b91c3daf02`.
- Preflight real: `artifacts/android-native/2026-10-23T20-45-47-716Z-preflight/report.json`, confirmado nuevamente en `artifacts/android-native/2026-10-23T20-49-42-213Z-preflight/report.json`. Estado `BLOCKED`, salida 2, sin capturas de app y sin Android autorizado en estado `device`.

## Android

No había dispositivos físicos conectados ni AVD configurado. Se creó `Ruum_QA` con una imagen Android 37.0 Google Play x86_64 ya instalada, pantalla 640×1136 y densidad 320 (objetivo 320×568 CSS antes de los insets nativos). WHPX está disponible.

Se intentó arrancar sin ventana, sin snapshots y con renderizado SwiftShader. Se reintentó con un núcleo y menor RAM solicitada. La imagen elevó la asignación a 4096 MB; Windows reportó aproximadamente 306 MB de RAM física libre durante el primer intento. Android permaneció `offline` en ADB y no llegó a una sesión operativa durante las comprobaciones. Esto es un bloqueo del entorno de ejecución, no evidencia de un defecto de teclado en la app.

Al finalizar se detuvieron únicamente los procesos del AVD creados para esta auditoría para recuperar recursos. Se conserva su configuración como `Ruum_QA`. El recolector pasó comprobación de sintaxis y ESLint; se verificó que el preflight sin Android operativo devuelve el bloqueo esperado, sin conceder PASS/GO.

| Gate de Android | Resultado |
|---|---|
| Login con IME nativo desplegado | PENDIENTE: sin dispositivo operativo |
| Registro: Cuenta, Identidad y Licencia | PENDIENTE: sin dispositivo operativo |
| Perfil y confirmación de sesión con IME | PENDIENTE: sin dispositivo operativo |
| Inputs y CTA sobre teclado | PENDIENTE: sin capturas ni hit-testing Android |
| Notch, gestos, tres botones y rotación | PENDIENTE: sin prueba Android |

Las 42 pruebas Chromium y las nueve unitarias aprobadas en la validación anterior siguen siendo evidencia de escritorio/fixture. No se reclasifican como prueba física ni como IME nativo.

## Pipeline remoto

Se revisaron los checks completos del HEAD mediante GitHub CLI, además de los estados de despliegue del conector. La [ejecución de CI](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374) **no está verde**:

| Check | Resultado |
|---|---|
| [Conductor: E2E crítica + UI](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753351) | SUCCESS en HEAD remoto |
| [Conductor: unitarias](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753191) | SUCCESS en HEAD remoto |
| [Conductor: cobertura UI crítica](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753188) | SUCCESS en HEAD remoto |
| [Usuario: unitarias](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753906) | FAILURE |
| [Usuario: E2E](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753332) | FAILURE |
| [Auditoría de dependencias](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/40009406374/job/120605753253) | FAILURE en `Run pnpm audit:deps` |

Los estados Vercel correctos no compensan estos gates fallidos. No se cambiaron los jobs fallidos ni sus umbrales para obtener GO.

## Para cerrar el ticket

Ejecutar el [protocolo Android](UI_CND_05_UX_CND_03_PROTOCOL.md) con un Android físico autorizado o un emulador que complete el arranque, sobre el artefacto candidato identificado. Adjuntar evidencia nativa para cada fila, resolver los bloqueos de CI y repetir el pipeline sobre el código candidato. Mantener NO-GO hasta contar con ambos resultados.

Esta decisión corresponde a la auditoría de teclado/layout solicitada; no sustituye la certificación de liberación completa del runbook.
