# SEC-003 — Retiro de `unsafe-inline` en estilos de App Usuario

**Fecha objetivo propuesta: 30 de noviembre de 2026, Ciudad de México.** Responsable propuesto: equipo Frontend de App Usuario. El operador de Vercel a cargo del release activa el cambio en producción.

El 14 de noviembre, el deployment `3c8d90b` sirvió `style-src` con `unsafe-inline`. El constructor compartido admite `CSP_STRICT_STYLES=true` y, en ese modo, elimina `unsafe-inline` de `style-src` y la excepción `style-src-attr`. El middleware actual de App Usuario usa la misma política para la cabecera aplicada y la de Report-Only. Activar ese flag en el código actual bloquearía estilos desde el primer día en staging.

| Fecha objetivo | Trabajo |
| --- | --- |
| 16–19 de noviembre | Inventariar estilos inline propios y de terceros. Migrar los propios a CSS Modules o clases y revisar los estilos dinámicos de Mapbox, Stripe Elements y el Pasaporte Digital. Preparar en el middleware una política estricta exclusiva para Report-Only, con la política vigente en la cabecera aplicada. Añadir pruebas de ambas cabeceras. |
| 20–26 de noviembre | Mantener siete días completos de Report-Only en staging. Confirmar vía HTTP que la cabecera aplicada conserva el comportamiento vigente y que Report-Only usa estilos estrictos y reporta a `/api/csp-report`. Agrupar las violaciones de `style-src`, `style-src-elem` y `style-src-attr` por ruta y origen. |
| 27 de noviembre | Si no quedan violaciones reproducibles de la aplicación, activar `CSP_STRICT_STYLES=true` en staging y repetir el smoke. |
| 30 de noviembre | Con el smoke aprobado, activar el flag en Production mediante un despliegue validado y comprobar que la cabecera aplicada carece de la excepción inline en estilos. |

El smoke incluye login, registro, wizard de cotización con Mapbox, pago con Stripe Elements en modo prueba, Pasaporte Digital y el portal Didit con una sesión de pruebas cuando esté operativo. Comprobar escritorio y móvil. Si aparecen regresiones en staging, corregirlas y volver a observar durante siete días antes de aplicar la política. Si se rompe una ruta crítica tras el cambio en producción, revertir al deployment anterior y registrar la directiva y la ruta afectadas. [Plan de rollback](ops/C6_C8_VERIFICACION_RELEASE.md#rollback).
