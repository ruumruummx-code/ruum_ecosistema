# Contrato operativo — Flujo 6: Solicitud Individual (Traslados)

## Alcance y secuencia

1. El usuario accede al wizard de solicitud individual (`/viajes/nuevo`) compuesto por los pasos:
   - **Paso 1: Vehículo** (selección o alta manual, placas, VIN, características mecánicas y condición).
   - **Paso 2: Ruta** (código postal, colonia, calles, coordenadas y paradas intermedias de origen a destino).
   - **Paso 3: Detalles** (contactos de entrega y recepción, modalidad de programación horaria).
   - **Paso 4: Cotización y Políticas** (visualización del resumen, aceptación de políticas de servicio y confirmación).
   - **Paso 5: Pago y Pasaporte** (pago electrónico seguro con Stripe y emisión de pasaporte digital).
2. **Validación y Recálculo en Servidor (`POST /api/viajes`):**
   - El wizard invoca `POST /api/viajes` al completar el paso 4 antes de crear el registro en la base de datos.
   - El endpoint valida autenticación de sesión GoTrue (`auth.getUser()`) y resuelve el perfil interno del usuario.
   - Aplica el **rate limit compuesto** sobre Redis/memoria: IP (20/15 min), cuenta (5/15 min) y dispositivo (10/15 min).
   - **Recálculo Server-Side Obligatorio (CB-1):** El servidor calcula de forma soberana la distancia en kilómetros y el tiempo estimado de viaje mediante el módulo `ruta-cache.ts` (consultando primero Redis `cache:ruta:{hash}` con TTL 24 horas, con fallback a Mapbox Directions API o Haversine).
   - El servidor calcula la tarifa oficial (v2.0) considerando tarifas base, por kilómetro, gama del vehículo, franja horaria, día y condición del vehículo (aplicando factor $1.25\times$ para `rescate_mecanico`).
   - Audita cualquier discrepancia entre los valores reportados por el cliente y el recálculo server-side mediante `registrarDivergenciaTarifa`.
   - Genera un **Snapshot Tarifario Firmado** (`tarifa-snapshot.ts`) con versión `2.0`, hash canónico de entradas, monto exacto, marcas de tiempo, TTL acotado (15 minutos), nonce único de un solo uso y firma criptográfica HMAC-SHA256.
   - Registra el consentimiento legal utilizando el escritor canónico de F2 (`registrarConsentimientoUsuario`).
   - Retorna al cliente el recálculo de ruta y el snapshot firmado.
3. **Persistencia Atómica en Base de Datos (RPC `usuario_crea_traslado`):**
   - El cliente invoca el RPC `usuario_crea_traslado` inyectando los datos del traslado junto con el `snapshot_tarifa`.
   - El RPC valida integridad de esquema, autoriza vehículos no rodantes bajo condición `rescate_mecanico` (migración `20261104000005`), almacena el snapshot en la columna `snapshot_tarifa` de `public.traslados` y registra auditoría.
4. **Saga de Cobro y Confirmación (CB-2):**
   - El cliente avanza al Paso 5 ([PasoPago.tsx](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/viajes/nuevo/components/PasoPago.tsx)).
   - El pago se ejecuta exclusivamente con tarjeta bancaria vía Stripe Elements; los métodos no implementados (OXXO, Google Pay) se muestran deshabilitados con badge "Próximamente" para evitar falsas expectativas.
   - Ante fallas de pago o abandono, se activa compensación explícita (`pago_fallido_compensacion`).
   - Ante demoras de webhook de Stripe, `usePagoTraslado` adopta el estado "Pago en proceso de confirmación" con reintento y consulta asíncrona no bloqueante.

---

## Coordinación con Contratos Transversales (F2, F3, F4 y F5)

### 1. Relación con F2 (Infraestructura Redis y Consentimientos)
- Flujo 6 consume la misma infraestructura de Upstash Redis definida en F2 (`src/lib/csp-rate-limit.ts`) tanto para el rate limit como para el cache de rutas (`cache:ruta:{hash}`) y la validación anti-replay de nonces de cotización (`snapshot-nonce:{nonce}`).
- Para consentimientos legales, F6 consume exclusivamente el escritor canónico `registrarConsentimientoUsuario` de [`@ruum/api/services`](file:///c:/ruum_ecosistema-main/packages/api/src/services/) (versión `1.0.0`, origen `web`, tipo `1`), eliminando cualquier tabla o ruta alternativa.

### 2. Extensión Autorizada del Contrato de Rate Limiting (F3, F4, F5, F7)
F6 no define un motor de rate limiting propio; consume el motor centralizado `rateLimitConVentana` de F2/Redis (`src/lib/csp-rate-limit.ts`) bajo una **extensión autorizada** específicamente dimensionada para el flujo de creación individual de traslados:

| Dimensión | Clave Redis | Límite / Ventana | Justificación Operativa |
| :--- | :--- | :--- | :--- |
| **IP** | `viajes-crear-ip:{ip}` | 20 peticiones / 15 min | Admite múltiples usuarios legítimos operando simultáneamente bajo CGNAT de operadores móviles mexicanos (Telcel, AT&T, Movistar) o redes corporativas compartidas, evitando falsos positivos sin abrir flood irrestricto. |
| **Cuenta** | `viajes-crear-cuenta:{userIdHash}` | 5 peticiones / 15 min | Contención estricta contra creación automatizada de solicitudes, scripts de flooding y saturación maliciosa de la base de datos por parte de una misma cuenta autenticada. |
| **Dispositivo** | `viajes-crear-device:{deviceIdHash}` | 10 peticiones / 15 min | Contención contra ataques de evasión mediante rotación rápida de IP (botnets o proxies móviles) ejecutados desde una misma instancia o navegador cliente. |

En caso de exceder cualquiera de los tres umbrales, el endpoint emite de inmediato `HTTP 429 Too Many Requests` con la cabecera estándar `Retry-After` y registra el evento seudonimizado `viajes_crear_rate_limited`.

### 3. Decisión Formal sobre Divergencia de Tarifas (>10%) (RUUM-USR-F6-001-C / C2 / CA-C4)
- **Dueño de la Decisión**: Tech Lead de Arquitectura & Finanzas RUUM.
- **Principio Rector**: Soberanía Server-Side Inviolable. El cliente jamás fija precios finales en base de datos.
- **Efecto Operativo según Umbrales**:
  1. **Discrepancia $\le 10\%$**: *Comportamiento Nominal*. Se asumen variaciones normales de precisión de GPS o cálculo de ruta entre SDK de Mapbox cliente y servidor. El servidor recalcula y devuelve snapshot oficial.
  2. **Discrepancia $> 10\%$ y $\le 50\%$**: *Telemetría y Sobreescritura Soberana*. Se emite log estructurado de advertencia (`divergencia_tarifa_detectada`) con `userIdHash`. El servidor descarta las estimaciones del cliente y sobreescribe soberanamente la distancia, tiempo y snapshot oficial, permitiendo al usuario continuar sin fricción comercial.
  3. **Discrepancia $> 50\%$ o Monto del Cliente $\le 0$**: *Rechazo Operativo y Bloqueo Inmediato*. Clasificado como manipulación maliciosa de payload. El servidor responde con `HTTP 400 Bad Request` (`"Divergencia crítica detectada en los parámetros de ruta y tarifa. Por favor actualiza la cotización."`) y emite telemetría de fraude `divergencia_tarifa_critica_bloqueada`.

---

## Dependencia y Reconciliador de Saga (Bloque B / B1, B2 / CA-C2)

F6 formaliza la compensación y reconciliación durable de la saga transaccional de pagos mediante:
- **Componente**: RPC `public.reconciliar_saga_traslados_individuales(p_limite integer default 50)` ([migración 20261104000005](file:///c:/ruum_ecosistema-main/supabase/migrations/20261104000005_flujo6_tarifa_snapshot_rescate_mecanico.sql)).
- **Consumidor Interno**: `GET /api/internal/viajes/reconcile` protegido por `VIAJES_RECONCILIADOR_SECRET`.
- **Dueño Operativo**: Equipo de Operaciones & Pasarela de Pagos RUUM.
- **Frecuencia**: Cada 5 minutos (vía Vercel Cron / pg_cron `ruum-reconciliar-saga-f6`).
- **Concurrencia**: `FOR UPDATE SKIP LOCKED` sobre traslados en `cotizacion_generada` con antigüedad $> 15\text{ minutos}$.
- **Comportamiento**:
  - Si el pago existe en `public.pagos` como aprobado $\to$ transiciona a `servicio_confirmado`.
  - Si el pago no existe o falló tras agotar el TTL de 15 min $\to$ compensa a `servicio_cancelado` con motivo `pago_fallido_compensacion`.
  - Las excepciones se aíslan y registran en `public.registro_auditoria` (`error_reconciliacion_saga_f6`) sin abortar el lote.

---

## Condiciones Bloqueantes RUUM-USR-F6-001

### CB-1 — Recálculo server-side como fuente de verdad y snapshot firmado
- **Vulnerabilidad erradicada:** El cliente ya no puede fijar distancias arbitrarias ni modificar el costo del servicio en base de datos.
- **Snapshot Criptográfico:** HMAC-SHA256 sobre versión, hash de entradas, monto, expiración y nonce. Valida autenticidad e integridad del presupuesto sin constituir autorización directa de cobro.
- **Anti-Replay y TTL:** Nonce con vigencia de 15 minutos en Redis. Expirado o reutilizado el nonce, el traslado no puede crearse.
- **Cache de Rutas:** Guardado en Redis bajo `cache:ruta:{hash}` con TTL de 24 horas, disminuyendo costos de API de mapas.

### CB-2 — Contrato de la saga de pago para solicitud individual
- **Estados Coreografiados:** Definidos en `apps/app-usuario/src/lib/pago-individual-saga-contract.md`.
- **Compensación:** Cancelación de traslados impagos tras expiración de sesión.
- **Resiliencia de Webhook:** Estado intermedio "Pago en proceso de confirmación" en `usePagoTraslado.ts` sin bloqueo de UI.
- **Higiene UX:** Tabs de métodos no soportados marcadas con badge "Próximamente" y deshabilitadas en `PasoPago.tsx`.

### CB-3 — Resolución del conflicto `rescate_mecanico` y consentimiento canónico
- **Alineación de Capas:** Migración `20261104000005` corrige la guarda SQL para permitir `puedeCircular = false` cuando `condicion = 'rescate_mecanico'`.
- **Sobretasa de Rescate:** Factor $1.25\times$ implementado en `tarifa-snapshot.ts` y verificado en pruebas unitarias.
- **Consentimiento Canónico:** Registro a través de `registrarConsentimientoUsuario` de F2 documentado en `flujo6-consent-contract.md`.

---

## Nota de Rigor Criptográfico sobre Hashes de Telemetría
Todos los eventos de auditoría y métricas de F6 (`viajes_crear_rate_limited`, `divergencia_tarifa_detectada`, etc.) registran identificadores procesados mediante **SHA-256 truncado a 32 caracteres hexadecimales**. Se declara formalmente que este valor constituye **pseudonimización operacional** (RFC 4949 / Considerando 26 RGPD) y no anonimización fuerte irreversible ni control de seguridad o token de autenticación. Queda estrictamente erradicado el uso de MD5 o SHA-1.
