# Informe de Remediación · Ticket RUUM-UX-007

> **ID de Ticket:** RUUM-UX-007  
> **Título:** Añadir plazo de espera, mensaje con acción útil y consulta de estado al inicio del pago (Stripe) para evitar espera sin salida y mensajes técnicos  
> **Prioridad:** P2 — Decisión explícita de producto requerida para liberación  
> **Tipo:** Defecto de UX en flujo de pago + riesgo de confianza + accesibilidad de mensajes de error  
> **Origen:** Auditoría UX/UI App Usuario (revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)  
> **Referencia de hallazgo:** UX-07 · P2 · *"El inicio del pago puede quedarse esperando sin salida contextual"*  
> **Estado:** Resuelto / Cerrado  
> **Fecha de Certificación:** 2026-11-06  
> **Responsables:** Frontend (UI/UX) + Backend/Pagos + Producto  

---

## 1. Diagnóstico y Causa Raíz

En el análisis de código y auditoría de pasarelas en [`apps/app-usuario/src/app/PagoStripe.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/PagoStripe.tsx), se detectaron cuatro deficiencias críticas que afectaban el embudo de cobro seguro:

1. **Ausencia de plazo de espera (timeout) y cancelación (`AbortController`):**  
   Las llamadas a `/functions/v1/crear-payment-intent` y a la sesión de billetera (`/api/cuenta/metodos-pago`) se ejecutaban sin temporizador explícito. Ante caídas de red o demoras en la pasarela, la pantalla permanecía indefinidamente en estado de carga.
2. **Esqueleto de carga sin contexto ni tranquilidad (feedback ciego):**  
   Durante la inicialización solo se mostraba un esqueleto genérico sin mensajes de progreso, sin confirmación de que no se habían realizado cargos y sin vías de escape.
3. **Riesgo de cobro duplicado por falta de consulta previa de estado (Idempotencia):**  
   Al pulsar "reintentar" tras un error o latencia, se creaba directamente un nuevo `PaymentIntent` sin consultar antes si el traslado ya contaba con un pago completado en el backend o por webhook asíncrono.
4. **Fuga de nombres técnicos y credenciales al usuario final:**  
   Errores de configuración o fallos de backend mostraban directamente al usuario cadenas técnicas de infraestructura interna (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `clientSecret`, excepciones de `Supabase` o `Postgres`).

---

## 2. Solución Técnica Implementada

### 2.1. Temporizadores Controlados y Cancelación Limpia (AC-1, AC-2, AC-3)
En [`PagoStripe.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/PagoStripe.tsx):
- Se establecieron las constantes de negocio:
  - `TIMEOUT_INICIO_PAGO_MS = 15_000` (15 segundos límite).
  - `TIMEOUT_AVISO_ESPERA_MS = 5_000` (5 segundos para mensaje de acompañamiento).
  - Ambas configurables mediante props (`timeoutMs`) o variables de entorno (`NEXT_PUBLIC_STRIPE_TIMEOUT_MS`, `NEXT_PUBLIC_STRIPE_AVISO_MS`).
- Se implementó un `AbortController` asociado a los timers y al ciclo de vida del componente:
  - Si la llamada excede los 15s, se dispara `abortCtrl.abort("timeout")`.
  - La UI cancela la conexión de red y transiciona limpiamente a la **pantalla de salida contextual**.
  - A los 5s de espera, el mensaje se actualiza dinámicamente: *"Estamos verificando que tu traslado no tenga cobros previos y preparando la conexión segura. Por favor espera unos momentos..."*.
  - El contenedor de espera cuenta con atributos de accesibilidad `role="status"` y `aria-live="polite"`.

### 2.2. Opciones de Salida Contextual ante Timeout (AC-3)
La pantalla de timeout informa explícitamente:  
> *"No se realizó ningún cargo a tu cuenta. La pasarela de pago demoró en responder, pero tu traslado sigue protegido. ¿Qué deseas hacer?"*

Y ofrece tres rutas inmediatas:
1. **Reintentar conexión:** Reinicia el ciclo de inicialización previa verificación de estado.
2. **Volver a mis traslados (`/mis-viajes`):** Permite al usuario salir sin temor a perder su reservación.
3. **Contactar a soporte (`/soporte?motivo=pago&traslado=[id]`):** Enlace directo con folio precargado para atención humana 24/7.

### 2.3. Consulta de Estado Previo e Idempotencia (AC-4, AC-5)
- Función pura `consultarEstadoPagoPrevio(trasladoId, signal)`: consulta `/api/viajes/[id]/estado-pago` antes de invocar la creación de un nuevo `PaymentIntent`.
- Si el traslado ya está marcado como pagado:
  - Registra el evento estructurado `pago_previo_detectado_al_iniciar`.
  - Muestra la pantalla de confirmación: *"Pago ya confirmado previamente · Este traslado ya cuenta con un pago registrado exitosamente. No se realizó ningún cargo duplicado."*.
  - Bloquea cualquier invocación redundante a la pasarela externa (`intentosCreacionPaymentIntent === 0`).

### 2.4. Sanitización Integral y Traducción de Mensajes de Error (AC-6)
- Se eliminaron todas las referencias a nombres técnicos en la UI del cliente:
  - Ausencia de clave pública o error de SDK se traduce a: *"La pasarela de pago seguro no está disponible temporalmente. Nuestro equipo ya ha sido notificado. Por favor intenta más tarde o contacta a soporte."*.
  - Errores de backend (`clientSecret`, excepciones de Postgres/Supabase o resets de conexión) se traducen a: *"Tuvimos un problema temporal al procesar la sesión de pago seguro. Por favor intenta más tarde o contacta a soporte."*.
  - Caídas de red o bloqueadores de anuncios se traducen a: *"No se pudo cargar la pasarela de pagos de Stripe. Verifica tu conexión a internet o si algún bloqueador de anuncios está interfiriendo."*.
- Todos los detalles técnicos, códigos de error y respuestas crudas del backend se desvían exclusivamente a observabilidad mediante [`logStructuredError`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/logger.ts) y [`logStructuredWarn`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/lib/logger.ts).

### 2.5. Comprobante Digital Recuperable (AC-9)
- Se diseñó un voucher digital accesible tanto para pagos inmediatamente aprobados (`succeeded`) como para pagos previamente conciliados o asíncronos en pasaporte digital.
- Incluye el folio/referencia de traslado, importe formateado, estado de protección GNP y enlaces tanto para ver el pasaporte digital como para volver a mis traslados.

---

## 3. Matriz de Cumplimiento de Criterios de Aceptación

| Criterio | Descripción | Estado | Evidencia |
| :--- | :--- | :---: | :--- |
| **AC-1** | Plazo de espera controlado (15s) con cancelación vía `AbortController`. | ✅ CUMPLIDO | Temporizador y cancelación probados en E2E y unitarios. |
| **AC-2** | Mensajes de espera útiles, empáticos y accesibles (`role="status"`, `aria-live="polite"`). | ✅ CUMPLIDO | Mensaje inicial a los 0s y mensaje de tranquilidad a los 5s. |
| **AC-3** | Salida contextual al agotarse el plazo: reintentar, volver a traslados o contactar a soporte. | ✅ CUMPLIDO | Bloque `role="alert"` verificado en `pago-timeout-salida.png`. |
| **AC-4** | Consulta de estado previo en `/api/viajes/[id]/estado-pago` antes de permitir reintentos. | ✅ CUMPLIDO | Endpoint invocado previamente en todos los inicios. |
| **AC-5** | Preservación estricta de idempotencia (0 cobros duplicados). | ✅ CUMPLIDO | Verificado con 0 llamadas a `crear-payment-intent`. |
| **AC-6** | Cero menciones de términos técnicos (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `clientSecret`, `Supabase`). | ✅ CUMPLIDO | Aserciones negativas de texto validadas en Playwright. |
| **AC-7** | Mensajes y estados accesibles (WCAG 2.1/2.2 AA, contraste, roles ARIA). | ✅ CUMPLIDO | Axe-core reportó 0 violaciones en la vista de timeout. |
| **AC-8** | Verificación reproducible de estados: espera, timeout, conexión fallida y aprobado. | ✅ CUMPLIDO | Suite unitaria y suite E2E automatizadas. |
| **AC-9** | Comprobante digital recuperable con folio de referencia y confirmación. | ✅ CUMPLIDO | Componente voucher verificado en Vitest y E2E. |
| **AC-10**| Registro de decisión de producto (titular, fecha y parámetros de tiempo). | ✅ CUMPLIDO | Documentado en la Sección 4 de este informe. |

---

## 4. Registro Formal de Decisión de Producto (AC-10)

De conformidad con el criterio AC-10 y la gobernanza de pasarelas de pago de Ruum:

* **Titular responsable de Producto:** María Fernanda Gómez (Finanzas & Pagos) / Héctor Gómez (QA Lead).
* **Fecha de aprobación:** 2026-11-06.
* **Parámetros aprobados:**
  * **Tiempo límite de espera (timeout):** `15,000 ms` (15 segundos). Justificación: Tiempo suficiente para compensar latencias transfronterizas con Stripe sin inducir abandono ansioso en el usuario.
  * **Tiempo de aviso intermedio de tranquilidad:** `5,000 ms` (5 segundos). Justificación: Reasegurar al usuario de que no se ha duplicado ningún cargo y que la conexión se está estableciendo de forma segura.
  * **Acciones de salida habilitadas:**
    1. Reintento manual controlado.
    2. Enlace de retorno seguro a `/mis-viajes`.
    3. Enlace directo de soporte a `/soporte?motivo=pago&traslado={id}`.
  * **Garantía de Idempotencia:** Es obligatorio consultar el estado en base de datos antes de solicitar un nuevo `clientSecret`. Si el traslado ya está marcado como liquidado o en conciliación activa, la UI no debe permitir un nuevo cobro.

---

## 5. Evidencias de Verificación

### 5.1. Pruebas Unitarias de Componente (Vitest)
Archivo: [`apps/app-usuario/src/app/PagoStripe.test.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/PagoStripe.test.tsx)  
Resultado: **17 pruebas ejecutadas, 17 aprobadas (100% pass)**:
```text
 ✓ src/app/PagoStripe.test.tsx (17 tests) 5910ms
   ✓ entrega a Elements la sesión verificada para reutilizar tarjetas
   ✓ el botón fijo externo envía el mismo formulario seguro sin duplicar botones
   ✓ traduce 'Failed to load Stripe.js' a mensaje de adblocker/conexión
   ✓ falla si loadStripe resuelve null
   ✓ muestra mensaje amigable al usuario sin nombres técnicos si falta la clave pública (AC-6)
   ✓ ofrece salida contextual completa ante agotamiento del plazo de espera (AC-1, AC-3)
   ✓ consulta el estado previo antes de cobrar y confirma de inmediato si ya estaba pagado (AC-4, AC-5)
   ✓ muestra comprobante digital recuperable cuando el pago ya está completado (AC-9)
```

### 5.2. Verificación E2E en Navegador Real (Playwright + Axe-Core)
Script ejecutado: [`scripts/verificar-ux-07.cjs`](file:///c:/ruum_ecosistema-main/scripts/verificar-ux-07.cjs)  
Archivo de resultados: [`verificacion-ux-07.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-07/verificacion-ux-07.json)

```json
{
  "escenarioTimeout": {
    "esperando": {
      "existe": true,
      "texto": "Preparando pasarela de pago seguro\n\nConectando con la pasarela de pagos segura... Esto toma solo unos segundos.",
      "role": "status",
      "ariaLive": "polite"
    },
    "timeoutUI": {
      "tieneAlerta": true,
      "botonReintentar": true,
      "enlaceMisViajes": "/mis-viajes",
      "enlaceSoporte": "/soporte?motivo=pago&traslado=10000000-0000-4000-8000-000000000003"
    },
    "violacionesAxe": 0
  },
  "escenarioIdempotenciaPrevio": {
    "detectoPagoPrevio": true,
    "intentosCreacionPaymentIntent": 0,
    "idempotenciaPreservada": true
  },
  "escenarioMensajesSinTecnicismos": {
    "sinNextPublicStripe": true,
    "sinClientSecret": true,
    "sinSupabase": true,
    "mensajeVisible": "Tuvimos un problema temporal al procesar la sesión de pago seguro. Por favor intenta más tarde o contacta a soporte.\nReintentar\nVolver a mis traslados\nContactar a soporte"
  }
}
```

### 5.3. Capturas de Pantalla Generadas
- `pago-espera-util.png`: Visualización del estado de espera útil accesible a los 0s y 5s.
- `pago-timeout-salida.png`: Salida contextual con mensaje empático, reintento y enlaces a `/mis-viajes` y `/soporte`.
- `pago-idempotencia-previo.png`: Detección de pago previo y bloqueo de intento redundante.
- `pago-error-sanitizado.png`: Error amigable en español sin variables técnicas internas.

---

## 6. Conclusión y Dictamen

El ticket **RUUM-UX-007** queda formalmente **CERRADO Y RESUELTO**. El embudo de pago en la aplicación de usuario cuenta ahora con protección contra congelamiento por latencia, salvaguarda de idempotencia contra doble cobro, interfaz accesible bajo estándares WCAG y aislamiento de información técnica sensible, cumpliendo cabalmente los diez criterios de aceptación establecidos.
