# Protocolo de Verificación de Hipótesis en Producción — Flujo 6
**Ticket**: RUUM-USR-F6-001  
**Criterio de Aceptación**: CA-11  
**Fecha de Publicación**: 2026-11-04  

---

## 1. Declaración de Principio Metodológico

Las conclusiones de la auditoría estática externa ("el sistema es seguro", "las tarifas están protegidas", "la latencia es óptima") se tratan formalmente como **hipótesis científicas a verificar en producción y staging** bajo métricas empíricas de telemetría y observabilidad.

---

## 2. Hipótesis Operativas y Métricas de Validación

### Hipótesis 1 (H1): Cierre Integral de Manipulación de Tarifa
- **Enunciado**: El recálculo server-side de distancia, tiempo y fórmula tarifaria elimina el 100% de los intentos de manipulación de precio por clientes autenticados.
- **Mecanismo de Detección**: Función `registrarDivergenciaTarifa` en [tarifa-snapshot.ts](./tarifa-snapshot.ts) que audita diferencias entre valores del cliente y cómputo del servidor.
- **Métrica Clave**: Tasa de divergencias de tarifa no autorizadas que logran persistirse en BD.
- **Criterio de Éxito**: $\text{Tasa de discrepancia permitida} = 0\%$. Toda solicitud creada en `traslados` tiene `precio_cotizado` idéntico al recálculo server-side.

---

### Hipótesis 2 (H2): Eficiencia de Cache de Rutas en Redis (`cache:ruta:{hash}`)
- **Enunciado**: El almacenamiento en cache de las rutas calculadas por Mapbox (TTL 24 horas) reduce los llamados al API de Mapbox Directions en al menos un 40% en corredores de alta demanda (ej. CDMX–Guadalajara, CDMX–Monterrey, CDMX–Puebla) y reduce la latencia de respuesta a $< 100\text{ ms}$.
- **Métricas Clave**:
  - Cache Hit Ratio en Redis: $\frac{\text{hits}}{\text{hits} + \text{misses}} \ge 40\%$.
  - Latencia p95 de obtención de ruta en cache: $< 30\text{ ms}$ (vs $250\text{--}600\text{ ms}$ de llamada externa a Mapbox).
- **Criterio de Éxito**: Ahorro de cuota mensual de Mapbox Directions $\ge 40\%$ sin comprometer precisión de trazo.

---

### Hipótesis 3 (H3): Inviolabilidad del Snapshot Tarifario Firmado
- **Enunciado**: El snapshot con HMAC-SHA256, TTL acotado (15 minutos) y protección anti-replay por nonce previene el uso de presupuestos vencidos o la reutilización de cotizaciones pasadas.
- **Métricas Clave**:
  - Intentos de replay detectados por `snapshot-nonce:{nonce}` en Redis.
  - Intentos de uso con timestamp $> 15\text{ minutos}$.
- **Criterio de Éxito**: Cero solicitudes aprobadas con snapshot adulterado, expirado o con nonce reciclado.

---

### Hipótesis 4 (H4): Resiliencia del Rate Limit Compuesto (IP + Cuenta + Dispositivo)
- **Enunciado**: El rate limit compuesto dimensionado (`ip: 20`, `cuenta: 5`, `dispositivo: 10` por ventana de 15 min) mitiga ataques de scraping y flood de creación sin generar falsos positivos en usuarios corporativos o residenciales bajo CGNAT móvil en México.
- **Métricas Clave**:
  - Volumen de eventos `viajes_crear_rate_limited` clasificados por dimensión activada (`ip`, `cuenta`, `dispositivo`).
  - Tasa de tickets de soporte técnico por bloqueo indebido 429.
- **Criterio de Éxito**: Cero reportes de usuarios legítimos bloqueados por compartir IP pública en redes celulares mexicanas (Telcel, AT&T, Movistar) con cuentas distintas.

---

### Hipótesis 5 (H5): Consistencia Transaccional de la Saga de Pago
- **Enunciado**: La coreografía con compensación explícita (`pago_fallido_compensacion`) y reconciliación durable elimina traslados huérfanos sin pago y cargos de Stripe sin traslado.
- **Métricas Clave**:
  - Número de traslados en estado `solicitado` por más de 30 minutos sin `PaymentIntent` asociado.
  - Discrepancias entre `payment_intent.succeeded` en Stripe y `pagos` en base de datos.
- **Criterio de Éxito**: Cero traslados huérfanos tras la ejecución del cron de saneamiento y 100% de reconciliación en webhooks demorados.

---

## 3. Validación pendiente en staging

Las cinco hipótesis requieren evidencia con fecha, commit, entorno, comandos y resultados. Registrar aquí el enlace al artefacto de la ejecución cuando esté disponible.

Para ejecutar las pruebas locales de regresión, usar `pnpm --filter @ruum/app-usuario test:coverage` y el workflow de app-usuario. Para pagos usar una cuenta Stripe de sandbox y probar webhook demorado, entrega duplicada y cotización vencida sin pago. Verificar el resultado en `traslados`, `pagos` y `registro_auditoria`.

En Vercel, configurar Root Directory en `apps/app-usuario` y establecer `CRON_SECRET`. El cron individual corre cada cinco minutos y el masivo cada minuto. Verificar ambos con una llamada sin cookies y otra sin Bearer. Configurar y comprobar alertas ante dos fallos consecutivos o falta de ejecuciones. La función Supabase `reconciliar-pagos-stripe` mantiene su propia programación y verifica los PaymentIntents contra Stripe.

## 4. Evidencia local del cierre de auditoría

- Ejecutar `node scripts/check-supabase-security.mjs` para comprobar los grants documentados. En Supabase local, una prueba dentro de una transacción con datos sintéticos verificó que anon y una cuenta ajena no podían leer la fila privada del conductor, y que su titular sí podía leerla. También se comprobó que los dos catálogos SAT eran legibles por anon y que solo service_role podía ejecutar la RPC individual. La transacción se revirtió. En otra transacción, el reconciliador confirmó un pago registrado, canceló una cotización vencida sin pago y conservó otra con pago pendiente. Repetir la RPC devolvió cero cambios. El escenario está en [reconciliacion-individual.sql](../../test/reconciliacion-individual.sql).
- Ejecutar `pnpm --filter @ruum/app-usuario exec vitest run src/middleware.test.ts src/app/api/internal src/app/api/viajes/route.test.ts` para verificar el nonce, los jobs y el aislamiento del límite entre cuentas sin dispositivo.
- Los resultados anteriores corresponden a una ejecución local del 12 de noviembre de 2026, sobre el árbol de trabajo posterior a 38d795bd. La matriz completa de roles, Realtime y proveedores queda pendiente en el entorno objetivo.
