# Inventario de overrides

Se analizaron importaciones nombradas de @ruum/ui en apps/**/*.tsx y redeclaraciones de tokens conocidos en CSS. No se resuelven todas las propagaciones, wrappers, namespace imports o CSS externo: no constituye prueba de ausencia global de overrides.

462 usos, 105 candidatos de override/props dinámicas y 354 redeclaraciones de tokens.

Las instancias del showcase final no reciben className/style que reparen su apariencia. El host solo aporta padding externo, rótulos de auditoría y área mínima de captura. No se cargan estilos de apps. Los candidatos de consumidores conservan justificación y veredicto preliminar por fila; no se inventaron aprobaciones nominales. La revisión de compensaciones corresponde a SD-REM-010.

| Archivo/línea | Componente | Tipo | Expresión | Categoría | Justificación | Veredicto |
|---|---|---|---|---|---|---|
| apps/app-conductor/src/app/cuenta/seguridad/page.tsx:102 | Card | className | `className="border-red-500/20 bg-red-500/5"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/cuenta/soporte/page.tsx:162 | Card | className | `className="border-red-500/20 bg-red-500/5"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/EstadoError.tsx:54 | Button | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/ganancias/EarningsPayoutsSection.tsx:33 | Card | className | `className="p-4"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/ganancias/EarningsSummary.tsx:30 | Card | className | `className="flex flex-col border-border/40"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/ganancias/EarningsSummary.tsx:39 | Card | className | `className="flex flex-col border-border/40"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/ganancias/EarningsSummary.tsx:51 | FinancialCard | className | `className="overflow-hidden p-0 border-border/60"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/login/page.tsx:150 | Button | className | `className={styles.submit}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/nueva-password/page.tsx:187 | Button | className | `className="mt-2 w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/OfflineShell.tsx:108 | Button | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/onboarding/page.tsx:88 | Button | className | `className="min-h-12 w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/panel/EstadoRevisionConductor.tsx:278 | Button | className | `className="w-full shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/panel/EstadoRevisionConductor.tsx:399 | Button | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/recuperar-password/page.tsx:97 | Button | className | `className="mt-2 w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/DiditVerificationModal.tsx:101 | Button | aria-label | `aria-label="Cerrar verificación"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/DiditVerificationModal.tsx:102 | Button | className | `className="p-2"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/DiditVerificationModal.tsx:165 | Button | className | `className="w-full sm:w-auto text-xs py-2 px-4 min-h-10"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/registro/DocumentUploadField.tsx:175 | MapaEstatico | className | `className="shrink-0 rounded-lg object-cover ring-1 ring-border"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/registro/DraftRecoveryModal.tsx:60 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/DraftRecoveryModal.tsx:63 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/page.tsx:98 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/page.tsx:111 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/page.tsx:312 | Button | className | `className="flex-1"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/page.tsx:323 | Button | className | `className="flex-1"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/registro/page.tsx:400 | Button | className | `className={[                       "min-h-12 min-w-12 px-6 py-3.5 font-display text-base font-bold leading-6",                       "shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",                       "focus-visible:outline-route-action focus-visible:outline-[3px] focus-visible:outline-offset-2",                       r.paso === 0 ? "sm:col-start-2 w-full" : "w-full",                     ].join(" ")}` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/registro/page.tsx:417 | Button | className | `className={[                       "w-full min-h-12 px-6 py-3.5 font-display text-base font-bold leading-6",                       "shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",                       "focus-visible:outline-route-action focus-visible:outline-[3px] focus-visible:outline-offset-2",                     ].join(" ")}` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/viajes/[id]/ContactActionBar.tsx:128 | Button | className | `className="w-full sm:w-auto min-h-11"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/EmergencyPanel.tsx:286 | Button | aria-label | `aria-label="Abrir emergencia"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/EmergencyPanel.tsx:286 | Button | className | `className={compact ? "min-h-11 px-2 text-xs" : "min-h-[var(--ruum-button-height-street)] w-full text-[17px] sm:w-auto"}` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-conductor/src/app/viajes/[id]/evidencia/EvidenceComparisonDisplay.tsx:42 | Button | className | `className="mt-3"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/evidencia/EvidencePreview.tsx:53 | MapaEstatico | className | `className="object-cover"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/evidencia/EvidenciaFotosSection.tsx:77 | MapaEstatico | className | `className="object-cover"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/MapaRutaConduccion.tsx:80 | MapaEstatico | className | `className="object-cover"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/MapaRutaOrigen.tsx:57 | MapaEstatico | className | `className="object-cover"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/ReportarIncidencia.tsx:290 | Button | className | `className="min-h-12 w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-conductor/src/app/viajes/[id]/ReportarIncidencia.tsx:391 | Button | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:273 | MobileShell | className | `className="user-v2-scope user-account-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:281 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:284 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:311 | MobileShell | className | `className="user-v2-scope user-account-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:316 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:319 | Button | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:342 | Button | className | `className="font-display font-semibold text-xs"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:415 | Icono | className | `className="size-3.5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/cuenta-ui.tsx:465 | Icono | className | `className="size-[18px]"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:76 | Icono | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:188 | Icono | className | `className="size-5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:199 | Icono | className | `className="size-5 shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:416 | Icono | className | `className="size-5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:441 | Icono | className | `className="size-5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/CuentaCliente.tsx:468 | Icono | className | `className="size-5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/DatosPersonales.tsx:447 | Icono | className | `className="size-4"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/Facturacion.tsx:478 | Icono | className | `className="size-4"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/loading.tsx:4 | MobileShell | className | `className="user-v2-scope user-account-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/page.tsx:24 | MobileShell | className | `className="user-v2-scope user-account-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/PantallaCuentaResponsive.tsx:25 | MobileShell | className | `className={`user-v2-scope ${titulo === "Mi perfil" ? "user-profile-shell" : "user-preferences-shell"}`}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/preferencias/PreferenciasCliente.tsx:213 | MobileShell | className | `className="user-v2-scope user-preferences-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/Preferencias.tsx:340 | Icono | className | `className="size-4 shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/Preferencias.tsx:356 | Icono | className | `className="size-4 shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/vehiculos/page.tsx:28 | MobileShell | className | `className="user-v2-scope user-vehicles-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/vehiculos/[id]/page.tsx:42 | MobileShell | className | `className="user-v2-scope user-vehicles-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/VerificacionDocumentos.tsx:99 | Icono | className | `className="size-5 shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/cuenta/VerificacionDocumentos.tsx:111 | Icono | className | `className="size-5 shrink-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/experiencia-publica.tsx:38 | LogoMarca | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/legal/privacidad/page.tsx:19 | MobileHeader | className | `className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4 border-b border-[#e6edf6] dark:border-[#1a3a5c]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/legal/privacidad/page.tsx:22 | MobileCard | className | `className="space-y-6 text-[#0a2342] dark:text-[#f6f8fb]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/legal/terminos/page.tsx:5 | MobileShell | className | `className="user-v2-scope user-legal-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/login/LoginCliente.tsx:358 | MobileShell | className | `className="login-usuario login-container h-dvh max-h-dvh overflow-hidden !pb-0"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/login/LoginCliente.tsx:390 | MobileShell | className | `className="login-usuario login-container relative h-dvh max-h-dvh overflow-hidden !pb-0 bg-[#f4f7fb] dark:bg-[#061529] flex flex-col"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/mis-viajes/error.tsx:23 | MobileShell | className | `className="user-v2-scope user-transfers-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/mis-viajes/loading.tsx:11 | MobileShell | className | `className="user-v2-scope user-transfers-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/mis-viajes/page.tsx:171 | MobileShell | className | `className="user-v2-scope user-transfers-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/nueva-password/page.tsx:192 | MobileCard | className | `className="p-6 sm:p-7"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/nueva-password/page.tsx:267 | Field | etiquetaClassName | `etiquetaClassName="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/nueva-password/page.tsx:279 | Field | className | `className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-3.5 px-4 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/nueva-password/page.tsx:329 | Field | etiquetaClassName | `etiquetaClassName="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/nueva-password/page.tsx:340 | Field | className | `className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-3.5 px-4 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/nueva-password/page.tsx:369 | MobileButton | className | `className="mt-2"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/page.tsx:132 | MobileShell | className | `className="user-v2-scope user-dashboard-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/page.tsx:344 | Icono | className | `className="size-5"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/page.tsx:369 | SelloConductor | className | `className="mx-auto mb-6"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/pasaporte/page.tsx:77 | Icono | className | `className="size-8"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/recuperar-password/FormularioRecuperarPassword.tsx:193 | MobileShell | className | `className="min-h-dvh bg-[#f4f7fb] dark:bg-[#061529]"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/recuperar-password/FormularioRecuperarPassword.tsx:229 | MobileCard | className | `className="border border-[#e2e8f0]/80 bg-white/95 p-5 shadow-[0_8px_30px_rgba(10,35,66,0.06)] backdrop-blur-sm dark:border-[#1a3a5c] dark:bg-[#0a2342]/95 sm:p-7"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/registro/iconos-registro.tsx:4 | Icono | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/registro/iconos-registro.tsx:16 | Icono | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/registro/iconos-registro.tsx:40 | Icono | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/soporte/FormularioSoporte.tsx:212 | MobileButton | className | `className="w-full sm:w-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/soporte/SoporteResponsive.tsx:29 | MobileShell | className | `className="user-v2-scope user-support-shell"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/verificacion/page.tsx:24 | MobileCard | className | `className="text-center space-y-4 border-[#c8e6d8] bg-[#e9f3ee]/40 dark:border-[#135939] dark:bg-[#0a2e1f]/40"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/verificacion/page.tsx:43 | MobileBadge | className | `className="mx-auto"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:53 | MobileCard | className | `className="text-center"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:549 | MobileCard | className | `className="text-center space-y-4 border-[#c8e6d8] bg-[#e9f3ee]/40 dark:border-[#135939] dark:bg-[#0a2e1f]/40"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:594 | MobileButton | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:631 | MobileButton | className | `className="mt-4 w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:651 | MobileCard | className | `className="flex flex-col gap-6"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/verificacion/VerificacionForm.tsx:855 | MobileButton | className | `className="w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/viajes/nuevo/components/BarraAccionesTraslado.tsx:47 | Button | className | `className="user-wizard-primary min-h-12 flex-1"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/viajes/nuevo/components/PasoPago.tsx:361 | Button | className | `className="min-h-10 text-xs font-bold"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/app-usuario/src/app/viajes/[id]/PagoTraslado.tsx:195 | Button | className | `className="mt-3"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/app/viajes/[id]/piezas-pasaporte.tsx:153 | Icono | className | `className={className}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/app-usuario/src/components/layout/UserResponsiveLayout.tsx:45 | MobileShell | className | `className={mobileClassName}` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/panel-admin/src/app/conductores/activos/nuevo/page.tsx:267 | Button | className | `className="rounded-lg bg-ink px-4 py-2 font-body text-sm font-semibold text-surface-primary hover:bg-ink/90 disabled:opacity-50"` | apariencia-potencial | Sin justificación nominal por uso; comprobar si compensa defecto base | pendiente de co-revisión |
| apps/panel-admin/src/app/documentos/page.tsx:363 | PassportCard | className | `className="mt-4"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |
| apps/panel-admin/src/app/masivos/page.tsx:764 | Button | className | `className="mt-5 w-full"` | composición-o-semántica | Composición o semántica del consumidor; validar contrato | condicionado al contexto |

## Redeclaraciones

| Archivo/línea | Token | Valor | Veredicto |
|---|---|---|---|
| apps/app-conductor/src/app/ganancias/earnings.module.css:1 | `--font-body` | `"Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:255 | `--font-display` | `"Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:256 | `--font-body` | `"Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:259 | `--ruum-canvas` | `var(--conductor-surface)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:260 | `--ruum-surface` | `var(--conductor-surface)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:261 | `--ruum-surface-elevated` | `var(--conductor-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:262 | `--ruum-surface-subtle` | `#f7f9fc` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:263 | `--ruum-surface-strong` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:264 | `--ruum-border` | `var(--conductor-border)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:265 | `--ruum-border-strong` | `#B8D1F4` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:266 | `--ruum-text-primary` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:267 | `--ruum-text` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:268 | `--ruum-text-secondary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:269 | `--ruum-text-tertiary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:270 | `--ruum-text-disabled` | `#9AA8BD` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:271 | `--ruum-focus` | `var(--conductor-focus)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:272 | `--ruum-focus-ring` | `rgba(22, 119, 255, 0.24)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:273 | `--ruum-action-primary` | `var(--conductor-action-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:274 | `--ruum-action-primary-hover` | `#0A4F9C` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:275 | `--ruum-action-primary-active` | `#083E7E` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:276 | `--ruum-on-primary` | `#FFFFFF` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:277 | `--ruum-gradient-action` | `var(--conductor-gradient-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:278 | `--ruum-route` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:279 | `--ruum-route-contrast` | `var(--conductor-action-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:280 | `--ruum-route-hover` | `#1267DD` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:281 | `--ruum-route-active` | `#0E5CAB` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:282 | `--ruum-success` | `var(--conductor-success)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:283 | `--ruum-warning` | `var(--conductor-pending)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:284 | `--ruum-danger` | `var(--conductor-error)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:285 | `--ruum-danger-hover` | `#B83D4B` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:286 | `--ruum-danger-active` | `#9E3340` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:287 | `--ruum-shadow-1` | `0 1px 2px rgba(13, 43, 94, 0.04)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:288 | `--ruum-shadow-2` | `0 4px 12px rgba(13, 43, 94, 0.06)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:289 | `--ruum-shadow-3` | `0 10px 28px rgba(13, 43, 94, 0.10)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:290 | `--ruum-shadow-xs` | `0 1px 2px rgba(13, 43, 94, 0.04)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:291 | `--ruum-shadow-sm` | `0 4px 12px rgba(13, 43, 94, 0.06)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:292 | `--ruum-shadow-md` | `0 10px 28px rgba(13, 43, 94, 0.10)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:293 | `--ruum-radius-field` | `12px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:294 | `--ruum-radius-card` | `16px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:295 | `--ruum-radius-modal` | `20px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:298 | `--color-ink` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:299 | `--color-ink-soft` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:300 | `--color-asphalt` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:301 | `--color-steel` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:302 | `--color-mist` | `var(--conductor-surface)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:303 | `--color-mist-dim` | `var(--conductor-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:304 | `--color-signal` | `var(--conductor-brand)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:305 | `--color-signal-soft` | `#e8f0fe` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:306 | `--color-route` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:307 | `--color-route-dark` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:308 | `--color-route-soft` | `#e8f0fe` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:309 | `--color-control` | `var(--conductor-success)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:310 | `--color-control-soft` | `#e6f6ee` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:311 | `--color-warn` | `#f5b400` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:312 | `--color-warn-soft` | `#fff4d6` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:313 | `--color-danger` | `var(--conductor-error)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:314 | `--color-danger-soft` | `#fdecef` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:344 | `--ruum-canvas` | `#061529` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:345 | `--ruum-surface` | `var(--conductor-surface)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:346 | `--ruum-surface-elevated` | `var(--conductor-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:347 | `--ruum-surface-subtle` | `var(--conductor-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:348 | `--ruum-surface-strong` | `var(--conductor-surface)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:349 | `--ruum-border` | `var(--conductor-border)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:350 | `--ruum-border-strong` | `#2d4f73` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:351 | `--ruum-text-primary` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:352 | `--ruum-text` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:353 | `--ruum-text-secondary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:354 | `--ruum-text-tertiary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:355 | `--ruum-text-disabled` | `#6b7a99` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:356 | `--ruum-focus` | `var(--conductor-focus)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:357 | `--ruum-focus-ring` | `rgba(77, 148, 255, 0.35)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:358 | `--ruum-action-primary` | `var(--conductor-action-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:359 | `--ruum-on-primary` | `#08182e` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:360 | `--ruum-gradient-action` | `var(--conductor-gradient-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:361 | `--ruum-route` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:362 | `--ruum-success` | `var(--conductor-success)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:363 | `--ruum-warning` | `var(--conductor-pending)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:364 | `--ruum-danger` | `var(--conductor-error)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:741 | `--ruum-radius-sm` | `12px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:742 | `--ruum-radius-md` | `16px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:743 | `--ruum-radius-lg` | `20px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:744 | `--ruum-radius-xl` | `24px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:745 | `--ruum-radius-2xl` | `24px` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:750 | `--ruum-shadow-xs` | `0 2px 10px rgba(13, 43, 94, 0.05)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:751 | `--ruum-shadow-sm` | `0 8px 24px rgba(13, 43, 94, 0.10)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:752 | `--ruum-shadow-md` | `0 8px 24px rgba(13, 43, 94, 0.10)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:757 | `--ruum-success` | `#16805a` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:758 | `--ruum-warning` | `#f5b400` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:759 | `--ruum-error` | `#c23648` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:760 | `--ruum-info` | `#0066ff` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:964 | `--color-ink` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:965 | `--color-signal` | `#ff4713` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:966 | `--color-route` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:967 | `--color-route-dark` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:968 | `--color-route-soft` | `#f5f5f2` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:969 | `--ruum-action` | `#ff4713` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:970 | `--ruum-action-hover` | `#e93d0b` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:971 | `--ruum-route` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:972 | `--ruum-route-contrast` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:973 | `--ruum-focus` | `#101012` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/globals.css:974 | `--ruum-focus-ring` | `rgba(16, 16, 18, 0.18)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:171 | `--ruum-text` | `#081b37` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:172 | `--ruum-text-secondary` | `#52617b` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:173 | `--ruum-text-disabled` | `#53637d` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:174 | `--ruum-surface` | `#fff` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:175 | `--ruum-surface-elevated` | `#e5eaf2` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:176 | `--ruum-border-strong` | `#d8dce5` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:177 | `--ruum-route-contrast` | `#0060ee` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:178 | `--ruum-focus` | `#0060ee` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:179 | `--ruum-focus-ring` | `#0060ee1a` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:180 | `--ruum-success` | `#137b57` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/registro/registration.module.css:181 | `--ruum-danger` | `#b42335` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:2 | `--font-body` | `"Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:3 | `--ruum-text` | `var(--conductor-primary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:3 | `--ruum-text-secondary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:3 | `--ruum-text-tertiary` | `var(--conductor-muted)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:4 | `--ruum-surface` | `#fff` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:4 | `--ruum-surface-elevated` | `var(--conductor-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:4 | `--ruum-border` | `var(--conductor-border)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:5 | `--ruum-border-strong` | `#c5d1e4` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:5 | `--ruum-focus` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:5 | `--ruum-route-contrast` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:6 | `--ruum-on-primary` | `#fff` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:6 | `--color-signal` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-conductor/src/app/viajes/traslados.module.css:6 | `--color-route-action` | `var(--conductor-action)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/cuenta/cuenta-desktop.module.css:2 | `--ruum-text-primary` | `var(--user-on-light-primary)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/dashboard/dashboard.module.css:2 | `--ruum-text-primary` | `var(--user-on-light-primary)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:440 | `--color-ink` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:441 | `--color-ink-soft` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:442 | `--color-steel` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:443 | `--color-mist` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:444 | `--color-mist-dim` | `#061529` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:445 | `--color-signal` | `#00D1D1` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:446 | `--color-signal-soft` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:447 | `--color-route` | `#4D94FF` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:448 | `--color-route-dark` | `#6BA8FF` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:449 | `--color-route-soft` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:450 | `--color-control` | `#4DD9A3` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:451 | `--color-control-soft` | `#0A2E1F` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:452 | `--color-warn` | `#FFC933` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:453 | `--color-warn-soft` | `#3D2E00` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:454 | `--color-danger` | `#FF6B7A` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:455 | `--color-danger-soft` | `#3D0F1A` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:458 | `--ruum-canvas` | `#061529` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:459 | `--ruum-surface` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:460 | `--ruum-surface-raised` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:461 | `--ruum-surface-soft` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:462 | `--ruum-surface-elevated` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:463 | `--ruum-surface-subtle` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:464 | `--ruum-surface-strong` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:465 | `--ruum-border` | `#1A3A5C` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:466 | `--ruum-border-strong` | `#2D4F73` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:467 | `--ruum-text` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:468 | `--ruum-text-primary` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:469 | `--ruum-text-secondary` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:470 | `--ruum-text-tertiary` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:471 | `--ruum-text-muted` | `#8293b0` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:472 | `--ruum-text-disabled` | `#8293b0` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:473 | `--ruum-muted` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:474 | `--ruum-brand` | `#00D1D1` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:475 | `--ruum-action` | `#4D94FF` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:476 | `--ruum-primary` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:477 | `--ruum-success` | `#4DD9A3` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:478 | `--ruum-warning` | `#FFC933` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:479 | `--ruum-error` | `#FF6B7A` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:480 | `--ruum-danger` | `#FF6B7A` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:481 | `--ruum-info` | `#6BA8FF` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:482 | `--ruum-focus` | `#4D94FF` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:483 | `--ruum-focus-ring` | `rgba(77, 148, 255, 0.35)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:484 | `--ruum-gradient-action` | `linear-gradient(90deg, #00B3B3 0%, #4D94FF 100%)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:485 | `--ruum-shadow-1` | `0 2px 10px rgba(0, 0, 0, 0.3)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:486 | `--ruum-shadow-2` | `0 8px 24px rgba(0, 0, 0, 0.4)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:487 | `--ruum-shadow-3` | `0 8px 24px rgba(0, 0, 0, 0.4)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:488 | `--ruum-shadow-4` | `0 16px 36px rgba(0, 0, 0, 0.45)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:2186 | `--ruum-text` | `#000` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:2187 | `--ruum-text-secondary` | `#111` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:2188 | `--ruum-text-tertiary` | `#222` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:2189 | `--ruum-surface` | `#fff` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/globals.css:2190 | `--ruum-surface-subtle` | `#fff` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/registro/registro.css:3 | `--ruum-text-primary` | `var(--user-on-light-primary)` | Revisión de alcance y contexto requerida |
| apps/app-usuario/src/app/ubicaciones/ubicaciones-desktop.module.css:11 | `--ruum-text-primary` | `var(--user-on-light-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:10 | `--color-text-secondary` | `var(--ruum-text-secondary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:11 | `--color-text-tertiary` | `var(--ruum-text-tertiary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:12 | `--color-text-disabled` | `var(--ruum-text-disabled)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:32 | `--ruum-focus-ring` | `rgba(0, 102, 255, 0.24)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:58 | `--color-ink` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:59 | `--color-ink-soft` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:60 | `--color-steel` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:61 | `--color-mist` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:62 | `--color-mist-dim` | `#061529` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:63 | `--color-signal` | `#00D1D1` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:64 | `--color-signal-soft` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:65 | `--color-route` | `#4D94FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:66 | `--color-route-dark` | `#6BA8FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:67 | `--color-route-soft` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:68 | `--color-control` | `#4DD9A3` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:69 | `--color-control-soft` | `#0A2E1F` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:70 | `--color-warn` | `#FFC933` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:71 | `--color-warn-soft` | `#3D2E00` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:72 | `--color-danger` | `#FF6B7A` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:73 | `--color-danger-soft` | `#3D0F1A` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:90 | `--ruum-canvas` | `#061529` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:91 | `--ruum-surface` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:92 | `--ruum-surface-subtle` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:93 | `--ruum-surface-elevated` | `#0F2D52` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:94 | `--ruum-surface-strong` | `#0A2342` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:95 | `--ruum-border` | `#1A3A5C` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:96 | `--ruum-border-strong` | `#2D4F73` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:97 | `--ruum-text-primary` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:98 | `--ruum-text` | `#F6F8FB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:99 | `--ruum-text-secondary` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:100 | `--ruum-text-tertiary` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:101 | `--ruum-text-disabled` | `#6B7A99` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:102 | `--ruum-muted` | `#A8B5CC` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:103 | `--ruum-focus` | `#4D94FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:104 | `--ruum-focus-ring` | `rgba(77, 148, 255, 0.35)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:105 | `--ruum-shadow-1` | `0 2px 10px rgba(0, 0, 0, 0.3)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:106 | `--ruum-shadow-2` | `0 8px 24px rgba(0, 0, 0, 0.4)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:107 | `--ruum-shadow-3` | `0 8px 24px rgba(0, 0, 0, 0.4)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:108 | `--ruum-shadow-4` | `0 16px 36px rgba(0, 0, 0, 0.45)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:439 | `--color-ink` | `#1a1f2e` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:440 | `--color-mist` | `#ffffff` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:572 | `--color-ink` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:573 | `--color-ink-soft` | `#244472` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:574 | `--color-asphalt` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:575 | `--color-steel` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:576 | `--color-mist` | `var(--admin-v2-surface)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:577 | `--color-mist-dim` | `var(--admin-v2-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:578 | `--color-signal` | `var(--admin-v2-brand)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:579 | `--color-signal-soft` | `#E4FAF8` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:580 | `--color-route` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:581 | `--color-route-dark` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:582 | `--color-route-soft` | `#E9F2FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:583 | `--color-control` | `var(--admin-v2-success)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:584 | `--color-control-soft` | `#E5FAF5` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:585 | `--color-warn` | `var(--admin-v2-warning-text)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:586 | `--color-warn-soft` | `#FFF7DB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:587 | `--color-danger` | `var(--admin-v2-danger)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:588 | `--color-danger-soft` | `#FDECEF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:595 | `--ruum-text-primary` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:596 | `--ruum-text` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:597 | `--ruum-text-secondary` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:598 | `--ruum-text-tertiary` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:599 | `--ruum-text-disabled` | `#9AA8BD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:609 | `--ruum-focus` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:610 | `--ruum-focus-ring` | `rgba(22, 119, 255, 0.24)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:611 | `--ruum-surface` | `var(--admin-v2-surface)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:612 | `--ruum-surface-subtle` | `var(--admin-v2-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:613 | `--ruum-surface-elevated` | `#EEF5FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:614 | `--ruum-surface-strong` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:615 | `--ruum-border` | `var(--admin-v2-border)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:616 | `--ruum-border-strong` | `#B8D1F4` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:617 | `--ruum-action-primary` | `#0E5CAB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:618 | `--ruum-action-primary-hover` | `#0A4F9C` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:619 | `--ruum-action-primary-active` | `#083E7E` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:620 | `--ruum-on-primary` | `#FFFFFF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:621 | `--ruum-gradient-action` | `linear-gradient(90deg, #00C2B8 0%, #0E5CAB 100%)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:622 | `--ruum-on-danger` | `#FFFFFF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:623 | `--ruum-route` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:624 | `--ruum-route-contrast` | `#0E5CAB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:625 | `--ruum-route-hover` | `#1267DD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:626 | `--ruum-route-active` | `#0E5CAB` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:627 | `--ruum-success` | `var(--admin-v2-success)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:628 | `--ruum-warning` | `var(--admin-v2-warning-text)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:629 | `--ruum-danger` | `var(--admin-v2-danger)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:630 | `--ruum-danger-hover` | `#B83D4B` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:631 | `--ruum-danger-active` | `#9E3340` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:632 | `--ruum-action` | `var(--admin-v2-brand)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:633 | `--ruum-action-hover` | `#00A89F` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:634 | `--ruum-overlay` | `rgba(13, 43, 94, 0.24)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:635 | `--ruum-shadow-1` | `0 1px 3px rgba(13, 43, 94, 0.08)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:636 | `--ruum-shadow-2` | `0 8px 24px rgba(13, 43, 94, 0.10)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:637 | `--ruum-shadow-3` | `0 16px 40px rgba(13, 43, 94, 0.14)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:638 | `--ruum-shadow-4` | `0 24px 64px rgba(13, 43, 94, 0.18)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:639 | `--ruum-radius-field` | `12px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:640 | `--ruum-radius-card` | `16px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:641 | `--ruum-radius-modal` | `16px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:642 | `--radius-card` | `1rem` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:651 | `--font-display` | `var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:652 | `--font-body` | `var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:671 | `--color-ink` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:672 | `--color-ink-soft` | `#C7D5E7` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:673 | `--color-asphalt` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:674 | `--color-steel` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:675 | `--color-mist` | `var(--admin-v2-surface)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:676 | `--color-mist-dim` | `var(--admin-v2-surface-secondary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:677 | `--color-signal` | `var(--admin-v2-brand)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:678 | `--color-signal-soft` | `rgba(34, 211, 197, 0.12)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:679 | `--color-route` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:680 | `--color-route-dark` | `#D8E8FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:681 | `--color-route-soft` | `rgba(77, 154, 255, 0.14)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:682 | `--color-control` | `var(--admin-v2-success)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:683 | `--color-control-soft` | `rgba(34, 199, 168, 0.14)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:684 | `--color-warn` | `var(--admin-v2-warning)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:685 | `--color-warn-soft` | `rgba(246, 197, 71, 0.14)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:686 | `--color-danger` | `var(--admin-v2-danger)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:687 | `--color-danger-soft` | `rgba(240, 106, 120, 0.14)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:694 | `--ruum-text-primary` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:695 | `--ruum-text` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:696 | `--ruum-text-secondary` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:697 | `--ruum-text-tertiary` | `var(--admin-v2-muted)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:698 | `--ruum-text-disabled` | `#6F839B` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:708 | `--ruum-focus` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:709 | `--ruum-focus-ring` | `rgba(77, 154, 255, 0.18)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:710 | `--ruum-surface` | `var(--admin-v2-surface)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:711 | `--ruum-surface-subtle` | `#102844` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:712 | `--ruum-surface-elevated` | `#123052` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:713 | `--ruum-surface-strong` | `var(--admin-v2-surface)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:714 | `--ruum-border` | `var(--admin-v2-border)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:715 | `--ruum-border-strong` | `#356083` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:716 | `--ruum-action-primary` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:717 | `--ruum-action-primary-hover` | `#3A8AEF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:718 | `--ruum-action-primary-active` | `#2B7BDD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:719 | `--ruum-on-primary` | `#08182E` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:720 | `--ruum-gradient-action` | `var(--admin-v2-gradient-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:721 | `--ruum-on-danger` | `#FFFFFF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:722 | `--ruum-route` | `var(--admin-v2-action)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:723 | `--ruum-route-contrast` | `#D8E8FF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:724 | `--ruum-route-hover` | `#3A8AEF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:725 | `--ruum-route-active` | `#2B7BDD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:726 | `--ruum-success` | `var(--admin-v2-success)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:727 | `--ruum-warning` | `var(--admin-v2-warning-text)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:728 | `--ruum-danger` | `var(--admin-v2-danger)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:729 | `--ruum-danger-hover` | `#D95362` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:730 | `--ruum-danger-active` | `#BF3F4D` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:731 | `--ruum-action` | `var(--admin-v2-brand)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:732 | `--ruum-action-hover` | `#129E93` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:733 | `--ruum-overlay` | `rgba(8, 24, 46, 0.82)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:734 | `--ruum-shadow-1` | `0 1px 2px rgba(0, 0, 0, 0.18)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:735 | `--ruum-shadow-2` | `0 4px 12px rgba(0, 0, 0, 0.22)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:736 | `--ruum-shadow-3` | `0 8px 24px rgba(0, 0, 0, 0.28)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:737 | `--ruum-shadow-4` | `0 16px 36px rgba(0, 0, 0, 0.36)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:738 | `--ruum-radius-field` | `12px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:739 | `--ruum-radius-card` | `16px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:740 | `--ruum-radius-modal` | `16px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:741 | `--radius-card` | `1rem` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:749 | `--font-display` | `var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:750 | `--font-body` | `var(--font-body-loaded), "Inter", ui-sans-serif, system-ui, sans-serif` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:844 | `--color-ink` | `var(--admin-v2-primary)` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:845 | `--color-mist` | `#FFFFFF` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:846 | `--ruum-text-secondary` | `#D7E3F4` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:847 | `--ruum-text-tertiary` | `#AFC1DD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:848 | `--color-text-secondary` | `#D7E3F4` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:849 | `--color-text-tertiary` | `#AFC1DD` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1316 | `--ruum-shadow-1` | `none` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1317 | `--ruum-shadow-2` | `none` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1318 | `--ruum-radius-card` | `10px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1319 | `--radius-card` | `10px` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1320 | `--ruum-action` | `#ff4713` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1321 | `--ruum-action-hover` | `#e93d0b` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1322 | `--ruum-route` | `#101012` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1323 | `--ruum-route-contrast` | `#101012` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1325 | `--ruum-focus` | `#101012` | Revisión de alcance y contexto requerida |
| apps/panel-admin/src/app/globals.css:1326 | `--ruum-focus-ring` | `rgba(16, 16, 18, 0.16)` | Revisión de alcance y contexto requerida |
