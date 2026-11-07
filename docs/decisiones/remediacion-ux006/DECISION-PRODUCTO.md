# Decisión de Producto — RUUM-UX-006

- **Fecha:** 6 de noviembre de 2026 (America/Mexico_City).
- **Decisión aprobada:** Opción B — deshabilitar English y explicar que la interfaz solo está disponible en español.
- **Aprobación:** respuesta explícita del solicitante en esta conversación: «Opción B: deshabilitar English y explicar que solo hay español».
- **Propietario funcional:** Producto, con aprobación del solicitante registrada en el chat. No se proporcionó nombre nominal; debe consignarse en el registro de liberación.
- **Coordinación:** el solicitante confirmó que UX-011 y UX-010 concluyeron y que los componentes de preferencias estaban disponibles para edición.

## Comportamiento autorizado

1. Español permanece como única opción operativa; English se muestra deshabilitado.
2. La explicación aparece antes del control y se asocia mediante `aria-describedby`.
3. El documento usa `lang="es-MX"`. La etiqueta English declara su idioma en el botón.
4. No se simula una traducción ni se anuncia un guardado de inglés.
5. Se normaliza el idioma de los registros locales y pendientes heredados del usuario activo, conservando otras preferencias y el aislamiento entre cuentas.
6. Los valores remotos heredados se interpretan como español y se corrigen al siguiente guardado general. No hay migración masiva ni escritura remota al abrir la pantalla.
7. Se conservan el contrato unificado, los nombres accesibles y el manejo de fallo/reintento de UX-011/UX-010.

Esta decisión no constituye aprobación del gate de liberación ni de la reauditoría final.
