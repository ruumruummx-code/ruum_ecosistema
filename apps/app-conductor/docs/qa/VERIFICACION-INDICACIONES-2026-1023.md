# Verificación de indicaciones UI/UX — 2026-10-23

**Resultado:** **APLICACIÓN PARCIAL; aprobación UI/UX global sigue NO-GO.** El código incluye cambios claros que responden a los hallazgos anteriores y existen pruebas nuevas, pero la verificación E2E/visual de este turno no concluyó. Además, permanece duplicado el shell en `/403`.

## Estado por indicación

| Indicación anterior | Estado | Evidencia actual |
|---|---|---|
| Una sola navegación principal por vista; retirar barras inferiores locales duplicadas. | **Aplicada en rutas principales; pendiente en `/403`.** | Ya no hay navegación principal local en Traslados, Notificaciones, Cuenta, Perfil ni panel. La navegación compartida presenta cinco destinos. Excepción: `layout.tsx` monta `NavegacionConductor` y `403/page.tsx` también la monta manualmente; `/403` no está excluida en `EXCLUIDOS_NAVEGACION`, así que duplica header/nav. |
| Evitar que la navegación global tape títulos y acciones al pie. | **Implementación aplicada; E2E actual no verificado.** | `layout.tsx` agrega `conductor-safe-content`; `ConductorNav` conecta refs y `useConductorShellInsets` mide dinámicamente header y barra inferior; `globals.css` reserva espacio. `ContainedScrollView` calcula su marco con esos offsets. Falta completar el E2E de obstrucciones y revisar capturas actuales. |
| Alinear pantallas de scroll completo (Traslados/Ganancias) con el shell. | **Aplicada en estructura; pendiente de inspección visual ejecutada.** | `traslados.module.css` pasó de `position: fixed; height: 100dvh` a flujo relativo. La barra local se retiró de `DriverTrasladosView`. `earnings.module.css` también posiciona su pantalla en flujo y Ganancias ya no gestiona su propio viewport completo. |
| Incluir regresión automatizada de navegación y contenido no obstruido. | **Aplicada en código; ejecución pendiente.** | Nueva `tests/e2e/driver-navigation.spec.ts`: verifica una nav de cinco destinos, cero nav duplicada en `#contenido-principal`, heading y último control unobstructed en `/viajes`, `/notificaciones`, `/cuenta`, `/cuenta/perfil`, `/ganancias`, `/panel` en 320×568, 390×844, 667×375 y 1280×960; comprueba también cambios de tamaño de shell/ruta. Requiere `playwright.navigation.config.ts` y fixture local. |
| Cubrir alturas dinámicas y safe areas con pruebas unitarias. | **Aplicada y aprobada.** | `vitest` en `conductor-shell-insets.test.tsx` y `mobile-navigation-layout.test.ts`: **2 archivos, 5/5 pruebas aprobadas**. |
| Confirmar login, registro, teclado nativo y accesibilidad en equipo físico. | **Pendiente.** | Este turno no ejecutó las suites de login/registro y no usó Android/WebView físico. El entorno sigue usando Node 26.7 aunque `.nvmrc` fija Node 24. |

## Defecto residual confirmado por código

`src/app/layout.tsx` ya renderiza `<NavegacionConductor />` para la aplicación. `src/app/403/page.tsx` vuelve a importar y montar ese componente dentro de `Contenido403`. Como `/403` no se encuentra entre las rutas excluidas de `EXCLUIDOS_NAVEGACION`, habrá dos headers y navegaciones en esa pantalla. Quitar el montaje local de `/403` (y su import) es necesario para que la corrección de navegación sea completa.

## Pruebas de este turno

- `pnpm exec vitest run test/conductor-shell-insets.test.tsx test/mobile-navigation-layout.test.ts`: **5/5 aprobadas**.
- Se intentó ejecutar Playwright para Traslados y el caso de recalibración del shell. El servidor de desarrollo emitió las advertencias existentes (`hideSourceMaps`, Sentry) pero los casos no llegaron a publicar resultado antes de detener la ejecución. No se afirma pase ni fallo E2E.
- El archivo E2E actualizado contiene cobertura adecuada para las rutas principales, pero debe ejecutarse con Node 24 y con el fixture local disponible. También hay que agregar `/403` al recorrido de shell único.

## Dictamen

Las correcciones de navegación en las rutas principales y reservas dinámicas de espacio **sí están implementadas**. No doy por cerrada la indicación hasta retirar el shell duplicado de `/403`, ejecutar el E2E `driver-navigation.spec.ts` y revisar capturas recientes, al menos en 320×568 y 1280×960. Por ello el estado sigue siendo **NO-GO para una certificación global**; el principal arreglo está aplicado, pero no completamente verificado.
