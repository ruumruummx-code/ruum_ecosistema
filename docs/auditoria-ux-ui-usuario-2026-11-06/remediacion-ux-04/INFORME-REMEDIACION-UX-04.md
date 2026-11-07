# Informe de Cierre de Ticket · RUUM-UX-004

**ID del Ticket:** RUUM-UX-004  
**Título:** Asociar correctamente el nombre accesible del mapa del traslado (aria-label en div sin rol)  
**Prioridad:** P2 — Decisión explícita de producto requerida para liberación  
**Tipo:** Defecto de accesibilidad (WCAG 2.1/2.2 A) + semántica ARIA  
**Origen:** Auditoría UX/UI App Usuario (revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)  
**Referencia de hallazgo:** UX-04 · P2 · "El nombre accesible del mapa no está correctamente asociado"  
**Estado:** Resuelto / Verificado / Listo para Gate de Salida  
**Fecha de Cierre:** 2026-11-06  

---

## 1. Contexto, Diagnóstico y Causa Raíz

En la auditoría UX/UI automatizada mediante axe-core en el candidato de producción de la App Usuario:
1. **Ruta Móvil:** En `/viajes/10000000-0000-4000-8000-000000000001` (390 × 844 px), axe detectó una violación crítica de tipo `aria-prohibited-attr` en `.pasaporte-module__E_ynPq__map`.
2. **Ruta Escritorio:** En `/mis-viajes` (1440 × 900 px), se detectó la misma violación en el contenedor del mapa de detalle lateral.

### Diagnóstico Técnico y Normativo
- **Causa Raíz:** El componente `MapaPasaporte` renderizaba `<div ref={container} className={styles.map} aria-label="Mapa interactivo del traslado">`. Según la especificación WAI-ARIA 1.2/1.3 de la W3C, los elementos genéricos sin rol semántico explícito o implícito (como un `<div>`) **prohíben** atributos de asignación de nombre (`aria-label`, `aria-labelledby`). Como resultado, los árboles de accesibilidad de los navegadores ignoran la etiqueta o emiten una infracción de validación.
- **Criterios WCAG vulnerados:**
  - **4.1.2 Nombre, función, valor (Nivel A):** Los componentes de interfaz de usuario deben tener un rol y un nombre accesible programáticamente determinables.
  - **1.3.1 Información y relaciones (Nivel A):** La estructura y relaciones de la interfaz deben determinarse por software.
- **Impacto en Experiencia de Usuario (UX):**
  - Las personas con discapacidad visual o usuarios de lectores de pantalla (VoiceOver, NVDA, TalkBack) no recibían un nombre accesible claro para identificar la región del mapa en el pasaporte digital ni podían acceder a la información de posición y trayecto.
  - El elemento no formaba un hito (*landmark*) accesible ni admitía foco de teclado nativo.
- **Decisión de Diseño y Accesibilidad:**
  - **No usar `role="application"`:** Poner `role="application"` en un mapa rompe la navegación por teclado estándar del lector de pantalla (intercepta teclas de flecha, modo lectura, teclas de acceso rápido).
  - **No usar `aria-hidden="true"`:** Ocultar el mapa completo priva al usuario con tecnología de asistencia del contexto de seguimiento.
  - **Uso de `role="region"` + `tabIndex={0}` + fallback textual:** `role="region"` convierte el mapa en una región semántica identificable, `tabIndex={0}` permite la navegación por teclado para centrar y explorar controles, y una región complementaria `sr-only` con `role="status"` y `aria-live="polite"` suministra el estado operativo, coordenadas y antigüedad de la información sin depender de la percepción visual.

---

## 2. Solución Implementada

Se implementó una solución integral en los siguientes módulos:

### 2.1. Componente Principal del Pasaporte (`MapaPasaporte.tsx`)
Archivo: [`apps/app-usuario/src/app/viajes/[id]/MapaPasaporte.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/viajes/[id]/MapaPasaporte.tsx)

1. **Atributos de Rol y Región:**
   - Se asignó `role="region"`.
   - Se asignó `tabIndex={0}` para posibilitar la navegación y foco por teclado directo (AC-5).
   - Se calculó un `aria-label` contextual dinámico (AC-2).
2. **Nombre Accesible Contextual:**
   - Si se reciben `origenCiudad` y `destinoCiudad`, el nombre es: `"Mapa de seguimiento en vivo del traslado de [Origen] a [Destino]"`.
   - Si no hay ciudades disponibles, se utiliza `"Mapa de seguimiento en vivo de la ruta del traslado"`.
   - Permite personalización mediante la prop opcional `etiquetaAccesible`.
3. **Información Textual Complementaria (AC-4):**
   - Se incorporó un bloque accesible para lectores de pantalla con `<div className="sr-only" role="status" aria-live="polite">`:
     - Estado operativo del traslado (ej. "En curso", "Programado", o el estado textual del servidor).
     - Coordenadas de la última posición reportada del conductor o punto de partida.
     - Coordenadas del punto de destino.
     - Antigüedad de actualización en lenguaje natural mediante la función `formatearAntiguedad` ("hace menos de un minuto", "hace 2 minutos", "hace 1 hora", etc.).

### 2.2. Vistas Consumidoras
1. **Detalle de Escritorio (`DetalleTrasladoDesktop.tsx`):**
   - Archivo: [`apps/app-usuario/src/app/mis-viajes/DetalleTrasladoDesktop.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/mis-viajes/DetalleTrasladoDesktop.tsx)
   - Suministra `origenCiudad`, `destinoCiudad`, `estadoTexto` y `actualizadoEn` a `<MapaPasaporte>`.
2. **Seguimiento Móvil en Tiempo Real (`SeguimientoTrasladoTiempoReal.tsx`):**
   - Archivo: [`apps/app-usuario/src/app/viajes/[id]/SeguimientoTrasladoTiempoReal.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/viajes/[id]/SeguimientoTrasladoTiempoReal.tsx)
   - Pasa `estadoTexto` ("En camino al origen", "En camino al destino") y `actualizadoEn` al mapa.
3. **Saneamiento Preventivo en Componentes de Mapa Auxiliares:**
   - [`apps/app-usuario/src/app/components/SkeletonMapa.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/components/SkeletonMapa.tsx): Se asoció `role="status"` y `aria-live="polite"` al placeholder de carga.
   - [`apps/app-usuario/src/app/ubicaciones/MapaUbicacion.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/ubicaciones/MapaUbicacion.tsx): Se incorporó `role="region"` y `tabIndex={0}` para soportar su `aria-label`.

---

## 3. Matriz de Cumplimiento de Criterios de Aceptación (AC-1 a AC-7)

| Criterio | Descripción | Estado | Evidencia y Resultado Técnico |
| :--- | :--- | :---: | :--- |
| **AC-1** | Contenedor con rol válido y `aria-label`. 0 violaciones de `aria-prohibited-attr`. | **CUMPLIDO** | `role="region"` asignado en el contenedor; reporte axe reporta **0 violaciones** de `aria-prohibited-attr` en móvil y escritorio (originalmente 1 en cada una). |
| **AC-2** | Nombre accesible contextual descriptivo del propósito del mapa. | **CUMPLIDO** | En móvil: `"Mapa de seguimiento en vivo de la ruta del traslado"`. En escritorio: `"Mapa de seguimiento en vivo del traslado de San Mateo Atenco a Lerma de Villada"`. |
| **AC-3** | Controles interactivos no ocultos a tecnología de asistencia; sin `role="application"`. | **CUMPLIDO** | No se empleó `aria-hidden="true"` en el contenedor ni en sus hijos; los marcadores y controles permanecen navegables; no se usó `role="application"`. |
| **AC-4** | Información textual complementaria de estado, ubicación y antigüedad de actualización. | **CUMPLIDO** | Región `.sr-only` con `role="status"` y `aria-live="polite"` emite: `"Estado: En curso. Última posición registrada del conductor: latitud 19.2740, longitud -99.5240. Destino: latitud 19.2860, longitud -99.5100. Actualizado hace menos de un minuto."` |
| **AC-5** | Navegación por teclado operativa en el contenedor del mapa. | **CUMPLIDO** | `tabIndex={0}` verificado en DOM; `page.evaluate()` confirmó `tieneFoco: true` al enfocar por teclado la región. |
| **AC-6** | Verificación en `/viajes/{id}` y `/mis-viajes` (escritorio). | **CUMPLIDO** | Verificado en ambas rutas sobre el build de producción con Mock Supabase activo. Reportes axe guardados por separado. |
| **AC-7** | Sin regresión visual en estilos ni layout del mapa. | **CUMPLIDO** | Capturas de pantalla generadas; las dimensiones y clases CSS (`.pasaporte-module__E_ynPq__map`) se mantuvieron intactas sin distorsión. |

---

## 4. Evidencias de Verificación

### 4.1. Auditoría Automatizada axe-core

| Ruta Evaluada | Viewport | Violaciones `aria-prohibited-attr` Antes | Violaciones `aria-prohibited-attr` Después | Archivo de Evidencia |
| :--- | :---: | :---: | :---: | :--- |
| `/viajes/10000000-0000-4000-8000-000000000001` | 390 × 844 px (Móvil) | **1** | **0** | [`axe-report-viajes-id-390.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-04/axe-report-viajes-id-390.json) |
| `/mis-viajes` | 1440 × 900 px (Escritorio) | **1** | **0** | [`axe-report-mis-viajes-1440.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-04/axe-report-mis-viajes-1440.json) |

### 4.2. Pruebas Unitarias
Se ejecutó la suite de Vitest en `MapaPasaporte.test.tsx`:
```bash
pnpm --filter @ruum/app-usuario test src/app/viajes/[id]/MapaPasaporte.test.tsx
```
**Resultado:** 6/6 pruebas pasaron exitosamente (100%), incluyendo las aserciones de semántica ARIA (`role="region"`, `tabindex="0"`, `role="status"` y formato de antigüedad).

### 4.3. Capturas de Pantalla y Resumen
- Captura Móvil (390 px): [`mapa-viajes-id-390.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-04/mapa-viajes-id-390.png)
- Captura Escritorio (1440 px): [`mapa-mis-viajes-1440.png`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-04/mapa-mis-viajes-1440.png)
- Datos Consolidados: [`verificacion-ux-04.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-04/verificacion-ux-04.json)

---

## 5. Decisión de Producto y Dictamen Final

- **Decisión de Producto:** Se aprueba la implementación de `role="region"` junto con `tabIndex={0}` y el contenido textual en vivo (`role="status"`, `aria-live="polite"`). Esto garantiza que la información crítica del traslado (estado del viaje, posición actual del conductor, destino y frescura de los datos) sea accesible de forma universal e inmediata, sin comprometer la usabilidad ni la navegación por teclado.
- **Dictamen:** **TICKET RESUELTO Y CERRADO**. Listo para el gate de salida y liberación a producción.
