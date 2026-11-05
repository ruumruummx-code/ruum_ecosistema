# RUUM-USR-F7-001 — Contrato de solicitud masiva

## 1. Workflow durable y checkpoints (CB-1)

La fila `checkout_traslados_masivos` es la identidad durable del lote. `checkout_masivo_checkpoints` es el journal de workflow; cada checkpoint conserva `estado`, `intentos`, `disponible_en`, `bloqueado_hasta` y `ultimo_error`. La máquina es:

`cotizado → reserva_pago → payment_intent_creado → pago_confirmado → generando → completado`.

Los errores recuperables pasan a `error_reconciliable`; errores de identidad, importe o moneda, o cinco intentos fallidos, pasan a `error_permanente` para revisión auditable sin reintentos infinitos. El consumidor es `/api/internal/masivos/reconcile`, invocado por cron cada minuto con `MASIVOS_RECONCILIADOR_SECRET`; reclama lotes de 25 mediante `FOR UPDATE SKIP LOCKED`, aplica backoff y libera el bloqueo después de procesar.

El webhook de Stripe y los fallbacks de estado registran `pago_confirmado` antes de ejecutar la generación. Si la generación falla después de un pago confirmado, el checkpoint sobrevive al proceso y el reconciliador reanuda sin cobrar de nuevo.

## 2. Idempotencia y protección contra segundo cobro (CB-2)

- `idempotency_key`: el UUID `clave` del lote, generado por el cliente pero validado como UUID y ligado a `auth_user_id`; existe índice único compuesto `(auth_user_id, idempotency_key)`.
- `route_hash`: SHA-256 de las filas normalizadas y de los inputs que afectan la cotización: origen/destino, marca, modelo, año, condición, modalidad y fecha programada. No incluye credenciales ni secretos.
- `reservar_checkout_masivo` bloquea la fila con `FOR UPDATE`. Si existe PaymentIntent devuelve `payment_intent_existente`; si hay una reserva vigente devuelve `en_progreso` (HTTP 409); solo un propietario puede continuar.
- Stripe recibe `Idempotency-Key: carga-masiva-{checkout_id}`. Un reintento después de caída de red reutiliza el mismo PaymentIntent.
- `vincular_checkout_masivo_payment_intent` solo enlaza si todavía no hay intent. La compensación elimina únicamente checkouts sin intent; si Stripe ya respondió, el lote queda para reconciliación.

## 3. Límites, validación y confirmación server-side (CB-3)

- Máximo 100 filas.
- Máximo 4,000 celdas por solicitud.
- Máximo 5 MiB de JSON.
- Presupuesto CPU de 240 s en cotización; al exceder se rechaza y no se inicia pago.
- Los campos individuales mantienen máximo 2,000 caracteres mediante Zod.
- Exceso de tamaño/celdas devuelve `413`; exceso de CPU devuelve `503` sin PaymentIntent.
- El monto se calcula en servidor con `previsualizarTarifasMasivasUsuario`, se guarda en el checkout y Stripe recibe ese valor. La RPC de confirmación vuelve a exigir monto exacto y `mxn`; el cliente nunca confirma el monto.

## 4. Extensión autorizada del Rate Limit (F2 / F3)

- Se declara formalmente que [`src/lib/rate-limit-masivos.ts`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/rate-limit-masivos.ts) es una **extensión autorizada** de los contratos F2 y F3:
  - Consume directamente `rateLimitConVentana` de F2 (`src/lib/csp-rate-limit.ts`) conectado a Upstash Redis.
  - Adopta la estructura de clave compuesta de tres dimensiones de F3:
    1. Usuario: `uid:${usuarioId}` (`cotizar-masivo-usuario`).
    2. Dirección IP: `ip` (`cotizar-masivo-ip`).
    3. Dispositivo: `hashIdentificador(dispositivo)` (`cotizar-masivo-dispositivo`).
  - No utiliza memoria local propia en producción; si Redis no responde o se excede el límite, responde `HTTP 429` con `Retry-After`. Mismo patrón institucional formalizado en F4 y F5.

## 5. Registro de Dependencia F6 como Bloqueante Documental de CA-7

- **Estado de CA-7:** Abierta por **dependencia arquitectónica intencional** con Flujo 6.
- **Descripción:** La validación canónica estricta de monto y divisa contra el catálogo central de tarifas está centralizada en la entrega del **ADR-006 (Fuente de verdad de tarifas F6)**.
- **Dueño de la Condición:** Equipo de Pricing & Backend Core (`packages/api/src/services/traslados.ts`).
- **Condición de Cierre:** Integración y despliegue en producción de las funciones canónicas de ADR-006.
- **Mitigación Activa Actual (Fail-Closed):**
  - Toda cotización masiva se calcula en servidor mediante `previsualizarTarifasMasivasUsuario`.
  - La RPC `confirmar_checkout_masivo` valida de manera transaccional que el monto cobrado coincida al centavo con el guardado en `checkout_traslados_masivos` y que la divisa sea estrictamente `mxn`. Cualquier discrepancia aborta con `error_permanente`.

## 6. Namespace de almacenamiento (T10)

La clave activa es `ruum:carga-masiva:{auth_user_id}:activa`. Al montar, la aplicación obtiene la sesión, migra una clave legacy única solo si la cuenta aún no tiene valor y elimina la clave global. El UUID de lote sigue siendo la identidad server-side; limpiar, pagar o descartar elimina únicamente la clave de la cuenta actual. Si Supabase/localStorage no están disponibles, no se usa una clave compartida y la recuperación se realiza desde `/pendientes`.

## 7. Consentimiento (T12) — Exclusión Explícita

- Se confirma la **exclusión explícita** de mecanismos de consentimiento en Flujo 7:
  - La solicitud masiva de traslados no crea un flujo alternativo, paralelo ni tablas accesorias de consentimiento.
  - La captura y gobernanza de consentimientos permanece 100% bajo el escritor canónico `registrar_consentimiento_usuario` de Flujo 2. Flujo 7 asume la sesión previamente consentida.

## 8. Verificación Operativa en Staging y Requisitos de Infraestructura

1. **Reconciliador Fail-Closed:**
   - La ruta `/api/internal/masivos/reconcile` exige `Authorization: Bearer ${MASIVOS_RECONCILIADOR_SECRET}`.
   - Sin el secreto configurado o ante credenciales incorrectas, responde de inmediato `HTTP 401 Unauthorized`.
2. **Soporte de Cron en Vercel:**
   - Configurado en `vercel.json` con frecuencia `* * * * *` (cada minuto).
   - **Requisito de Plataforma:** El entorno de producción y staging de RUUM opera sobre el plan **Vercel Pro / Enterprise**, el cual soporta ejecución de Cron Jobs con granularidad de 1 minuto.
3. **Escalamiento a Revisión (Sin Reintento Infinito):**
   - Lotes que experimenten 5 fallos consecutivos (`intentos >= 5`) o errores no recuperables (`/amount|currency|identity|idempotency/`) se marcan como `error_permanente` y se cancela su fecha de reintento (`disponible_en = NULL`), escalando a revisión humana sin bucles infinitos.
4. **Idempotencia Comprobada:**
   - Peticiones en vuelo concurrentes reciben `HTTP 409 Conflict`.
   - Peticiones repetidas con `PaymentIntent` existente recuperan el secreto existente sin duplicar cargos en Stripe.
   - Repetición de webhook tras fallo de generación no duplica traslados ni pagos.

