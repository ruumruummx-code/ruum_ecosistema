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

La reconciliación individual y masiva se programa en Supabase con pg_cron. Verificar el resultado HTTP de ambas invocaciones y la alerta ante fallos consecutivos. La función Supabase `reconciliar-pagos-stripe` mantiene su propia programación y verifica los PaymentIntents contra Stripe.

## 4. Evidencia local del cierre de auditoría

- Ejecutar `node scripts/check-supabase-security.mjs` para comprobar los grants documentados. En Supabase local, una prueba dentro de una transacción con datos sintéticos verificó que anon y una cuenta ajena no podían leer la fila privada del conductor, y que su titular sí podía leerla. También se comprobó que los dos catálogos SAT eran legibles por anon y que solo service_role podía ejecutar la RPC individual. La transacción se revirtió. En otra transacción, el reconciliador confirmó un pago registrado, canceló una cotización vencida sin pago y conservó otra con pago pendiente. Repetir la RPC devolvió cero cambios. El escenario está en [reconciliacion-individual.sql](../../test/reconciliacion-individual.sql).
- Ejecutar `pnpm --filter @ruum/app-usuario exec vitest run src/middleware.test.ts src/app/api/internal src/app/api/viajes/route.test.ts` para verificar el nonce, los jobs y el aislamiento del límite entre cuentas sin dispositivo.
- Los resultados anteriores corresponden a una ejecución local del 12 de noviembre de 2026, sobre el árbol de trabajo posterior a 38d795bd. La matriz completa de roles, Realtime y proveedores queda pendiente en el entorno objetivo.

## 5. Seguimiento de liberación

**Dictamen: NO-GO.** El entorno Supabase accesible solo expone la rama predeterminada `main`. La aplicación de la migración requiere identificar la referencia aislada de staging y el proyecto Preview de App Usuario. Los endpoints de reconciliación se pueden invocar manualmente en Preview con el secreto de ese entorno. Los crons declarados en `vercel.json` se programan en despliegues de producción.

| Gate | Evidencia requerida |
| --- | --- |
| Chromium local | Respuesta HTTP con renovación de cookie y nonce coincidente en el bootstrap. |
| Cobertura local | Resultado de `pnpm --filter @ruum/app-usuario test:coverage` y reporte HTML/LCOV. |
| Staging | Referencias de Supabase y Vercel, migración aplicada, comprobación de Redis/KV y Stripe test. |
| Validación sandbox | IDs Stripe, aislamiento entre dos cuentas, handshake WS 101, HTTP 200 de ambos crons y recepción de una alerta controlada. |

### Resultados locales del 12 de noviembre de 2026

- Candidato basado en `a7e19a6b`. Build Next.js de producción completado con fixtures HTTP locales.
- Chromium aprobó el login anónimo y la renovación de sesión expirada en `/soporte`. Playwright verificó HTTP 200, cabecera `Set-Cookie`, expiración futura de la sesión y nonce de los scripts de bootstrap igual al de la CSP bloqueante. Se probó con el doble HTTP de Supabase. El handshake WSS sigue pendiente en staging.
- Primera corrida completa con cobertura y cuatro workers: 1,150 pruebas aprobadas, 1 fallo por timeout en Facturación y 2 omitidas. El caso fiscal pasó en la repetición aislada. Vitest no emitió el reporte de cobertura para esa corrida.
- La prueba de carga local de cotización pasó al repetirla después de mover a un import estático el escritor de consentimiento y calentar el handler. Conserva su umbral de 1,200 ms. La ráfaga usa proveedores simulados.
- La revisión de cuentas remotas encontró un único proyecto Supabase con rama predeterminada `main`. El proyecto de Vercel asociado al repositorio es `ruum-ecosistema-kcct`. Falta disponer de una referencia aislada de Supabase Staging.


Evidencia local: [reporte Chromium con evidencia de red y consola](../../../../docs/evidence/app-usuario-go/chromium.html) y [log Chromium](../../../../docs/evidence/app-usuario-go/chromium.txt), [resultado de la suite completa](../../../../docs/evidence/app-usuario-go/resultado-suite.txt) y [carga local](../../../../docs/evidence/app-usuario-go/carga-local.txt).

- Repetición completa con dos workers: **1,151 aprobadas, 2 omitidas, 0 fallos**. Cobertura global de 81.04% en líneas y sentencias, 76.09% en funciones y 75.50% en ramas. Superó los umbrales de Vitest. [Resumen de la corrida](../../../../docs/evidence/app-usuario-go/resultado-suite-dos-workers.txt) y [LCOV](../../../../docs/evidence/app-usuario-go/cobertura.lcov).

### Supabase Staging, 13 de noviembre de 2026

- Proyecto aislado: `ytqhzrbmiczzwzzuzgbq`. La migración `20261113045314_remote_schema` había sobrescrito la RPC protegida. Se aplicó `20261113065212_restaurar_reconciliacion_individual` y se verificó que únicamente `service_role` conserva permiso de ejecución.
- Se ejecutó el escenario SQL con rollback en Staging. Primera ejecución: un pago confirmado, una cotización vencida cancelada y cero errores. Segunda ejecución: cero cambios. Se comprobó que los traslados sintéticos se eliminaron con el rollback.
- El reconciliador de Stripe de Staging apuntaba al proyecto principal. Se actualizó la configuración de Staging para invocar su propia Edge Function.
- El proyecto Vercel `ruum-ecosistema-kcct` carece de configuración Preview para la clave de servicio, la clave privada Stripe, el token Redis, el secreto Mapbox, los valores de Twilio, el secreto telefónico y `CRON_SECRET`. La validación sandbox y el despliegue Preview siguen pendientes.

### Preflight e integración, 13 de noviembre de 2026

- Prebuild con variables sintéticas de Preview: aprobado, incluidas las aserciones CSP. El mismo prebuild con el entorno local sin fixtures rechazó las credenciales faltantes.
- Integración local: 21 pruebas aprobadas en 3 archivos. Incluye registro y OTP, login, cotización, pago y ambos endpoints de reconciliación con proveedores simulados.
- Vercel Preview: se confirmó que la URL pública corresponde a Supabase Staging y que la clave pública de Stripe es test. Vercel rechazó la creación del Preview de a7e19a6b antes del build con `cron_jobs_limits_reached`. El plan Hobby solo admite crons diarios. Quedan pendientes el preflight con secretos reales y las pruebas de proveedores, WebSocket y alertas.

### Programación de reconciliación en Supabase Staging

La Edge Function `reconciliar-usuario` está desplegada en `ytqhzrbmiczzwzzuzgbq` y usa Stripe en modo test. La migración `20261113190650` registra ambos jobs. Las solicitudes encoladas 163 y 164 devolvieron HTTP 200 con cero candidatos. Una solicitud sin nonce devolvió 401. Consultar el [runbook de Supabase](../../../../docs/runbooks/reconciliacion-usuario-supabase.md) para configurar y verificar otro entorno.
