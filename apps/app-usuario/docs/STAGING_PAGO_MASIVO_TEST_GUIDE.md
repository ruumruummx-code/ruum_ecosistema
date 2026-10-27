# Guía de Validación de Pagos Reales en Staging — Carga Masiva (RR-CM-001 / F03)

Esta guía documenta el procedimiento formal para verificar el flujo de cobros reales de Carga Masiva en el ambiente de **Staging** utilizando **Stripe en modo test (`sk_test_...`)** y la base de datos Supabase, validando la idempotencia ante reintentos del webhook.

---

## 1. Alcance de la Validación

- **Stripe Test Mode**: Creación y confirmación de `PaymentIntent` con tarjeta de prueba oficial de Stripe (`pm_card_visa`).
- **Webhook y Conciliación**: Recepción del evento `payment_intent.succeeded` y ejecución transaccional de `confirmar_checkout_masivo(p_id, p_intent, p_monto, p_moneda)`.
- **Integridad en Base de Datos**: Creación exacta de $N$ traslados y $N$ registros en la tabla `pagos` vinculados a `checkout_masivo_id`.
- **Protección de Idempotencia**: La repetición del webhook o la concurrencia entre polling y webhook no duplica órdenes ni cargos.

---

## 2. Variables de Entorno Necesarias

En Staging (o en local apuntando a Staging):

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=https://asmzetwwwugaoowiukdv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 3. Ejecución Automatizada de la Prueba

Se incluye un script autónomo que realiza el ciclo completo:

```bash
node apps/app-usuario/scripts/verificar-pago-masivo-staging.mjs
```

### Qué realiza el script:
1. Crea un usuario temporal de prueba en Supabase Auth y su perfil en `public.usuarios`.
2. Inserta un lote de prueba con 3 traslados cotizados en `checkout_traslados_masivos`.
3. Crea un `PaymentIntent` en Stripe Test Mode por el monto exacto ($4,500.00 MXN) y lo confirma con `pm_card_visa`.
4. Ejecuta la función RPC de conciliación `confirmar_checkout_masivo`.
5. Consulta directamente las tablas `checkout_traslados_masivos`, `traslados` y `pagos`:
   - Verifica `pagado_en IS NOT NULL`.
   - Verifica `COUNT(traslados) = 3`.
   - Verifica `COUNT(pagos) = 3` con `estado = 'completado'`.
6. Simula una repetición idéntica del webhook (reintento por timeout) y comprueba que `traslados` y `pagos` permanezcan exactamente en 3.
7. Purga los datos temporales del usuario de prueba.

---

## 4. Consultas SQL de Auditoría Directa en Supabase

Para auditar un lote pagado en Staging:

```sql
-- 1. Verificar estado del checkout masivo
SELECT id, auth_user_id, stripe_payment_intent_id, monto_centavos, pagado_en, carga_id
FROM public.checkout_traslados_masivos
WHERE id = '<CHECKOUT_ID>';

-- 2. Verificar traslados generados para el lote
SELECT id, usuario_id, precio_cotizado, estado, tipo_pago, created_at
FROM public.traslados
WHERE usuario_id = '<USUARIO_ID>'
ORDER BY created_at DESC;

-- 3. Verificar pagos completados y trazabilidad
SELECT id, traslado_id, monto, estado, metodo, checkout_masivo_id, created_at
FROM public.pagos
WHERE checkout_masivo_id = '<CHECKOUT_ID>';

-- 4. Certificar que la suma de pagos sea exactamente igual a la cotización
SELECT
  c.id,
  c.monto_centavos / 100.0 AS cotizado_esperado,
  SUM(p.monto) AS total_pagado_registrado,
  COUNT(p.id) AS traslados_pagados
FROM public.checkout_traslados_masivos c
JOIN public.pagos p ON p.checkout_masivo_id = c.id
WHERE c.id = '<CHECKOUT_ID>'
GROUP BY c.id, c.monto_centavos;
```

---

## 5. Pruebas Automatizadas de Idempotencia en CI

En el repositorio se ejecutan dos suites complementarias que garantizan la integridad sin depender de credenciales vivas:
1. **pgTAP SQL Test**: [`test/rr22_checkout_masivo_usuario.test.sql`](file:///c:/Users/hecto/ecosistema/ruum_ecosistema/test/rr22_checkout_masivo_usuario.test.sql) — Prueba transaccional en Postgres que ejecuta reintentos duplicados y verifica que `traslados` y `pagos` no se duplican.
2. **Vitest Integration Suite**: [`apps/app-usuario/test/carga-masiva-webhook-idempotencia.test.ts`](file:///c:/Users/hecto/ecosistema/ruum_ecosistema/apps/app-usuario/test/carga-masiva-webhook-idempotencia.test.ts) — Prueba unitaria/integración de servicio que verifica parámetros, retornos y rechazo de montos/monedas anómalos.
