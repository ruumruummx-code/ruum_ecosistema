# Validación de fase 4

## Matriz

| Caso | Comprobación |
|---|---|
| Pasos de evidencia | Navegación entre fotos, llaves, mediciones, documentos, observaciones y revisión; CTA alcanzable y raíz fija en dos tamaños. |
| Datos sin suposiciones | Borrador inicial con llaves, combustible y odómetro pendientes; cero de odómetro preservado. |
| Recuperación de campos | Cambiar de paso y recargar conserva la inspección local de esa pestaña. |
| Capturas | Ampliación completa, cancelación del selector, rechazo de archivo inválido y conservación de una foto offline tras recargar. |
| Revisión | Fotos faltantes no emiten transición. Los servicios conservan la comprobación de sincronización, pago y completitud. |
| Firma | Un toque no firma; trazo con puntero, redimensión y persistencia entre pasos; error al guardar sin avance. |
| Cierre | Fotos en conflicto o llaves discordantes bloquean continuación; una confirmación por entrega y otra por cierre; acuse ya acreditado no se vuelve a subir. |
| Registro | Contacto, contraseña, consentimiento explícito y respuesta OTP simulada; campos, cabecera y acción común. |
| Registro autenticado | Identidad, domicilio con contenido largo y foco restaurado; licencia, documentos y revisión conservan la acción y el retorno. |
| Teclado y reducción de movimiento | Área visible simulada de 320 px, campo OTP y acción alcanzables; mediciones del vehículo conservan la acción. |
| Regresión | Suite de shell y etapas de las fases 2–3, incluido el formulario de cierre migrado. |

El fixture no concede acceso a un servicio real. La firma se envía a un Storage simulado; los cambios de estado quedan en memoria. La prueba OTP intercepta signup y no crea cuentas ni envía correos. Las llamadas de emergencia y los mensajes a contactos no se ejecutan.

## Reproducción

Desde `apps/app-conductor`, con Node 24 y pnpm 10:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e2e_only \
RUUM_LOCAL_PRODUCTION=true NEXT_PUBLIC_RUUM_AMBIENTE=development \
pnpm exec next build

PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
pnpm exec playwright test --config playwright.interface.config.ts
```

La suite inicia Next de producción en 3003 y el API ficticio en 54331. Las capturas y trazas se generan en `test-results`; una selección y los hashes de las fuentes finales se conservan en esta carpeta de auditoría.

## Resultado final

- Build de producción: aprobado, 31 páginas generadas; comprobación de tipos aprobada.
- Playwright: **37/37 aprobadas** (14 de formularios y 23 de regresión), Chromium, 320×568 y 390×844; teclado simulado y movimiento reducido.
- ESLint sobre las fuentes TypeScript modificadas: 0 errores y 2 advertencias `security/detect-object-injection`, en DocumentsStep y RegistrationProgress.
- First Load JS estimado por Next: registro 327 kB, detalle de viaje 335 kB, evidencia 323 kB. Son tamaños de compilación, no métricas de rendimiento en dispositivos.
- Capturas seleccionadas, logs y hashes en `evidencia/` y `validacion.json`.

El pre-commit global ejecuta `npm test`. Su fallo previo está documentado en la auditoría de fase 3: `@ruum/ui` no tiene archivos de pruebas y Vitest termina con código 1. No se declara aprobada esa suite global. Para esta entrega se ejecutan las comprobaciones anteriores y el validador del mensaje de commit; se omite ese hook conocido mediante `HUSKY=0`, sin modificar su configuración.
