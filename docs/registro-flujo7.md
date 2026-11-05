# RUUM-USR-F7-001 — Contrato de solicitud masiva

## Workflow durable y checkpoints (CB-1)

La fila `checkout_traslados_masivos` es la identidad durable del lote. `checkout_masivo_checkpoints` es el journal de workflow; cada checkpoint conserva `estado`, `intentos`, `disponible_en`, `bloqueado_hasta` y `ultimo_error`. La máquina es:

`cotizado → reserva_pago → payment_intent_creado → pago_confirmado → generando → completado`.

Los errores recuperables pasan a `error_reconciliable`; errores de identidad, importe o moneda, o cinco intentos fallidos, pasan a `error_permanente` para revisión auditable. El consumidor es `/api/internal/masivos/reconcile`, invocado por cron cada minuto con `MASIVOS_RECONCILIADOR_SECRET`; reclama lotes de 25 mediante `FOR UPDATE SKIP LOCKED`, aplica backoff y libera el bloqueo después de procesar.

El webhook de Stripe y los fallbacks de estado registran `pago_confirmado` antes de ejecutar la generación. Si la generación falla después de un pago confirmado, el checkpoint sobrevive al proceso y el reconciliador reanuda sin cobrar de nuevo.

## Idempotencia y segundo cobro (CB-2)

- `idempotency_key`: el UUID `clave` del lote, generado por el cliente pero validado como UUID y ligado a `auth_user_id`; existe índice único compuesto `(auth_user_id, idempotency_key)`.
- `route_hash`: SHA-256 de las filas normalizadas y de los inputs que afectan la cotización: origen/destino, marca, modelo, año, condición, modalidad y fecha programada. No incluye credenciales ni secretos.
- `reservar_checkout_masivo` bloquea la fila con `FOR UPDATE`. Si existe PaymentIntent devuelve el intent existente; si hay una reserva vigente devuelve `en_progreso`; solo un propietario puede continuar.
- Stripe recibe `Idempotency-Key: carga-masiva-{checkout_id}`. Un reintento después de caída de red reutiliza el mismo PaymentIntent.
- `vincular_checkout_masivo_payment_intent` solo enlaza si todavía no hay intent. La compensación elimina únicamente checkouts sin intent; si Stripe ya respondió, el lote queda para reconciliación.

## Límites y confirmación server-side (CB-3)

- Máximo 100 filas.
- Máximo 4,000 celdas por solicitud.
- Máximo 5 MiB de JSON.
- Presupuesto CPU de 240 s en cotización; al exceder se rechaza y no se inicia pago.
- Los campos individuales mantienen máximo 2,000 caracteres mediante Zod.
- Exceso de tamaño/celdas devuelve `413`; exceso de CPU devuelve `503` sin PaymentIntent.
- Rate limit compuesto (usuario + IP + dispositivo) consume `rateLimitConVentana` de F2/Redis, con `Retry-After`; no hay contador local propio.
- El monto se calcula en servidor con `previsualizarTarifasMasivasUsuario`, se guarda en el checkout y Stripe recibe ese valor. La RPC de confirmación vuelve a exigir monto exacto y `mxn`; el cliente nunca confirma el monto.

## Namespace de almacenamiento (T10)

La clave activa es `ruum:carga-masiva:{auth_user_id}:activa`. Al montar, la aplicación obtiene la sesión, migra una clave legacy única solo si la cuenta aún no tiene valor y elimina la clave global. El UUID de lote sigue siendo la identidad server-side; limpiar, pagar o descartar elimina únicamente la clave de la cuenta actual. Si Supabase/localStorage no están disponibles, no se usa una clave compartida y la recuperación se realiza desde `/pendientes`.

## Consentimiento (T12)

La solicitud masiva no crea un camino de consentimiento. Los consentimientos permanecen bajo el escritor canónico `registrar_consentimiento_usuario` de F2; este ticket no añade tablas, RPC ni UI paralelas de consentimiento.

## Evidencia local y límites de verificación

Pruebas ejecutadas: rutas `cotizar`, `estado`, `geocode`, `pendientes` y hook `useCargaMasiva`; typecheck de `apps/app-usuario` y `packages/api`; ESLint y `git diff --check`. La evidencia de Redis real, `SKIP LOCKED` bajo concurrencia, Stripe test mode y RLS debe ejecutarse en staging antes del cierre definitivo; los mocks locales no prueban infraestructura externa.
