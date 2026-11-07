# SD-REM-005 · Patrón de pestañas

Fecha: 2026-11-07, America/Mexico_City. Propietarios funcionales: Frontend Plataforma + Accesibilidad. **Implementación técnica verificada; cierre pendiente de sesión asistiva y firmas nominales.** No se declara cerrada P2-1 ni las deudas de 004/007.

## Criterios y evidencia

| AC | Resultado | Evidencia |
| --- | --- | --- |
| 0 | Defecto original contrastado; se distinguen defectos observados y requisitos preventivos | `AC-0.md`, `comparativo-original.json`, `Navigation-original.txt`; enlaces a auditoría 001-SD |
| 1 | Roles/selección/relaciones correctos; IDs únicos y estables SSR/CSR | `resultados.json`, `arbol-light.yml`, `arbol-dark.yml`; axe sin violaciones en las muestras |
| 2 | Manual: flechas del eje y Home/End solo enfocan; Enter/Space activan; Tab/Shift+Tab entran/salen | Registro `keyboard` con resultados explícitos en `resultados.json` |
| 3 | Solo paneles activos en árbol accesible; inactivos hidden y display:none | Árboles, `panels` en resultados y fuente `Tabs.tsx` |
| 4 | Patrón A coherente con 007: span role=tab, aria-disabled=true, sin href/tabindex/manejadores; navegación lo salta | Intentos de foco/clic/Enter/Space y árbol con estado disabled |
| 5 | Foco 3px, tokens y contraste medido; capturas verificadas light/dark | `tabs-light.png`, `tabs-dark.png`, ratios en resultados: 4.83:1 light y 6.10:1 dark para texto, foco y límite seleccionado contra superficie |
| 6 | Dos instancias con IDs lógicos iguales y orientación distinta; sin colisión y con hidratación estable | SSR vs DOM y estabilidad tras renders/rehabilitación en resultados |
| 7 | Regresión de componentes 004/007 y P1 en el harness final, más pruebas de consumidores | Cuatro estados de ayuda/error en ambos temas, destinos bloqueados sin href, suite UI y reportes `pruebas-*.json`; límites de alcance abajo |
| 8 | 642 archivos de apps barridos: 15 usos compartidos, cero tab/tablist locales y cero ancestros activadores encontrados | `consumidores.json`; `composition-contract.test.ts` protege componentes, wrappers, layouts y providers |
| 9 | **PENDIENTE** sesión real con lector, operador nominal, transcriptor distinto y respaldo | `SESION-AT.md`, campos sin rellenar en `estado-gate.json` |
| 10 | Manifiesto SHA-256 y sello; commit base más huellas del código sin commit | `MANIFIESTO-SHA256.json`, `.sha256`, `sellar-evidencia.cjs --check` |
| 11 | **PENDIENTE** firmas nominales de Frontend Plataforma y Accesibilidad | `FIRMAS.md`, `estado-gate.json` |

## Decisiones de implementación

`Tabs` vive en `packages/ui/src/components/Tabs.tsx`, con reexportación compatible desde `Navigation.tsx` y el índice público. Conserva `tabs`, `activo`, `conteo`, `onSeleccion` y `className`, y añade paneles, control por `value`, orientación, razones de bloqueo y montaje configurable. Los items requieren ID lógico único; se rechazan duplicados. `useId()` se invoca sin condiciones y genera namespaces por instancia. El ID es estable mientras la instancia permanece montada; no se promete estabilidad tras desmontaje real. Prefijos explícitos o distintas raíces React requieren coordinación del consumidor.

Al entrar desde fuera, la selección es el único tabstop. Durante el recorrido manual el roving tabindex acompaña al foco, sin cambiar aria-selected ni disparar callbacks; al salir se restablece a la selección. Este detalle permite salir con Tab/Shift+Tab sin volver a recorrer la selección anterior. El panel activo es enfocable para continuar la lectura.

Por defecto se monta solo el contenido activo, con contenedores de panel existentes para todas las relaciones aria-controls. `mantenerMontados` mantiene el estado de inputs bajo paneles ocultos; se usa en perfil y pasaporte. Las guardas de actividad de mapa/chat permanecen en el consumidor. Ocultar contenido no cancela efectos de hijos montados ni portales fuera del panel: esos efectos requieren su guarda propia.

Pestañas bloqueadas conservan nombre/estado en el árbol, con explicación visible cuando existe; no son botones o enlaces activables. Si no hay opciones habilitadas, no hay selección ni tabstop. Una lista vacía no crea un tablist ARIA incompleto. El componente no recibe handlers arbitrarios de ancestros ni introduce roles sobre enlaces con href.

## Consumidores y alcance

Se migran perfiles, detalles de vehículo/traslado, pasaporte, datos de ruta, preferencias de conductor, captura de evidencias y secciones administrativas al componente compartido. AdminTabs es un adaptador de Tabs y ahora exige un renderPanel; todos sus usos actuales lo proporcionan. NavegacionPasaporte no tiene consumidores actuales, pero también delega el patrón y exige contenido de panel.

Los selectores de periodo (ganancias), estado (traslados/facturas), categoría (ubicaciones) y método de pago del MVP son filtros/selección de un resultado común: usan group y botones con aria-pressed. Los métodos no disponibles conservan disabled nativo y el texto Próximamente. Las acciones de Gastos/Incidencias de SecondaryTripNavBar abren diálogos y no se declaran pestañas; se conservan sus aria-haspopup/expanded. Los accesos de evidencia con href a fragmentos son accesos a secciones que activan el contenido correspondiente, no role=tab sobre un enlace.

El barrido contempla el código fuente JS/TS/JSX/TSX de las apps, excluyendo tests/builds. La prueba de composición detecta roles locales tab/tablist, candidatos de selección sin contrato, handlers de activación/capture y spreads no verificables en ancestros. No certifica listeners imperativos externos, alias arbitrarios de runtime ni DOM generado por terceros.

Las capturas y axe corresponden al **harness con componentes reales**, no a rutas autenticadas completas. Hay pruebas de consumidores en app-usuario, app-conductor y panel-admin y comprobación TypeScript de las tres apps. No se afirma recorrido visual/asistivo de todas sus rutas ni build Next completo. Las deudas humanas de P1/P2-1 permanecen abiertas. Los sellos pre-sesión de 004/007 se conservan; la evolución del código en 005 se identifica mediante este nuevo manifiesto, sin atribuirla al antiguo sello.

## Reproducir

Desde la raíz, con Node 24 y dependencias del workspace instaladas:

```
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/inventariar.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/verificar.cjs
pnpm --filter @ruum/ui test
pnpm --filter @ruum/ui build
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/sellar-evidencia.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-005/sellar-evidencia.cjs --check
```

Los reportes `pruebas-*.json` incluyen los nombres/rutas de las pruebas ejecutadas. `validacion.json` resume cantidades y comprobaciones de tipos. Regenerar resultados cambia el sello: conservar la versión pre-sesión antes de incorporar sesión/firmas y generar el sello posterior. SHA-256 demuestra integridad, no validez de anuncios o firma humana.


Se actualizaron también los selectores E2E de filtros (button/aria-pressed) y de geometría del panel activo para el nuevo contenedor compartido. Esos specs completos de rutas no se ejecutaron en esta corrida; no se incluyen en las cantidades de pruebas aprobadas. El alcance ejecutado figura en `validacion.json`.
