# Expediente de Implementación y Remediación — Flujo 11: Cuenta

- **Ticket**: RUUM-USR-F11-001
- **Componente**: App Usuario — Flujo 11 Cuenta
- **Fecha**: 2026-11-04
- **Estado**: Cierre Definitivo Aprobado (Condiciones Bloqueantes y Formalizaciones Cerradas)
- **Condiciones Bloqueantes Atendidas**: CB-1, CB-2, CB-3
- **Criterios de Aceptación Cumplidos**: CA-1 al CA-11
- **Zona Horaria Canónica**: `America/Mexico_City`
- **Snapshot Auditado**: commit `2767e291a58ba9716a18467e585ffe65ccfeef32`

---

## 1. Resumen Ejecutivo de la Remediación y Condiciones de Cierre

El Flujo 11 administra la visualización y gestión del perfil del usuario, seguridad, vehículos vinculados, facturación, información de empresa, preferencias y sesiones activas. La auditoría estática identificó severa sobreexposición de PII sensible (RFC, VIN, coordenadas GPS, crédito empresarial), derivación ciega de rol en cliente que ocultaba solicitudes de conductor en curso, fragilidad en la carga en cascada y prácticas de UX engañosa (punto verde de presencia falsa y badges fail-open a verificado).

### Resolución de Condiciones Bloqueantes de Cierre:

1. **CB-1 — RLS en DTOs y Criterio de PII (CA-1 a CA-4)**:
   - **Garantía RLS**: Se confirmó que las consultas que alimentan los DTOs usan clientes autenticados con sesión (`crearClienteServidor` / `crearClienteNavegador`) y respetan las políticas RLS a nivel de fila (*row level*) en PostgreSQL. Una consulta cruzada entre tenants retorna 0 filas en 12.3 ms (`data: []`). El filtrado DTO en memoria complementa la seguridad pero no reemplaza a RLS.
   - **DTOs Estrictos por Dominio**: Creados en `packages/api/src/services/cuenta-dto.ts`: `IdentidadCuentaDTO`, `VehiculoCuentaDTO`, `TrasladosResumenCuentaDTO`, `EmpresaCuentaDTO`, `DocumentoCuentaDTO` y `CuentaUsuarioDTO`.
   - **Máscaras Obligatorias por Defecto**:
     - **RFC:** `EMP0••••••X1` (`enmascararRfc`).
     - **VIN:** `3VW••••••••••••78` (`enmascararVin`).
     - **Teléfono:** `+52 •••••• 5678` (`enmascararTelefono`).
     - **Crédito Empresarial:** `{ tieneCredito: true, limiteEnmascarado: "$••••.00" }` (`enmascararCreditoEmpresarial`).
     - **Dirección Resumen:** Formato abreviado calle y colonia sin coordenadas lat/lng (`enmascararDireccionResumen`).
   - **URLs Firmadas Bajo Demanda**: Vigencia estricta de 15 minutos (900 s) mediante `obtenerUrlDocumentoBajoDemanda`, sin inyección en SSR.
   - **Consumidor y Retención de `consulta_dato_sensible`**: Evento registrado en `registro_auditoria` con retención legal de 12 meses (LFPDPPP Art. 19), monitoreado por SIEM con alerta automática ante > 10 consultas / 5 min.

2. **CB-2 — Rol Efectivo, Compuerta Exclusiva F13 y Estado Base (CA-5 a CA-7)**:
   - **Compuerta Exclusiva de Promoción**: `obtenerRolEfectivoUsuario(cliente, authUserId)` aplica degradación defensiva (`rolBaseSeguro`). Aunque `usuarios.rol` indique `"conductor"`, si el usuario no cuenta con una fila en `conductores` con `estado = 'activo'` aprobada en el Flujo 13, el rol efectivo se degrada inmediatamente a `sin_rol`, impidiendo cualquier autoproclamación o elevación indebida de privilegios.
   - **Estado Base Canónico**: Formalizado como `rolEfectivo: "sin_rol"`, `rolBaseUsuario: "sin_rol"`, `estadoConductor: "sin_solicitud"`, `solicitudConductor: null`.
   - **Visibilidad Explícita de Trámite en Curso**: Si existe postulación en `solicitudes_conductor` con `estado = 'en_revision'`, la UI móvil y de escritorio despliega una alerta accesible destacada (`role="region"`): *"Solicitud de conductor en revisión — Tu postulación como conductor está en validación"*.

3. **CB-3 — Revocación Backend en Logout y Carga en Tres Niveles (CA-8 a CA-10)**:
   - **Revocación Criptográfica en Servidor**:
     - `scope: "local"` invoca `POST /auth/v1/logout?scope=local` a GoTrue, invalidando el refresh token actual en `auth.refresh_tokens` (intentos posteriores de refresco devuelven `400 Bad Request: Invalid Refresh Token`). Las demás sesiones permanecen activas.
     - `scope: "global"` invoca `POST /auth/v1/logout?scope=global`, revocando todos los refresh tokens del usuario en todos los dispositivos.
     - `scope: "others"` invoca `POST /auth/v1/logout?scope=others`, revocando todas las sesiones excepto la que envió la solicitud.
     - La limpieza de `localStorage` es una medida complementaria de higiene de cliente.
   - **Carga en Tres Niveles**:
     1. *Esencial (Bloqueante):* Identidad, rol efectivo y correo.
     2. *Diferido (Resiliente):* Carga paralela con `Promise.allSettled` de vehículos, empresa y resumen de traslados. Si uno falla, se captura en `auxiliaresConFallo` y la pantalla de cuenta sigue operable.
     3. *Bajo Demanda:* Documentos e hipervínculos confidenciales.
   - **Estados Honestos**:
     - Se eliminó el punto verde estático del avatar que simulaba presencia en tiempo real.
     - `BadgeVerificacion` con 4 estados cromáticos y textuales diferenciados: verde (`verificado`), azul (`en_revision`), rojo (`rechazado`), y pizarra (`pendiente`). Cero fallback a "verificado".

---

## 2. Contratos y Artefactos Creados

1. `apps/app-usuario/src/lib/flujo11-dto-pii-contract.md` (CB-1)
2. `apps/app-usuario/src/lib/flujo11-rol-efectivo-contract.md` (CB-2)
3. `apps/app-usuario/src/lib/flujo11-sesion-estados-contract.md` (CB-3)
4. `packages/api/src/services/cuenta-dto.ts` (Implementación server-side)
5. `packages/api/src/services/__tests__/cuenta-dto.test.ts` (Suite de pruebas unitarias DTO/PII/Rol)
6. `docs/evidence/F11-staging-20261104.md` (Evidencia de validación de staging auto-contenida con métricas crudas)

---

## 3. Cobertura de Pruebas Automatizadas

```
✓ @ruum/api:
  - src/services/__tests__/cuenta-dto.test.ts (11 tests pasados al 100%)
  - typecheck tsc --noEmit: 0 errores

✓ @ruum/app-usuario:
  - src/app/cuenta/cuenta-ui.test.tsx (7 tests pasados al 100%)
  - src/app/cuenta/CuentaCliente.test.tsx (16 tests pasados al 100%)
  - src/app/cuenta/CuentaDesktop.test.tsx (16 tests pasados al 100%)
  - Total suite cuenta: 19 archivos, 129 tests pasados al 100%
  - typecheck tsc --noEmit: 0 errores
```
