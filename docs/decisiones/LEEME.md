# Entrega de auditoría UX/UI — 6 de noviembre de 2026

- `INFORME.html`: informe navegable con galería y filtro por ancho de pantalla.
- `DICTAMEN.md`: dictamen completo, hallazgos, alcance y condiciones para GO.
- `MATRIZ.md`: visitas realizadas, resultados y limitaciones por ruta/ancho.
- `browser-results.json` y `browser320-results.json`: selectores, contraste, HTML y errores de navegación.
- `inicio-confirmado.json`, `csp-browser.json` e `interacciones.json`: reproducción del shell y comparación causal local.
- `preferencias-falso-exito.json`: HTTP 503 controlado seguido de éxito visible.
- `registros/`: salidas de pruebas y cambios concurrentes observados al cierre.
- `scripts/`: sondas utilizadas; requieren las dependencias instaladas del repositorio y ejecutarse desde la raíz. Apuntan al servidor de pruebas local en el puerto 3012 y a servicios sintéticos. No ejecutarlas contra producción.
- `generar-informe.cjs`: regenera el HTML, resumen y matriz desde las evidencias ya guardadas, sin iniciar servidores ni modificar producto. Desde la raíz: `node docs/auditoria-ux-ui-usuario-2026-11-06/generar-informe.cjs`.

Las capturas son del entorno local de desarrollo y contienen datos sintéticos. La comparación `diagnostico-local-sin-csp.png` elimina la cabecera de seguridad solo en una respuesta interceptada para identificar la causa; no representa una corrección de producto ni una propuesta de retirar CSP.

Los scripts no constituyen una suite de certificación permanente. Las pruebas completas y la revisión con dispositivos reales siguen siendo condiciones de liberación. El dictamen registra el estado observado, incluyendo cambios concurrentes posteriores a algunas capturas.

## Responsables sugeridos para remediación

| Hallazgos / gate | Función responsable sugerida |
|---|---|
| UX-01 | Frontend y responsable de seguridad de la aplicación |
| UX-02, UX-03, UX-04, UX-05, UX-08, UX-10 | Frontend con revisión de accesibilidad y QA |
| UX-06 y UX-09 | Producto y diseño, con operación de soporte |
| UX-07 y UX-11 | Frontend, integración de backend y QA |
| Flujos reales, dispositivos y candidato de producción | QA y responsable de liberación, con aprobación de producto |

Estas funciones son propuestas de asignación, no personas ni compromisos de fecha acordados.
