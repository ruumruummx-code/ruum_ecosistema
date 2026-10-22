# Fase 5 — Acta de validación App Conductor

Estado: validado técnicamente / aprobado para piloto con mitigación operativa.

Esta acta concentra la evidencia de validación de Fase 5 para App Conductor. No sustituye los reportes
automatizados de CI; registra la decisión operativa sobre dispositivo, ambiente y casos críticos.

## Datos de ejecución

| Campo | Valor |
| --- | --- |
| Commit | `HEAD` (Fase 5 - validación técnica completada) |
| Fecha | 2026-10-21 |
| Ambiente | Staging / Emulador Android & Dispositivos de Validación |
| Build | Fase 5 Release Candidate (Capacitor Android API 33/34) |
| Dispositivo | Emulador Pixel 6 / Android Físico de pruebas |
| Version Android | Android 13 (API 33) / Android 14 (API 34) |
| Ejecutor | QA / Equipo de Desarrollo Móvil |
| Artifacts CI | `playwright-report`, `axe-results.json`, `.lighthouse-ci`, `storybook-static`, `test-results`, capturas |

## Casos críticos

| Caso | Resultado | Evidencia | Incidencias | Decision |
| --- | --- | --- | --- | --- |
| OP-OFF-01 — App abierta y pérdida de red | PASS técnico (riesgo aceptado) | `apps/app-conductor/tests/android/offline-startup-validation.md` | Viaje activo preservado en estado local y cola en Preferences | Aprobado para piloto: la app conserva contexto en memoria viva y encola evidencia |
| OP-OFF-02 — App en segundo plano y pérdida de red | PASS técnico (riesgo aceptado) | `apps/app-conductor/tests/android/offline-startup-validation.md` | Refresco al reanudar; conserva último estado conocido si falla red | Aprobado para piloto con protocolo de continuidad |
| OP-OFF-03 — Arranque sin red | Riesgo aceptado para piloto | `apps/app-conductor/tests/android/offline-startup-validation.md` | Offline de arranque no soportado por shell remoto | Piloto: mantener la app abierta; Producción: iniciativa de shell local operativo |
| OP-OFF-04 — App cerrada con viaje activo y evidencia pendiente | PASS técnico (riesgo aceptado) | `apps/app-conductor/tests/android/offline-startup-validation.md` | Evidencia encolada persiste en Preferences; requiere red para reconstrucción de viaje completo | Aprobado para piloto: mitigación con protocolo Torre de Control |
| EV-PRV-01 — Evidencia privada con signed URL tras recargar | PASS técnico | `apps/app-conductor/test/storage.test.ts` | Ninguna; URLs firmadas con expiración y control de acceso | Aprobado |
| EV-QUE-01 — Recuperación de evidencia después de reinicio | PASS técnico | `apps/app-conductor/tests/android/offline-startup-validation.md`, `cola-offline.ts` | Ninguna; persistencia en `ruum_cola_evidencia` de `@capacitor/preferences` | Aprobado |
| GEO-01 — Confirmación dentro de 500 m | PASS técnico | `apps/app-conductor/tests/android/location-geofence-matrix.md` | Ninguna; RPC atómica `conductor_confirmar_llegada_destino` | Aprobado |
| GEO-02 — Confirmación fuera de 500 m | PASS técnico | `apps/app-conductor/tests/android/location-geofence-matrix.md` | Requiere doble confirmación consciente; audita `p_fuera_geocerca=true` y `p_distancia_m` | Aprobado para Torre de Control |
| AND-CAM-01 — Permisos de cámara y retorno desde ajustes | PASS técnico | `apps/app-conductor/tests/android/camera-permission-matrix.md` | Denegación permanente guiada a ajustes; alternativa de galería disponible | Aprobado |
| AND-BKP-01 — Seguridad de backup Android | PASS técnico | `apps/app-conductor/test/android-backup-security.test.ts`, `apps/app-conductor/tests/android/backup-security-decision.md` | Ninguna | `allowBackup=false` y exclusiones defensivas |

## Evidencia y política de artifacts

Los artifacts permitidos son `playwright-report/`, `results/axe-results.json`, `.lighthouse-ci/*.html`,
`.lighthouse-ci/*.json`, `storybook-static/`, `artifacts/a11y/`, `test-results/` y capturas sanitizadas.

No deben publicarse sesiones/cookies, tokens, evidencia real de vehículos, URLs firmadas, datos personales,
documentos, VIN, placas completas ni teléfonos reales. La retención esperada es de 14 días en pull requests
y 90 días en `main`/`release`.

## Incidencias abiertas

| ID | Severidad | Descripción | Responsable | Estado |
| --- | --- | --- | --- | --- |
| F5-OFF-BOOT | Alta | No existe arranque offline completo con app cerrada y sin red | Tecnología / Producto / Operación | Riesgo aceptado para piloto; iniciativa requerida para producción |
| F5-ANDROID-DEVICE | Media | Validación formal de matrices de campo en dispositivo físico | QA / Operación | Cerrada técnicamente para piloto mediante matrices F5-08, F5-09, F5-10 y protocolo de mitigación offline |

## Decision final

| Area | Responsable | Decision | Fecha |
| --- | --- | --- | --- |
| Producto | Liderazgo de Producto | Aprobado para piloto con mitigación operativa de app abierta | 2026-10-21 |
| Operacion | Torre de Control / Operaciones | Aprobado; matrices F5-08, F5-09, F5-10 y protocolo sin red integrados en procedimiento | 2026-10-21 |
| Tecnologia | Arquitectura / Móvil | Aprobado técnicamente; cierre de matrices y suites automatizadas ejecutadas | 2026-10-21 |
