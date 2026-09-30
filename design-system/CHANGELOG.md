# CHANGELOG — Design System Ruum Ruum

## [v1.2] — 2026-09-26 — Auditoría Libro de marca + claro/oscuro + logotipos
- Autor: Design System / Opencode
- Motivo: Verificar cumplimiento del Design System Integrado (claro + oscuro) contra `Libro de marca` y corregir desviaciones + actualizar logotipos.
- Cambios:
  - `design-system/assets/logo/`: set oficial copiado del Libro de marca (horizontal, vertical, símbolo, avatar, sello, versión navy, maestro, versiones). `assets/ruum-logo-v2.png` reemplazado (tenía fondo negro + franja magenta; ahora es copia de `logo-horizontal.png`).
  - `apps/*/public/imagenes/`: `ruum-logo-header.png` + `ruum-logo-v2.png` actualizados a horizontal oficial; añadidos `ruum-logo-simbolo/avatar/sello/version-navy`. `NavegacionUsuario` usa `ruum-logo-version-navy.png` sobre header navy.
  - `@ruum/ui` `LogoMarca`: PNG oficiales theme-aware (navy en claro / blanco en oscuro vía `.ruum-logo-light/.ruum-logo-dark`); `SimboloVectorial[auto]` usa `--ruum-logo-rr/--ruum-logo-bg` (antes navy fijo, invisible en dark); docs corregidos (swoosh turquesa, avatar superficie clara, firma DRIVEAWAY SERVICE, mínimos, nuevas variantes `sello`/`version-navy`); `descriptor="Conductor"` migrado a `subtitulo`.
  - `@ruum/ui` `SelloConductor`: ahora usa PNG oficial con anillo + mínimo 72px (antes símbolo solo sin anillo); tema oscuro con aro sobre navy.
  - Tokens: `tokens.json/ts` + `Tokens.swift/kt` completados en dark (`warning/success/error/incident/emergency-text`, `action/neutral bg`, `teal`, logo RR/BG); `tokens.css` (design-system + ui): eliminado duplicado `--ruum-text-muted` que pisaba `#8293B0` con `#6B7A99` (rompía 4.5:1), añadidas vars `--ruum-logo-*` light/dark, `prefers-contrast: more` en claro.
  - `@ruum/ui` `tokens.css`: inputs usan `--ruum-border-input` (spec 1px 7A8DAE, no `--ruum-border`); `::selection` con `--ruum-on-primary`; `.ruum-skip-link` texto blanco fijo (era invisible en dark); `.ruum-auth-*` sin naranja fuera de paleta y con superficies por token.
- Verificación: tests `design-system-v1.test.ts` (claro + oscuro) + revisión manual de marca.

## [v1.1] — 2026-09-25 — Extensión Dark Mode
- Autor: Design System / Opencode
- Motivo: Implementar la especificación "Modo Oscuro · Dark Mode v1.0" en app-usuario, app-conductor (modo calle) y panel-admin.
- Cambios:
  - `tokens/tokens.json`: nueva clave `dark` (color + gradient §2/§5.1) en los 4 formatos (`tokens.css`, `tokens.ts`, `Tokens.swift`, `Tokens.kt`).
  - `@ruum/ui` `tokens.css`: bloque `[data-theme="dark"]` con la paleta v1.0 (base `#061529`, nunca negro puro), chips de estado dark, gradientes dark, overlay negro 70%, `.ruum-force-light` (documentos siempre claros + print), `prefers-contrast: more`, `.ruum-street-dim` opt-in.
  - Componentes theme-aware vía variables: `Controls`, `Modal` (superficie elevada), `Navigation` (BottomNav/Sidebar), `EmptyState`, `Buttons` secundario/texto; `Documentos` y `CredencialConductor` forzados a claro.
  - Nuevo `useRuumTheme()` (`Theme.tsx`): sistema → auto, manual prevalece, sin preferencia → claro.
  - App-usuario: `TemaProvider` con modo Claro/Oscuro/Automático + selector en Preferencias (Anexo A); `theme-init.js` ×3 con detección §5.4; `globals.css` dark migrado a v1.0.
  - App-conductor: `globals.css` dark migrado; modo calle nocturno hereda contraste + `SafetyButton` `#FF4D3D`.
  - Panel-admin: `globals.css` dark migrado a v1.0.
  - Tests: 5 nuevos (tokens dark, sin negro puro, contraste texto/chips/CTA) — 11/11 pasan.
- Desviaciones documentadas en `docs/dark-mode-v1.0.md`: texto `#061529` sobre CTA oscuro (no blanco); `text-muted` `#8293B0` (no `#6B7A99`); brillo/filtro cálido como opt-in.

## [v1.0] — 2026-09-25 — Actualización de identidad visual V2.1
- Autor: Design System / Opencode
- Motivo: Implementar Libro de Marca V2.1 (Parte II+III): nueva proporción 60/30/8/2, símbolo RR entrelazado, tokens cap. 26, componentes cap. 19, estados cap. 20, accesibilidad cap. 21.
- Cambios:
  - `tokens/tokens.json`: valores canónicos navy 0A2342, teal 00D1D1, teal-deep 008B8B, action 0066FF, surface E8EEF4, muted 566889, border-input 7A8DAE, warning/success/error/emergency + fondos de chip, gradientes CTA/route, font/space/radius/elevation/size/motion.
  - `tokens/tokens.css`, `tokens.ts`, `Tokens.swift`, `Tokens.kt`: generados desde JSON.
  - `assets/ruum-logo-v2.png`: copiado desde Libro de marca.
  - `@ruum/ui`: ButtonPrimary/Secondary/Text (52px, CTA, estados), StatusChip (12 estados), Card/Input/Select/Checkbox/Radio/Toggle/Alert/Toast/Modal/EmptyState/Skeleton/BottomNav/Tabs/Sidebar/Avatar alineados a tokens; modo calle (56px, ≥17px, botón seguridad); documentos (reporte, acta, credencial, estado de pago).
  - Superficies: app-usuario (paleta/tipografía/botones/chips), app-conductor (modo calle + seguridad persistente), panel-admin (tablas/chips/sidebar/indicadores sin hardcodeo).
  - `whatsapp/`: perfil, saludo, respuestas rápidas, catálogo Fase 0.
  - Verificación: contraste 4.5:1, áreas táctiles, foco visible, reduced-motion, sin hardcodeo en rutas críticas.
