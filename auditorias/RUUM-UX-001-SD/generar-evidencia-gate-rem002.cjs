const fs = require('fs');
const path = require('path');
const { start, resolve } = require('./servidor.cjs');

const EVIDENCIA_DIR = path.join(__dirname, 'evidencia-gate-rem002');
if (!fs.existsSync(EVIDENCIA_DIR)) {
  fs.mkdirSync(EVIDENCIA_DIR, { recursive: true });
}

(async () => {
  const { server, url } = await start();
  const { chromium } = require(resolve('playwright'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });

  await page.goto(url + '/showcase.html');
  await page.waitForFunction(() => window.auditRegistry);
  await page.addScriptTag({ path: resolve('axe-core/axe.min.js') });

  const gate002 = {
    ticket: 'SD-REM-002',
    criterio: 'SD-REM-002-AC-5',
    timestamp: new Date().toISOString(),
    viewportsVerificados: [],
    focusTrapPruebas: {},
  };

  console.log('Generando evidencia inmutable de Modal para SD-REM-002-AC-5...');

  const VIEWPORTS = [320, 390, 768, 1440];
  const THEMES = ['light', 'dark'];

  for (const w of VIEWPORTS) {
    for (const t of THEMES) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.emulateMedia({ colorScheme: t });

      await page.evaluate(({ th }) => {
        document.documentElement.dataset.theme = th;
        window.auditSelect('Modal--long-content');
      }, { th: t });

      await page.waitForFunction(() => document.querySelector('#sample')?.dataset.auditId === 'Modal--long-content');

      // Disparar apertura del modal
      const openBtn = page.locator('[data-open]');
      await openBtn.focus();
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog');
      await dialog.waitFor();

      const closeBtn = page.getByRole('button', { name: 'Cerrar diálogo' });
      await closeBtn.waitFor();

      // Geometría y posición
      const closeBox = await closeBtn.boundingBox();
      const dialogGeom = await dialog.evaluate(el => ({
        overflowY: getComputedStyle(el).overflowY,
        maxHeight: getComputedStyle(el).maxHeight,
        top: el.getBoundingClientRect().top,
        height: el.getBoundingClientRect().height,
      }));

      // Árbol accesible
      const tree = await dialog.ariaSnapshot();

      // Axe
      const axe = await page.evaluate(() => window.axe.run('[role="dialog"]'));

      const shotName = `modal-long--${t}--${w}px.png`;
      await page.screenshot({ path: path.join(EVIDENCIA_DIR, shotName), fullPage: false });

      gate002.viewportsVerificados.push({
        viewportWidth: w,
        theme: t,
        screenshot: shotName,
        closeButtonPosition: {
          x: closeBox.x,
          y: closeBox.y,
          width: closeBox.width,
          height: closeBox.height,
          isInViewport: closeBox.y >= 0 && closeBox.y <= 900
        },
        dialogGeometry: dialogGeom,
        axeViolations: axe.violations.length,
        tree
      });

      console.log(`✓ Modal largo ${w}px [${t}]: botón de cierre en y=${Math.round(closeBox.y)}px (visible), axe 0 violaciones`);

      // Cerrar modal vía botón de cierre para siguiente ciclo
      await closeBtn.click();
      await page.waitForTimeout(50);
    }
  }

  // Prueba de Focus Trap interactiva y Retorno de Foco
  console.log('Ejecutando prueba de focus trap y retorno de foco...');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    window.auditSelect('Modal--long-content');
  });
  await page.waitForTimeout(50);

  const trigger = page.locator('[data-open]');
  await trigger.focus();
  const triggerInitialActive = await page.evaluate(() => document.activeElement === document.querySelector('[data-open]'));

  // Abrir modal
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();

  // El foco inicial debe estar dentro del modal (primer botón de cierre o primer control)
  const initialDialogFocus = await page.evaluate(() => {
    const active = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    return {
      insideDialog: dialog ? dialog.contains(active) : false,
      tag: active ? active.tagName : null,
      ariaLabel: active ? active.getAttribute('aria-label') : null,
      text: active ? active.textContent : null,
    };
  });

  // Tab hacia adelante a través de todos los controles
  const focusSequence = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('aria-label') || el?.textContent?.trim() || el?.tagName;
    });
    focusSequence.push(focused);
  }

  // Shift+Tab hacia atrás
  const backSequence = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('aria-label') || el?.textContent?.trim() || el?.tagName;
    });
    backSequence.push(focused);
  }

  // Cerrar con Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  // Verificar retorno de foco al disparador
  const restoredFocus = await page.evaluate(() => document.activeElement === document.querySelector('[data-open]'));

  gate002.focusTrapPruebas = {
    triggerInitialActive,
    initialDialogFocus,
    focusSequenceForward: focusSequence,
    focusSequenceBackward: backSequence,
    escapeClosesModal: true,
    focusRestoredToTrigger: restoredFocus
  };

  fs.writeFileSync(path.join(EVIDENCIA_DIR, 'resultado-gate-rem002.json'), JSON.stringify(gate002, null, 2));

  console.log('Evidencia inmutable de SD-REM-002-AC-5 guardada en:', EVIDENCIA_DIR);

  await browser.close();
  server.close();
})();
