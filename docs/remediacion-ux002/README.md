# RUUM-UX-002 — Contraste de contenido esencial

## Implementación

`apps/app-usuario/src/app/contrast-tokens.css` contiene los pares semánticos reutilizables para navegación, texto secundario, enlaces, éxito, advertencia, error y contenido sobre tarjetas oscuras. Se mantienen los colores de marca y las superficies. Los módulos de escritorio que mantienen superficies claras usan explícitamente los tokens `on-light`, también cuando el usuario elige tema oscuro. Las superficies adaptativas usan tokens que cambian con `data-theme`.

Aplicación: navegación inferior, condiciones y enlaces de acceso, pasos/ETA/contacto de inicio, estados y metadatos en inicio de escritorio, cuenta, traslados, ubicaciones y preferencias. Se refuerza también el borde de pasos pendientes (indicador no textual).

Los estados ya tienen diferenciación no cromática: navegación con `aria-current`, indicador y peso tipográfico; pasos numerados con “Actual”, “Completada”, “Pendiente”, check y `aria-current="step"`; badges con etiquetas de estado y verificación con check. Se conservan estas señales.

## Evidencia y reproducción

- `antes.json`: extracto sin modificar de los hallazgos `color-contrast` de la auditoría de referencia, en 390 y 1440 px. La auditoría original no aportó una matriz equivalente en oscuro; no se debe presentar como comparación completa entre temas.
- `apps/app-usuario/test/contraste-ux002.test.ts`: cálculo WCAG de luminancia sRGB sobre los tokens reales; comparación estricta >= 4.5, sin redondeo. Comprueba fondos claros, oscuros, badges y tarjeta oscura.
- `apps/app-usuario/tests/e2e/contraste-ux002.spec.ts`: matriz axe en 390/1440, claro/oscuro, acceso, inicio, traslados, cuenta, ubicaciones y preferencias. Incluye registro y soporte como pantallas de control. Valida ruta y tema para evitar falsos aprobados sobre redirecciones o páginas vacías. Conserva hallazgos pendientes de revisión manual (`incomplete`).

Comandos desde la raíz, con Node 24:

```powershell
pnpm --filter @ruum/app-usuario exec vitest run test/contraste-ux002.test.ts src/app/NavegacionUsuario.test.tsx
pnpm --filter @ruum/app-usuario typecheck
pnpm exec playwright test --config apps/app-usuario/playwright.config.ts contraste-ux002 --workers=1 --reporter=list
```

Las capturas y los JSON por tema/ancho se escriben en este directorio al ejecutar la matriz. Los datos son sintéticos de las fixtures existentes. La reauditoría de UX-02 y la revisión de Diseño de Sistemas quedan sujetas a la evidencia renderizada; las pruebas de pares por sí solas no certifican todos los estados de pantalla.

## Nota de entorno del runner

El arranque estándar con Next 15.5.28/Node 24 encontró `Cannot find module '../../packages/shared/src/seguridad'`: el hook SWC de configuración aplica el alias de TypeScript relativo a `src/lib/csp.ts`. Para obtener evidencia sin modificar el trabajo concurrente de CSP se usó un preloader temporal que resuelve ese import al mismo módulo fuente. `entorno-validacion.cjs` conserva esa adaptación exclusivamente para reproducir la auditoría; no se importa en la aplicación. No se eliminaron cabeceras ni se desactivó CSP.

Si se reproduce el mismo error local de resolución:

```powershell
$env:NODE_OPTIONS="--require=$((Resolve-Path docs/remediacion-ux002/entorno-validacion.cjs).Path)"
pnpm exec playwright test --config apps/app-usuario/playwright.config.ts contraste-ux002 --workers=1 --reporter=list
Remove-Item Env:NODE_OPTIONS
```

La ejecución de referencia aisló además los puertos 3036/54409/54410 y la caché de Next en `.next-ux002-final` para evitar interferencia de otros builds. Los cambios automáticos de referencias TypeScript generados por esa caché se retiran de la entrega. Los resultados de navegador son de desarrollo con fixtures sintéticas, no un build de producción certificado.

La prueba complementaria `fixtures/contraste-traslado.ts` lee colores computados y compone fondos interiores sobre una cota conservadora del gradiente más claro. El mínimo observado de texto esencial es 8.71:1 en móvil y 4.97:1 en escritorio; los valores completos sin redondear se conservan en los JSON. Los `incomplete` de axe se conservan y se distinguen de las aprobaciones automáticas.

Para regenerar la galería y el comparativo desde la evidencia guardada:

```powershell
node docs/remediacion-ux002/generar-evidencia.cjs
```

La matriz añade cuatro comprobaciones de las secciones inferiores de preferencias, desplazando los contenedores con scroll interno. Sus informes y capturas terminan en `preferencias-inferior.json` y `_cuenta_preferencias_inferior.png`. La fixture fija el tema general y la preferencia de tema asociada al ID del perfil (distinto del ID de Auth).

## Resultado final

- Playwright: **8 pruebas aprobadas**, cubriendo **32 combinaciones de pantalla/ancho/tema y 4 revisiones inferiores de preferencias**. Cero violaciones de `color-contrast` en la ejecución final con código congelado y caché nueva.
- Referencia en claro: **83 nodos con fallo → 0** en las mismas rutas y anchos supervisados. El tema oscuro se verificó como matriz final; no se inventa una referencia anterior en oscuro.
- Vitest: **65 pruebas aprobadas** (48 de pares/indicadores y 17 de navegación, inicio y traslados).
- TypeScript de app-usuario y ESLint de los archivos modificados: aprobados.
- Revisión visual: acceso e inicio móvil; inicio, cuenta, ubicaciones y preferencias de escritorio, incluyendo el contenido inferior, conservan legibilidad y diferenciación de estados.
- `tokens.diff` contiene el alta completa de los tokens. `comparativo.json` conserva los resultados y los selectores que axe dejó para revisión manual. `EVIDENCIA.html` ofrece las 36 capturas y enlaces a los JSON.

Los tokens `success/warning/danger-essential` se usan sobre fondos claros de estado; `success/danger-content` se adaptan al tema en superficies móviles que cambian de fondo. Los encabezados de tarjetas que permanecen blancas usan el par `on-light-primary`; los encabezados de ubicaciones sobre fondo adaptativo conservan el token primario del tema.

Se corrigieron también los controles de registro que la revisión en oscuro detectó: encabezado de tarjeta clara y prefijo telefónico sobre campo oscuro. La revisión inferior de preferencias cubre los contenedores con scroll cuando existen; en móvil el contenido comprobado cabe en el viewport de 900 px.

Estado técnico: **implementado y listo para reauditoría UX-02 y co-revisión de Diseño de Sistemas antes del merge**. La certificación integral y el gate de producción corresponden a la ventana de liberación descrita en el ticket.

La revisión automática bloqueó el borrado de copias temporales de una ejecución anterior fuera del repositorio (`blocked by policy`); esas copias se conservaron. La evidencia vigente es la de este directorio. Las cachés locales de validación se excluyeron únicamente en `.git/info/exclude`; las referencias TypeScript generadas se restauraron.
