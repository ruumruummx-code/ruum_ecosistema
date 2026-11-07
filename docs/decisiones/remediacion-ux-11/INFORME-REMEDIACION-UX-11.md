# Informe de Cierre de Ticket · RUUM-UX-011

**ID del Ticket:** RUUM-UX-011  
**Título:** Eliminar falso éxito al guardar preferencias y unificar contrato de persistencia móvil/escritorio  
**Prioridad:** P1 — Bloqueante de liberación  
**Tipo:** Defecto funcional de UX + inconsistencia de sistema de diseño + riesgo de confianza  
**Origen:** Auditoría UX/UI App Usuario (revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)  
**Referencia de hallazgo:** UX-11 · P1 · "Preferencias de escritorio confirma éxito aunque falle el guardado remoto"  
**Estado:** Resuelto / Listo para Gate de Salida  
**Fecha de Cierre:** 2026-11-06  

---

## 1. Contexto y Diagnóstico del Problema

Durante la auditoría UX/UI se identificó que en la pantalla de preferencias de escritorio (`/cuenta/preferencias`):
1. **Falso éxito comprobado:** Al interceptar la petición de guardado remoto simulando un fallo controlado `HTTP 503 Service Unavailable`, la pantalla presentaba inmediatamente el mensaje `"Cambios guardados con éxito"`.
2. **Causa raíz en código:** En `apps/app-usuario/src/app/cuenta/preferencias/PreferenciasCliente.tsx`, `handleGuardarCambios` capturaba los errores en un bloque `try/catch` superficial y procedía incondicionalmente a ejecutar `setMensajeExito(true)`.
3. **Inconsistencia de persistencia y fuga de datos entre cuentas:**
   - Escritorio utilizaba una clave de `localStorage` global y desprotegida (`ruum-usuario-preferencias`), compartida entre todas las cuentas que abrieran sesión en el mismo navegador.
   - La variante móvil (`Preferencias.tsx`) utilizaba un esquema atómico y aislado por usuario (`ruum:pref:<clave>:<userId>`) junto con una cola de sincronización pendiente (`ruum:preferencias-pendientes:<userId>`).
   - El guardado remoto de escritorio solo actualizaba las columnas de notificación en `public.usuarios` (`actualizarPreferenciasNotificaciones`), ignorando las opciones generales (idioma, zona horaria, unidades, tema, accesibilidad, uso de datos), que nunca se sincronizaban con la columna `usuarios.preferencias` (JSONB).

---

## 2. Solución Implementada

### 2.1. Contrato Unificado de Persistencia (`preferencias-contrato.ts`)
Se formalizó el contrato transversal en [`apps/app-usuario/src/lib/preferencias-contrato.ts`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/preferencias-contrato.ts):
- **Estructura unificada:** `PreferenciasUsuarioContrato` modela tanto las opciones generales como las preferencias de notificación de forma consistente para móvil y escritorio.
- **Aislamiento por usuario:** 
  - Clave consolidada: `ruum:pref:usuario:<userId>`
  - Claves atómicas retrocompatibles: `ruum:pref:<clave>:<userId>`
  - Migración transparente y única de la clave global histórica `ruum-usuario-preferencias` hacia el ámbito del usuario autenticado.
- **Cola de sincronización pendiente:** `ruum:preferencias-pendientes:<userId>` registra los cambios pendientes de envío ante fallos de red o 503, asegurando la no pérdida de ediciones.

### 2.2. Máquina de Estados Honesta de Guardado (`PreferenciasCliente.tsx`)
Se eliminó la invocación incondicional de éxito y se sustituyó por una máquina de estados explícita:
`"inactivo" | "guardando" | "exito" | "error" | "pendiente"`
- **Ante fallo HTTP 503:** La pantalla entra en estado `error`, muestra una alerta visual con `role="alert"` comunicando `"Servicio no disponible (HTTP 503). Cambios guardados localmente."` y habilita el botón interactivo **"Reintentar"**.
- **Ante pérdida de red / offline:** La pantalla entra en estado `pendiente`, muestra un banner con `role="status"` indicando `"Sin conexión. Cambios guardados localmente; sincronización pendiente."` y activa un listener reactivo `window.addEventListener("online", ...)` para reintentar automáticamente al recuperar la conectividad.
- **Sincronización dual completa:** `sincronizarPreferenciasRemotas` despacha concurrentemente `actualizarPreferenciasNotificaciones` (columnas booleanas en BD) y `actualizarPreferenciasGeneralesUsuario` (columna `preferencias` JSONB con control de concurrencia optimista `actualizado_en`).

---

## 3. Matriz de Opciones, Persistencia y Efectos Reales (AC-6)

| Opción | Tipo de Control | Destino Remoto (Supabase) | Destino Local (`localStorage`) | Efecto Real en la Aplicación |
| :--- | :--- | :--- | :--- | :--- |
| **Idioma** | Segmented Switch (`es` / `en`) | `usuarios.preferencias -> { idioma }` | `ruum:pref:usuario:<id>`, `ruum:pref:idioma:<id>` | `document.documentElement.setAttribute("lang", "es-MX" \| "en-US")` |
| **Zona Horaria** | Dropdown (`UTC-06`, etc.) | `usuarios.preferencias -> { zonaHoraria }` | `ruum:pref:usuario:<id>` | Formateador de fechas y horarios de traslados |
| **Unidades** | Dropdown (`Métrico` / `Imperial`) | `usuarios.preferencias -> { unidades }` | `ruum:pref:usuario:<id>`, `ruum:pref:unidades:<id>` | `data-units="metric" \| "imperial"`, evento `ruum:unidades-actualizadas` |
| **Tema** | Segmented Switch (`Claro` / `Oscuro` / `Auto`) | `usuarios.preferencias -> { tema }` | `ruum:pref:usuario:<id>`, `ruum:pref:tema:<id>`, `ruum-tema` | `data-theme="light" \| "dark"`, clase `.dark` en `<html>` |
| **Accesibilidad** | Dropdown (`Estándar` / `Alto contraste` / `Texto grande`) | `usuarios.preferencias -> { accesibilidad }` | `ruum:pref:usuario:<id>`, `ruum:pref:accesibilidad:<id>` | `data-a11y-font="large"`, `data-a11y-contrast="high"` |
| **Uso de Datos** | Dropdown (`Activado` / `Solo esenciales` / `Desactivado`) | `usuarios.preferencias -> { usoDatos }` | `ruum:pref:usuario:<id>`, `ruum:pref:usoDatos:<id>` | Toggle de telemetría analítica `desactivarTelemetriaActiva()` |
| **Notificaciones Traslado** | Toggle Push / Email | Columnas `alertas_viaje`, `alertas_evidencia` | `ruum:pref:usuario:<id>` | Filtro de eventos en backend y triggers de notificación push |
| **Notificaciones Pagos** | Toggle Push / Email | Columna `alertas_pago` | `ruum:pref:usuario:<id>` | Alertas de confirmación y comprobantes de facturación |
| **Promociones** | Toggle Push / Email | Columna `notificaciones_promocionales` | `ruum:pref:usuario:<id>` | Comunicaciones de marketing y novedades de servicio |

---

## 4. Matriz de Cumplimiento de Criterios de Aceptación

| # | Criterio de Aceptación (DoD) | Estado | Evidencia Adjunta |
| :--- | :--- | :--- | :--- |
| **AC-1** | Ante un HTTP 503 simulado, la pantalla **no muestra** "Cambios guardados con éxito"; muestra error con reintento. | ✅ Cumplido | `preferencias-503-reintento.png`, log de red, `preferencias-falso-exito.json` actualizado. |
| **AC-2** | Ante pérdida de red, el estado se comunica como pendiente/error con reintento; no hay falso éxito. | ✅ Cumplido | `preferencias-offline-pendiente.png`, `verificacion-ux-11.json` (escenario `offline`). |
| **AC-3** | Tras recarga y cambio de cuenta, las preferencias leídas son las del usuario correcto (no hay fuga entre cuentas). | ✅ Cumplido | `preferencias-cuenta-a.png` (English, Imperial), `preferencias-cuenta-b.png` (Español, Métrico). |
| **AC-4** | Contrato de preferencias unificado móvil/escritorio: mismas claves, mismo esquema por usuario, misma semántica local vs. remoto. | ✅ Cumplido | [`apps/app-usuario/src/lib/preferencias-contrato.ts`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/preferencias-contrato.ts), diff de código. |
| **AC-5** | Tres estados visibles y diferenciados: guardado local, sincronización remota pendiente y error con reintento. | ✅ Cumplido | Capturas `preferencias-exito-sincronizado.png`, `preferencias-offline-pendiente.png` y `preferencias-503-reintento.png`. |
| **AC-6** | Verificación de opciones documentada contra su efecto real. | ✅ Cumplido | Sección 3 de este informe y validación en `aplicarEfectosReales`. |
| **AC-7** | Pruebas realizadas en móvil y escritorio por separado; sin regresiones en la variante móvil. | ✅ Cumplido | `preferencias-movil-390.png`, `preferencias-escritorio-1440.png`, 20 pruebas unitarias pasando. |
| **AC-8** | Cero caminos en el código donde se anuncie éxito sin confirmación del backend. | ✅ Cumplido | Auditoría de código en `PreferenciasCliente.tsx`, test automatizado `PreferenciasCliente.test.tsx`. |

---

## 5. Índice de Archivos de Evidencia Generados

Todos los artefactos de evidencia se encuentran archivados en:
`docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-11/`

- **`preferencias-503-reintento.png`**: Captura en resolución 1440 × 900 px demostrando la alerta de error ante HTTP 503 y la presencia del botón "Reintentar", sin el mensaje de falso éxito.
- **`preferencias-offline-pendiente.png`**: Captura del estado sin conexión demostrando la indicación de guardado local y sincronización pendiente.
- **`preferencias-exito-sincronizado.png`**: Captura del estado de éxito cuando la sincronización remota responde satisfactoriamente (HTTP 200).
- **`preferencias-cuenta-a.png`**: Captura de Usuario A con preferencias aisladas (English / Imperial).
- **`preferencias-cuenta-b.png`**: Captura de Usuario B con preferencias aisladas (Español / Métrico) en la misma instancia del navegador, confirmando ausencia total de fuga de datos.
- **`preferencias-movil-390.png`**: Captura del shell móvil a 390 × 844 px confirmando la navegación y la hoja de notificaciones.
- **`preferencias-escritorio-1440.png`**: Captura del shell de escritorio a 1440 × 900 px con el layout 2×2 y sidebar.
- **`preferencias-movil-503.png`**: Captura de la variante móvil ante un fallo 503, validando que el banner de reintento opera sin falso éxito.
- **`verificacion-ux-11.json`**: Registro estructurado de la ejecución automatizada de los 6 escenarios de prueba E2E.
- **`docs/auditoria-ux-ui-usuario-2026-11-06/preferencias-falso-exito.json`**: Actualización del archivo original de la auditoría marcando el hallazgo como `REMEDIADO`.
