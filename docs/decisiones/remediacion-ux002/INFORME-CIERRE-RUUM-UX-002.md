# Informe de cierre técnico — RUUM-UX-002

**Título:** Corregir contraste insuficiente en navegación, acceso y textos esenciales  
**Aplicación:** Ruum App Usuario  
**Prioridad:** P1 · Bloqueante de liberación  
**Fecha:** 6 de noviembre de 2026 · America/Mexico_City  
**Estado propuesto:** Resuelto en código; pendiente de aceptación UX y Diseño de Sistemas.

## Dictamen

La remediación está implementada y cuenta con evidencia local reproducible. La ejecución final, con el código sin cambios durante la prueba, terminó con **8 pruebas de navegador aprobadas**: 32 combinaciones de pantalla, ancho y tema, más cuatro comprobaciones de las secciones inferiores de preferencias. Se reportaron **cero violaciones automáticas de `color-contrast`**.

Este informe acredita la implementación y sus verificaciones locales. **El cierre administrativo y la autorización de liberación quedan sujetos a la reauditoría UX-02, la revisión de los resultados manuales pendientes y la co-revisión de Diseño de Sistemas.** Los resultados `incomplete` de axe se conservan y no se consideran aprobaciones automáticas.

## Trabajo ejecutado

Se incorporó una capa de tokens semánticos reutilizables en `apps/app-usuario/src/app/contrast-tokens.css`, importada por los estilos globales de la aplicación. Los cambios abarcan:

- Etiquetas e iconos inactivos de navegación móvil.
- Texto legal y enlaces de acceso.
- Pasos, ETA, estado, placas y contacto del conductor en inicio.
- Estados y metadatos de inicio de escritorio, cuenta, traslados y ubicaciones.
- Textos esenciales y enlaces de preferencias, incluidos los controles inferiores.
- Encabezados de tarjetas blancas que heredaban texto claro al activar oscuro.
- Título y prefijo telefónico de registro, detectados al comprobar las pantallas de control en oscuro.

Se conservan los gradientes, los colores de marca y la estructura de las pantallas. Los componentes sobre superficies claras usan pares explícitos `on-light`; las superficies adaptativas usan tokens que cambian con el tema. Los bordes de los pasos pendientes y el check de los completados se reforzaron. La navegación conserva `aria-current`, indicador y peso tipográfico; los pasos conservan numeración, check y textos de estado. Estas señales permiten distinguir estados además del color.

## Validación y resultados

| Verificación | Resultado |
|---|---|
| Navegador · Playwright | 8 pruebas aprobadas |
| Matriz principal | 8 pantallas × 390/1440 px × claro/oscuro = 32 casos |
| Preferencias · sección inferior | 4 comprobaciones adicionales; desplazamiento donde existe scroll |
| Axe · regla `color-contrast` | 0 violaciones automáticas en la ejecución final |
| Vitest | 65 pruebas aprobadas: 48 de pares/indicadores y 17 de comportamiento |
| TypeScript · app-usuario | Aprobado |
| ESLint · archivos modificados | Aprobado |
| Evidencia visual | 36 capturas guardadas y galería revisada |

Rutas comprobadas: `/login`, `/`, `/mis-viajes`, `/cuenta`, `/ubicaciones`, `/cuenta/preferencias`, `/registro` y `/soporte`.

La referencia original contiene **83 nodos con violaciones en claro** en estas rutas y anchos; la matriz final reporta cero violaciones automáticas. Se trata de nodos reportados, no de 83 defectos independientes. La referencia original no contiene una matriz equivalente en oscuro, por lo que no se presenta una comparación anterior/posterior de ese tema.

Para los textos esenciales de la tarjeta de traslado sobre gradientes se agregó una medición complementaria basada en los colores computados, composición de fondos interiores y una cota conservadora del gradiente más claro:

| Superficie | Menor ratio medido, en ambos temas |
|---|---:|
| Tarjeta de traslado móvil | 8.711590255053475:1 |
| Tarjeta de traslado de escritorio | 4.9761935605158945:1 |

La aceptación compara los valores completos contra 4.5:1; no redondea valores inferiores para aprobarlos. Los indicadores cubiertos por las pruebas de pares también se comprueban contra 3:1.

## Criterios de aceptación

| AC | Resultado técnico y evidencia | Situación |
|---|---|---|
| AC-1 · Navegación inactiva | Matriz móvil/escritorio, claro/oscuro; informes y capturas por pantalla. | Validado localmente en el alcance evaluado. |
| AC-2 · Texto y enlaces legales | Tokens corregidos, pruebas de pares y auditoría de acceso en ambos anchos/temas. | Validado localmente en el alcance evaluado. |
| AC-3 · Estado del traslado | Axe y medición complementaria del texto esencial sobre gradientes, con mínimos superiores a 4.5:1. | Validado localmente. |
| AC-4 · Cuenta, traslados, ubicaciones y preferencias | Cero violaciones automáticas; informes conservan los elementos que requieren evaluación manual. | Remediado; aceptación final sujeta a reauditoría. |
| AC-5 · Claro y oscuro | Matriz completa y capturas pareadas, con comprobación del tema efectivo antes y después de axe. | Ejecutado; pendientes manuales identificados. |
| AC-6 · Estados sin dependencia exclusiva del color | Numeración, textos, check, indicador, peso tipográfico y atributos de estado; revisión visual. | Implementado y revisado localmente. |
| AC-7 · Ausencia de regresiones | Comparativo disponible en claro; registro y soporte incluidos como controles. Oscuro cuenta con verificación final, sin referencia anterior equivalente. | Evidencia comparativa parcial; completar aceptación UX. |
| AC-8 · Tokens reutilizables | Archivo semántico nuevo, aplicación en consumidores y `tokens.diff`. | Implementado. |

## Evidencias entregadas

- [Galería y matriz de resultados](EVIDENCIA.html): capturas pareadas y enlaces a los reportes.
- [Comparativo estructurado](comparativo.json): resultados por pantalla, ancho y tema, mínimos del gradiente y selectores pendientes de revisión manual.
- [Referencia original](antes.json): extracto de los hallazgos de contraste de la auditoría de origen.
- [Diff de tokens](tokens.diff): alta completa de la capa semántica.
- [Nota de implementación y reproducción](README.md): comandos, entorno y detalles de validación.
- Carpetas `light-390`, `light-1440`, `dark-390` y `dark-1440`: JSON de axe y capturas vigentes.

Las pruebas permanentes están en `apps/app-usuario/test/contraste-ux002.test.ts`, `apps/app-usuario/tests/e2e/contraste-ux002.spec.ts` y `apps/app-usuario/tests/e2e/fixtures/contraste-traslado.ts`.

## Condiciones de la evidencia y pendientes de cierre

La validación usó Node 24, un servidor de desarrollo y datos sintéticos. El arranque estándar del runner encontró un error de resolución del import de CSP; se empleó una adaptación local documentada que apunta al mismo módulo fuente. No se eliminaron cabeceras ni se desactivó CSP. La ejecución final aisló puertos y caché. Esto no acredita un build ni un despliegue de producción.

Para autorizar el cierre administrativo corresponde:

1. Reauditar UX-02 y resolver o aceptar justificadamente los `incomplete` de axe no cubiertos por la medición complementaria.
2. Obtener la co-revisión de Diseño de Sistemas sobre los pares semánticos y su conservación de la identidad visual.
3. Completar el gate de liberación con el candidato de producción y las comprobaciones integrales previstas en el ticket.

No se registra en esta entrega una aprobación externa, merge o despliegue. **Recomendación: aceptar la implementación para revisión final y mantener pendiente la autorización de liberación.**

La revisión automática rechazó el borrado de copias temporales externas al repositorio con el mensaje `blocked by policy`; se conservaron. La evidencia vigente para este cierre es la del directorio `docs/remediacion-ux002`.
