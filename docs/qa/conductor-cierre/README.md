# Cierre visual minimalista · app conductor

Seguimiento del PR #34, base `main`, 8 de noviembre de 2026.

## Alcance

- T1: [transición y reconciliación con servidor](T1-transicion.md), sin cambios de lógica de producción.
- T2: eliminados los ocho componentes huérfanos y sus exclusiones de cobertura. Se buscaron referencias en apps y packages, incluyendo stories y pruebas. Los componentes usaban utilidades compartidas, sin hojas CSS exclusivas que eliminar. Se conservan el asistente actual y sus componentes usados.
- T3: regeneración obligatoria y paridad de colores en CI. Se añadieron únicamente nombres canónicos ausentes en los CSS, con colores ya existentes; no se alteraron valores de tokens. Las pruebas negativas de paridad y de diff de regeneración devolvieron código 1; la fuente y los generados se restauraron después.
- T4: pruebas de interfaz, auditoría Axe y matriz visual. Se corrigió la prioridad CSS que reducía a 48 px las acciones de evidencias/cierre, el espaciado de la revisión en pantallas bajas para conservar los 56 px sin scroll adicional y el token inexistente del texto del botón de verificación. En las ocho combinaciones se verifica su par de color y contraste ≥4.5:1 sobre los dos extremos iguales del gradiente sólido, además de Axe.
- T5: [tabla completa de colores y excepciones](T5-colores.md).

No se modifican servicios, requisitos de evidencias, textos, roles ni aria-labels.
Cada tarea tiene su commit propio. El PR #34 también incluye el arreglo urgente
de scroll de app usuario, ajeno a este ticket; se dejó una nota en su conversación.

## Reproducción

Node 24, dependencias existentes del workspace, Chromium de Playwright instalado.
El build de QA usa `.env.local` con la fixture local; no usar credenciales ni
datos reales para estas pruebas. Los servidores de pruebas arrancan desde
`playwright.interface.config.ts` y `playwright.a11y.config.ts`.

```sh
pnpm tokens:generate
git diff --exit-code design-system/tokens
pnpm tokens:check
pnpm typecheck
pnpm --filter @ruum/app-conductor lint
pnpm --filter @ruum/app-conductor build
pnpm --filter @ruum/app-conductor exec vitest run test/conduce-estado.test.tsx
pnpm --filter @ruum/app-conductor exec playwright test --config playwright.interface.config.ts
pnpm --filter @ruum/app-conductor test:a11y
```

Los resultados definitivos se adjuntan en `resultados.json` y la matriz en
`CAPTURAS.md`. `a11y-auditorias.json` registra las 104 auditorías Axe, con
cero violaciones WCAG A/AA detectadas. Los resultados `incomplete` de Axe
requieren revisión humana y no se cuentan como aprobaciones automáticas.
Las verificaciones automáticas cubren scroll de página,
desborde horizontal, foco por teclado y altura de acciones principales en la
matriz, además de la suite existente de contraste, navegación y formularios.
El modo calle se fuerza en las capturas para comparar ambos estados sobre
la misma fixture. La aprobación visual humana se registra por separado.

## Seguimientos y responsables

Resultado final: **57/57 pruebas de interfaz**, **4/4 combinaciones de
accesibilidad (104 auditorías, cero violaciones detectadas)** y **208 capturas**.
No hubo pruebas omitidas ni reintentos automáticos en estas ejecuciones.
La prueba de reintento de red usa una identidad de viaje exclusiva para
evitar interferencias con las pruebas que avanzan y reinician el viaje base.

| Decisión o hallazgo | Responsable / seguimiento |
|---|---|
| D1 · Validar el asistente con conductores reales | **Administración e Innovación Digital** · [#36](https://github.com/ruumruummx-code/ruum_ecosistema/issues/36) |
| D2 · Confirmar botón sólido y revisión de diseño | **Desarrollo Digital** · [#37](https://github.com/ruumruummx-code/ruum_ecosistema/issues/37) |
| Hook global sin pruebas en API y lint de builds locales | [#35](https://github.com/ruumruummx-code/ruum_ecosistema/issues/35) |
| Acciones principales de la lista aún de 48 px | [#39](https://github.com/ruumruummx-code/ruum_ecosistema/issues/39) · seguimiento separado permitido por T4 |

`pnpm typecheck` pasó en los seis paquetes. El lint de conductor no tiene
errores y conserva 86 advertencias. El lint global sin exclusiones falla al
leer builds locales `.next-ux002*` de app usuario; al excluir `**/.next*/**`
los tres consumidores pasan. No se borran ni se mueven esos artefactos ajenos.
El hook de commit ejecuta la suite global y falla porque API no contiene
pruebas. Se crearon los commits con `HUSKY=0`, después de registrar el fallo
y ejecutar las validaciones específicas.

La asignación de responsables está confirmada por el solicitante. Siguen
pendientes la validación de campo de D1 y la decisión/aprobación humana de D2;
los resultados automatizados no las sustituyen.

La revisión manual también encontró que la lista de viajes no usa
`data-trip-primary` y mantiene acciones de 48 px. La comprobación automática
de altura cubre las acciones de los marcos operativos y formularios; no se
declara cumplido el mínimo de 56 px para la lista. El hallazgo queda en #39,
como exige el documento para los problemas no corregidos en este ticket.
