import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    exclude: ["tests/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // El porcentaje global sólo considera código de producción; scripts,
      // configuración de herramientas y artefactos no deben diluirlo.
      include: ["src/**/*.{ts,tsx}"],
      // ─────────────────────────────────────────────────────────────────────
      // GATE DE COBERTURA (trinquete: sólo puede subir, nunca bajar).
      //
      // Antes: `src/app/**` y `src/components/**` excluidos de golpe, así que
      // el 41% medido sólo hablaba de src/lib y las cuatro rutas críticas
      // (evidencia, cierre, ganancias, datos bancarios) no tenían gate.
      //
      // Ahora: el gate global mide src/lib + las cuatro rutas críticas, y
      // cada ruta tiene su propio umbral por glob. La lista de `exclude` es
      // EXPLÍCITA: cada ruta que aún no se mide aparece nombrada con el motivo
      // (no hay comodines tipo `src/app/**` que oculten 200 ficheros).
      //
      // Para medir una ruta nueva: quita su entrada de `exclude`, añade su
      // glob en `thresholds` con el umbral que te comprometas a sostener y sube
      // el global sólo cuando la ruta aguante.
      // ─────────────────────────────────────────────────────────────────────
      thresholds: {
        // Gate global de código de producción.
        lines: 60,
        branches: 60,
        functions: 60,
        statements: 60,
        // Rutas críticas: 50 → 60 (subida de 2026-10-22). El aggregate es el
        // de los ficheros medidos de cada ruta (los .tsx de presentación se
        // listan en `exclude` con su motivo).
        // Nota: el segmento dinámico del detalle de traslado se escribe como
        // `*` (no como `[id]`): los matchers de cobertura (minimatch para
        // `exclude`, picomatch para `thresholds`) tratan los corchetes como
        // clase de caracteres y el patrón no casaría con la carpeta real.
        "src/app/viajes/*/evidencia/**": { lines: 60, branches: 60, functions: 60, statements: 60 },
        "src/app/viajes/*/cierre/**": { lines: 60, branches: 60, functions: 60, statements: 60 },
        "src/app/ganancias/**": { lines: 60, branches: 60, functions: 60, statements: 60 },
        "src/app/cuenta/datos-bancarios/**": { lines: 60, branches: 60, functions: 60, statements: 60 }
      },
      exclude: [
        // ── Infraestructura: nunca se mide ──────────────────────────────────
        "test/**",
        "tests/**",
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "coverage-scan/**",
        "cap-shell/**",
        "android/**",
        "storybook-static/**",
        "**/storybook-static/**",

        // ── Deuda de cobertura DECLARADA ─────────────────────────────────────
        // Cada entrada nombra una ruta concreta que aún NO se mide, con el
        // motivo. Cuando una ruta tenga test unitario o E2E que la justifique,
        // se quita su línea de aquí (y se sube su umbral en `thresholds`).

        // (1) Route Handlers y callbacks: se prueban por contrato/estado
        //     (test/health-route.test.ts, test/auth-callback-recuperar-password.test.ts)
        //     y de punta a punta en E2E; no aportan señal de cobertura de UI.
        "src/app/api/csp-report/**",
        "src/app/api/health/**",
        "src/app/api/recovery/clear/**",
        "src/app/api/recovery/verify/**",
        "src/app/auth/**",

        // (2) Pantallas de una sola vista (presentación pura, sin lógica de
        //     negocio): se cubren con E2E cuando aplican.
        "src/app/403/**",
        "src/app/actualizacion-requerida/**",
        "src/app/configuracion/**",
        "src/app/documentos/**",
        "src/app/legal/**",
        // La lógica de validación de login sí tiene unit tests; se excluye
        // sólo la página de presentación.
        "src/app/login/page.tsx",
        "src/app/nueva-password/**",
        "src/app/notificaciones/**",
        "src/app/onboarding/**",
        "src/app/panel/**",
        "src/app/recuperar-password/**",
        // La lógica de validación del registro tiene unit tests. Estas piezas
        // son presentación y permanecen fuera del cálculo global.
        "src/app/registro/AccountStep.tsx",
        "src/app/registro/DenseField.tsx",
        "src/app/registro/DiditVerificationModal.tsx",
        "src/app/registro/DocumentUploadField.tsx",
        "src/app/registro/DocumentsStep.tsx",
        "src/app/registro/DraftRecoveryModal.tsx",
        "src/app/registro/IdentityStep.tsx",
        "src/app/registro/LicenseConsentDetails.tsx",
        "src/app/registro/LicenseStep.tsx",
        "src/app/registro/OtpVerification.tsx",
        "src/app/registro/RegistrationAccessHeader.tsx",
        "src/app/registro/RegistrationIcon.tsx",
        "src/app/registro/RegistrationNotice.tsx",
        "src/app/registro/RegistrationProgress.tsx",
        "src/app/registro/RegistrationSheet.tsx",
        "src/app/registro/RegistrationShell.tsx",
        "src/app/registro/ReviewStep.tsx",
        "src/app/registro/ReviewSummary.tsx",
        "src/app/registro/SelectField.tsx",
        "src/app/registro/page.tsx",
        "src/app/registro/registration.module.css",
        // Hooks de integración remota y orquestación del expediente todavía
        // requieren pruebas de integración aisladas antes de entrar al gate.
        "src/app/registro/registration-types.ts",
        "src/app/registro/useRegistrationDocuments.ts",
        "src/app/registro/useRegistrationDraft.ts",
        "src/app/registro/useRegistrationTelemetry.ts",
        "src/app/registro/useRegistroConductorLogic.ts",
        "src/app/components/**",
        // Componentes de app (shell, PWAs, offline shell, layouts): son
        // cableado de UI; su comportamiento se prueba en los E2E.
        "src/app/ConfirmarDisponibilidad.tsx",
        "src/app/EstadoError.tsx",
        "src/app/EstadoSincronizacionGlobal.tsx",
        "src/app/EstadoTrackingGlobal.tsx",
        "src/app/ModoCalleActivador.tsx",
        "src/app/NavegacionConductor.tsx",
        "src/app/OfflineShell.tsx",
        "src/app/OperationalAccessibilityBridge.tsx",
        "src/app/PWABootstrap.tsx",
        "src/app/PushNotificationsBootstrap.tsx",
        "src/app/SincronizadorEvidenciaOffline.tsx",
        "src/app/VersionGate.tsx",
        "src/app/ViajeActivoContext.tsx",
        "src/app/error.tsx",
        "src/app/global-error.tsx",
        "src/app/layout.tsx",
        "src/app/not-found.tsx",
        "src/app/page.tsx",
        "src/app/useActiveTripPolling.ts",

        // (3) Cuenta del conductor: la lógica vive en src/lib (medida) y las
        //     vistas son de presentación; falta unitario del perfil completo.
        "src/app/cuenta/certificacion/**",
        "src/app/cuenta/documentos/**",
        "src/app/cuenta/legal/**",
        "src/app/cuenta/perfil/**",
        "src/app/cuenta/preferencias/**",
        "src/app/cuenta/seguridad/**",
        "src/app/cuenta/soporte/**",
        "src/app/cuenta/AccountIcon.tsx",
        "src/app/cuenta/CuentaHeader.tsx",
        "src/app/cuenta/DetailsDialog.tsx",
        "src/app/cuenta/DetailsNotice.tsx",
        "src/app/cuenta/DriverAccountView.tsx",
        "src/app/cuenta/DriverDetailsShell.tsx",
        "src/app/cuenta/ServiceIcon.tsx",
        "src/app/cuenta/datos-sensibles.stories.tsx",
        "src/app/cuenta/datos-sensibles.tsx",
        "src/app/cuenta/error.tsx",
        "src/app/cuenta/page.tsx",

        // (4) Ruta crítica "datos bancarios": se mide su catálogo de bancos
        //     (bank-catalog.ts); la vista y la página son de presentación.
        "src/app/cuenta/datos-bancarios/DriverBankDetailsView.tsx",
        "src/app/cuenta/datos-bancarios/page.tsx",

        // (5) Ruta crítica "ganancias": se mide su lógica (useEarningsLedger.ts,
        //     earnings-summary.ts); los componentes visuales quedan fuera.
        "src/app/ganancias/DriverEarningsLedger.tsx",
        "src/app/ganancias/DriverEarningsView.tsx",
        "src/app/ganancias/EarningsPayoutsSection.tsx",
        "src/app/ganancias/EarningsSummary.tsx",
        "src/app/ganancias/EarningsTabs.tsx",
        "src/app/ganancias/EarningsTimeline.tsx",
        "src/app/ganancias/EarningsTripRow.tsx",
        "src/app/ganancias/InfoSheet.tsx",
        "src/app/ganancias/error.tsx",
        "src/app/ganancias/loading.tsx",
        "src/app/ganancias/page.tsx",
        "src/app/ganancias/historial/**",

        // (6) Detalle del traslado: la lógica está en src/lib (medida) y en los
        //     hooks de evidencia (medidos); el resto son componentes de vista.
        "src/app/viajes/page.tsx",
        "src/app/viajes/AcceptedTripCard.tsx",
        "src/app/viajes/DriverTrasladosView.tsx",
        "src/app/viajes/OfertaCard.tsx",
        "src/app/viajes/RejectTripDialog.tsx",
        "src/app/viajes/TrasladosIcon.tsx",
        "src/app/viajes/TripPreviewCard.tsx",
        "src/app/viajes/UndoRechazoToast.tsx",
        "src/app/viajes/ViajesDateNavigator.tsx",
        "src/app/viajes/ViajesFilters.tsx",
        "src/app/viajes/ViajesMapa.tsx",
        "src/app/viajes/ViajesSearch.tsx",
        "src/app/viajes/WeekDaySelector.tsx",
        "src/app/viajes/error.tsx",
        "src/app/viajes/loading.tsx",
        "src/app/viajes/*/ChatViaje.tsx",
        "src/app/viajes/*/CierreTrasladoDetails.tsx",
        "src/app/viajes/*/ConduceADestinoDetails.tsx",
        "src/app/viajes/*/ContactActionBar.tsx",
        "src/app/viajes/*/ContactoRecepcionVehiculo.tsx",
        "src/app/viajes/*/ContactoYVehiculo.tsx",
        "src/app/viajes/*/DirigeteAOrigenDetails.tsx",
        "src/app/viajes/*/EmergencyPanel.stories.tsx",
        "src/app/viajes/*/EmergencyPanel.tsx",
        "src/app/viajes/*/LocalizarVehiculoDetails.tsx",
        "src/app/viajes/*/MapaRutaConduccion.tsx",
        "src/app/viajes/*/MapaRutaOrigen.tsx",
        "src/app/viajes/*/NavigationLauncher.tsx",
        "src/app/viajes/*/ReportarIncidencia.tsx",
        "src/app/viajes/*/SecondaryTripNavBar.tsx",
        "src/app/viajes/*/StickyTripActions.tsx",
        "src/app/viajes/*/TrasladoAsignadoDetails.tsx",
        "src/app/viajes/*/TripOpportunityDetails.tsx",
        "src/app/viajes/*/error.tsx",
        "src/app/viajes/*/page.tsx",
        "src/app/viajes/*/quick-messages.ts",
        "src/app/viajes/*/detalles/**",
        "src/app/viajes/*/gastos/**",
        "src/app/viajes/*/incidencia/**",
        "src/app/viajes/*/soporte/**",

        // (7) Ruta crítica "evidencia": se mide su lógica (evidence-requirements,
        //     useEvidenceComparison, useEvidenceQueue, useEvidenciaPageLogic);
        //     los componentes de la checklist, la foto y las hojas son de vista.
        "src/app/viajes/*/evidencia/EvidenceCaptureStep.stories.tsx",
        "src/app/viajes/*/evidencia/EvidenceCaptureStep.tsx",
        "src/app/viajes/*/evidencia/EvidenceChecklist.tsx",
        "src/app/viajes/*/evidencia/EvidenceComparisonDisplay.tsx",
        "src/app/viajes/*/evidencia/EvidenceContext.tsx",
        "src/app/viajes/*/evidencia/EvidencePreview.tsx",
        "src/app/viajes/*/evidencia/EvidenceReference.tsx",
        "src/app/viajes/*/evidencia/EvidenceReview.tsx",
        "src/app/viajes/*/evidencia/EvidenceSyncStatus.tsx",
        "src/app/viajes/*/evidencia/EvidenceWizard.tsx",
        "src/app/viajes/*/evidencia/EvidenciaCsatSheet.tsx",
        "src/app/viajes/*/evidencia/EvidenciaDocumentosSection.tsx",
        "src/app/viajes/*/evidencia/EvidenciaFooter.tsx",
        "src/app/viajes/*/evidencia/EvidenciaFotosSection.tsx",
        "src/app/viajes/*/evidencia/EvidenciaHeader.tsx",
        "src/app/viajes/*/evidencia/EvidenciaKmCombustibleSection.tsx",
        "src/app/viajes/*/evidencia/EvidenciaLlavesSection.tsx",
        "src/app/viajes/*/evidencia/EvidenciaNotasSection.tsx",
        "src/app/viajes/*/evidencia/EvidenciaProgress.tsx",
        "src/app/viajes/*/evidencia/EvidenciaSoporteSheet.tsx",
        "src/app/viajes/*/evidencia/EvidenciaStepper.tsx",
        "src/app/viajes/*/evidencia/error.tsx",
        "src/app/viajes/*/evidencia/page.tsx",

        // (8) Ruta crítica "cierre": se mide su contrato de datos
        //     (cierre-types.ts); las secciones y hojas son de presentación.
        "src/app/viajes/*/cierre/CierreConciliacionSection.tsx",
        "src/app/viajes/*/cierre/CierreConfirmacionModal.tsx",
        "src/app/viajes/*/cierre/CierreExitoPantalla.tsx",
        "src/app/viajes/*/cierre/CierreGastosSection.tsx",
        "src/app/viajes/*/cierre/CierreSoporteSheet.tsx",

        // (9) UI compartida: sin test de render todavía; se migra a unitarios
        //     con jsdom cuando se toque cada pieza.
        "src/components/Breadcrumbs.tsx",
        "src/components/ConfirmDialog.tsx",
        "src/components/ConductorUI.tsx",
        "src/components/ErrorBoundaryConductor.tsx",
        "src/components/GuidedTour.tsx",
        "src/components/LiveRegionProvider.tsx",
        "src/components/SincronizacionBadge.tsx",
        "src/components/icons.tsx",
        "src/components/v2/**"
      ]
    }
  }
});
