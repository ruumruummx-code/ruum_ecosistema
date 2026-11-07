# Informe de cierre técnico — RUUM-UX-003

**Título:** Corregir estructura semántica inválida en listas de indicadores (`dl/dt/dd`) en mis traslados y cuenta  
**Fecha:** 6 de noviembre de 2026 · America/Mexico_City  
**Prioridad:** P2  
**Estado técnico:** Implementado; listo para reauditoría UX-03.  
**Liberación:** Pendiente de decisión explícita de Producto, con propietario y fecha por asignar.

## Resultado

Se corrigieron los resúmenes móviles de `/mis-viajes` y `/cuenta`. Cada agrupador de la lista contiene directamente su término `dt` seguido de su definición `dd`. Los iconos decorativos están dentro del contenido de la definición y ocultos mediante `aria-hidden="true"`. En cuenta se eliminó el contenedor que aislaba incorrectamente el `dd`.

El orden lógico del DOM es término → valor. Las clases CSS `order-1` y `order-2` mantienen la presentación existente, con el valor visualmente encima de su etiqueta. Se conservaron los cálculos, valores, iconos y estilos de color.

Las variantes de escritorio se comprobaron como controles de regresión. La vista inicial de traslados de escritorio no expone un `dl` visible; la lista de datos personales de cuenta ya tenía agrupaciones válidas. Sus estructuras se conservaron.

## Evidencia antes/después

| Pantalla | Ancho | Antes | Después |
|---|---:|---|---|
| Mis traslados | 390 px | `definition-list`: 1 nodo | 0 fallos |
| Cuenta | 390 px | `definition-list`: 1 nodo; `dlitem`: 3 nodos | 0 fallos |
| Mis traslados | 1440 px | 0 fallos | 0 fallos |
| Cuenta | 1440 px | 0 fallos | 0 fallos |

Los cuatro casos finales pasan las reglas axe `definition-list` y `dlitem`. El primer intento posterior a la corrección de traslados móvil agotó el margen de compilación inicial de Next en desarrollo; la repetición del caso pasó con 240 segundos de margen de navegación, conservando las aserciones. Los restantes casos pasaron en la primera ejecución posterior al cambio.

## Orden expuesto a tecnología de asistencia

Las instantáneas del árbol de accesibilidad de Chromium muestran:

- **Traslados:** término «Total» → definición «10»; «Activos» → «1»; «Gastado» → «$0».
- **Cuenta:** término «Incidencias» → definición «0»; «Traslados» → «2»; «Vehículos» → «5».

Los valores corresponden a las fixtures sintéticas de la auditoría y se mantienen entre ambas versiones. Antes de la corrección, traslados exponía la definición «10» antes del término «Total».

Esta es una comprobación programática del árbol de accesibilidad y una nota de verificación del orden semántico. **No se ejecutó una sesión de VoiceOver/NVDA ni una prueba con dispositivos físicos.** Esa validación permanece en el gate previsto por el ticket.

## Ausencia de regresión visual y de datos

- Los textos y las coordenadas de términos y valores coinciden entre las capturas anteriores y posteriores: desplazamiento medido de 0 px en los indicadores comparables.
- Las capturas completas de cuenta en 390 y 1440 px son idénticas byte a byte.
- El recorte del resumen de traslados móvil es idéntico píxel a píxel: región de 358 × 99 px, con origen x=16, y=159 en las capturas guardadas.
- Se revisaron visualmente las capturas móviles anteriores y posteriores. Los datos y la jerarquía visual se conservan.

## Validaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Axe · dos rutas × dos anchos | 4 casos finales aprobados; 0 `definition-list` y 0 `dlitem` |
| Pruebas de los componentes | 22 aprobadas: 6 de traslados y 16 de cuenta |
| Contrato semántico | Aserciones de hijos directos `DT, DD`, términos, valores e iconos ocultos |
| ESLint · archivos de esta remediación | Aprobado |
| Revisión visual y geométrica | Aprobada en los resúmenes evaluados |
| TypeScript general de app-usuario | **No aprobado en el estado concurrente del workspace**: dos errores ajenos a UX-003 |

El chequeo general de TypeScript informó `TS2556` en `src/app/cuenta/preferencias/PreferenciasCliente.test.tsx`, líneas 43 y 44: argumentos spread sin tipo de tupla o parámetro rest compatible. Ese archivo pertenece a la ventana de trabajo UX-011 → UX-010 y no se modificó en esta remediación. La salida no señaló errores en los archivos de UX-003. El resultado general debe repetirse cuando finalice esa ventana.

## Criterios de aceptación

| AC | Evidencia / situación |
|---|---|
| AC-1 · Traslados sin errores de listas | Cumplido en los casos locales de 390 y 1440 px. |
| AC-2 · Cuenta sin errores de listas | Cumplido en los casos locales de 390 y 1440 px. |
| AC-3 · Término antes del valor y relación válida | Cumplido; diff, aserciones de estructura y árbol de accesibilidad. |
| AC-4 · Iconos decorativos | Cumplido; `aria-hidden="true"` y comprobación automatizada. |
| AC-5 · Lectura comprensible | Nota técnica e instantáneas entregadas; verificación con lector real pendiente del gate. |
| AC-6 · Presentación y datos conservados | Cumplido en los casos medidos; capturas, coordenadas y comparación de píxeles. |
| AC-7 · Ambos anchos | Cumplido en la matriz local de ambas rutas. |

## Archivos y evidencias

Implementación:

- `apps/app-usuario/src/app/mis-viajes/MisViajesCliente.tsx`
- `apps/app-usuario/src/app/cuenta/CuentaCliente.tsx`

Pruebas:

- Aserciones añadidas a los tests existentes de ambos componentes.
- `apps/app-usuario/tests/e2e/semantica-listas-ux003.spec.ts`: reproducción anterior y regresión posterior por ruta/ancho.

Entregables:

- [Galería antes/después](EVIDENCIA.html).
- [Comparativo de reglas, estructura, lectura y coordenadas](comparativo.json).
- [Comparación visual](comparacion-visual.json).
- [Diff de la corrección y sus aserciones](correccion.diff).
- Carpetas `before/` y `after/`: ocho capturas y ocho reportes JSON de los cuatro casos.
- `generar-evidencia.cjs`: regenera la galería y el comparativo desde los JSON guardados.

## Entorno y reproducción

Se utilizó Node 24.13.0, Chromium y el servidor de desarrollo con fixtures locales. Se aislaron el servidor en el puerto 3046, los dobles en 54419/54420 y la caché en `.next-ux003`. La selección de caché se realizó con un preloader temporal; la configuración de producto no se cambió. Las referencias de tipos generadas para esa caché se retiraron, preservando el trabajo concurrente. No se cambiaron dependencias ni la configuración de Turborepo.

Desde la raíz del repositorio:

```powershell
pnpm --filter @ruum/app-usuario exec vitest run src/app/mis-viajes/MisViajesCliente.test.tsx src/app/cuenta/CuentaCliente.test.tsx
pnpm exec playwright test --config apps/app-usuario/playwright.config.ts semantica-listas-ux003 --workers=1 --reporter=list
node docs/remediacion-ux003/generar-evidencia.cjs
```

`UX003_PHASE=before` conserva evidencia de reproducción sin exigir que las reglas ya estén corregidas. El modo predeterminado es `after` y exige cero violaciones y grupos directos `DT, DD`.

## Condiciones para cierre administrativo y liberación

1. Reauditoría de Accesibilidad sobre UX-03 y aceptación de la nota de lectura, complementada con lector real cuando corresponda al gate.
2. Repetir TypeScript general cuando concluyan UX-011/UX-010 y se corrijan los errores identificados en su archivo de pruebas.
3. Registrar la decisión explícita del responsable de Producto para esta P2, con **propietario y fecha**. Ambos quedan por definir; este informe no los asigna ni registra una aprobación de liberación.

**Dictamen:** remediación semántica implementada y verificada localmente; lista para reauditoría. La aprobación de liberación y el cierre administrativo permanecen pendientes de las condiciones anteriores.
