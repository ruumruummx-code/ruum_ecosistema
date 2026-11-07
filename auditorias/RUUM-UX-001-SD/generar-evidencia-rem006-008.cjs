const fs = require('fs');
const path = require('path');
const { resolve, start } = require('./servidor.cjs');
const { chromium } = require(resolve('playwright'));

const root = path.resolve(__dirname, '../..');
const dir006 = path.join(__dirname, 'evidencia-gate-rem006');
const dir008 = path.join(__dirname, 'evidencia-gate-rem008');

if (!fs.existsSync(dir006)) fs.mkdirSync(dir006, { recursive: true });
if (!fs.existsSync(dir008)) fs.mkdirSync(dir008, { recursive: true });

(async () => {
  const { server, url: baseUrl } = await start();
  console.log(`Servidor iniciado en ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Generando evidencia para SD-REM-006 (MobileHeader y Modal) ===');

  await page.goto(`${baseUrl}/showcase.html`);
  await page.waitForSelector('#sample');

  const viewports = [320, 390, 768, 1440];
  const ev006 = {
    viewports: [],
    modal: {},
    timestamp: new Date().toISOString()
  };

  for (const w of viewports) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.evaluate(({ theme }) => {
        document.documentElement.dataset.theme = theme;
        window.auditSelect('MobileHeader--default');
      }, { theme });

      await page.waitForTimeout(200);

      const snapPath = path.join(dir006, `MobileHeader-${theme}-${w}px.png`);
      await page.screenshot({ path: snapPath, fullPage: false });

      const metrics = await page.evaluate(() => {
        const header = document.querySelector('#sample header');
        const h1 = document.querySelector('#sample header h1');
        const p = document.querySelector('#sample header p');
        const backBtn = document.querySelector('#sample header button, #sample header a');
        const rectH = header ? header.getBoundingClientRect() : null;
        const rectH1 = h1 ? h1.getBoundingClientRect() : null;
        return {
          headerHeight: rectH ? rectH.height : 0,
          headerWidth: rectH ? rectH.width : 0,
          titleText: h1 ? h1.textContent : null,
          titleAttribute: h1 ? h1.getAttribute('title') : null,
          subtitleText: p ? p.textContent : null,
          subtitleAttribute: p ? p.getAttribute('title') : null,
          titleScrollWidth: h1 ? h1.scrollWidth : 0,
          titleClientWidth: h1 ? h1.clientWidth : 0,
          isTruncated: h1 ? h1.scrollWidth > h1.clientWidth : false,
          backBtnAriaLabel: backBtn ? backBtn.getAttribute('aria-label') : null,
        };
      });

      ev006.viewports.push({
        width: w,
        theme,
        snapshot: path.basename(snapPath),
        metrics
      });
    }
  }

  // Modal sticky close + focus trap en SD-REM-006
  await page.evaluate(() => {
    window.auditSelect('Modal--long-content');
  });
  await page.waitForTimeout(300);

  const abrirBtn = page.locator('button[data-open]').first();
  if (await abrirBtn.count() > 0) {
    await abrirBtn.click();
    await page.waitForTimeout(200);
  }

  const modalMetrics = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const closeBtn = document.querySelector('[aria-label="Cerrar diálogo"]');
    const rectD = dialog ? dialog.getBoundingClientRect() : null;
    const rectC = closeBtn ? closeBtn.getBoundingClientRect() : null;
    return {
      dialogExists: Boolean(dialog),
      dialogRole: dialog ? dialog.getAttribute('role') : null,
      ariaModal: dialog ? dialog.getAttribute('aria-modal') : null,
      closeBtnInViewport: rectC ? rectC.top >= 0 && rectC.bottom <= window.innerHeight : false,
      closeBtnCoords: rectC ? { top: rectC.top, left: rectC.left } : null,
    };
  });
  ev006.modal = modalMetrics;

  fs.writeFileSync(path.join(dir006, 'resultado-gate-rem006.json'), JSON.stringify(ev006, null, 2), 'utf-8');
  console.log('Evidencia SD-REM-006 guardada exitosamente.');

  console.log('=== Generando evidencia para SD-REM-008 (Chat) ===');

  // Navegar a la página de reproducción de dos instancias
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${baseUrl}/reproduccion-chat.html`);
  await page.waitForSelector('#contenedor-chat-1');

  const c1Input = page.locator('#contenedor-chat-1 input');
  const c1Button = page.locator('#contenedor-chat-1 button[type="submit"]');
  const c2Input = page.locator('#contenedor-chat-2 input');
  const c2Button = page.locator('#contenedor-chat-2 button[type="submit"]');

  // Obtener IDs de ambas instancias
  const c1InputId = await c1Input.getAttribute('id');
  const c2InputId = await c2Input.getAttribute('id');

  console.log(`Instancia 1 Input ID: ${c1InputId}`);
  console.log(`Instancia 2 Input ID: ${c2InputId}`);

  // Test 1: Rechazo de envío y conservación de borrador en Instancia 1
  const textoBorrador = 'Mensaje urgente con falla de red';
  await c1Input.fill(textoBorrador);
  await page.screenshot({ path: path.join(dir008, '01-chat1-borrador-antes-de-envio.png') });

  await c1Button.click();
  // Esperar a que la promesa falle y se actualice el estado
  await page.waitForSelector('#contenedor-chat-1 [role="alert"]', { timeout: 3000 });

  const valorDespuesDeFalla = await c1Input.inputValue();
  const alertTexto = await page.locator('#contenedor-chat-1 [role="alert"]').textContent();
  const activeElementIdTrasFalla = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);

  await page.screenshot({ path: path.join(dir008, '02-chat1-rechazo-borrador-preservado-alert.png') });

  const pruebaRechazo = {
    textoOriginal: textoBorrador,
    valorConservado: valorDespuesDeFalla,
    borradorPreservado: valorDespuesDeFalla === textoBorrador,
    alertaRenderizada: alertTexto,
    focoDevueltoAlInputLocal: activeElementIdTrasFalla === c1InputId,
  };

  // Test 2: Foco entre dos instancias (aislamiento de foco)
  const textoInstancia2 = 'Consulta a soporte técnico';
  await c2Input.fill(textoInstancia2);
  await c2Button.click();
  await page.waitForTimeout(300);

  const activeElementIdTrasEnvio2 = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);

  await page.screenshot({ path: path.join(dir008, '03-chat2-envio-exitoso-foco-aislado.png') });

  const pruebaAislamientoFoco = {
    c1InputId,
    c2InputId,
    focoDevueltoAInstancia2: activeElementIdTrasEnvio2 === c2InputId,
    focoNoRobadoPorInstancia1: activeElementIdTrasEnvio2 !== c1InputId,
  };

  // Test 3: Axe accessibility audit en showcase
  await page.goto(`${baseUrl}/showcase.html`);
  await page.evaluate(() => {
    window.auditSelect('Chat--default');
  });
  await page.waitForTimeout(300);

  const axeSource = fs.readFileSync(resolve('axe-core/axe.min.js'), 'utf-8');
  await page.evaluate(axeSource);

  const axeLight = await page.evaluate(async () => {
    document.documentElement.dataset.theme = 'light';
    return await axe.run('#sample', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }
    });
  });

  const axeDark = await page.evaluate(async () => {
    document.documentElement.dataset.theme = 'dark';
    return await axe.run('#sample', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }
    });
  });

  await page.screenshot({ path: path.join(dir008, '04-chat-showcase-light.png') });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.screenshot({ path: path.join(dir008, '05-chat-showcase-dark.png') });

  const ev008 = {
    timestamp: new Date().toISOString(),
    pruebaRechazo,
    pruebaAislamientoFoco,
    axe: {
      lightViolations: axeLight.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })),
      darkViolations: axeDark.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })),
    },
    snapshots: [
      '01-chat1-borrador-antes-de-envio.png',
      '02-chat1-rechazo-borrador-preservado-alert.png',
      '03-chat2-envio-exitoso-foco-aislado.png',
      '04-chat-showcase-light.png',
      '05-chat-showcase-dark.png'
    ]
  };

  fs.writeFileSync(path.join(dir008, 'resultado-gate-rem008.json'), JSON.stringify(ev008, null, 2), 'utf-8');
  console.log('Evidencia SD-REM-008 guardada exitosamente.');

  await browser.close();
  server.close();
  console.log('=== Generación completada con éxito ===');
})();
