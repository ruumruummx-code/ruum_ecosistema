# Constantes Conductor — Convención y Catálogo

> **Convención:** Constantes en `SCREAMING_SNAKE`, centralizadas cerca del uso. Valores mágicos prohibidos en UI. Documentar unidad y origen (PRD / migración).

## App Conductor (`src/lib`, `packages/api`, `packages/shared`)

| Constante | Valor | Ubicación | Origen |
|-----------|-------|-----------|--------|
| `TAMANO_MAX_DOCUMENTO_BYTES` | `10 *1024*1024` (10 MB) | `packages/api/src/services/conductores.ts:22` | PRD §7 documentos |
| `EXTENSIONES_DOCUMENTO_PERMITIDAS` | `jpg/jpeg/png/webp/pdf` | mismo | validación UI + Edge Function |
| `TAMANO_MAX_FOTO_PERFIL_BYTES` | `5 MB` | mismo | UX perfil |
| `TTL_COLA_EVIDENCIA_MS` | `7d` | `src/lib/cola-offline.ts:34` | OFF-001, auditoría |
| `MAX_REINTENTOS_EVIDENCIA` | `15` | mismo | backoff `[60s,5m,15m,60m]` (`BACKOFF_REINTENTO_MS`) |
| `TIMEOUT_UPLOAD_MS` | `15_000` | `src/lib/cola-offline.ts:15` | PERF-004 |
| `TIMEOUT_UPSERT_MS` | `10_000` | mismo | PERF-004 |
| `RETENCION_CACHE_MS` | `72h` | `src/lib/offline-active-trip-cache.ts:76` | offline shell |
| `MAX_PUNTOS_COLA` | `500` | `src/lib/cola-telemetria-offline.ts:9` | telemetría |
| `DISTANCIA_SIGNIFICATIVA_M` | `25m` | `src/lib/cola-telemetria-offline.ts:10` | no guardar ruido GPS |

## Reglas de Contribución
- Nuevas constantes deben tener test en `test/*.test.ts` (o junto al módulo) y referencia en esta tabla.
- Usar `@ruum/shared/constants` para constantes cruzadas (mensajes-ux, tipos-vehiculo, terminos).
- No duplicar: importar desde `conductores.ts` / `cola-offline.ts`, no redefinir `10*1024*1024` suelto.
