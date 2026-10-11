# Staging: probar Stripe y Twilio contra APIs reales

Estado al 2026-10-11: **bloqueado** — solo existe un proyecto Supabase
(`ruum_ecosistema`, el enlazado) y no hay credenciales de Stripe/Twilio en el
entorno. Lo verificado sin staging:

- `deno task test:functions` 48/48 (lógica Stripe + Didit + documentos).
- Integration-test local del handler real (`stripe-webhook/integration-test`,
  6/6): firma HMAC real + HTTP contra `index.ts` + mock PostgREST. Al
  correrlo se encontraron y corrigieron 3 derivas: mock sin
  `registro_auditoria`, mock/runner con `/viajes` en vez de `/traslados`, y
  bug real `solicitud_creada + anticipado` no avanzaba a
  `documentacion_pendiente` (ver `logica.ts`).
- Twilio: solo `deno test` de `logica.ts` (11 casos). **Cero llamadas reales**.

## Requisitos previos

1. Proyecto Supabase **staging** (o usar el enlazado con datos de prueba
   marcados) + `supabase link` correspondiente.
2. Secretos (Dashboard → Edge Functions → Secrets, nunca en repo):
   `STRIPE_SECRET_KEY` (sk_test_), `STRIPE_WEBHOOK_SECRET` (whsec_),
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PROXY_SERVICE_SID`
   (Proxy Service creado una vez en Twilio Console).
3. Funciones desplegadas: `scripts/deploy-supabase-functions.ps1`
   (o `supabase functions deploy crear-payment-intent stripe-webhook
   crear-llamada-enmascarada`).
4. Stripe CLI instalado (`stripe --version`).

## Stripe (modo test, MXN)

```bash
# 1. Forward de eventos al webhook desplegado
stripe listen --forward-to https://<staging>.supabase.co/functions/v1/stripe-webhook
# 2. En otra terminal, disparar el evento real
stripe trigger payment_intent.succeeded
# 3. Aceptar si falla y repetir
stripe trigger payment_intent.payment_failed
```

Aceptación: `pagos.estado` = `completado`/`fallido` con `stripe_event_id`
registrado; traslado `al_cierre` en `pago_pendiente` → `pago_completado`;
solicitud `anticipado` en `solicitud_creada` → `documentacion_pendiente`;
reintento del mismo `event.id` no duplica escritas (idempotencia);
`registro_auditoria` con evento `registro_pago`.

## Twilio Proxy (casos reales, números de prueba)

1. `TWILIO_PROXY_SERVICE_SID` configurado (ver `supabase/functions/README.md`).
2. Dos traslados de prueba con teléfonos reales distintos (uno por parte).
3. Invocar `crear-llamada-enmascarada` autenticado como cada parte:
   - misma sesión Proxy reutilizada para el traslado;
   - cada participante recibe el número virtual por `tel:` y la llamada
     conecta sin exponer el número real (verificar en CDR de Twilio Console).
4. Cerrar el traslado y verificar `sesiones_proxy_traslado.cerrada_en`
   (pendiente de automatizar, ver README de funciones).

Aceptación: sesiones y participantes visibles en Twilio Console, números
reales nunca expuestos entre partes, duración registrada cuando exista el
status callback.

## Cierre

Registrar fecha, IDs de eventos/sesiones y resultado en el PR que habilite
producción. Sin este runbook completado no se activan `sk_live_`/`whsec_`
de producción.
