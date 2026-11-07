# Informe de Cierre de Ticket · RUUM-UX-010

**ID del Ticket:** RUUM-UX-010  
**Título:** Asociar nombre accesible a interruptores y selectores de preferencias de escritorio  
**Prioridad:** P1 — Bloqueante de liberación  
**Tipo:** Defecto de accesibilidad (WCAG 2.1/2.2 AA) + inconsistencia de sistema de diseño  
**Origen:** Auditoría UX/UI App Usuario (revisión `b6e8a27f75eb8922020b64142dd232daca95f36a`)  
**Referencia de hallazgo:** UX-10 · P1 · "Preferencias de escritorio tiene controles sin nombre accesible"  
**Estado:** Resuelto / Listo para Gate de Salida  
**Fecha de Cierre:** 2026-11-06  

---

## 1. Contexto y Diagnóstico del Problema

En la auditoría UX/UI en `/cuenta/preferencias` a 1440 px:
- **9 interruptores** (`button[role="switch"]`) fallaban la regla `button-name` de axe/WCAG por carecer de `aria-label`, `aria-labelledby` o texto accesible. El texto ubicado en la columna izquierda no estaba asociado semánticamente a los botones de la columna derecha (Email y Web/Push).
- **5 selectores** (`<select>`) fallaban la regla `select-name` al carecer de `<label htmlFor>` o atributo `aria-label`.
- **Violación normativa:** Criterios de éxito WCAG 2.1/2.2:
  - **4.1.2 Nombre, función, valor (Nivel A):** Los nombres accesibles de los controles deben ser programáticamente determinables.
  - **1.3.1 Información y relaciones (Nivel A):** La relación entre la etiqueta visible y el control debe determinarse en código.
- **Riesgo UX:** Los usuarios de lectores de pantalla (VoiceOver, NVDA, JAWS) no podían discernir qué canal de notificación o ajuste estaban modificando ni su estado actual.

---

## 2. Solución de Sistema de Diseño Implementada (AC-7)

En vez de introducir parches ad-hoc por elemento, se crearon componentes reutilizables conforme a las normas de accesibilidad de Ruum en [`apps/app-usuario/src/app/cuenta/preferencias/ControlesPreferencias.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/cuenta/preferencias/ControlesPreferencias.tsx):

1. **`InterruptorPreferencia`:**
   - Atributos semánticos completos: `role="switch"`, `aria-checked={activo}`, `aria-label={nombreAccesible}`.
   - Texto complementario para lectores de pantalla en `<span className="sr-only">`: anuncia el nombre completo y el estado (`activado` o `desactivado`).
   - Composición automática de nombre: cuando se suministra un canal (`Email` o `Web y Push`), compone el formato estandarizado `Evento · Canal`.

2. **`SelectorPreferencia`:**
   - Vinculación dual: etiqueta oculta `<label htmlFor={id} className="sr-only">` para navegadores y motores de asistencia + atributo `aria-label={nombreAccesible}` para árbol de accesibilidad directo.
   - IDs únicos y descriptivos por selector.

Ambos componentes fueron integrados en [`apps/app-usuario/src/app/cuenta/preferencias/PreferenciasCliente.tsx`](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/cuenta/preferencias/PreferenciasCliente.tsx) preservando la coordinación con el contrato de persistencia unificado de `RUUM-UX-011`.

---

## 3. Mapeo Exhaustivo de Controles y Nombres Accesibles (AC-3)

### 3.1. Interruptores (9 controles)

| # | ID del Control | Evento / Ajuste | Canal | Nombre Accesible Resultante | Anuncio `sr-only` |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `preferencias-alertas-generales` | Notificaciones y alertas generales | General | `Notificaciones y alertas generales` | `Notificaciones y alertas generales: activado/desactivado` |
| **2** | `preferencias-recordatorios-email` | Recordatorios de traslados | Email | `Recordatorios de traslados · Email` | `Recordatorios de traslados · Email: activado/desactivado` |
| **3** | `preferencias-recordatorios-push` | Recordatorios de traslados | Web y Push | `Recordatorios de traslados · Web y Push` | `Recordatorios de traslados · Web y Push: activado/desactivado` |
| **4** | `preferencias-cambios-estado-email` | Cambios de estado de traslados | Email | `Cambios de estado de traslados · Email` | `Cambios de estado de traslados · Email: activado/desactivado` |
| **5** | `preferencias-cambios-estado-push` | Cambios de estado de traslados | Web y Push | `Cambios de estado de traslados · Web y Push` | `Cambios de estado de traslados · Web y Push: activado/desactivado` |
| **6** | `preferencias-pagos-email` | Pagos y facturación | Email | `Pagos y facturación · Email` | `Pagos y facturación · Email: activado/desactivado` |
| **7** | `preferencias-pagos-push` | Pagos y facturación | Web y Push | `Pagos y facturación · Web y Push` | `Pagos y facturación · Web y Push: activado/desactivado` |
| **8** | `preferencias-promociones-email` | Promociones y novedades | Email | `Promociones y novedades · Email` | `Promociones y novedades · Email: activado/desactivado` |
| **9** | `preferencias-promociones-push` | Promociones y novedades | Web y Push | `Promociones y novedades · Web y Push` | `Promociones y novedades · Web y Push: activado/desactivado` |

### 3.2. Selectores Dropdown (5 controles)

| # | ID del Control | Categoría | Etiqueta Asociada (`<label>`) | Nombre Accesible (`aria-label`) |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `preferencias-zona-horaria` | Idioma y región | `Zona horaria` | `Zona horaria para mostrar fechas y horarios de traslados` |
| **2** | `preferencias-unidades-region` | Idioma y región | `Unidades` | `Sistema de unidades para distancias, peso y consumo` |
| **3** | `preferencias-accesibilidad` | Aplicación | `Accesibilidad` | `Ajustes de contraste, tamaño de letra y accesibilidad` |
| **4** | `preferencias-unidades-app` | Aplicación | `Unidades` | `Sistema de unidades en la aplicación` |
| **5** | `preferencias-uso-datos` | Privacidad y permisos | `Uso de datos` | `Configuración de uso de datos de la aplicación` |

---

## 4. Matriz de Cumplimiento de Criterios de Aceptación (DoD)

| # | Criterio de Aceptación | Estado | Evidencia Adjunta |
| :--- | :--- | :--- | :--- |
| **AC-1** | Los 9 interruptores tienen nombre accesible único; axe no marca `button-name`. | ✅ Cumplido | Reporte axe: **0 violaciones** de `button-name` (vs. 9 previas). [`axe-report-escritorio-1440.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10/axe-report-escritorio-1440.json). |
| **AC-2** | Los 5 selectores tienen nombre accesible único; axe no marca `select-name`. | ✅ Cumplido | Reporte axe: **0 violaciones** de `select-name` (vs. 5 previas). [`axe-report-escritorio-1440.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10/axe-report-escritorio-1440.json). |
| **AC-3** | El nombre identifica evento y canal (ej. `Recordatorios de traslados · Email`), no solo la categoría. | ✅ Cumplido | Tabla en Sección 3 de este informe y validación en [`verificacion-ux-10.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10/verificacion-ux-10.json). |
| **AC-4** | Los interruptores anuncian estado y cambio (`aria-checked` dinámico, anuncio `.sr-only`). | ✅ Cumplido | Prueba de interacción en script E2E (`aria-checked` conmuta de `true` a `false`) y prueba unitaria en `PreferenciasCliente.test.tsx`. |
| **AC-5** | Verificación en ambas variantes (móvil y escritorio); sin regresiones en la variante móvil. | ✅ Cumplido | Axe en móvil 390 px reporta **0 violaciones** de `button-name` y `select-name`. [`axe-report-movil-390.json`](file:///c:/ruum_ecosistema-main/docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10/axe-report-movil-390.json). |
| **AC-6** | Coordinación con RUUM-UX-011: el cambio no reintroduce falso éxito ni rompe la persistencia. | ✅ Cumplido | Prueba simulada de HTTP 503 con los controles accesibles: falso éxito = `false`, alerta de error visible = `true`, botón reintentar = `true`. |
| **AC-7** | Patrón de etiquetado reutilizable (no parche local). | ✅ Cumplido | Componentes reutilizables `InterruptorPreferencia` y `SelectorPreferencia` en `ControlesPreferencias.tsx`. |

---

## 5. Índice de Archivos de Evidencia Generados

Todos los artefactos de evidencia se encuentran archivados en:
`docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10/`

- **`axe-report-escritorio-1440.json`**: Auditoría completa con `@axe-core/playwright` de la variante de escritorio (1440 × 900 px), certificando 0 violaciones de `button-name` y `select-name`.
- **`axe-report-movil-390.json`**: Auditoría completa con `@axe-core/playwright` de la variante móvil (390 × 844 px), certificando 0 violaciones y ausencia de regresiones.
- **`preferencias-escritorio-a11y-1440.png`**: Captura a página completa de `/cuenta/preferencias` en escritorio con los controles accesibles activos.
- **`preferencias-movil-a11y-390.png`**: Captura a página completa de la variante móvil preservada.
- **`verificacion-ux-10.json`**: Registro estructurado con el resultado de los 7 criterios de aceptación evaluados programáticamente.
- **`PreferenciasCliente.test.tsx`**: Suite de pruebas unitarias actualizada con 3 pruebas específicas para `RUUM-UX-010` (11 pruebas pasando en total).
