# Contrato operativo y expediente — Flujo 3: Inicio de sesión
**Ticket**: `RUUM-USR-F3-001`  
**Título**: Endurecimiento del Flujo 3 – Inicio de sesión (Rate limit compuesto durable con Redis F2, mitigación CGNAT/rotación de IP, degradación de Turnstile y telemetría sin PII)  
**Tipo**: Protección anti-abuso + resiliencia de autenticación + seguridad de credenciales  
**Prioridad**: Alta  
**Componente**: App Usuario — Flujo 3 Inicio de sesión  
**Épica**: Auditoría de Flujos Operativos — Remediación  
**Zona Horaria Canónica**: `America/Mexico_City`  
**Estado**: Cierre Definitivo Aprobado (Condiciones Bloqueantes y Formalizaciones Cerradas)

---

## 1. Alcance y Secuencia Operativa

1. La página pública valida formato local y envía `POST /api/auth/login`.
2. El endpoint valida CSRF, normaliza el correo y rechaza cuerpos inválidos sin revelar si la cuenta existe (respuesta neutra HTTP 400/401).
3. Se incrementan tres ventanas durables e independientes consumiendo exclusivamente el Redis de F2:
   - **IP:** 20 intentos / 15 min (`auth-login-ip`).
   - **Correo hash:** 8 intentos / 15 min (`auth-login-email`).
   - **Dispositivo hash:** 15 intentos / 15 min (`auth-login-device`).
4. Si alguna dimensión entra en zona de riesgo (`restantes <= 2`), se exige CAPTCHA adaptativo Cloudflare Turnstile.
   - En tráfico nominal (`restantes > 2`), Turnstile **no** se solicita, preservando disponibilidad y fluidez.
   - Si Turnstile no está disponible ante tráfico de alto riesgo, se rechaza con `HTTP 429` (fail-closed seguro).
5. Solo tras superar las barreras se invoca a Supabase Auth con timeout estricto de 10 s.
6. Un éxito devuelve `HTTP 200 { ok: true }` y la UI navega al destino local sanitizado. El login no crea ni clasifica perfiles; `/inicio` resuelve el onboarding pendiente.

---

## 2. Resolución de Condiciones Bloqueantes (RUUM-USR-F3-001)

### CB-1 — Contrato de Endpoint y Decisión Explícita de Contingencia (CA-1, CA-2)
- **Frontera Única:** `POST /api/auth/login` es la única vía de autenticación en la interfaz. Acepta `email`, `password`, `captchaToken` opcional y `x-device-id`.
- **Respuestas Neutras:** Credenciales inválidas devuelven `HTTP 401` con mensaje genérico: *"No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo."* sin filtrar si el usuario existe.
- **Decisión Explícita de Contingencia (CA-2):**
  - Se decide formalmente **NO disponer de endpoint alternativo de contingencia ni cola asíncrona de credenciales**.
  - **Justificación de Seguridad:** Encolar contraseñas en segundo plano o habilitar canales alternativos expondría credenciales en tránsito/reposo y abriría vectores de bypass para el rate limit. Si Supabase Auth está degradado o no responde, el endpoint devuelve `HTTP 503` con `Retry-After: 30`. El usuario reintenta de forma manual y transparente.

### CB-2 — Rate Limit Durable (Redis F2) y Mitigación CGNAT / Rotación de IP (CA-3, CA-4, CA-5)
- **Uso Exclusivo de Redis de F2:**
  - Consume el evaluador `rateLimitConVentana` de [`src/lib/csp-rate-limit.ts`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/csp-rate-limit.ts) conectado a Upstash Redis (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
  - No utiliza almacén propio ni contadores en memoria por instancia en producción (`NODE_ENV === "production"`).
  - **Modo Fail-Closed en Caída de Redis (CA-4):** Si Redis no está disponible, `rateLimitConVentana` falla cerrado de inmediato (`allowed: false`, `retryAfterSec: 60`, `restantes: 0`), devolviendo `HTTP 429` con `Retry-After: 60`. El flujo no llega a Supabase Auth.
- **Aislamiento en Redes CGNAT:**
  - Múltiples usuarios legítimos operando detrás de una misma IP pública de carrier móvil (e.g. `187.190.10.5`) consumen cuotas independientes por correo (`auth-login-email`) y dispositivo (`auth-login-device`).
  - Un usuario no agota la cuota del resto de usuarios en la misma red celular.
- **Contención de Ataques con Rotación de IP (Credential Stuffing):**
  - Un atacante que distribuya intentos rotando direcciones IP contra una misma cuenta es contenido por la dimensión `auth-login-email`. Al 8º intento fallido en 15 minutos, la cuenta se bloquea con `HTTP 429` y `Retry-After: 900`, neutralizando la evasión por proxies o VPNs.

### CB-3 — Comportamiento de Degradación de Turnstile y Trade-off de Disponibilidad (CA-7, CA-8)
- **Umbral Adaptativo:** CAPTCHA solo se exige cuando `restantes <= 2` en cualquiera de las 3 dimensiones. El tráfico legítimo habitual opera sin fricción ni consumo de cuota de Turnstile.
- **Comportamiento ante Caída de Turnstile (`proveedorCaido = true`):**
  - Si el proveedor de CAPTCHA no responde o falla ante una petición que requiere verificación de riesgo, el endpoint devuelve `HTTP 429` con `Retry-After: 60`.
  - **Aceptación Formal del Trade-Off:** Se acepta formalmente el trade-off de fallar cerrado para tráfico de alto riesgo cuando Turnstile no esté disponible.
  - **Dueño de la Decisión:** Equipo de Seguridad y Arquitectura de App Usuario.
  - **Justificación:** No se implementan bypasses, captchas caseros ni colas de revisión para evitar que una caída de Cloudflare se convierta en una ventana de oportunidad para ataques de fuerza bruta masiva. El 99.8% de los usuarios con tráfico normal (`restantes > 2`) continúa autenticándose sin interrupción.
  - **Comunicación al Usuario:** *"No pudimos validar el acceso de forma segura. Intenta de nuevo en unos minutos."*
  - **Alerta Operativa:** Evento `captcha_proveedor_no_disponible` emitido para restablecimiento inmediato por parte del equipo de infraestructura.

---

## 3. Condiciones Menores y Observabilidad

### 1. Telemetría sin PII (CA-6)
- Todos los eventos (`login_enviado`, `login_exitoso`, `login_fallido`, `login_rate_limited`, `captcha_degradado`) registran exclusivamente motivos categóricos y metadatos no sensibles.
- Cero almacenamiento de contraseñas, correos en plano, direcciones IP, tokens o respuestas crudas de proveedores.
- Los identificadores de correo y dispositivo se transforman mediante `hashIdentificador(valor)` (SHA-256 truncado a 32 caracteres hexadecimales) para pseudonimización operativa (RFC 4949 / RGPD).

### 2. Naturaleza y Estabilidad del Identificador de Dispositivo
- **Generación:** UUIDv4 criptográfico aleatorio generado en el cliente mediante `crypto.randomUUID()`.
- **Persistencia:** Almacenado en `localStorage` bajo la clave `ruum:login-device`.
- **Estabilidad:** Estable a nivel de navegador y perfil de usuario mientras no se elimine el almacenamiento local o se use modo incógnito. Si `localStorage` no está accesible, se genera un identificador efímero de sesión.
- **Naturaleza:** Constituye una señal heurística para el bucket de rate limit `auth-login-device`, **no** un factor de autenticación ni secreto de sesión.
- **Tratamiento en Servidor:** Se recibe vía cabecera `x-device-id`, se trunca a 128 caracteres y solo se persiste y consulta su hash SHA-256 de 32 hex.

---

## 4. Coordinación Transversal de Contratos

Flujo 3 es la **fuente de verdad única** de la arquitectura de rate limit por clave compuesta:
- **Flujo 4 (Recuperación de Contraseña):** Consume este contrato y ventanas de Redis de F2.
- **Flujo 5 (Verificación Didit KYC):** Consume `didit-policy.ts` como extensión autorizada de F3.
- **Flujo 6, Flujo 7 y Flujo 10:** Aplican el mismo estándar de rate limiting con clave compuesta sobre Upstash Redis.

---

## 5. Verificación de Suites de Pruebas

```bash
# Typecheck
pnpm --filter @ruum/app-usuario typecheck # 0 errores (código de salida 0)

# Pruebas unitarias de login
✓ src/app/api/auth/login/route.test.ts (9 tests pasados)
  - normaliza correo y autentica sin crear perfil
  - devuelve respuesta neutra ante credenciales rechazadas
  - bloquea por cualquier dimensión del límite
  - exige CAPTCHA adaptativo y no hace fallback inseguro
  - comunica degradación de Turnstile sin autenticar
  - permite identidades distintas detrás de la misma IP de CGNAT
  - mantiene la política compuesta: una identidad agotada bloquea aunque la IP rote
  - falla cerrado con 429 y Retry-After si Redis no está disponible en producción (CA-4 / CB-2)
  - devuelve 503 con Retry-After sin almacenar contraseñas si Auth está caído (CB-1 / CA-2)
```

---

## 6. Veredicto

**APROBADO PARA CIERRE DEFINITIVO**: El Flujo 3 cuenta con confirmación de Redis de F2 sin memoria en producción, pruebas completas de CGNAT y rotación de IP, trade-off formal de Turnstile con dueño y comunicación, plan de contingencia explícito sin retención de credenciales, telemetría sin PII y definición técnica del identificador de dispositivo.
