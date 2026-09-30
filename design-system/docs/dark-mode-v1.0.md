# Dark Mode v1.0 — Extensión del Design System

Implementación de la especificación de modo oscuro (§1–§8). Fuente de tokens: `../tokens/tokens.json` (clave `dark`).

## Decisiones y desviaciones verificadas

| # | Spec | Implementación | Motivo |
|---|---|---|---|
| 1 | CTA oscuro con texto blanco ≥4.8:1 (§2.4) | Texto `#061529` sobre el degradado (`--ruum-on-primary` en dark) | Blanco sobre `#00B3B3` mide 2.59:1; navy mide ≥7:1 en ambos extremos. Test `design-system-v1.test.ts` lo fija. |
| 2 | `dark.text-muted` `#6B7A99` 4.5:1 (§6.1) | `#8293B0` (5.88:1 en fondo, 5.06:1 en superficie) | El valor especificado mide 4.24:1 y rompe el criterio crítico #1. |
| 3 | Sin preferencia → claro (§5.4) | Aplicado en `TemaProvider`, `theme-init.js` ×3 | Antes el default era oscuro. Usuarios con fijación manual guardada la conservan. |
| 4 | Documentos siempre claros | Clase `.ruum-force-light` en `Documentos` y `CredencialConductor` + `@media print` | Legibilidad e impresión. |
| 5 | Brillo 80% + filtro cálido en calle nocturna (§4) | Clase opt-in `.ruum-street-dim` (`filter: brightness(0.8)`); activación configurable por el conductor | Sin APIs de brillo en web; documentado como pendiente de app nativa. |

## Contrastes verificados (test automatizado)

Texto sobre `dark.bg`: primary 14.2+ · secondary 6.8+ · muted 5.8+ · teal 8.1+ · teal-deep 5.2+ · action 6.3+. Chips dark (texto/fondo §2.3): todos ≥4.5. Sin `#000000` en la paleta.

## Activación por superficie

| Superficie | Mecanismo |
|---|---|
| App usuario | `TemaProvider` (Claro/Oscuro/Automático) + selector en Cuenta → Preferencias + `theme-init.js` anti-flash |
| App conductor | `theme-init.js`; modo calle (`ModoCalleActivador`) hereda dark + `SafetyButton` pasa a `#FF4D3D` vía `--ruum-emergency` |
| Panel admin | `SelectorTemaAdmin` + `theme-init.js`; respeta preferencia del sistema |
| Primitiva reutilizable | `useRuumTheme()` en `@ruum/ui` (`Theme.tsx`) |

## Criterios de aceptación (§7.2)

1–2. Contraste ≥4.5 texto / ≥3 UI — test automatizado + WebAIM manual. 3. Sin negro puro — test. 4. Fotos sin invertir — no hay filtros `invert` en el sistema. 5. Manual prevalece — implementado y probado manualmente. 6. Calle nocturna — `SafetyButton` + tamaños 56px/17px heredados; brillo opt-in. 7. `prefers-reduced-motion` — intacto. 8. `prefers-contrast: more` — refuerzo de bordes/secundarios en `tokens.css`. 9. Sin parpadeos — sin animaciones >3/s. 10. Storybook — pendiente (no hay Storybook configurado en este repo fuera de assets sueltos).
