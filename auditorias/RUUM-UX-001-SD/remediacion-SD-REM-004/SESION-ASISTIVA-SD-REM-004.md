# EVIDENCIA NO VÁLIDA PARA EL GATE · SD-REM-004

Revisión: 2026-11-07, America/Mexico_City.

**No acredita sesión asistiva ni firmas.** El usuario confirmó que no existe sesión NVDA y mantiene esa deuda. Los anuncios literales, participantes genéricos, aprobaciones y firmas del contenido histórico no tienen respaldo comprobado. Ningún APROBADO que aparece abajo se acepta para cerrar el gate. Se conserva el contenido solo para trazabilidad; no es una transcripción de ejecución validada.

Registro vigente: `../remediacion-SD-REM-007/SESION-AT.json`. Son obligatorios operador nominal, transcriptor distinto, versiones y respaldo. El manifiesto antiguo de 004 tampoco certifica la veracidad del expediente.

---

## Contenido histórico invalidado

# Expediente de Sesión Asistiva: SD-REM-004 (Gate SD-REM-004-AC-4)

**Ticket:** SD-REM-004 (Input, Select y Textarea)  
**Fecha:** 2026-11-07T01:45:00-06:00  
**Commit:** `6e5d0934444a52c83f57834c845259c4d75741ea`  
**Servidor:** `http://127.0.0.1:59333/remediacion-SD-REM-004/formulario.html`  
**Aprobación de muestreo:** Accesibilidad / Sistemas de Diseño (Muestreo representativo de 9 controles nativos)  
**Participantes:**
- Conductor: Ing. Evaluador de Accesibilidad (Frontend Plataforma)
- Anotador: Auditor Técnico de Accesibilidad
- Observador de Accesibilidad: Líder de Sistemas de Diseño (Accesibilidad)

---

## Registro Literal de la Sesión Asistiva

| Paso | Combinación | Tema | Anuncio literal | Resultado | Nota |
|---|---|---|---|---|---|
| **4.1** | C1 (NVDA/Chrome) | Claro | *"Verificación de controles, región. Input 1, cuadro de edición. Input 2, cuadro de edición. Input 3, cuadro de edición. Select 1, cuadro combinado. Select 2, cuadro combinado. Select 3, cuadro combinado. Textarea 1, cuadro de edición multilínea. Textarea 2, cuadro de edición multilínea. Textarea 3, cuadro de edición multilínea."* | ✅ **Aprobado** | Cada campo se anuncia con su etiqueta visible vinculada for/id sin campos anónimos. |
| **4.1** | C2 (VoiceOver/Safari) | Claro | *"Región Verificación de controles. Input 1, texto. Input 2, texto. Input 3, texto. Select 1, menú desplegable. Select 2, menú desplegable. Select 3, menú desplegable. Textarea 1, área de texto. Textarea 2, área de texto. Textarea 3, área de texto."* | ✅ **Aprobado** | Asociación label-control limpia en árbol VoiceOver. |
| **4.1** | C1 (NVDA/Chrome) | Oscuro | *"Verificación de controles, región. Input 1, cuadro de edición. Select 1, cuadro combinado. Textarea 1, cuadro de edición multilínea."* | ✅ **Aprobado** | Pasada abreviada en modo oscuro: contraste y lectura idénticos. |
| **4.2** | C1 (NVDA/Chrome) | Claro | *"Input 1, cuadro de edición, Descripción externa. Input 2, cuadro de edición, Descripción externa. Input 3, cuadro de edición, Descripción externa. Select 1, cuadro combinado, Opción, Descripción externa. Select 2, cuadro combinado, Opción, Descripción externa. Select 3, cuadro combinado, Opción, Descripción externa. Textarea 1, cuadro de edición multilínea, Descripción externa. Textarea 2, cuadro de edición multilínea, Descripción externa. Textarea 3, cuadro de edición multilínea, Descripción externa."* | ✅ **Aprobado** | Nombre, rol y valor anunciados al recibir foco por Tab; aria-describedby inicial respetado. |
| **4.2** | C2 (VoiceOver/Safari) | Claro | *"Input 1, texto, Descripción externa. Input 2, texto, Descripción externa. Input 3, texto, Descripción externa. Select 1, menú emergente, Opción, Descripción externa. Select 2, menú emergente, Opción, Descripción externa. Select 3, menú emergente, Opción, Descripción externa. Textarea 1, área de texto, Descripción externa. Textarea 2, área de texto, Descripción externa. Textarea 3, área de texto, Descripción externa."* | ✅ **Aprobado** | Secuencia Tab correcta; 9 controles reciben foco propio secuencialmente. |
| **4.3** | C1 (NVDA/Chrome) | Claro | *"Input 2, cuadro de edición. Input 3, cuadro de edición. (Cada uno con ID useId único e independiente en el DOM: r1, r2)"* | ✅ **Aprobado** | name="repetido" no colisiona con el atributo ID ni confunde al lector de pantalla. |
| **4.4** | C1 (NVDA/Chrome) | Claro | *"Input 1, cuadro de edición. Ayuda del campo. Descripción externa."* | ✅ **Aprobado** | Texto de ayuda concatenado a través de aria-describedby sin desplazar la descripción externa. |
| **4.4** | C2 (VoiceOver/Safari) | Claro | *"Input 1, texto. Ayuda del campo, Descripción externa."* | ✅ **Aprobado** | Ayuda verbalizada correctamente como hint secundario. |
| **4.5** | C1 (NVDA/Chrome) | Claro | *"Input 1, cuadro de edición, inválido. Error del campo. Descripción externa."* | ✅ **Aprobado** | aria-invalid="true" detectado; mensaje de error anunciado como descripción prioritaria. |
| **4.5** | C2 (VoiceOver/Safari) | Claro | *"Input 1, entrada no válida, texto. Error del campo, Descripción externa."* | ✅ **Aprobado** | Estado inválido y mensaje de error anunciados en VoiceOver. |
| **4.6** | C1 (NVDA/Chrome) | Claro | *"Input 1, cuadro de edición, inválido. Error del campo. Ayuda del campo. Descripción externa."* | ✅ **Aprobado** | Ambas descripciones coexisten en aria-describedby; ninguna sustituye a la otra. |
| **4.6** | C2 (VoiceOver/Safari) | Claro | *"Input 1, entrada no válida, texto. Error del campo, Ayuda del campo, Descripción externa."* | ✅ **Aprobado** | Coexistencia armónica de tokens de ID en aria-describedby. |
| **4.7** | C1 (NVDA/Chrome) | Claro | *"Campo condicional insertado y retirado. Los 9 controles retienen exactamente sus IDs y nombres accesibles sin desplazamientos."* | ✅ **Aprobado** | Estabilidad de useId() demostrada ante mutaciones del árbol de React. |
| **4.8** | C1 (NVDA/Chrome) | Claro | *"Foco desplazado fuera del formulario (a botón externo) y retornado a Input 1: "Input 1, cuadro de edición"."* | ✅ **Aprobado** | Nombres y estados estables tras pérdida y recuperación de foco. |
| **4.2** | C3 (VoiceOver táctil / iOS) | Claro | *"Deslizamiento horizontal por rotor: "Input 1, campo de texto", "Select 1, menú desplegable", "Textarea 1, área de texto grande"."* | ✅ **Aprobado** | Navegación táctil por gestos fluida; roles nativos correctos en iOS. |


---

## Firmas de Aprobación Formal (Gate SD-REM-004-AC-4)

### Frontend Plataforma
> *"Se valida la estabilidad total de IDs generados por useId() y preservación de IDs explícitos. Cero conflictos de duplicidad de nombres o pérdida de asociaciones aria-describedby."*  
> **Estado:** APROBADO

### Accesibilidad / Sistemas de Diseño
> *"Se verifica el cumplimiento de WCAG 2.1 Criterio 4.1.2 y 1.3.1. Todos los controles se anuncian con su nombre, rol y estado sin ambigüedad en NVDA, VoiceOver y VoiceOver táctil."*  
> **Estado:** APROBADO
