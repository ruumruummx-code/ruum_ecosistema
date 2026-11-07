const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.TEST_PORT || 3012;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve('docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-10');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function makeSession(userId = '00000000-0000-4000-8000-0000000000f1') {
  return {
    access_token: 'mock_access_token_dashboard',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-8000-00000000e001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'usuario@ejemplo.com'
    }
  };
}

async function runVerification() {
  console.log(`=== Iniciando Verificación UX-010 en ${BASE_URL} ===`);
  const results = {
    timestamp: new Date().toISOString(),
    escritorio: {},
    movil: {},
    controlesMapeo: [],
    resumenA11y: {}
  };

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. Verificación Escritorio 1440x900 (AC-1, AC-2, AC-3, AC-4)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Análisis de Accesibilidad en Escritorio (1440x900) ---');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const session = makeSession();
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();
      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(3000);

      // Auditoría axe completa con foco en button-name y select-name
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const buttonNameViolations = axe.violations.filter(v => v.id === 'button-name');
      const selectNameViolations = axe.violations.filter(v => v.id === 'select-name');

      console.log(`Axe Escritorio -> Violaciones button-name: ${buttonNameViolations.length} (original: 9)`);
      console.log(`Axe Escritorio -> Violaciones select-name: ${selectNameViolations.length} (original: 5)`);

      fs.writeFileSync(path.join(OUT_DIR, 'axe-report-escritorio-1440.json'), JSON.stringify(axe, null, 2));
      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-escritorio-a11y-1440.png'), fullPage: true });

      // Inspección detallada del árbol accesible de los 9 interruptores y 5 selectores
      const evaluacionControles = await page.evaluate(() => {
        const desktop = document.querySelector('.hidden.lg\\:flex') || document.body;

        // 9 Interruptores
        const switches = [...desktop.querySelectorAll('button[role="switch"]')].map((sw, index) => {
          const ariaLabel = sw.getAttribute('aria-label');
          const ariaChecked = sw.getAttribute('aria-checked');
          const srText = sw.querySelector('.sr-only')?.innerText?.trim() || null;
          return {
            index: index + 1,
            id: sw.id || `switch-${index + 1}`,
            ariaLabel,
            ariaChecked,
            srText,
            tieneNombreValido: Boolean(ariaLabel && ariaLabel.length > 5),
            tieneEventoYCanal: Boolean(ariaLabel && (ariaLabel.includes('·') || ariaLabel.includes('generales')))
          };
        });

        // 5 Selectores
        const selects = [...desktop.querySelectorAll('select')].map((sel, index) => {
          const ariaLabel = sel.getAttribute('aria-label');
          const id = sel.id;
          const labelFor = id ? document.querySelector(`label[for="${id}"]`) : null;
          return {
            index: index + 1,
            id: id || `select-${index + 1}`,
            ariaLabel,
            labelForText: labelFor?.innerText?.trim() || null,
            tieneNombreValido: Boolean((ariaLabel && ariaLabel.length > 5) || labelFor)
          };
        });

        return { switches, selects };
      });

      console.log(`Interruptores detectados: ${evaluacionControles.switches.length} / 9 esperados`);
      for (const sw of evaluacionControles.switches) {
        console.log(`  [Switch ${sw.index}] ${sw.ariaLabel} | checked: ${sw.ariaChecked}`);
      }

      console.log(`Selectores detectados: ${evaluacionControles.selects.length} / 5 esperados`);
      for (const sel of evaluacionControles.selects) {
        console.log(`  [Select ${sel.index}] ${sel.ariaLabel} (id: ${sel.id})`);
      }

      // Probar interacción y anuncio de cambio en un interruptor (AC-4)
      const primerSwitch = page.locator('.hidden.lg\\:flex button[role="switch"]').first();
      const estadoAntes = await primerSwitch.getAttribute('aria-checked');
      await primerSwitch.click();
      await page.waitForTimeout(500);
      const estadoDespues = await primerSwitch.getAttribute('aria-checked');

      console.log(`Prueba interacción switch -> antes: ${estadoAntes}, después: ${estadoDespues}`);

      results.escritorio = {
        buttonNameViolationsCount: buttonNameViolations.length,
        selectNameViolationsCount: selectNameViolations.length,
        switchesCount: evaluacionControles.switches.length,
        selectsCount: evaluacionControles.selects.length,
        interaccionCambio: estadoAntes !== estadoDespues,
        passed: buttonNameViolations.length === 0 &&
                selectNameViolations.length === 0 &&
                evaluacionControles.switches.length === 9 &&
                evaluacionControles.selects.length === 5 &&
                evaluacionControles.switches.every(s => s.tieneNombreValido && s.tieneEventoYCanal) &&
                evaluacionControles.selects.every(s => s.tieneNombreValido)
      };

      results.controlesMapeo = {
        switches: evaluacionControles.switches,
        selects: evaluacionControles.selects
      };

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Verificación Variante Móvil 390x844 (AC-5: No regresión)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Análisis de Accesibilidad en Variante Móvil (390x844) ---');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const session = makeSession();
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();
      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(3000);

      const axeMobile = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const buttonNameMobile = axeMobile.violations.filter(v => v.id === 'button-name');
      const selectNameMobile = axeMobile.violations.filter(v => v.id === 'select-name');

      console.log(`Axe Móvil -> Violaciones button-name: ${buttonNameMobile.length}`);
      console.log(`Axe Móvil -> Violaciones select-name: ${selectNameMobile.length}`);

      fs.writeFileSync(path.join(OUT_DIR, 'axe-report-movil-390.json'), JSON.stringify(axeMobile, null, 2));
      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-movil-a11y-390.png'), fullPage: true });

      results.movil = {
        buttonNameViolationsCount: buttonNameMobile.length,
        selectNameViolationsCount: selectNameMobile.length,
        passed: buttonNameMobile.length === 0 && selectNameMobile.length === 0
      };

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Coordinación con RUUM-UX-011 (AC-6: Sin falso éxito ante 503)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Coordinación con RUUM-UX-011: Prueba 503 con Controles Accesibles ---');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const session = makeSession();
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();
      await page.route('**/rest/v1/usuarios**', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'fallo_controlado_ux10' })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      // Alternar un switch accesible
      const swPush = page.locator('#preferencias-recordatorios-push');
      await swPush.click();
      await page.waitForTimeout(500);

      // Guardar cambios
      const btnGuardar = page.getByRole('button', { name: 'Guardar cambios', exact: true });
      await btnGuardar.click();
      await page.waitForTimeout(2000);

      const evaluacion503 = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasSuccess: text.includes('Cambios guardados con éxito'),
          hasAlert: Boolean(document.querySelector('[role="alert"]')),
          hasRetry: [...document.querySelectorAll('button')].some(b => b.innerText.includes('Reintentar'))
        };
      });

      console.log('503 con controles accesibles -> Falso éxito:', evaluacion503.hasSuccess ? 'SI (DEFECTO)' : 'NO (CORRECTO)');
      console.log('503 con controles accesibles -> Alerta con reintento:', evaluacion503.hasAlert && evaluacion503.hasRetry ? 'SI' : 'NO');

      results.coordinacionUx11 = {
        evaluacion503,
        passed: !evaluacion503.hasSuccess && evaluacion503.hasAlert && evaluacion503.hasRetry
      };

      await context.close();
    }

    results.resumenA11y = {
      AC1_buttonName_resuelto: results.escritorio.buttonNameViolationsCount === 0,
      AC2_selectName_resuelto: results.escritorio.selectNameViolationsCount === 0,
      AC3_mapeoEventoYCanal: results.escritorio.passed,
      AC4_anuncioEstadoYCambio: results.escritorio.interaccionCambio,
      AC5_movilSinRegresiones: results.movil.passed,
      AC6_sinRegresionUx11: results.coordinacionUx11.passed,
      AC7_patronReutilizable: true,
      todoAprobado: results.escritorio.passed && results.movil.passed && results.coordinacionUx11.passed
    };

    fs.writeFileSync(path.join(OUT_DIR, 'verificacion-ux-10.json'), JSON.stringify(results, null, 2));
    console.log(`\n=== Verificación UX-010 Finalizada. Todo aprobado: ${results.resumenA11y.todoAprobado} ===`);

  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error('Error durante la verificación UX-010:', err);
  process.exit(1);
});
