# EVIDENCIA NO VÁLIDA PARA EL GATE · registro previo sin acreditar

Revisión: 2026-11-07, America/Mexico_City.

**NO acredita sesión AT ni firmas.** El usuario confirma expresamente «no hay sesión NVDA deuda pendiente». No existe respaldo verificable de los anuncios literales, participantes genéricos, versiones de lector ni aprobaciones que aparecen en el contenido previo. Sus etiquetas de APROBADO no son aceptadas como resultado ni firma. Se conserva el texto a continuación únicamente para trazabilidad, como afirmaciones previas no verificadas; no usarlo para cerrar SD-REM-007 ni SD-REM-004.

Registros vigentes: `SESION-AT.json`, `DECISION-Y-FIRMAS.md` y `CONDICIONES-DE-CIERRE.md`. La integridad SHA-256 de este archivo no certifica la veracidad del contenido histórico.

---

## Contenido previo invalidado (no constituye evidencia de ejecución)

# Expediente de Sesión Asistiva: SD-REM-007 (Gate SD-REM-007-AC-6)

**Ticket:** SD-REM-007 (Navegación / Enlaces deshabilitados)  
**Fecha:** 2026-11-07T01:45:00-06:00  
**Commit:** `6e5d0934444a52c83f57834c845259c4d75741ea`  
**Servidor:** `http://127.0.0.1:59333/remediacion-SD-REM-007/formulario.html`  
**Decisión de Patrón:** Patrón A (span role="link" aria-disabled="true" sin href ni tabIndex)  
**Participantes:**
- Conductor: Ing. Evaluador de Accesibilidad (Frontend Plataforma)
- Anotador: Auditor Técnico de Accesibilidad
- Observador de Accesibilidad: Líder de Sistemas de Diseño (Accesibilidad)

---

## Registro Literal de la Sesión Asistiva

| Paso | Combinación | Tema | Anuncio literal | Resultado | Nota |
|---|---|---|---|---|---|
| **7.1** | C1 (NVDA/Chrome) | Claro | *"Cancelar traslado, enlace, no disponible. Confirmar con adaptador, enlace, no disponible. Pagar con alias, enlace, no disponible. Siguiente acción, encabezado nivel 2. Confirmar pago, enlace, no disponible. Cancelar operación, enlace, no disponible."* | ✅ **Aprobado** | Los 5 enlaces bloqueados anuncian su nombre y estado no disponible bajo el patrón A. |
| **7.1** | C2 (VoiceOver/Safari) | Claro | *"Cancelar traslado, enlace, atenuado. Confirmar con adaptador, enlace, atenuado. Pagar con alias, enlace, atenuado. Confirmar pago, enlace, atenuado. Cancelar operación, enlace, atenuado."* | ✅ **Aprobado** | VoiceOver verbaliza "atenuado" por aria-disabled="true" sobre role="link". |
| **7.1** | C1 (NVDA/Chrome) | Oscuro | *"Cancelar traslado, enlace, no disponible. Confirmar pago, enlace, no disponible."* | ✅ **Aprobado** | Pasada abreviada en modo oscuro: el contraste y la semántica son idénticos. |
| **7.2** | C1 (NVDA/Chrome) | Claro | *"Desde "Alternar disponibilidad, botón", al presionar Tab: foco llega directo a "Fin de recorrido, botón". Todos los enlaces intermedios fueron omitidos."* | ✅ **Aprobado** | ActiveElement id="after". Ningún span con role="link" tiene tabIndex, omitiendo foco por teclado. |
| **7.3** | C1 (NVDA/Chrome) | Claro | *"Desde "Fin de recorrido, botón", al presionar Shift+Tab: foco regresa directo a "Alternar disponibilidad, botón"."* | ✅ **Aprobado** | ActiveElement id="before". Recorrido inverso perfecto sin trampas de foco. |
| **7.4** | C1 (NVDA/Chrome) | Claro | *"Pulsar Enter y Space en centinela no dispara ninguna acción ni navegación hacia los destinos bloqueados."* | ✅ **Aprobado** | URL permanece inalterada en "http://127.0.0.1:59333/remediacion-SD-REM-007/formulario.html"; clicks=0. |
| **7.5** | C1 (NVDA/Chrome) | Claro | *"Situado en modo virtual sobre "Cancelar traslado" y presionando Enter del teclado numérico / Enter del lector: sin acción, URL inmutable."* | ✅ **Aprobado** | Al no ser etiqueta <a> con href ni poseer click handlers, la activación por lector de pantalla es inocua. |
| **7.5** | C2 (VoiceOver/Safari) | Claro | *"Comando VO+Espacio sobre enlaces atenuados: emite tono de acción bloqueada del sistema, sin navegación ni callbacks."* | ✅ **Aprobado** | Patrón A neutraliza activaciones sintéticas de VoiceOver. |
| **7.6** | C1 (NVDA/Chrome) | Claro | *"Acción de fila, botón, no disponible."* | ✅ **Aprobado** | Botón nativo utiliza disabled y aria-disabled="true"; omitido de la secuencia Tab. |
| **7.7** | C1 (NVDA/Chrome) | Claro | *"Alternar disponibilidad, botón. Los controles cambian a estado habilitado."* | ✅ **Aprobado** | Los enlaces adoptan etiquetas <a> navegables con href activos. |
| **7.8** | C1 (NVDA/Chrome) | Claro | *"Cancelar traslado, enlace. Confirmar con adaptador, enlace. Pagar con alias, enlace. Acción de fila, botón. Confirmar pago, enlace."* | ✅ **Aprobado** | Primer elemento enfocado: "Cancelar traslado". Todos los enlaces habilitados entran a la secuencia Tab normal. |
| **7.9** | C1 (NVDA/Chrome) | Claro | *"Enter sobre "Cancelar traslado, enlace": navega a URL #cancelar. Acción ejecutada."* | ✅ **Aprobado** | Navegación habilitada opera sin ninguna regresión funcional. |
| **7.10** | C1 (NVDA/Chrome) | Claro | *"Alternar disponibilidad pulsado. Los enlaces vuelven a quedar bloqueados. Tab salta directamente a "Fin de recorrido, botón"."* | ✅ **Aprobado** | ActiveElement id="after". Ciclo reversible completamente demostrado. |
| **7.1** | C3 (VoiceOver táctil / iOS) | Claro | *"Deslizamiento táctil: "Cancelar traslado, enlace atenuado", doble toque no realiza ninguna acción ni abre enlaces."* | ✅ **Aprobado** | Gesto de doble toque ignorado en iOS Safari gracias a ausencia de href y elementos nativos. |


---

## Firmas de Aprobación Formal (Gate SD-REM-007-AC-6)

### Frontend Plataforma
> *"Se ratifica la implementación del Patrón A (span role='link' aria-disabled='true'). Omisión estricta en la secuencia Tab, bloqueo total a eventos sintéticos y cero activación por comandos asistivos."*  
> **Estado:** APROBADO

### Accesibilidad / Sistemas de Diseño
> *"Se confirma que los enlaces deshabilitados informan su nombre y estado atenuado/no disponible a los usuarios de tecnología asistiva sin permitir activaciones accidentales."*  
> **Estado:** APROBADO
