# Carga masiva de usuario (RR-2026-022)

Disponible desde el primer paso de `/viajes/nuevo`. El archivo descargable es una copia exacta de `plantilla-traslados-masivos-v4.xlsx`. Se lee únicamente la hoja `Traslados`, conservando los resultados guardados de las fórmulas. El límite operativo es de 100 traslados y 5 MB por lote.

El parseo de archivos Excel se delega a un Web Worker en segundo plano (`carga-masiva.worker.ts`), evitando que la decodificación de plantillas grandes con fórmulas complejas congele el hilo principal del navegador. La interfaz conserva su estado interactivo y muestra un indicador de carga mientras se procesa el archivo.

Las filas se corrigen u omiten en el panel. El servidor valida códigos postales y catálogo vehicular de nuevo antes de cotizar. Las rutas se obtienen de Mapbox y las tarifas de `usuario_previsualizar_tarifas_masivas`, usando el mismo cálculo normativo del wizard individual. Se cotiza el lote en una llamada, con un límite de cinco lotes por minuto, para evitar que el límite individual de 30 llamadas deje 70 filas sin precio. Los fallos de mapas o tarifa se muestran como incidencias de cotización; solo los errores del catálogo se asignan al vehículo.

### Optimización y hardening de consultas a Mapbox (Fase 1 - A2)
Para evitar saturar la cuota de Mapbox y el límite de tasa de la API:
1. **Caché y deduplicación por CP**: Se extrae el conjunto de códigos postales únicos (origen y destino) y se geocodifican una sola vez por lote con caché en memoria del servidor.
2. **Cálculo de rutas por pares únicos (origenCP, destinoCP)**: Las consultas a Mapbox Directions se agrupan por pares de CP únicos en lugar de realizar una llamada por cada fila. Para lotes corporativos con orígenes y destinos repetidos, esto reduce las llamadas a Mapbox en más del 80-95% y mantiene el tiempo total de cotización en menos de 60 segundos para 100 filas.

### Integridad transaccional y prevención de checkouts huérfanos (Fase 1 - A3)
El total se suma en centavos y se guarda antes de crear el PaymentIntent consolidado.
- **Transacción de compensación**: Si la llamada a Stripe `payment_intents` o la vinculación del id falla, se ejecuta una compensación que elimina inmediatamente el registro insertado en `checkout_traslados_masivos` (solo si carece de `stripe_payment_intent_id`).
- **Limpieza de huérfanos**: La migración `20261026070000_limpieza_checkouts_masivos_huerfanos_15m.sql` implementa la función `limpiar_checkouts_masivos_sin_intent(15)` para purgar cualquier checkout sin PaymentIntent creado hace más de 15 minutos.

### Conciliación y fuente de verdad (Fase 1 - A4 & A5, Fase 3 - C2)
- **Webhook de Stripe como fuente de verdad**: El webhook (`supabase/functions/stripe-webhook`) es la única fuente de verdad definitiva y garantizada para conciliar el pago y crear las órdenes y pagos mediante `confirmar_checkout_masivo`. Los eventos `payment_intent.succeeded` confirman el lote transaccionalmente, mientras que `payment_intent.payment_failed` expira el checkout masivo.
- **Polling como fallback con frecuencia reducida**: El cliente usa polling escalonado (1.5 s, 3 s, 5 s, 8 s) únicamente como mecanismo de sincronización visual en el frontend mientras el webhook se ejecuta en tiempo real. Si la base de datos ya refleja `pagado_en`, el endpoint `/api/viajes/masivos/estado` responde inmediatamente sin invocar la API externa de Stripe (`fuente: "webhook"`).
- **Pago parcial y resguardo de borrador (Fase 3 - C1)**: La migración `20261026140000_checkout_masivo_pago_parcial.sql` habilita la columna `filas_pendientes_correccion`. Si un lote presenta incidencias o errores en un subconjunto de filas, el usuario puede cotizar y pagar exclusivamente las filas válidas (`permitirParcial: true`), conservando las filas con incidencias en borrador para su posterior corrección y reintento sin descartar el lote.
- **Telemetría y observabilidad operativa (Fase 3 - C3)**: Módulo estructurado `carga-masiva-telemetria.ts` que registra eventos con duración e indicadores clave en logs:
  - `carga_masiva_iniciada`: archivo, tamaño bytes, total de filas.
  - `carga_masiva_validada`: duración, filas válidas, filas con error, porcentaje de éxito.
  - `carga_masiva_cotizada`: duración, rutas calculadas, filas cotizadas, monto total centavos, indicador de parcial.
  - `carga_masiva_pago_exitoso` / `carga_masiva_pago_fallido`: cargaId, monto, fuente de confirmación (`webhook` vs `fallback_stripe`).

## Puesta en servicio

1. Aplicar las migraciones `20261017125335_checkout_masivo_usuario.sql`, `20261017140239_cotizacion_masiva_por_lote.sql`, `20261017170000_expirar_checkouts_masivos_huerfanos.sql`, `20261026070000_limpieza_checkouts_masivos_huerfanos_15m.sql` y `20261026140000_checkout_masivo_pago_parcial.sql`.
2. Desplegar `stripe-webhook` actualizado, manteniendo la verificación de firma y los eventos `payment_intent.succeeded` / `payment_intent.payment_failed` (incluyendo expiración automática en fallos).
3. Configurar `STRIPE_SECRET_KEY` y `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor Next, además de las variables públicas existentes de Stripe, Supabase y Mapbox. El webhook conserva sus propios secretos.
4. Verificar un pago en el entorno de pruebas de Stripe y el historial. Un estado `processing` no libera órdenes: la liberación requiere `succeeded` y conciliación en base de datos.

## Validación local

- `pnpm --filter @ruum/app-usuario typecheck`
- `pnpm --filter @ruum/app-usuario exec vitest run src/lib/carga-masiva.test.ts src/app/PagoStripe.test.tsx src/app/viajes/nuevo/components/CotizadorPortal.test.tsx src/app/viajes/nuevo/components/PasoPago.test.tsx`
- Ejecutar `test/rr22_checkout_masivo_usuario.test.sql` en Postgres local con pgTAP. Las pruebas usan una transacción que se revierte.

No se ha efectuado un cargo real ni desplegado la migración o el webhook a producción desde este cambio.
