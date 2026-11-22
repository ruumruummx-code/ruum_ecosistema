# Decisión de Producto y Arquitectura: Proxy Mapbox en `/api/ruta`

**Fecha:** 2026-11-22  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata)  
**Ticket:** `RUUM-SEC-006` (F0.2: Endurecer proxy Mapbox /api/ruta + decisión de producto)  
**Owners:** Frontend Senior + Lead Tech App Usuario  
**Estado:** Decisión Tomada / Aprobada  

---

## 1. Contexto del Problema

El endpoint `apps/app-usuario/src/app/api/ruta/route.ts` actúa como un proxy servidor hacia la API de Directions de Mapbox (`https://api.mapbox.com/directions/v5/mapbox/driving/`), consumiendo el token secreto de servidor `MAPBOX_SECRET_TOKEN` (`sk.*`).

Históricamente, permitía invocaciones `POST` sin autenticación obligatoria (identificando al cliente únicamente por IP para aplicar rate limit de 20 req/min). Esto exponía el token secreto de Mapbox a consumo no autenticado por bots o scrapers.

---

## 2. Decisión Tomada: MANTENER EL PROXY CON ENDURECIMIENTO Y EVALUAR REDISEÑO EN FASE 2

### 2.1 Decisión Inmediata (Fase 0)
**Mantener el proxy en servidor pero con autenticación obligatoria y cuota estricta (Endurecimiento completado):**
1. **Autenticación obligatoria:** Requiere sesión activa en `supabase.auth.getUser()`; peticiones no autenticadas reciben `401 Unauthorized` de inmediato con log estructurado (`acceso_no_autenticado_rechazado`).
2. **Rate Limit reducido a 10 req/min:** La cuota se aplica por usuario autenticado (`uid:<user_id>`), no por IP.
3. **Caché en Redis de 24 horas:** El resultado de distancias y tiempos estimados se mantiene cacheado por hash de coordenadas para evitar llamadas repetitivas hacia Mapbox.

### 2.2 Evaluación de Alternativas

| Alternativa | Ventajas | Desventajas / Riesgos | Dictamen |
|---|---|---|---|
| **Opción A: Eliminar proxy y llamar Mapbox directo desde el navegador con `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (`pk.*`)** | - Cero latencia extra de servidor Next.js.<br>- Sin consumo de CPU en Vercel. | - Expone el token público `pk.*` a cuotas de Directions.<br>- Pierde la caché compartida de rutas en Redis (cada cliente pagaría una consulta a Mapbox para la misma ruta).<br>- Riesgo de divergencia con la cotización oficial del servidor. | ❌ Descartada para cálculo de tarifas. |
| **Opción B: Mantener proxy autenticado con caché centralizada (Adoptada en F0.2)** | - Protege el secreto `sk.*`.<br>- Caché global de rutas compartida entre todos los usuarios.<br>- Cero invocaciones no autenticadas.<br>- Máximo 10 req/min por usuario. | - Requiere sesión para cotizar rutas interactivas en el mapa. | ✅ **Adoptada para Fase 0**. |
| **Opción C: Rediseño arquitectónico en Fase 2 (Token de sesión efímero o integración en Wizard)** | - Flujo unificado donde la ruta se precalcula únicamente al generar la cotización formal en `/api/viajes`. | - Requiere refactorizar los componentes de UI del wizard de traslados (`DireccionMapa.tsx`). | 🗓️ **Programada para evaluación en Fase 2 (F2.5).** |

---

## 3. Criterios de Aceptación Cumplidos en F0.2

- [x] **POST `/api/ruta` sin sesión → `401 Unauthorized`** (verificado en suite de pruebas `route.test.ts`).
- [x] **POST `/api/ruta` con sesión y > 10 req/min → `429 Too Many Requests`** (verificado en suite de pruebas `route.test.ts`).
- [x] **Emisión de log estructurado:** Registra `acceso_no_autenticado_rechazado` ante cualquier intento anónimo.
- [x] **Documento de decisión de producto:** Mergeado en `docs/decision-proxy-mapbox.md`.
