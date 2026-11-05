# Contrato operativo — Flujo 4: Recuperación de acceso

## Alcance y secuencia

1. El usuario solicita recuperación de contraseña en `/recuperar-password`. La UI valida formato de correo en el cliente y envía `POST /api/recovery/request`.
2. El endpoint valida CSRF de origen, normaliza el correo (`normalizarCorreoRegistro`) y descarta entradas inválidas sin revelar la existencia de la cuenta (respuesta neutra HTTP 200).
3. Se incrementan tres ventanas durables e independientes en Redis (Upstash): IP (15/15 min), correo hash (3/15 min) y dispositivo hash (5/15 min).
4. Si alguna dimensión tiene una sola petición restante (`restantes <= 1`), se exige CAPTCHA adaptativo (Cloudflare Turnstile). Si el proveedor de CAPTCHA no responde o falla, la solicitud devuelve `429` (fail-closed); no existe bypass.
5. Tras superar los controles de rate limit y CAPTCHA, el endpoint invoca en servidor `supabase.auth.resetPasswordForEmail` con timeout de 10 s y redirección sanitizada a `/auth/callback?next=/nueva-password`.
6. Al recibir el correo y hacer clic en el enlace, `/auth/callback` procesa el código PKCE con GoTrue, obtiene la sesión consolidando `getUser()` en un solo viaje de red, emite una cookie de autorización temporal (`ruum_rec_usuario`, HttpOnly, Secure, SameSite=Lax, TTL 900 s) y redirige a `/nueva-password`.
7. `/nueva-password` verifica la autorización llamando a `GET /api/recovery/verify` (que valida que la cookie temporal coincida con la sesión activa). Tras cambiar la contraseña, la sesión actual se preserva mientras que otras sesiones son revocadas (`signOut({ scope: 'others' })`), y se invoca `POST /api/recovery/clear` para destruir la cookie temporal con doble barrera CSRF.

---

## Coordinación con Contratos Transversales (F2 y F3)

### Relación con F2 (Infraestructura Redis)
Flujo 4 **no introduce ningún proveedor de Redis adicional**. Consume directamente el cliente `@upstash/redis` y la función `rateLimitConVentana` de `src/lib/csp-rate-limit.ts` (creado en F2). El almacén es exactamente la misma instancia de Upstash Redis compartida en la plataforma (`UPSTASH_REDIS_REST_URL` / `KV_REST_API_URL`). En producción (`NODE_ENV === "production"`), si Redis no está configurado o falla la conexión, la función falla cerrado devolviendo `429` con cabecera `Retry-After: 60`.

### Extensión Autorizada del Contrato de F3
F4 adopta y consume el contrato de rate limit de F3 (`registro-flujo3.md`), actuando como una **extensión autorizada** y no como una divergencia:
- **Estructura de clave compuesta:** `(IP + hashIdentificador + Device ID)` idéntica a F3.
- **Función hash:** SHA-256 truncado a 32 caracteres hexadecimales (`hashIdentificador`) para cuentas y dispositivos.
- **Ventana:** 15 minutos (`RECOVERY_VENTANA_MS = 15 * 60 * 1000`).
- **Defensa ante CGNAT y rotación de IP:** La independencia de dimensiones garantiza que los usuarios bajo CGNAT comparten cuota de IP pero no de cuenta/dispositivo, mientras que atacantes rotando IP agotan el bucket por correo.
- **Diferenciación autorizada de umbrales:**
  - `recovery-req-email` se fija en **3 peticiones / 15 min** (en contraste con 8 en login). Esta reducción más estricta está autorizada y justificada para proteger el costo y reputación de entrega del transporte SMTP de GoTrue y evitar inundación de buzones.
  - `recovery-req-ip` se fija en **15 peticiones / 15 min**.
  - `recovery-req-device` se fija en **5 peticiones / 15 min**.

---

## Nota de Rigor Criptográfico sobre Hashes en Telemetría

La aplicación utiliza un hash de 32 caracteres hexadecimales (SHA-256 truncado) en eventos de telemetría y logs (`emailHash`):
1. **Propósito exclusivo:** Constituye un mecanismo de **pseudonimización operacional** (conforme a RFC 4949 y Considerando 26 del RGPD) para correlacionar eventos de riesgo y depuración dentro de la ventana de 15 minutos sin registrar datos personales (PII) en texto plano (como correos electrónicos o direcciones IP).
2. **No es anonimización fuerte:** Se declara explícitamente que un hash sin sal sobre un dominio de entropía predecible (como direcciones de correo) **no** constituye anonimización irreversible ante ataques de diccionario o tablas precomputadas.
3. **No es control de seguridad:** Este identificador pseudonimizado no interviene como secreto, token de autenticación ni firma criptográfica.

---

## Condiciones Bloqueantes

### CB-1 — Rate limit durable con clave compuesta
- Implementado en `src/lib/recovery-policy.ts` y aplicado en `/api/recovery/request`, `/api/recovery/verify` y `/api/recovery/clear`.
- Protegido contra caídas de Redis mediante fail-closed en producción.

### CB-2 — Contrato del endpoint de recuperación y consolidación de `getUser()`
- `resetPasswordForEmail` trasladado a `/api/recovery/request`.
- Se exige CAPTCHA adaptativo Cloudflare Turnstile con timeout de 3 s ante `restantes <= 1`.
- En `/auth/callback`, `dataAuth.user` obtenido de `exchangeCodeForSession` se reutiliza directamente, consolidando las 3 llamadas históricas a `getUser()` en 1 sola invocación.

### CB-3 — Exclusión explícita de alternativa de 6 dígitos cross-device
- Documentado formalmente en `src/lib/recovery-cross-device-contract.md`.
- El código numérico de 6 dígitos fue excluido explícitamente en esta versión para prevenir vectores de Account Takeover (ATO) por fuerza bruta. La fricción cross-device de PKCE se registra como deuda técnica aceptada.

---

## Pruebas y Verificación

1. **Pruebas locales:**
   - `src/app/api/recovery/request/route.test.ts` (6 tests).
   - `src/app/api/recovery/verify/route.test.ts` (4 tests).
   - `src/app/api/recovery/clear/route.test.ts` (5 tests).
   - `src/app/auth/callback/route.test.ts` (4 tests).
   - `src/app/recuperar-password/page.test.tsx` (5 tests).
   - `src/app/nueva-password/page.test.tsx` (3 tests).
2. **Evidencia remota en Staging:**
   - Documentada en `docs/evidence/F4-staging-20261104.md`.
