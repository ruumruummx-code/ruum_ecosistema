# Decisión de Producto y Seguridad: Revocación de Sesiones tras Restablecimiento de Contraseña (RUUM-USR-F4-001 / T9)

## 1. Decisión de Producto (CA-7)

Cuando un usuario actualiza exitosamente su contraseña mediante `/nueva-password`:
1. **Comportamiento Predeterminado (`mantenermeConectado = true`):**
   - Se invoca `cliente.auth.signOut({ scope: "others" })`.
   - **Objetivo de Seguridad:** Invalida instantáneamente todos los refresh tokens y sesiones activas en cualquier otro dispositivo, navegador o cliente previo (protección contra Account Takeover y sesiones abiertas en equipos ajenos).
   - **Objetivo de UX:** Mantiene la sesión activa en el dispositivo actual donde se efectuó el cambio, permitiendo al usuario continuar utilizando la plataforma de inmediato sin fricción de re-autenticación innecesaria.
2. **Cierre Total Voluntario (`mantenermeConectado = false`):**
   - Si el usuario desmarca la casilla (por ejemplo, en un dispositivo público, cibercafé o equipo de terceros), se invoca `cliente.auth.signOut({ scope: "global" })`.
   - Purga las sesiones en todos los dispositivos (incluido el actual).
   - Purga de forma atómica en el cliente el borrador local (`ruumruum.traslados-nuevo.borrador.v2`) y las banderas de onboarding (`ruum-onboarding-*`) en `localStorage`.
   - Redirige a `/login?contrasena=actualizada`.

## 2. Verificación de Resiliencia
- Ambas llamadas de revocación están encapsuladas en bloques `try/catch` con `logStructuredWarn`.
- Si el proveedor GoTrue experimenta latencia o falla transitoria en la revocación remota (`scope: "others"`), la contraseña ya quedó actualizada de forma segura en la base de datos y la interfaz de usuario concluye con éxito, evitando bloquear la experiencia del usuario.
