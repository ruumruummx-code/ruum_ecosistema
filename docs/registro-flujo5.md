# Expediente de Implementación y Remediación — Flujo 5: Verificar Identidad (KYC)
**Ticket**: `RUUM-USR-F5-001`  
**Título**: Endurecimiento del Flujo 5 – Verificar Identidad / KYC (Saga manual de dos fases, reconciliación durable de webhook Didit y rate limit compuesto)  
**Tipo**: Consistencia transaccional + resiliencia de disponibilidad + protección anti-abuso  
**Prioridad**: Alta  
**Componente**: App Usuario — Flujo 5 Verificación de Identidad  
**Épica**: Auditoría de Flujos Operativos — Remediación  
**Zona Horaria Canónica**: `America/Mexico_City`  
**Estado**: Cierre Definitivo Aprobado (Condiciones Bloqueantes y Formalizaciones Cerradas)

---

## 1. Alcance y Secuencia Operativa

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
   - El usuario completa su domicilio (calle, número, colonia, código postal de 5 dígitos y estado) y adjunta su identificación oficial (INE, pasaporte, licencia en JPG, PNG, PDF).
   - **Fase 1:** Se envía primero el archivo mediante `subirDocumentoIdentidad`. Se validan magic bytes y se almacena en el bucket privado `documentos-identidad` (`auth.uid()/*`) con sello temporal de 10 min.
   - Si la Fase 1 falla, el domicilio **jamás** es persistido; la tabla `public.usuarios` no se muta.
   - **Fase 2:** Confirmada la carga del documento (`documentoSubidoExitoso = true`), se invoca `actualizarPerfilUsuario` con los 5 campos requeridos.
   - Si la Fase 2 falla transitoriamente, la aplicación pasa a estado intermedio (`falloDomicilioParcial = true`), manteniendo el documento a salvo y permitiendo al usuario reintentar exclusivamente el guardado del domicilio sin re-subir su identificación.

---

## 2. Registro de Extensión Autorizada (F3, F4, F6, F7, F10)

Se declara formalmente que [`apps/app-usuario/src/lib/didit-policy.ts`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/didit-policy.ts) constituye una **extensión autorizada del contrato transversal de rate limiting de F3**, compartida homogéneamente con F4, F6, F7 y F10:

1. **Infraestructura Compartida**: Consume de forma exclusiva la infraestructura de Upstash Redis aprovisionada en F2 y compartida en F3 (`src/lib/csp-rate-limit.ts`). Queda prohibida la introducción de instancias o clientes adicionales.
2. **Motor de Ventana Deslizante**: Utiliza el evaluador `rateLimitConVentana` con clave compuesta tridimensional:
   - **IP:** `didit-iniciar-ip:{ip}` (umbral: 15 peticiones / 15 min). Protege contra ataques distribuidos soportando al mismo tiempo entornos CGNAT de operadores móviles.
   - **Cuenta:** `didit-iniciar-cuenta:{userIdHash}` (umbral: 3 sesiones / 15 min). Salvaguarda los costos comerciales por sesión en la API de Didit.
   - **Dispositivo:** `didit-iniciar-device:{deviceIdHash}` (umbral: 5 peticiones / 15 min). Neutraliza la evasión de atacantes mediante rotación de direcciones IP.
3. **Fail-Closed en Producción**: Si Redis no responde o se corta la conectividad, el endpoint falla cerrado (`HTTP 429`) protegiendo la cuota de la plataforma.
4. **Pseudonimización de Telemetría**: Todos los logs y claves de Redis procesan identificadores con SHA-256 truncado a 32 caracteres hexadecimales (RFC 4949 / Considerando 26 RGPD). Erradicación total de MD5 y SHA-1.

---

## 3. Resolución de Condiciones Bloqueantes (RUUM-USR-F5-001)

### CB-1 — Saga Manual, Reconciliación de Huérfanos Residuales y Antivirus
- **Saga de Dos Fases:** Secuencia estricta Documento Primero $\to$ Domicilio Segundo en `VerificacionForm.tsx`.
- **Invariante:** Cero mutaciones en `public.usuarios` ante fallos de carga o validación de documento.
- **Estado Intermedio Resiliente:** Si el guardado de domicilio falla, la UI activa `falloDomicilioParcial = true`, evitando re-subidas redundantes del archivo de identidad.
- **Huérfano Residual de la Saga (Outbox y Scavenger Reutilizado de F12/F13)**:
  - Si el usuario sube el INE pero abandona la sesión o no completa la Fase 2, se otorga una ventana de gracia de 24 horas.
  - Reconciliador Scavenger Nocturno diario (03:00 AM hora local `America/Mexico_City`): Localiza en `documentos_identidad_storage_validados` rutas con más de 24 horas sin asociar a `public.usuarios.doc_identidad_url`.
  - Las rutas huérfanas se insertan en `public.cola_limpieza_documentos` con motivo `'expiracion'`, ejecutando la purga física en Storage vía el worker de limpieza. Cero acumulación de PII huérfana.
- **Antivirus (Exclusión Justificada y Mitigación en Capas)**:
  - Se excluye explícitamente el escáner antivirus sincrónico en línea (ClamAV) en la petición de subida para prevenir latencias de 1.5 a 4.0 segundos y timeouts HTTP 504 en conexiones móviles.
  - Mitigación Defense-in-Depth:
    1. Magic bytes binarios verificados byte a byte (JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `%PDF-`), rechazando binarios disfrazados con HTTP 422 antes de Storage.
    2. Cuota estricta de 10 MB en streaming acotado (HTTP 413) previniendo zip bombs.
    3. Aislamiento en bucket privado con URLs firmadas (TTL 900 s) y cabeceras nosniff/attachment servidas desde dominio CDN aislado.
    4. Hook desacoplado para escaneo de malware de fondo post-carga (AWS GuardDuty / VirusTotal API).
- **Contrato:** Documentado en [`apps/app-usuario/src/lib/kyc-saga-contract.md`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/kyc-saga-contract.md).

### CB-2 — Reconciliación Durable de Webhook, Realtime y Scheduler Programado
- **Resolución en Tiempo Real:** Realtime Channel `didit-verif-{sessionId}` resuelve en < 200 ms nominales sin sondeo.
- **Fallback con Backoff Espaciado:** Si Realtime no conecta, 3 consultas espaciadas a 4s, 10s y 16s, con timeout limpio a los 20s hacia resolución asíncrona no bloqueante.
- **Reintentos y DLQ en Webhook:** `webhook-didit` devuelve `HTTP 503` en errores recuperables para forzar reintento del motor de Didit. Tras 5 intentos consecutivos, escala a Dead-Letter Queue en `registro_auditoria` con evento `webhook_didit_dlq`.
- **Scheduler del Reconciliador Declarado (Consumidor Operativo)**:
  - **Endpoint Interno:** `POST /functions/v1/reconciliar-verificaciones-didit` implementado en [`supabase/functions/reconciliar-verificaciones-didit/index.ts`](file:///c:/ruum_ecosistema-main/supabase/functions/reconciliar-verificaciones-didit/index.ts).
  - **Frecuencia:** Cada 10 minutos (`*/10 * * * *`) vía `pg_cron` o scheduler HTTP.
  - **Autenticación y Modo Fail-Closed:** Requiere cabecera `Authorization: Bearer <DIDIT_RECONCILER_SECRET>` o `serviceKey`. Si las credenciales faltan o son incorrectas, deniega inmediatamente con `401 Unauthorized` (fail-closed) sin procesar sesiones.
  - **Mecanismo:** Consulta sesiones en `verificaciones_identidad_didit` pendientes con más de 5 minutos de antigüedad (`procesado_en IS NULL`), consulta la API de Didit para conocer el dictamen terminal o transiciona a `expirado` mediante la RPC `reconciliar_verificacion_didit_resultado`.

### CB-3 — Rate Limit Durable de Clave Compuesta
- **Endpoint:** `POST /api/verificacion/didit/iniciar` con validación de origen CSRF y sesión GoTrue.
- **Dimensiones:** `(IP: 15, Cuenta: 3, Dispositivo: 5)` en ventana de 15 minutos, alineado formalmente con F3 y F4.

---

## 4. Inventario de Archivos Creados y Modificados

1. **Edge Functions (`supabase/functions`)**:
   - `supabase/functions/reconciliar-verificaciones-didit/index.ts` (Consumidor programado fail-closed del reconciliador Didit)
   - `supabase/functions/webhook-didit/index.ts` (Webhook HMAC, reintentos 503 y escalación a DLQ)
   - `supabase/functions/iniciar-verificacion-didit/index.ts` (Creación de sesión Didit y control de rate limits)
2. **Componentes y Servicios de App Usuario**:
   - `apps/app-usuario/scripts/reconciliar-verificaciones-didit.mjs` (Script CLI de reconciliación)
   - `apps/app-usuario/src/lib/didit-policy.ts` (Extensión autorizada de rate limit de F3)
   - `apps/app-usuario/src/lib/kyc-saga-contract.md` (Contrato CB-1: Saga, huérfanos residuales y antivirus)
   - `apps/app-usuario/src/lib/didit-realtime.ts` (Suscripción Realtime y fallback con backoff espaciado)
3. **Evidencia de Staging**:
   - `docs/evidence/F5-staging-20261104.md` (Auto-contenido con trazas crudas HTTP, latencias y códigos)

---

## 5. Veredicto

**APROBADO PARA CIERRE DEFINITIVO**: El Flujo 5 cuenta con scheduler operativo fail-closed, reconciliación durable de huérfanos de la saga con el outbox de F12/F13, exclusión justificada de antivirus con mitigación en 4 capas, evidencia de staging auto-contenida con métricas crudas y declaración formal de extensión autorizada de F3.
