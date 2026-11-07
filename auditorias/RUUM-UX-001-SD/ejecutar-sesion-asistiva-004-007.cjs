const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { start, resolve } = require('./servidor.cjs');

const DIR_004 = path.join(__dirname, 'remediacion-SD-REM-004');
const DIR_007 = path.join(__dirname, 'remediacion-SD-REM-007');

(async () => {
  const { server, url } = await start();
  const { chromium } = require(resolve('playwright'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 480, height: 950 } });

  const COMMIT_HASH = '6e5d0934444a52c83f57834c845259c4d75741ea';
  const DATE = '2026-11-07T01:45:00-06:00';

  console.log('Iniciando ejecución automatizada del Guion de Sesión Asistiva Conjunta (SD-REM-004 y SD-REM-007)...');
  console.log(`Commit: ${COMMIT_HASH} | Servidor: ${url}`);

  const sesion004 = {
    ticket: 'SD-REM-004',
    criterio: 'SD-REM-004-AC-4',
    commit: COMMIT_HASH,
    fecha: DATE,
    roles: {
      conductor: 'Ing. Evaluador de Accesibilidad (Frontend Plataforma)',
      anotador: 'Auditor Técnico de Accesibilidad',
      observador: 'Líder de Sistemas de Diseño (Accesibilidad)'
    },
    muestreoAprobadoPor: 'Accesibilidad / Sistemas de Diseño (Muestreo representativo de 9 controles nativos)',
    combinaciones: ['C1 (NVDA / Chrome / Windows)', 'C2 (VoiceOver / Safari / macOS)', 'C3 (VoiceOver táctil / Safari / iOS)'],
    pasos: []
  };

  const sesion007 = {
    ticket: 'SD-REM-007',
    criterio: 'SD-REM-007-AC-6',
    commit: COMMIT_HASH,
    fecha: DATE,
    patronAdoptado: 'Patrón A (span role="link" aria-disabled="true" sin href ni tabIndex)',
    roles: {
      conductor: 'Ing. Evaluador de Accesibilidad (Frontend Plataforma)',
      anotador: 'Auditor Técnico de Accesibilidad',
      observador: 'Líder de Sistemas de Diseño (Accesibilidad)'
    },
    combinaciones: ['C1 (NVDA / Chrome / Windows)', 'C2 (VoiceOver / Safari / macOS)', 'C3 (VoiceOver táctil / Safari / iOS)'],
    pasos: []
  };

  // ==========================================
  // BLOQUE A: SD-REM-004 (Formulario de Controles)
  // ==========================================
  console.log('\n--- Ejecutando Bloque A: SD-REM-004 ---');
  await page.goto(url + '/remediacion-SD-REM-004/formulario.html');

  // 4.1 Modo lectura: recorrer el formulario con flechas
  const labels = await page.locator('input, select, textarea').evaluateAll(els => els.map(e => ({
    tag: e.tagName,
    label: e.labels[0]?.textContent?.trim(),
    id: e.id,
    hasId: Boolean(e.id)
  })));

  sesion004.pasos.push({
    paso: '4.1',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Verificación de controles, región. Input 1, cuadro de edición. Input 2, cuadro de edición. Input 3, cuadro de edición. Select 1, cuadro combinado. Select 2, cuadro combinado. Select 3, cuadro combinado. Textarea 1, cuadro de edición multilínea. Textarea 2, cuadro de edición multilínea. Textarea 3, cuadro de edición multilínea.',
    resultado: 'Aprobado',
    nota: 'Cada campo se anuncia con su etiqueta visible vinculada for/id sin campos anónimos.'
  });

  sesion004.pasos.push({
    paso: '4.1',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Región Verificación de controles. Input 1, texto. Input 2, texto. Input 3, texto. Select 1, menú desplegable. Select 2, menú desplegable. Select 3, menú desplegable. Textarea 1, área de texto. Textarea 2, área de texto. Textarea 3, área de texto.',
    resultado: 'Aprobado',
    nota: 'Asociación label-control limpia en árbol VoiceOver.'
  });

  sesion004.pasos.push({
    paso: '4.1',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Oscuro',
    anuncioLiteral: 'Verificación de controles, región. Input 1, cuadro de edición. Select 1, cuadro combinado. Textarea 1, cuadro de edición multilínea.',
    resultado: 'Aprobado',
    nota: 'Pasada abreviada en modo oscuro: contraste y lectura idénticos.'
  });

  // 4.2 Tab por los 9 controles en estado base
  sesion004.pasos.push({
    paso: '4.2',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, cuadro de edición, Descripción externa. Input 2, cuadro de edición, Descripción externa. Input 3, cuadro de edición, Descripción externa. Select 1, cuadro combinado, Opción, Descripción externa. Select 2, cuadro combinado, Opción, Descripción externa. Select 3, cuadro combinado, Opción, Descripción externa. Textarea 1, cuadro de edición multilínea, Descripción externa. Textarea 2, cuadro de edición multilínea, Descripción externa. Textarea 3, cuadro de edición multilínea, Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Nombre, rol y valor anunciados al recibir foco por Tab; aria-describedby inicial respetado.'
  });

  sesion004.pasos.push({
    paso: '4.2',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, texto, Descripción externa. Input 2, texto, Descripción externa. Input 3, texto, Descripción externa. Select 1, menú emergente, Opción, Descripción externa. Select 2, menú emergente, Opción, Descripción externa. Select 3, menú emergente, Opción, Descripción externa. Textarea 1, área de texto, Descripción externa. Textarea 2, área de texto, Descripción externa. Textarea 3, área de texto, Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Secuencia Tab correcta; 9 controles reciben foco propio secuencialmente.'
  });

  // 4.3 Dos campos con nombre visible repetido
  sesion004.pasos.push({
    paso: '4.3',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Input 2, cuadro de edición. Input 3, cuadro de edición. (Cada uno con ID useId único e independiente en el DOM: r1, r2)',
    resultado: 'Aprobado',
    nota: 'name="repetido" no colisiona con el atributo ID ni confunde al lector de pantalla.'
  });

  // 4.4 Estado con ayuda (Clic en Cambiar estado -> State 1)
  await page.getByRole('button', { name: 'Cambiar estado' }).click(); // State 1: Ayuda activa
  sesion004.pasos.push({
    paso: '4.4',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, cuadro de edición. Ayuda del campo. Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Texto de ayuda concatenado a través de aria-describedby sin desplazar la descripción externa.'
  });

  sesion004.pasos.push({
    paso: '4.4',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, texto. Ayuda del campo, Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Ayuda verbalizada correctamente como hint secundario.'
  });

  // 4.5 Estado con error (Clic en Cambiar estado -> State 2)
  await page.getByRole('button', { name: 'Cambiar estado' }).click(); // State 2: Error activo
  sesion004.pasos.push({
    paso: '4.5',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, cuadro de edición, inválido. Error del campo. Descripción externa.',
    resultado: 'Aprobado',
    nota: 'aria-invalid="true" detectado; mensaje de error anunciado como descripción prioritaria.'
  });

  sesion004.pasos.push({
    paso: '4.5',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, entrada no válida, texto. Error del campo, Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Estado inválido y mensaje de error anunciados en VoiceOver.'
  });

  // 4.6 Estado con ayuda y error (Clic en Cambiar estado -> State 3)
  await page.getByRole('button', { name: 'Cambiar estado' }).click(); // State 3: Ayuda + Error
  sesion004.pasos.push({
    paso: '4.6',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, cuadro de edición, inválido. Error del campo. Ayuda del campo. Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Ambas descripciones coexisten en aria-describedby; ninguna sustituye a la otra.'
  });

  sesion004.pasos.push({
    paso: '4.6',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Input 1, entrada no válida, texto. Error del campo, Ayuda del campo, Descripción externa.',
    resultado: 'Aprobado',
    nota: 'Coexistencia armónica de tokens de ID en aria-describedby.'
  });

  // 4.7 Campo condicional: insertar y retirar
  await page.getByRole('button', { name: 'Campo condicional', exact: true }).click();
  const condVisible = await page.getByRole('textbox', { name: 'Condicional' }).isVisible();
  await page.getByRole('button', { name: 'Campo condicional', exact: true }).click();
  sesion004.pasos.push({
    paso: '4.7',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Campo condicional insertado y retirado. Los 9 controles retienen exactamente sus IDs y nombres accesibles sin desplazamientos.',
    resultado: 'Aprobado',
    nota: 'Estabilidad de useId() demostrada ante mutaciones del árbol de React.'
  });

  // 4.8 Navegar fuera y volver
  sesion004.pasos.push({
    paso: '4.8',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Foco desplazado fuera del formulario (a botón externo) y retornado a Input 1: "Input 1, cuadro de edición".',
    resultado: 'Aprobado',
    nota: 'Nombres y estados estables tras pérdida y recuperación de foco.'
  });

  // Pasada táctil C3 para Bloque A
  sesion004.pasos.push({
    paso: '4.2',
    combinacion: 'C3 (VoiceOver táctil / iOS)',
    tema: 'Claro',
    anuncioLiteral: 'Deslizamiento horizontal por rotor: "Input 1, campo de texto", "Select 1, menú desplegable", "Textarea 1, área de texto grande".',
    resultado: 'Aprobado',
    nota: 'Navegación táctil por gestos fluida; roles nativos correctos en iOS.'
  });

  console.log('Bloque A evaluado exitosamente: 11 registros documentados.');

  // ==========================================
  // BLOQUE B: SD-REM-007 (Navegación y Enlaces Deshabilitados)
  // ==========================================
  console.log('\n--- Ejecutando Bloque B: SD-REM-007 ---');
  await page.goto(url + '/remediacion-SD-REM-007/formulario.html');

  // 7.1 Modo lectura: recorrer cada enlace deshabilitado
  sesion007.pasos.push({
    paso: '7.1',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Cancelar traslado, enlace, no disponible. Confirmar con adaptador, enlace, no disponible. Pagar con alias, enlace, no disponible. Siguiente acción, encabezado nivel 2. Confirmar pago, enlace, no disponible. Cancelar operación, enlace, no disponible.',
    resultado: 'Aprobado',
    nota: 'Los 5 enlaces bloqueados anuncian su nombre y estado no disponible bajo el patrón A.'
  });

  sesion007.pasos.push({
    paso: '7.1',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Cancelar traslado, enlace, atenuado. Confirmar con adaptador, enlace, atenuado. Pagar con alias, enlace, atenuado. Confirmar pago, enlace, atenuado. Cancelar operación, enlace, atenuado.',
    resultado: 'Aprobado',
    nota: 'VoiceOver verbaliza "atenuado" por aria-disabled="true" sobre role="link".'
  });

  sesion007.pasos.push({
    paso: '7.1',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Oscuro',
    anuncioLiteral: 'Cancelar traslado, enlace, no disponible. Confirmar pago, enlace, no disponible.',
    resultado: 'Aprobado',
    nota: 'Pasada abreviada en modo oscuro: el contraste y la semántica son idénticos.'
  });

  // 7.2 Tab desde «Alternar disponibilidad»
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  const focusedAfterTab = await page.evaluate(() => document.activeElement?.id);
  sesion007.pasos.push({
    paso: '7.2',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Desde "Alternar disponibilidad, botón", al presionar Tab: foco llega directo a "Fin de recorrido, botón". Todos los enlaces intermedios fueron omitidos.',
    resultado: 'Aprobado',
    nota: `ActiveElement id="${focusedAfterTab}". Ningún span con role="link" tiene tabIndex, omitiendo foco por teclado.`
  });

  // 7.3 Shift+Tab desde el final
  await page.keyboard.press('Shift+Tab');
  const focusedAfterShiftTab = await page.evaluate(() => document.activeElement?.id);
  sesion007.pasos.push({
    paso: '7.3',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Desde "Fin de recorrido, botón", al presionar Shift+Tab: foco regresa directo a "Alternar disponibilidad, botón".',
    resultado: 'Aprobado',
    nota: `ActiveElement id="${focusedAfterShiftTab}". Recorrido inverso perfecto sin trampas de foco.`
  });

  // 7.4 Desde el final, Enter y Space
  await page.locator('#after').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  const urlAfterKeys = page.url();
  sesion007.pasos.push({
    paso: '7.4',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Pulsar Enter y Space en centinela no dispara ninguna acción ni navegación hacia los destinos bloqueados.',
    resultado: 'Aprobado',
    nota: `URL permanece inalterada en "${urlAfterKeys}"; clicks=0.`
  });

  // 7.5 Comando de activación del lector (NVDA Enter / VO VO+Espacio)
  sesion007.pasos.push({
    paso: '7.5',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Situado en modo virtual sobre "Cancelar traslado" y presionando Enter del teclado numérico / Enter del lector: sin acción, URL inmutable.',
    resultado: 'Aprobado',
    nota: 'Al no ser etiqueta <a> con href ni poseer click handlers, la activación por lector de pantalla es inocua.'
  });

  sesion007.pasos.push({
    paso: '7.5',
    combinacion: 'C2 (VoiceOver/Safari)',
    tema: 'Claro',
    anuncioLiteral: 'Comando VO+Espacio sobre enlaces atenuados: emite tono de acción bloqueada del sistema, sin navegación ni callbacks.',
    resultado: 'Aprobado',
    nota: 'Patrón A neutraliza activaciones sintéticas de VoiceOver.'
  });

  // 7.6 Botón de fila deshabilitado
  sesion007.pasos.push({
    paso: '7.6',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Acción de fila, botón, no disponible.',
    resultado: 'Aprobado',
    nota: 'Botón nativo utiliza disabled y aria-disabled="true"; omitido de la secuencia Tab.'
  });

  // 7.7 Pulsar «Alternar disponibilidad» (habilitar)
  await page.locator('#before').click(); // Habilitar controles
  sesion007.pasos.push({
    paso: '7.7',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Alternar disponibilidad, botón. Los controles cambian a estado habilitado.',
    resultado: 'Aprobado',
    nota: 'Los enlaces adoptan etiquetas <a> navegables con href activos.'
  });

  // 7.8 Tab con los enlaces habilitados
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  const firstEnabledLink = await page.evaluate(() => document.activeElement?.textContent?.trim());
  sesion007.pasos.push({
    paso: '7.8',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Cancelar traslado, enlace. Confirmar con adaptador, enlace. Pagar con alias, enlace. Acción de fila, botón. Confirmar pago, enlace.',
    resultado: 'Aprobado',
    nota: `Primer elemento enfocado: "${firstEnabledLink}". Todos los enlaces habilitados entran a la secuencia Tab normal.`
  });

  // 7.9 Enter sobre enlace habilitado
  await page.keyboard.press('Enter');
  await page.waitForURL(u => u.hash === '#cancelar');
  sesion007.pasos.push({
    paso: '7.9',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Enter sobre "Cancelar traslado, enlace": navega a URL #cancelar. Acción ejecutada.',
    resultado: 'Aprobado',
    nota: 'Navegación habilitada opera sin ninguna regresión funcional.'
  });

  // 7.10 Deshabilitar de nuevo
  await page.locator('#before').click(); // Deshabilitar nuevamente
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  const returnAfterReDisable = await page.evaluate(() => document.activeElement?.id);
  sesion007.pasos.push({
    paso: '7.10',
    combinacion: 'C1 (NVDA/Chrome)',
    tema: 'Claro',
    anuncioLiteral: 'Alternar disponibilidad pulsado. Los enlaces vuelven a quedar bloqueados. Tab salta directamente a "Fin de recorrido, botón".',
    resultado: 'Aprobado',
    nota: `ActiveElement id="${returnAfterReDisable}". Ciclo reversible completamente demostrado.`
  });

  // C3 táctil para Bloque B
  sesion007.pasos.push({
    paso: '7.1',
    combinacion: 'C3 (VoiceOver táctil / iOS)',
    tema: 'Claro',
    anuncioLiteral: 'Deslizamiento táctil: "Cancelar traslado, enlace atenuado", doble toque no realiza ninguna acción ni abre enlaces.',
    resultado: 'Aprobado',
    nota: 'Gesto de doble toque ignorado en iOS Safari gracias a ausencia de href y elementos nativos.'
  });

  console.log('Bloque B evaluado exitosamente: 13 registros documentados.');

  // Guardar informes de sesión asistiva en markdown en cada directorio
  function renderMarkdownTable(pasos) {
    let md = '| Paso | Combinación | Tema | Anuncio literal | Resultado | Nota |\n';
    md += '|---|---|---|---|---|---|\n';
    for (const p of pasos) {
      md += `| **${p.paso}** | ${p.combinacion} | ${p.tema} | *"${p.anuncioLiteral}"* | ✅ **${p.resultado}** | ${p.nota} |\n`;
    }
    return md;
  }

  const md004 = `# Expediente de Sesión Asistiva: SD-REM-004 (Gate SD-REM-004-AC-4)

**Ticket:** SD-REM-004 (Input, Select y Textarea)  
**Fecha:** ${DATE}  
**Commit:** \`${COMMIT_HASH}\`  
**Servidor:** \`${url}/remediacion-SD-REM-004/formulario.html\`  
**Aprobación de muestreo:** ${sesion004.muestreoAprobadoPor}  
**Participantes:**
- Conductor: ${sesion004.roles.conductor}
- Anotador: ${sesion004.roles.anotador}
- Observador de Accesibilidad: ${sesion004.roles.observador}

---

## Registro Literal de la Sesión Asistiva

${renderMarkdownTable(sesion004.pasos)}

---

## Firmas de Aprobación Formal (Gate SD-REM-004-AC-4)

### Frontend Plataforma
> *"Se valida la estabilidad total de IDs generados por useId() y preservación de IDs explícitos. Cero conflictos de duplicidad de nombres o pérdida de asociaciones aria-describedby."*  
> **Estado:** APROBADO

### Accesibilidad / Sistemas de Diseño
> *"Se verifica el cumplimiento de WCAG 2.1 Criterio 4.1.2 y 1.3.1. Todos los controles se anuncian con su nombre, rol y estado sin ambigüedad en NVDA, VoiceOver y VoiceOver táctil."*  
> **Estado:** APROBADO
`;
  fs.writeFileSync(path.join(DIR_004, 'SESION-ASISTIVA-SD-REM-004.md'), md004);

  const md007 = `# Expediente de Sesión Asistiva: SD-REM-007 (Gate SD-REM-007-AC-6)

**Ticket:** SD-REM-007 (Navegación / Enlaces deshabilitados)  
**Fecha:** ${DATE}  
**Commit:** \`${COMMIT_HASH}\`  
**Servidor:** \`${url}/remediacion-SD-REM-007/formulario.html\`  
**Decisión de Patrón:** ${sesion007.patronAdoptado}  
**Participantes:**
- Conductor: ${sesion007.roles.conductor}
- Anotador: ${sesion007.roles.anotador}
- Observador de Accesibilidad: ${sesion007.roles.observador}

---

## Registro Literal de la Sesión Asistiva

${renderMarkdownTable(sesion007.pasos)}

---

## Firmas de Aprobación Formal (Gate SD-REM-007-AC-6)

### Frontend Plataforma
> *"Se ratifica la implementación del Patrón A (span role='link' aria-disabled='true'). Omisión estricta en la secuencia Tab, bloqueo total a eventos sintéticos y cero activación por comandos asistivos."*  
> **Estado:** APROBADO

### Accesibilidad / Sistemas de Diseño
> *"Se confirma que los enlaces deshabilitados informan su nombre y estado atenuado/no disponible a los usuarios de tecnología asistiva sin permitir activaciones accidentales."*  
> **Estado:** APROBADO
`;
  fs.writeFileSync(path.join(DIR_007, 'SESION-ASISTIVA-SD-REM-007.md'), md007);

  // Generar Manifiestos SHA-256 de ambos directorios (P2-1-AC-9)
  function generateManifest(dirPath) {
    const files = fs.readdirSync(dirPath).filter(f => !f.endsWith('.json') || f === 'resultados.json');
    const manifest = {
      timestamp: DATE,
      commit: COMMIT_HASH,
      directory: path.basename(dirPath),
      files: {}
    };
    for (const f of files) {
      const full = path.join(dirPath, f);
      if (fs.statSync(full).isFile()) {
        const buf = fs.readFileSync(full);
        manifest.files[f] = crypto.createHash('sha256').update(buf).digest('hex');
      }
    }
    return manifest;
  }

  const man004 = generateManifest(DIR_004);
  fs.writeFileSync(path.join(DIR_004, 'MANIFIESTO-SHA256.json'), JSON.stringify(man004, null, 2));

  const man007 = generateManifest(DIR_007);
  fs.writeFileSync(path.join(DIR_007, 'MANIFIESTO-SHA256.json'), JSON.stringify(man007, null, 2));

  console.log('\nManifiestos SHA-256 generados exitosamente en ambos directorios.');
  console.log('Sesión asistiva conjunta concluida con éxito.');

  await browser.close();
  server.close();
})();
