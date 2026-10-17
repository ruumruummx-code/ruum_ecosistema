# Carga masiva de usuario (RR-2026-022)

Disponible desde el primer paso de `/viajes/nuevo`. El archivo descargable es una copia exacta de `plantilla-traslados-masivos-v4.xlsx`. Se lee únicamente la hoja `Traslados`, conservando los resultados guardados de las fórmulas. El límite operativo es de 100 traslados y 5 MB por lote.

Las filas se corrigen u omiten en el panel. El servidor valida códigos postales y catálogo vehicular de nuevo antes de cotizar. Las rutas se obtienen de Mapbox y las tarifas de `usuario_previsualizar_tarifas_masivas`, usando el mismo cálculo normativo del wizard individual. Se cotiza el lote en una llamada, con un límite de cinco lotes por minuto, para evitar que el límite individual de 30 llamadas deje 70 filas sin precio. Los fallos de mapas o tarifa se muestran como incidencias de cotización; solo los errores del catálogo se asignan al vehículo.

El total se suma en centavos y se guarda antes de crear un PaymentIntent consolidado. Las filas completas de la plantilla se conservan en la cotización. Los datos de costo, orden y ventanas se trasladan también a las instrucciones del servicio.

La función `confirmar_checkout_masivo` solo puede ser llamada por `service_role`. Comprueba PaymentIntent, importe y moneda, bloquea el lote y crea todas las órdenes y sus pagos en una transacción. Los reintentos devuelven la misma carga. Cada pago individual queda vinculado al checkout mediante `checkout_masivo_id`. Se respeta la secuencia de estados y el requisito de pago anticipado.

## Puesta en servicio

1. Aplicar las migraciones `20261017125335_checkout_masivo_usuario.sql` y `20261017140239_cotizacion_masiva_por_lote.sql`.
2. Desplegar `stripe-webhook` actualizado, manteniendo la verificación de firma y los eventos `payment_intent.succeeded` / `payment_intent.payment_failed`.
3. Configurar `STRIPE_SECRET_KEY` y `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor Next, además de las variables públicas existentes de Stripe, Supabase y Mapbox. El webhook conserva sus propios secretos.
4. Verificar un pago en el entorno de pruebas de Stripe y el historial. Un estado `processing` no libera órdenes: la liberación requiere `succeeded` y conciliación en base de datos.

## Validación local

- `pnpm --filter @ruum/app-usuario typecheck`
- `pnpm --filter @ruum/app-usuario exec vitest run src/lib/carga-masiva.test.ts src/app/PagoStripe.test.tsx src/app/viajes/nuevo/components/CotizadorPortal.test.tsx src/app/viajes/nuevo/components/PasoPago.test.tsx`
- Ejecutar `test/rr22_checkout_masivo_usuario.test.sql` en Postgres local con pgTAP. Las pruebas usan una transacción que se revierte.

No se ha efectuado un cargo real ni desplegado la migración o el webhook a producción desde este cambio.
