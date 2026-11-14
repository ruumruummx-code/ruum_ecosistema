# Verificación de pago masivo en staging

**Aprobada el 13 de noviembre de 2026 a las 20:36, Ciudad de México.**

En `ruum-ruum-staging` (`ytqhzrbmiczzwzzuzgbq`), Stripe Test Mode confirmó 4,500 MXN con `pm_card_visa`. El checkout registró `pagado_en`, tres traslados en `servicio_confirmado` y tres pagos en `completado`, uno por traslado. El mismo evento firmado recibió HTTP 200 dos veces y los conteos permanecieron en tres. El script inició ambas entregas HTTPS al webhook desplegado. Los datos de prueba quedaron en staging para auditoría.

## Salida del script

Comando `node --env-file=supabase/.env.staging apps/app-usuario/scripts/verificar-pago-masivo-staging.mjs`, con la URL de staging. Código de salida 0.

~~~text
====================================================================
  VERIFICACIÓN DE PAGOS REALES — CARGA MASIVA (STAGING / TEST MODE) 
====================================================================

1. Creando usuario de prueba temporal: qa_masivo_1794623754617@ruum.test...
Usuario: c1122a72-ef7d-47c5-95a5-bac1cb1f89b7; checkout: d0d78007-e924-48f2-afee-1e566d0ecdba
2. Creando PaymentIntent en Stripe en modo test...
   PaymentIntent creado: pi_3UbWosFLafRTrLRk1N4brBTo por $4500.00 MXN
Stripe confirmó pi_3UbWosFLafRTrLRk1N4brBTo: 450000 centavos MXN, livemode=false.
Webhook HTTPS evt_3UbWosFLafRTrLRk1ueczM98: HTTP 200, ok
3. Verificando integridad directa en la base de datos Supabase:
   ✓ checkout_traslados_masivos.pagado_en: 2026-11-14T02:36:01.001658+00:00
   ✓ Conteo de traslados creados: 3 (esperado: 3)
   ✓ 3 pagos completados por 450000 centavos MXN.
4. Reenviando el mismo evento de Stripe al webhook de staging...
Webhook HTTPS evt_3UbWosFLafRTrLRk1ueczM98: HTTP 200, ok
   ✓ Traslados post reintento: 3 (sin duplicaciones)
   ✓ Pagos post reintento: 3 (sin duplicaciones)

====================================================================
  RESULTADO: TODAS LAS PRUEBAS EN STAGING PASARON SATISFACTORIAMENTE
  - Cobro real con Stripe Test Mode: Confirmado.
  - Conciliación y creación exacta de N traslados: Validado.
  - Idempotencia ante eventos repetidos de Webhook: Comprobado.
====================================================================

Datos del lote disponibles para auditoría SQL. Auth ID: 42cbaed6-abcf-49e1-bfb8-05695e3be4d2; checkout: d0d78007-e924-48f2-afee-1e566d0ecdba.
~~~

## 1. Checkout y pago registrado

~~~sql
SELECT id, auth_user_id, stripe_payment_intent_id, monto_centavos, pagado_en, carga_id
FROM public.checkout_traslados_masivos
WHERE id = 'd0d78007-e924-48f2-afee-1e566d0ecdba';
~~~

~~~json
[
  {
    "id": "d0d78007-e924-48f2-afee-1e566d0ecdba",
    "auth_user_id": "42cbaed6-abcf-49e1-bfb8-05695e3be4d2",
    "stripe_payment_intent_id": "pi_3UbWosFLafRTrLRk1N4brBTo",
    "monto_centavos": 450000,
    "pagado_en": "2026-11-14 02:36:01.001658+00",
    "carga_id": "20633eff-2d26-4874-a8e4-25ebf0c0da49"
  }
]
~~~

## 2. Traslados del perfil temporal

~~~sql
SELECT id, usuario_id, precio_cotizado, estado, tipo_pago, creado_en
FROM public.traslados
WHERE usuario_id = 'c1122a72-ef7d-47c5-95a5-bac1cb1f89b7'
ORDER BY creado_en DESC, id;
~~~

~~~json
[
  {
    "id": "9b8084e3-49d6-491c-82f7-72b37a84e8e7",
    "usuario_id": "c1122a72-ef7d-47c5-95a5-bac1cb1f89b7",
    "precio_cotizado": "1500.00",
    "estado": "servicio_confirmado",
    "tipo_pago": "anticipado",
    "creado_en": "2026-11-14 02:36:01.001658+00"
  },
  {
    "id": "bbc1f249-388e-4423-9ec2-1b08bef81d6d",
    "usuario_id": "c1122a72-ef7d-47c5-95a5-bac1cb1f89b7",
    "precio_cotizado": "1500.00",
    "estado": "servicio_confirmado",
    "tipo_pago": "anticipado",
    "creado_en": "2026-11-14 02:36:01.001658+00"
  },
  {
    "id": "cdce97e5-9ffb-45bd-b1f9-34550fd39b69",
    "usuario_id": "c1122a72-ef7d-47c5-95a5-bac1cb1f89b7",
    "precio_cotizado": "1500.00",
    "estado": "servicio_confirmado",
    "tipo_pago": "anticipado",
    "creado_en": "2026-11-14 02:36:01.001658+00"
  }
]
~~~

## 3. Pagos del checkout

~~~sql
SELECT id, traslado_id, monto, estado, metodo, checkout_masivo_id, registrado_en
FROM public.pagos
WHERE checkout_masivo_id = 'd0d78007-e924-48f2-afee-1e566d0ecdba'
ORDER BY id;
~~~

~~~json
[
  {
    "id": "068c0058-d46c-4b35-a204-724494b89928",
    "traslado_id": "9b8084e3-49d6-491c-82f7-72b37a84e8e7",
    "monto": "1500.00",
    "estado": "completado",
    "metodo": "stripe",
    "checkout_masivo_id": "d0d78007-e924-48f2-afee-1e566d0ecdba",
    "registrado_en": "2026-11-14 02:36:01.001658+00"
  },
  {
    "id": "184c9455-140c-4548-bfa1-bbc6cfac9089",
    "traslado_id": "cdce97e5-9ffb-45bd-b1f9-34550fd39b69",
    "monto": "1500.00",
    "estado": "completado",
    "metodo": "stripe",
    "checkout_masivo_id": "d0d78007-e924-48f2-afee-1e566d0ecdba",
    "registrado_en": "2026-11-14 02:36:01.001658+00"
  },
  {
    "id": "48b4a37f-db77-4854-9540-9eb929b7c8ed",
    "traslado_id": "bbc1f249-388e-4423-9ec2-1b08bef81d6d",
    "monto": "1500.00",
    "estado": "completado",
    "metodo": "stripe",
    "checkout_masivo_id": "d0d78007-e924-48f2-afee-1e566d0ecdba",
    "registrado_en": "2026-11-14 02:36:01.001658+00"
  }
]
~~~

## 4. Total conciliado

~~~sql
SELECT c.id, c.monto_centavos / 100.0 AS cotizado_esperado,
       SUM(p.monto) AS total_pagado_registrado, COUNT(p.id) AS traslados_pagados
FROM public.checkout_traslados_masivos c
JOIN public.pagos p ON p.checkout_masivo_id = c.id
WHERE c.id = 'd0d78007-e924-48f2-afee-1e566d0ecdba'
GROUP BY c.id, c.monto_centavos;
~~~

~~~json
[
  {
    "id": "d0d78007-e924-48f2-afee-1e566d0ecdba",
    "cotizado_esperado": "4500.0000000000000000",
    "total_pagado_registrado": "4500.00",
    "traslados_pagados": 3
  }
]
~~~
