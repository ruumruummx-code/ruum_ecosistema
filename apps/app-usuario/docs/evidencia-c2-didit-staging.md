# C2 — Evidencia de Didit en staging

**14 de noviembre de 2026, 08:16, Ciudad de México. Verificación bloqueada antes de crear la sesión.**

Proyecto `ruum-ruum-staging` (`ytqhzrbmiczzwzzuzgbq`). Se creó una cuenta sintética confirmada por vía administrativa y se inició sesión con la llave pública. La llamada a la función desplegada usó el JWT de esa cuenta.

| Operación | Resultado |
| --- | --- |
| Alta temporal y autenticación | HTTP 200 en ambas |
| Lectura de su perfil | HTTP 200, `estado_verificacion=pendiente` |
| `POST /functions/v1/iniciar-verificacion-didit` con `{"tipo":"usuario"}` | HTTP 503, `Servicio temporalmente no disponible.` |
| Eliminación de la cuenta temporal y comprobación en Auth | HTTP 200 al eliminar, HTTP 404 al consultar |

La solicitud no devolvió un identificador ni una URL de sesión. El log de la función a las `14:16:02.026Z` registró `iniciar-verificacion-didit: configuración Didit ausente o inválida`. La función emite ese mensaje cuando falta la llave o el workflow, el workflow no tiene formato UUID o el callback configurado no pasa la validación. La copia local de configuración de staging carece de un workflow y de un callback válido para este proyecto. El log de la función no distingue qué valor desplegado provocó el rechazo.

Para completar la validación, hace falta un workflow de pruebas autorizado, su configuración en el entorno de staging y una persona autorizada que complete la captura en el portal. Luego se debe confirmar el estado terminal del proveedor, la recepción del webhook y el estado de verificación del perfil en Supabase.

## Ejecución de los specs de C2

Desde `apps/app-usuario`, ejecutar `pnpm exec playwright test tests/e2e/pasaporte-digital.spec.ts` para comprobar las siete etapas del fixture, el conductor, la ficha de evidencia y el recibo contra el doble local de Supabase.

Para ejecutar `pnpm exec playwright test tests/e2e/pago-elements.spec.ts`, cargar en el entorno `PLAYWRIGHT_STRIPE_TEST=1`, `STRIPE_SECRET_KEY` (`sk_test_`) y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_`) de la misma cuenta de pruebas. Si se usa `PLAYWRIGHT_E2E_PRODUCCION=1`, compilar con la llave pública de prueba antes de lanzar Playwright. El spec monta Stripe Payment Element y consulta el PaymentIntent real en Stripe Test Mode. La creación del traslado y la lectura de `pagos` se simulan en el entorno local. La lectura del fixture depende de que Stripe confirme el importe esperado. El spec se omite en la corrida ordinaria sin credenciales.

Ambos specs pasaron en Chromium con el build de producción local. El pago de prueba confirmó $500.00 MXN con el PaymentIntent en `succeeded`, `livemode=false` y `amount_received=50000`. El wizard mostró «¡Traslado solicitado!» y el enlace al pasaporte.
