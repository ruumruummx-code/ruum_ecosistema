# Cobertura de los flujos críticos del conductor

Fecha: 2026-10-22 · Ámbito: `apps/app-conductor` (PWA/Capacitor del conductor)

Este documento cruza los **flujos críticos** con el test que los cubre. El
gate de cobertura (job `coverage-conductor` del CI, umbrales en
`apps/app-conductor/vitest.config.ts`) falla si la cobertura baja; esta tabla
es la foto de qué está cubierto y **qué sigue siendo deuda**.

## Umbrales vigentes (trinquete: sólo suben)

| Ámbito | Umbral | Medido (2026-10-22) |
|---|---|---|
| Global (src/lib + 4 rutas críticas) | lines/statements **40%**, branches 70%, functions 65% | 50.4% / 72.2% / 66.8% |
| `src/app/viajes/*/evidencia/**` | **60%** | 78.6% lines |
| `src/app/viajes/*/cierre/**` | **60%** | 100% lines |
| `src/app/ganancias/**` | **60%** | 97.6% lines |
| `src/app/cuenta/datos-bancarios/**` | **60%** | 100% lines |

## Flujos críticos × cobertura

| Flujo | Test unitario | E2E | Estado |
|---|---|---|---|
| **Login** | `auth-state.test.ts`, `root-page-auth-redirect.test.ts` | `login-mobile-rc-2026-001.spec.ts` (4), `sprint-c5-critical-flows.spec.ts` | ✅ cubierto |
| **Evidencia** | `use-evidencia-page-logic.test.tsx` (12), `use-evidence-queue-hook.test.tsx` (7), `evidence-requirements.test.ts` (8), `use-evidence-queue.test.ts`, `use-evidence-comparison.test.ts`, `document-checklist.test.ts`, `cola-offline.test.ts` (21) | `offline-queue.spec.ts` (4), `sprint-c5-critical-flows.spec.ts` ("progresión desde evidencia inicial hasta cierre") | ✅ cubierto |
| **Cierre** | `cierre-types.test.ts` (2, sólo contrato de datos), `secondary-trip-navbar-gastos.test.ts`, `trip-details-operacion-tab.test.ts` | `sprint-c5-critical-flows.spec.ts` ("estado de pagos en ganancias después del cierre"), `flujo-oportunidades-y-traslados.spec.ts` | ⚠️ **parcial** → deuda D-01 |
| **Offline** | `cola-offline.test.ts`, `cola-telemetria-offline.test.ts`, `offline-orchestrator.test.ts`, `offline-index.test.ts`, `offline-startup-validation.test.ts`, `orquestador-sync-offline.test.ts`, `almacenamiento-seguro-evidencia.test.ts`, `evidencias-descartadas.test.ts`, `active-trip-state.test.ts`, `use-driver-location-tracking.test.ts` | `offline-queue.spec.ts` (4), `driver-account.spec.ts` ("barra local refleja desconexión") | ✅ cubierto |
| **Recuperación** | `auth-callback-recuperar-password.test.ts` | `recuperacion-password-pr02.spec.ts` (9, incluidos los negativos), `sprint-c5-critical-flows.spec.ts` (2) | ✅ cubierto |

## Deuda explícita (sin unitario **ni** E2E que lo cubra)

| # | Deuda | Ficheros | Fecha compromiso |
|---|---|---|---|
| **D-01** | UI del cierre de traslado: gastos, conciliación, modal de confirmación, pantalla de éxito y hoja de soporte. Hoy sólo hay contrato de datos (`cierre-types.ts`) y los E2E no exercises estas secciones. | `src/app/viajes/*/cierre/CierreGastosSection.tsx`, `CierreConciliacionSection.tsx`, `CierreConfirmacionModal.tsx`, `CierreExitoPantalla.tsx`, `CierreSoporteSheet.tsx` | 2026-11-15 |
| **D-02** | Componentes visuales de la evidencia (checklist, captura, secciones de/km-combustible/llaves/notas, hojas de CSAT y soporte). La **lógica** ya está medida al 78.6%. | `src/app/viajes/*/evidencia/EvidenceChecklist.tsx`, `EvidenceCaptureStep.tsx`, `Evidencia*Section.tsx`, `EvidenciaCsatSheet.tsx`, `EvidenciaSoporteSheet.tsx` | 2026-11-30 |
| **D-03** | Vista de ganancias: el hook y el resumen están medidos (97.6%), pero los componentes de pantalla (`DriverEarningsView`, `EarningsSummary`, `EarningsTimeline`, `EarningsTabs`) siguen en 0%. El E2E `driver-earnings.spec.ts` cubre la pantalla, no la lógica. | `src/app/ganancias/*.tsx` ( salvo `earnings-summary.ts` y `useEarningsLedger.ts`) | 2026-12-15 |
| **D-04** | Vista de datos bancarios: `bank-catalog.ts` medido al 100%, la vista no. Cubierto por E2E (`driver-bank-certification.spec.ts`), no por unitario. | `src/app/cuenta/datos-bancarios/DriverBankDetailsView.tsx`, `page.tsx` | 2026-12-15 |
| **D-05** | Arranque en frío sin red (shell local): sin cobertura porque la decisión está en el ADR-0001 (protocolo operativo para el piloto). Si Operación exige la solución técnica, el shell entra en el gate. | `src/app/OfflineShell.tsx`, `src/app/PWABootstrap.tsx` | 2026-12-31 (sujeto a ADR-0001) |

## Cómo se cierra una deuda

1. Añadir el test (unitario con jsdom si es vista, E2E si es flujo).
2. Quitar la ruta de la lista `exclude` de `apps/app-conductor/vitest.config.ts`.
3. Subir su glob en `thresholds` al valor real+5 (nunca por debajo).
4. Subir el global sólo cuando la ruta aguante el umbral nuevo.
5. Marcar la deuda como cerrada en esta tabla con la fecha real.

## Referencias

- `apps/app-conductor/vitest.config.ts` — umbrales y lista explícita de lo que aún no se mide.
- `.github/workflows/ci.yml` — job `coverage-conductor`.
- `docs/adr/0001-offline-arranque-en-frio.md` — decisión sobre el arranque sin red (D-05).
