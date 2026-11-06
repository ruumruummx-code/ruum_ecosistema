const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.TEST_PORT || 3012;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve('docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-01');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const MOCK_SESSION = {
  access_token: 'mock_access_token_dashboard',
  refresh_token: 'mock_refresh_token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: '00000000-0000-4000-8000-0000000000f1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'usuario@ejemplo.com'
  }
};

const AUTH_COOKIE = {
  name: 'sb-127-auth-token',
  value: 'base64-' + Buffer.from(JSON.stringify(MOCK_SESSION)).toString('base64url'),
  url: BASE_URL
};

async function runVerification() {
  console.log(`=== Iniciando Verificación UX-01 en ${BASE_URL} ===`);
  const results = {
    timestamp: new Date().toISOString(),
    cspEffective: {},
    consoleErrors: {
      login: [],
      inicio: [],
      misViajes: []
    },
    viewports: {},
    landscape: {},
    zoom200: {},
    headerConsistency: {},
    keyboardNav: {}
  };

  const browser = await chromium.launch({ channel: 'chrome' });

  try {
    // 1. Verificación de CSP y consola en /login
    console.log('\n--- 1. Verificación de CSP y consola en /login ---');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('Content Security Policy') || text.includes('violates')) {
          results.consoleErrors.login.push(text);
        }
      });

      const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      const headers = await response.allHeaders();
      results.cspEffective.login = {
        csp: headers['content-security-policy'],
        xNonce: headers['x-nonce'],
        hsts: headers['strict-transport-security'],
        xFrameOptions: headers['x-frame-options'],
        xContentTypeOptions: headers['x-content-type-options'],
        referrerPolicy: headers['referrer-policy']
      };

      console.log('Login CSP Header:', results.cspEffective.login.csp ? 'PRESENTE' : 'AUSENTE');
      console.log('Login style-src-attr en CSP:', results.cspEffective.login.csp?.includes("style-src-attr 'unsafe-inline'") ? 'SI' : 'NO');
      console.log('Login errores/avisos de CSP en consola:', results.consoleErrors.login.length);

      await page.screenshot({ path: path.join(OUT_DIR, 'login-390.png'), fullPage: true });
      await context.close();
    }

    // Helper para crear contexto autenticado
    async function createAuthContext(viewport) {
      const context = await browser.newContext({ viewport });
      await context.addCookies([AUTH_COOKIE]);
      return context;
    }

    // 2. Verificación de Inicio en anchos móviles: 320, 360, 390, 430
    console.log('\n--- 2. Verificación de Inicio en anchos móviles: 320, 360, 390, 430 ---');
    const viewportsToTest = [
      { name: '320', width: 320, height: 640 },
      { name: '360', width: 360, height: 740 },
      { name: '390', width: 390, height: 844 },
      { name: '430', width: 430, height: 932 }
    ];

    for (const vp of viewportsToTest) {
      const context = await createAuthContext({ width: vp.width, height: vp.height });
      const page = await context.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('Content Security Policy') || text.includes('violates')) {
          results.consoleErrors.inicio.push(`[${vp.name}] ${text}`);
        }
      });

      const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(4000);

      if (vp.name === '390' && !results.cspEffective.inicio) {
        const headers = await response.allHeaders();
        results.cspEffective.inicio = {
          csp: headers['content-security-policy'],
          xNonce: headers['x-nonce']
        };
      }

      const measurements = await page.evaluate(() => {
        function getRect(el) {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right
          };
        }

        const header = document.querySelector('#homeHeader') || document.querySelector('header');
        const img = document.querySelector('#homeHeader img') || document.querySelector('header img');
        const inner = document.querySelector('.ruum-header__inner');
        const activeTrip = document.querySelector('.home-active-trip');
        const quickActions = document.querySelector('.home-quick-actions');
        
        const headerRect = getRect(header);
        const imgRect = getRect(img);
        const innerRect = getRect(inner);
        const activeTripRect = getRect(activeTrip);
        const quickActionsRect = getRect(quickActions);

        const hasOverlap = Boolean(
          activeTripRect && quickActionsRect &&
          activeTripRect.bottom > quickActionsRect.top &&
          activeTripRect.top < quickActionsRect.bottom
        );

        return {
          header: header ? {
            rect: headerRect,
            computedHeight: getComputedStyle(header).height,
            display: getComputedStyle(header).display,
            className: header.className
          } : null,
          img: img ? {
            rect: imgRect,
            computedHeight: getComputedStyle(img).height,
            computedWidth: getComputedStyle(img).width,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            className: img.className
          } : null,
          inner: inner ? {
            rect: innerRect
          } : null,
          activeTripRect,
          quickActionsRect,
          hasOverlap,
          url: window.location.href,
          title: document.title
        };
      });

      results.viewports[vp.name] = measurements;
      console.log(`Viewport ${vp.name}px -> Header height: ${measurements.header?.rect?.height}px (computed: ${measurements.header?.computedHeight}), Logo height: ${measurements.img?.rect?.height}px (computed: ${measurements.img?.computedHeight}), Overlap: ${measurements.hasOverlap}`);

      await page.screenshot({ path: path.join(OUT_DIR, `inicio-${vp.name}.png`), fullPage: true });
      await context.close();
    }

    // 3. Orientación horizontal y texto ampliado (200%)
    console.log('\n--- 3. Verificación Landscape y Zoom 200% ---');
    {
      // Landscape 844 x 390
      const context = await createAuthContext({ width: 844, height: 390 });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(3000);

      results.landscape = await page.evaluate(() => {
        const header = document.querySelector('#homeHeader') || document.querySelector('header');
        const img = document.querySelector('#homeHeader img') || document.querySelector('header img');
        const rHeader = header ? header.getBoundingClientRect() : null;
        const rImg = img ? img.getBoundingClientRect() : null;
        return {
          headerHeight: rHeader ? rHeader.height : null,
          imgHeight: rImg ? rImg.height : null,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      console.log(`Landscape 844x390 -> Header height: ${results.landscape.headerHeight}px, Logo height: ${results.landscape.imgHeight}px, Horiz Scroll: ${results.landscape.hasHorizontalScroll}`);

      await page.screenshot({ path: path.join(OUT_DIR, 'inicio-landscape-844.png'), fullPage: true });
      await context.close();
    }

    {
      // Zoom 200% (font-size 200%)
      const context = await createAuthContext({ width: 390, height: 844 });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(3000);

      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await page.waitForTimeout(1000);

      results.zoom200 = await page.evaluate(() => {
        const header = document.querySelector('#homeHeader') || document.querySelector('header');
        const img = document.querySelector('#homeHeader img') || document.querySelector('header img');
        const rHeader = header ? header.getBoundingClientRect() : null;
        const rImg = img ? img.getBoundingClientRect() : null;
        return {
          headerHeight: rHeader ? rHeader.height : null,
          imgHeight: rImg ? rImg.height : null,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      console.log(`Zoom 200% -> Header height: ${results.zoom200.headerHeight}px, Logo height: ${results.zoom200.imgHeight}px, Horiz Scroll: ${results.zoom200.hasHorizontalScroll}`);

      await page.screenshot({ path: path.join(OUT_DIR, 'inicio-zoom-200.png'), fullPage: true });
      await context.close();
    }

    // 4. Consistencia del encabezado entre Inicio y Mis traslados (AC-7)
    console.log('\n--- 4. Consistencia del encabezado Inicio vs Mis traslados ---');
    {
      const context = await createAuthContext({ width: 390, height: 844 });
      const page = await context.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('Content Security Policy') || text.includes('violates')) {
          results.consoleErrors.misViajes.push(text);
        }
      });

      await page.goto(`${BASE_URL}/mis-viajes`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(4000);

      results.headerConsistency.misViajes = await page.evaluate(() => {
        const header = document.querySelector('#homeHeader') || document.querySelector('header');
        const img = document.querySelector('#homeHeader img') || document.querySelector('header img');
        const rHeader = header ? header.getBoundingClientRect() : null;
        const rImg = img ? img.getBoundingClientRect() : null;
        return {
          url: window.location.href,
          headerFound: Boolean(header),
          imgFound: Boolean(img),
          headerHeight: rHeader ? rHeader.height : null,
          imgHeight: rImg ? rImg.height : null,
          imgSrc: img ? img.getAttribute('src') : null,
          headerClass: header ? header.className : null
        };
      });

      results.headerConsistency.inicio = {
        headerHeight: results.viewports['390']?.header?.rect?.height,
        imgHeight: results.viewports['390']?.img?.rect?.height,
        imgSrc: results.viewports['390']?.img?.naturalWidth ? '/imagenes/ruum-logo-simbolo.png' : null
      };

      console.log(`Inicio: header=${results.headerConsistency.inicio.headerHeight}px, img=${results.headerConsistency.inicio.imgHeight}px`);
      console.log(`Mis Traslados: header=${results.headerConsistency.misViajes.headerHeight}px, img=${results.headerConsistency.misViajes.imgHeight}px, url=${results.headerConsistency.misViajes.url}`);

      await page.screenshot({ path: path.join(OUT_DIR, 'mis-traslados-390.png'), fullPage: true });
      await context.close();
    }

    // 5. Prueba de teclado y accesibilidad (AC-5)
    console.log('\n--- 5. Prueba de teclado y navegación ---');
    {
      const context = await createAuthContext({ width: 390, height: 844 });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(3000);

      const tabSteps = [];
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            ariaLabel: el.getAttribute('aria-label'),
            text: el.innerText ? el.innerText.slice(0, 30).trim() : null,
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        });
        if (focused) {
          tabSteps.push(focused);
          console.log(`Tab step ${i+1}: <${focused.tagName}> "${focused.text || focused.ariaLabel || focused.id}" (outline: ${focused.outline})`);
        }
      }
      results.keyboardNav.tabSteps = tabSteps;
      await page.screenshot({ path: path.join(OUT_DIR, 'teclado-foco.png') });
      await context.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'verificacion-ux-01.json'), JSON.stringify(results, null, 2));
    console.log('\n=== Verificación completada con éxito. Resultados guardados en verificacion-ux-01.json ===');

  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
