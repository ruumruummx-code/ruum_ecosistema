# Contrato operativo — Flujo 5: Verificar Identidad (KYC)

## Alcance y secuencia

1. El usuario accede a `/verificacion` para validar su identidad. Dispone de dos vías: **Verificación Digital Biométrica (Didit)** o **Carga Manual de Documentos**.
2. **Vía Digital Didit:**
   - La UI solicita la captura o selección de una fotografía de referencia del rostro del usuario.
   - La UI invoca `POST /api/verificacion/didit/iniciar`.
   - El endpoint valida token CSRF de origen y autenticación de sesión GoTrue (`auth.getUser()`).
   - Se evalúa el rate limit durable de clave compuesta sobre Upstash Redis: IP (15/15 min), cuenta de usuario (3/15 min) y dispositivo (5/15 min). Si se excede, devuelve `429 Too Many Requests` con cabecera `Retry-After`.
   - Se invoca la Edge Function `iniciar-verificacion-didit` y se retorna la URL de sesión de Didit (`url`) y el identificador (`sessionId`).
   - La UI abre el modal con iframe de Didit (`verify.didit.me`).
   - Al completar la biometría en el iframe, el front-end activa `esperarResultadoDidit` suscrito a Supabase Realtime (`public.verificaciones_identidad_didit`) con filtro de sesión.
   - Didit emite webhook firmado con HMAC-SHA256 hacia `/functions/v1/webhook-didit`. La función procesa la decisión, ejecuta la RPC atómica `finalizar_verificacion_didit` y actualiza la fila.
   - El evento Realtime notifica inmediatamente a la UI (< 250 ms), marcando al usuario como `verificado` y redirigiéndolo a su destino.
   - Si Realtime no conecta o el webhook demora, un mecanismo de fallback con backoff exponencial espaciado (a 4s, 10s y 16s) consulta puntualmente hasta 3 veces máximo, resolviendo a estado asíncrono a los 20s sin bloquear la UI.
3. **Vía Manual (Saga de Dos Fases):**
   - El usuario completa su domicilio (calle, número, colonia, código postal de 5 dígitos y estado) y adjunta su identificación oficial (INE, pasaporte, licencia en JPG, PNG, PDF o HEIC).
   - **Fase 1:** Se envía primero el archivo mediante `subirDocumentoIdentidad`. Se validan magic bytes y se almacena en el bucket privado `documentos-identidad` (`auth.uid()/*`) con sello temporal de 10 min.
   - Si la Fase 1 falla, el domicilio **jamás** es persistido; la tabla `public.usuarios` no se muta.
   - **Fase 2:** Confirmada la carga del documento (`documentoSubidoExitoso = true`), se invoca `actualizarPerfilUsuario` con los 5 campos requeridos.
   - Si la Fase 2 falla transitoriamente, la aplicación pasa a estado intermedio (`falloDomicilioParcial = true`), manteniendo el documento a salvo y permitiendo al usuario reintentar exclusivamente el guardado del domicilio sin re-subir su identificación.

---

## Coordinación con Contratos Transversales (F2, F3 y F4)

### 1. Relación con F2 (Infraestructura de Redis Compartida)
Flujo 5 consume la misma infraestructura de Upstash Redis definida en F2 y compartida en F3 y F4 (`src/lib/csp-rate-limit.ts`). No introduce proveedores adicionales ni instancias separadas.
En entorno de producción, si Redis falla o no está configurado, la política falla cerrado (`fail-closed = true`), devolviendo `HTTP 429` para resguardar la cuota comercial y la tasa de peticiones a la API de Didit.

### 2. Extensión Autorizada del Contrato de F3 y F4
F5 consume el motor `rateLimitConVentana` con clave compuesta de tres dimensiones independientes:
- **IP:** `didit-iniciar-ip:{ip}` (umbral: 15 / 15 min). Mitiga ataques masivos distribuidos mientras soporta entornos CGNAT de operadores móviles.
- **Cuenta:** `didit-iniciar-cuenta:{userIdHash}` (umbral: 3 / 15 min). Protege contra costos innecesarios de sesiones Didit por cuenta.
- **Dispositivo:** `didit-iniciar-device:{deviceIdHash}` (umbral: 5 / 15 min). Detecta reintentos persistentes en el mismo cliente ante rotación de IP.
- **Función hash:** SHA-256 truncado a 32 caracteres hexadecimales para pseudonimización de identificadores en telemetría y claves de Redis.

---

## Condiciones Bloqueantes RUUM-USR-F5-001

### CB-1 — Saga y compensación en carga manual de documentos
- **Implementación:** Secuencia estricta Documento Primero $\to$ Domicilio Segundo en `VerificacionForm.tsx`.
- **Invariante:** Cero mutaciones en `public.usuarios` ante fallos de carga o validación de documento.
- **Resiliencia:** Estado intermedio con reintento selectivo de domicilio si la segunda fase falla.
- **Contrato:** Documentado en `apps/app-usuario/src/lib/kyc-saga-contract.md`.

### CB-2 — Reconciliación durable de webhook y Supabase Realtime
- **Sustitución de sondeo agresivo:** Eliminado el bucle histórico de 12 s a 2 qps (hasta 24 queries por usuario). Reemplazado por `esperarResultadoDidit` vía Realtime Channel `didit-verif-{sessionId}`.
- **Fallback con Backoff Espaciado:** Si Realtime no resuelve, 3 consultas espaciadas a 4s, 10s y 16s, con timeout a los 20s hacia resolución asíncrona no bloqueante.
- **Reintentos y DLQ en Webhook:** `webhook-didit` devuelve `HTTP 503` en errores recuperables para forzar reintento de Didit. Tras 5 intentos consecutivos, redirige a Dead-Letter Queue en `registro_auditoria` con tipo `webhook_didit_dlq` y estado `error`.
- **Reconciliador Durable:** Script programado `reconciliar-verificaciones-didit.mjs` y migración `20261104000004_verificacion_didit_reconciliacion_dlq.sql` para recuperar sesiones pendientes sin webhook.

### CB-3 — Rate limit durable con clave compuesta
- **Endpoint:** Creado `POST /api/verificacion/didit/iniciar` con validación CSRF y sesión GoTrue.
- **Dimensiones:** `(IP: 15, Cuenta: 3, Dispositivo: 5)` en ventana de 15 minutos, alineado formalmente con F3 y F4.

---

## Nota de Rigor Criptográfico sobre Hashes de Telemetría
Todos los eventos de auditoría y métricas de F5 (`didit_iniciar_rate_limited`, `didit_sesion_iniciada_exitosa`, `iniciar_didit_edge_error`, etc.) registran identificadores procesados mediante **SHA-256 truncado a 32 caracteres hexadecimales**. Se declara formalmente que este valor constituye **pseudonimización operacional** (RFC 4949 / Considerando 26 RGPD) y no anonimización fuerte irreversible ni control de seguridad o token de autenticación. Queda estrictamente erradicado el uso de MD5 o SHA-1.
