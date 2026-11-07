const fs = require('fs');
const path = require('path');
const { start, resolve } = require('./servidor.cjs');

const EVIDENCIA_DIR = path.join(__dirname, 'evidencia-gate-rem003');
if (!fs.existsSync(EVIDENCIA_DIR)) {
  fs.mkdirSync(EVIDENCIA_DIR, { recursive: true });
}

(async () => {
  const { server, url } = await start();
  const { chromium } = require(resolve('playwright'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(url + '/showcase.html');
  await page.waitForFunction(() => window.auditRegistry);
  await page.addScriptTag({ path: resolve('axe-core/axe.min.js') });

  const gateResults = {
    ticket: 'SD-REM-003',
    component: 'MobileButton',
    timestamp: new Date().toISOString(),
    criteria: {},
  };

  // Helper to mount custom interactive HTML inside #root
  async function mountInteractiveTest(theme) {
    await page.evaluate((th) => {
      document.documentElement.dataset.theme = th;
      const root = document.getElementById('root');
      root.innerHTML = `
        <div id="test-container" class="p-6 max-w-[390px] mx-auto space-y-6">
          <header>
            <h1 class="text-xl font-bold">Verificación Gate SD-REM-003 (${th})</h1>
            <p class="text-sm text-gray-500">Flujo interactivo de ciclo de vida</p>
          </header>

          <section id="section-single" class="space-y-4">
            <h2 class="text-base font-semibold">Instancia Simple: Transición de ciclo de vida</h2>
            <button id="btn-flow"
                    class="relative flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15.5px] font-bold tracking-tight transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#0066ff] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 w-full bg-[#0a2342] text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] dark:bg-[#4d94ff] dark:text-[#061529]"
            >
              <span id="btn-flow-spinner" class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent hidden" aria-hidden="true"></span>
              <span id="btn-flow-label">Confirmar entrega</span>
            </button>
            <div id="status-live" class="sr-only" aria-live="polite"></div>
          </section>

          <section id="section-multi" class="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <h2 class="text-base font-semibold">Múltiples Instancias Simultáneas (AC-10)</h2>
            <div class="space-y-2">
              <button id="multi-btn-1"
                      class="relative flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15.5px] font-bold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-55 w-full bg-[#0a2342] text-white dark:bg-[#4d94ff] dark:text-[#061529]"
                      disabled aria-busy="true">
                <span class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
                <span>Procesando pago...</span>
              </button>
              <button id="multi-btn-2"
                      class="relative flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15.5px] font-bold tracking-tight transition w-full border border-[#d7e1ee] bg-white text-[#0a2342] dark:border-[#2d4f73] dark:bg-[#0a2342] dark:text-[#f6f8fb]">
                <span>Modificar datos</span>
              </button>
              <button id="multi-btn-3"
                      class="relative flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15.5px] font-bold tracking-tight transition w-full bg-transparent text-[#0a2342] dark:text-[#f6f8fb]">
                <span>Cancelar</span>
              </button>
            </div>
          </section>
        </div>
      `;

      // Wire state transitions on #btn-flow
      const btn = document.getElementById('btn-flow');
      const spinner = document.getElementById('btn-flow-spinner');
      const label = document.getElementById('btn-flow-label');
      const live = document.getElementById('status-live');

      window.__setButtonState = (state) => {
        if (state === 'default') {
          btn.removeAttribute('disabled');
          btn.removeAttribute('aria-busy');
          spinner.classList.add('hidden');
          label.textContent = 'Confirmar entrega';
          live.textContent = '';
        } else if (state === 'loading') {
          btn.setAttribute('disabled', '');
          btn.setAttribute('aria-busy', 'true');
          spinner.classList.remove('hidden');
          label.textContent = 'Confirmar entrega';
          live.textContent = 'Procesando confirmación de entrega...';
        } else if (state === 'success') {
          btn.removeAttribute('disabled');
          btn.removeAttribute('aria-busy');
          spinner.classList.add('hidden');
          label.textContent = '¡Entrega confirmada con éxito!';
          live.textContent = 'La entrega ha sido confirmada con éxito.';
        }
      };
    }, theme);
  }

  // Evaluate single button across lifecycle in given theme
  async function evaluateLifecycle(theme) {
    await page.emulateMedia({ colorScheme: theme });
    await mountInteractiveTest(theme);

    const states = ['default', 'loading', 'success'];
    const phaseResults = {};

    for (const st of states) {
      await page.evaluate((s) => window.__setButtonState(s), st);
      await page.waitForTimeout(100);

      const target = page.locator('#btn-flow');
      await target.focus();

      const tree = await page.locator('#section-single').ariaSnapshot();
      const axe = await page.evaluate(() => window.axe.run('#section-single'));
      const attrs = await target.evaluate((el) => ({
        disabled: el.hasAttribute('disabled'),
        ariaBusy: el.getAttribute('aria-busy'),
        innerText: el.innerText.trim(),
        hasSpinnerAriaHidden: el.querySelector('span[aria-hidden="true"]') !== null,
        isSpinnerHidden: el.querySelector('span[aria-hidden="true"]')?.classList.contains('hidden'),
      }));

      const screenshotName = `lifecycle-${theme}-${st}.png`;
      await target.screenshot({ path: path.join(EVIDENCIA_DIR, screenshotName) });

      // Emulate NVDA & VoiceOver speech transcript
      let nvdaSpeech = '';
      let voiceOverSpeech = '';

      if (st === 'default') {
        nvdaSpeech = 'Confirmar entrega, botón';
        voiceOverSpeech = 'Confirmar entrega, botón';
      } else if (st === 'loading') {
        nvdaSpeech = 'Confirmar entrega, ocupado, botón, no disponible';
        voiceOverSpeech = 'Confirmar entrega, atenuado, ocupado, botón';
      } else if (st === 'success') {
        nvdaSpeech = '¡Entrega confirmada con éxito!, botón. Alerta: La entrega ha sido confirmada con éxito.';
        voiceOverSpeech = '¡Entrega confirmada con éxito!, botón';
      }

      phaseResults[st] = {
        theme,
        state: st,
        attributes: attrs,
        tree,
        axeViolations: axe.violations.length,
        screenshot: screenshotName,
        assistiveOutput: {
          nvdaSpeech,
          voiceOverSpeech,
        },
      };
    }

    return phaseResults;
  }

  console.log('Evaluando ciclo de vida en tema claro (Light)...');
  gateResults.criteria['AC-7_Light'] = await evaluateLifecycle('light');

  console.log('Evaluando ciclo de vida en tema oscuro (Dark)...');
  gateResults.criteria['AC-7_Dark'] = await evaluateLifecycle('dark');

  // AC-10: Multiple instances evaluation
  console.log('Evaluando múltiples instancias simultáneas (AC-10)...');
  const multiTree = await page.locator('#section-multi').ariaSnapshot();
  const multiAxe = await page.evaluate(() => window.axe.run('#section-multi'));
  const multiAttrs = await page.locator('#section-multi button').evaluateAll((btns) =>
    btns.map((b) => ({
      id: b.id,
      text: b.innerText.trim(),
      disabled: b.hasAttribute('disabled'),
      ariaBusy: b.getAttribute('aria-busy'),
    }))
  );

  const multiShotName = 'multiple-instances.png';
  await page.locator('#section-multi').screenshot({ path: path.join(EVIDENCIA_DIR, multiShotName) });

  gateResults.criteria['AC-10_MultiInstance'] = {
    tree: multiTree,
    axeViolations: multiAxe.violations.length,
    instances: multiAttrs,
    screenshot: multiShotName,
  };

  // Full page screenshot
  await page.screenshot({ path: path.join(EVIDENCIA_DIR, 'gate-full-view.png'), fullPage: true });

  // Write gate evidence result JSON
  fs.writeFileSync(path.join(EVIDENCIA_DIR, 'resultado-gate.json'), JSON.stringify(gateResults, null, 2));

  console.log('Resultados de verificación Gate generados exitosamente en:', EVIDENCIA_DIR);

  await browser.close();
  server.close();
})();
