# SD-REM-004 · Implementado, gate manual pendiente

Fecha: 2026-11-07. Entorno: Node 24.13.0, React 19, Chromium/Playwright.

`packages/ui/src/components/Controls.tsx` usa `useId()` incondicionalmente, conserva IDs explícitos no vacíos y deja de usar `name` como ID. Cada etiqueta apunta a su control. Input, Select y Textarea admiten ayuda y combinan `aria-describedby` externo con ayuda/error presentes. No se modifican tokens ni dependencias.

## Evidencia reproducible

Desde la raíz: `node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-004/verificar.cjs`.

- `resultados.json`: nueve controles reales; por componente uno explícito, uno con nombre repetido y otro sin ID/nombre. Cuatro estados: sin ayuda/error, ayuda, error, ambos. Cero violaciones axe WCAG A/AA en cada estado. Además se comprueba manualmente por DOM que todas las referencias de descripción resuelven a elementos presentes.
- `arbol-0.yml` a `arbol-3.yml`: árbol accesible de Playwright con nombre de cada control.
- `formulario-light.png`, `formulario-dark.png`: capturas del formulario de verificación con los componentes reales y CSS del showcase existente; no son capturas de una ruta autenticada de app-usuario.
- Igualdad de IDs SSR/CSR, ausencia de errores de hidratación, estabilidad en cuatro renders y al insertar/retirar un campo vecino. Se verifica también la estabilidad del campo condicional mientras permanece montado. Un desmontaje real puede generar otro ID al remontar.
- Pruebas unitarias en `Controls.test.tsx`: ID explícito, ausencia de ID, nombre repetido, ID vacío y asociaciones. Build de UI y suite completa de 39 pruebas.

## Gate de cierre

**Pendiente sesión NVDA/VoiceOver**: no se realizó una escucha con lector de pantalla. No declarar cierre total. Ejecutar formulario servido con `node auditorias/RUUM-UX-001-SD/servidor.cjs` y abrir `/remediacion-SD-REM-004/formulario.html`; recorrer controles y cambiar estados. Registrar lector/versión, navegador, sistema y anuncios de etiqueta/ayuda/error.

Alcance: controles nativos compartidos. No se certifican autocompletados de terceros ni toda la aplicación. IDs explícitos duplicados siguen siendo responsabilidad del consumidor; múltiples raíces React requieren prefijos coordinados en sus raíces. El harness usa el CSS ya generado del showcase.
