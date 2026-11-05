# Contrato operativo — Flujo 3: Inicio de sesión

## Alcance y secuencia

1. La página pública valida formato local y envía `POST /api/auth/login`.
2. El endpoint valida CSRF, normaliza el correo y rechaza cuerpos inválidos sin revelar si la cuenta existe.
3. Se incrementan tres ventanas durables e independientes: IP (20/15 min), correo hash (8/15 min) y dispositivo hash (15/15 min).
4. Si alguna dimensión queda con dos o menos intentos, se exige CAPTCHA adaptativo. La caída del proveedor produce `429`; no existe bypass.
5. Solo después de superar las barreras se llama a Supabase Auth con un timeout de 10 s.
6. Un éxito devuelve `200 {ok:true}` y la UI navega al destino local sanitizado. El login no crea ni clasifica perfiles; `/inicio` resuelve el onboarding pendiente.

## Condiciones bloqueantes

### CB-1 — Contrato de endpoint

`POST /api/auth/login` es la única frontera de autenticación de la UI. Acepta `email`, `password`, `captchaToken` opcional y `x-device-id`; nunca registra credenciales, tokens, correo o IP en claro. Las respuestas de credenciales son neutras (`401`) y las fallas de dependencia son `503` con `Retry-After`.

### CB-2 — Rate limit durable

Las claves de correo y dispositivo se almacenan como SHA-256 truncado; la IP se obtiene de cabeceras confiables. F3 consume exclusivamente `rateLimitConVentana` de F2: no crea otro almacén ni contador propio. En producción, Redis es obligatorio; si falta o falla, la función falla cerrado y el endpoint devuelve `429` con `Retry-After: 60`. El fallback en memoria solo existe fuera de producción y no es evidencia de protección productiva.

La política compuesta evita que la IP sea la única decisión: usuarios legítimos detrás del mismo CGNAT conservan sus cuotas independientes por correo y dispositivo, mientras que un atacante que rote IP sigue limitado por correo/dispositivo hash. El escenario reproducible se cubre con la prueba de contrato del endpoint: una IP compartida mantiene las tres dimensiones permitidas para identidades distintas y una dimensión de identidad agotada bloquea aunque cambie la IP. La validación final de latencia y concurrencia contra Redis debe ejecutarse en staging.

### CB-3 — CAPTCHA y degradación

El umbral adaptativo es `restantes <= 2`. Turnstile se verifica en servidor con timeout de 3 s. Token ausente o inválido devuelve `428`; proveedor caído devuelve `429` y no permite autenticar sin prueba adicional.

Decisión de disponibilidad: se acepta explícitamente tumbar el login cuando Turnstile no está disponible. El dueño de la decisión es App Usuario/Seguridad; no se introduce bypass, desafío casero ni cola de revisión que pudiera convertirse en una vía de autenticación. La comunicación al usuario es: “No pudimos validar el acceso de forma segura. Intenta de nuevo en unos minutos.” Operaciones debe alertar por `captcha_proveedor_no_disponible` y restaurar `TURNSTILE_SECRET_KEY`/proveedor antes de retirar la degradación.

## Estados y recuperación

- Las ventanas se consumen antes de Auth; esto evita que credenciales inválidas saturen el proveedor, pero implica que reintentos legítimos también consumen cuota.
- No se escribe en `usuarios` ni en tablas de perfil durante login; por tanto no hay perfil huérfano por una autenticación parcial.
- Un timeout o excepción de Auth no cambia el estado de negocio y devuelve `503`; el usuario puede reintentar respetando la ventana.
- El cliente cancela por timeout de 12 s y restablece el estado `enviando`, mostrando feedback visible.

### Condiciones menores y operativas

- **CB-1 / CA-2:** no existe contingencia automática ni cola para Auth. El contrato explícito es `503` + `Retry-After: 30`, reintento manual del usuario y alerta operativa; el endpoint no persiste credenciales ni crea perfiles parcialmente.
- **CA-4:** si Redis cae en producción, las tres dimensiones de `rateLimitConVentana` fallan cerrado; no se usa memoria por instancia y el login no llega a Supabase Auth.
- **CA-6:** la telemetría solo registra estados (`login_enviado`, `login_exitoso`, `login_error`, `login_rate_limited`, `captcha_degradado`) y motivos categóricos. No incluye correo, IP, contraseña, token, identificador de dispositivo ni respuesta de proveedor.
- **Identificador de dispositivo:** UUID aleatorio generado en el navegador y persistido en `localStorage` bajo `ruum:login-device`; es pseudónimo, estable por perfil/navegador mientras no se borre el almacenamiento y no es factor de autenticación. Si `localStorage` no está disponible se usa un identificador efímero y la protección por IP/correo continúa siendo obligatoria. El servidor lo trunca a 128 caracteres y solo guarda su hash.

## Observabilidad y gobernanza

Los eventos permitidos son `login_enviado`, `login_exitoso`, `login_error`, `login_rate_limited` y `captcha_degradado`; sus atributos son banderas y motivos sin PII. Cualquier nuevo campo debe pasar revisión de seguridad para impedir secretos, correo, IP o tokens.

## Pruebas mínimas

`route.test.ts` cubre éxito, credenciales rechazadas, bloqueo por dimensión y CAPTCHA requerido. `LoginCliente.test.tsx` y `integracion-flujos-criticos.test.tsx` verifican que la UI consume el endpoint y no el SDK de Auth directamente.

## Evidencia de cierre

- Pruebas locales: `pnpm --dir apps/app-usuario exec vitest run src/app/api/auth/login/route.test.ts src/app/login/LoginCliente.test.tsx test/integracion-flujos-criticos.test.tsx`.
- Gate de código: `pnpm --dir apps/app-usuario exec eslint ...`, `pnpm --dir apps/app-usuario exec tsc --noEmit` y `git diff --check`.
- Evidencia pendiente de entorno: ejecutar en staging con Redis real una prueba concurrente CGNAT/rotación de IP y verificar métricas del proveedor Turnstile. Esta evidencia no puede inferirse de los mocks locales.

## Coordinación operativa

F3 es dueño del contrato de rate limit (`auth-login-ip`, `auth-login-email`, `auth-login-device`, sus límites y `Retry-After`). F4 y F5 deben consumir este contrato sin redefinir claves, ventanas o semántica. Antes del despliegue se requiere una sesión conjunta de arranque para validar compatibilidad y alertas.
