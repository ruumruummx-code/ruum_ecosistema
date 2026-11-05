# Contrato Arquitectónico y de Seguridad — Recuperación de Acceso Cross-Device (RUUM-USR-F4-001)

## 1. Contexto y Decisión de Alcance (CB-3 / CA-6)

### Estado: EXCLUSIÓN EXPLÍCITA DE CÓDIGO DE 6 DÍGITOS EN ESTE RELEASE
En el marco del Ticket **RUUM-USR-F4-001**, se evaluó la incorporación de un código OTP numérico de 6 dígitos como alternativa para resolver la fricción cuando un usuario solicita el restablecimiento de contraseña en un dispositivo (ej. computadora de escritorio) y abre el correo en otro (ej. teléfono inteligente).

**Decisión Formal de Arquitectura y Seguridad:**  
Se **EXCLUYE EXPLÍCITAMENTE** la implementación de un código de recuperación numérico de 6 dígitos en este release.

### Justificación Técnica de Seguridad:
1. **Espacio de Claves Reducido y Riesgo de Account Takeover (ATO):**  
   Un código de 6 dígitos decimales posee solo $10^6$ (1,000,000) combinaciones posibles. Sin un canal dedicado de hardware criptográfico o MFA secundario, abrir un endpoint de reseteo de credenciales que acepte un código numérico corto incrementa drásticamente la superficie de ataque por fuerza bruta distribuida.
2. **Defensa de Camino Único de Autorización (Single Path of Authority):**  
   Supabase GoTrue opera mediante tokens criptográficos de alta entropía (PKCE code verifier SHA-256 de 256 bits y hash tokens de 128 bits). Mantener el flujo exclusivamente sobre el deep-link PKCE validado por el servidor `/auth/callback` y sellado con la cookie HTTP-Only `ruum_rec_usuario` evita abrir un camino paralelo no auditado.
3. **Prohibición de Fallback a Correo de Facturación (CA-9):**  
   Se ratifica la regla de dominio inquebrantable: `auth.users.email` es la única identidad de acceso autorizada. Queda terminantemente prohibido utilizar `usuarios.correo_facturacion` como fallback o canal alterno de recuperación.

---

## 2. Deuda Técnica Conocida y Mitigación UX

### Diagnóstico de la Fricción:
El protocolo RFC 7636 (PKCE) requiere que el navegador que intercambia el `code` posea en su almacenamiento local el `code_verifier` original. Cuando el usuario hace clic en el enlace desde un cliente de correo en otro dispositivo, GoTrue rechaza el intercambio debido a la ausencia del verificador de flujo (`flow_state / code_verifier missing`).

### Mitigación en Producción:
El Route Handler `/auth/callback/route.ts` detecta el error de PKCE entre dispositivos mediante `clasificarCausaError()` y clasifica la causa como `otro_dispositivo`.  
La interfaz de usuario en `/recuperar-password/page.tsx` presenta una advertencia guiada y no bloqueante:
> *"El enlace no pudo validarse en este navegador o fue solicitado desde otro dispositivo. Por seguridad, solicita un nuevo enlace desde este mismo navegador."*

---

## 3. Especificación del Contrato Futuro para Alternativa Cross-Device

Si una fase futura de producto aprueba la implementación de un código de recuperación numérico cross-device, este **DEBERÁ** cumplir estrictamente con los siguientes requisitos no negociables:

1. **TTL Estricto:** Máximo 300 segundos (5 minutos) de vida útil desde su generación.
2. **Límite de Intentos:** Máximo 3 intentos fallidos consecutivos. Al 4to intento fallido, el código se invalida inmediatamente y de forma permanente en Redis.
3. **Binding Criptográfico de Cuenta y Dispositivo:**  
   El OTP en Redis debe persistirse indexado por un hash criptográfico:  
   `HMAC-SHA256(userId + emailNormalizado, SECRET_PEPPER)`.
4. **Rate Limit Compuesto de Verificación:**  
   - IP: máximo 5 intentos por ventana de 15 minutos.  
   - Cuenta: máximo 3 intentos por ventana de 15 minutos.  
   - Dispositivo: máximo 5 intentos por ventana de 15 minutos.
5. **Auditoría Inmutable:**  
   Todo intento de verificación (exitoso o fallido) debe emitir un registro de auditoría en la tabla `auditoria_seguridad` con severidad `CRITICAL` y notificar inmediatamente por correo al titular de la cuenta.
6. **Incompatibilidad con Correo de Facturación:**  
   El código solo podrá despacharse a `auth.users.email`.
