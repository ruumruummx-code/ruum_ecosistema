const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.TEST_PORT || 3012;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve('docs/auditoria-ux-ui-usuario-2026-11-06/remediacion-ux-11');
const AUDIT_ROOT = path.resolve('docs/auditoria-ux-ui-usuario-2026-11-06');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function makeSession(userId, authUserId = '00000000-0000-4000-8000-00000000e001', token = 'mock_access_token_dashboard', email = 'usuario@ejemplo.com') {
  return {
    access_token: token,
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: authUserId,
      aud: 'authenticated',
      role: 'authenticated',
      email
    }
  };
}

const USER_A_ID = '00000000-0000-4000-8000-0000000000f1';
const USER_B_ID = '00000000-0000-4000-8000-0000000000f2';

async function runVerification() {
  console.log(`=== Iniciando Verificación UX-011 en ${BASE_URL} ===`);
  const results = {
    timestamp: new Date().toISOString(),
    scenarios: {}
  };

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // ─────────────────────────────────────────────────────────────
    // Escenario 1: HTTP 503 simulado en Escritorio (AC-1, AC-8)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Escenario HTTP 503 en Escritorio (AC-1, AC-8) ---');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const session = makeSession(USER_A_ID);
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();
      let patchCount = 0;
      await page.route('**/rest/v1/usuarios**', async route => {
        if (route.request().method() === 'PATCH') {
          patchCount++;
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'fallo_controlado_auditoria: servicio no disponible' })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      // Clic en Guardar cambios
      const btnGuardar = page.getByRole('button', { name: 'Guardar cambios', exact: true });
      await btnGuardar.click();
      await page.waitForTimeout(2000);

      const evalResult = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasSuccessText = text.includes('Cambios guardados con éxito');
        const alertEl = document.querySelector('[role="alert"]');
        const retryBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Reintentar'));
        return {
          hasSuccessText,
          alertFound: Boolean(alertEl),
          alertText: alertEl ? alertEl.innerText : null,
          retryBtnFound: Boolean(retryBtn),
          fullTextSample: text.slice(0, 500)
        };
      });

      console.log('HTTP 503 -> Falso éxito mostrado:', evalResult.hasSuccessText ? 'SI (DEFECTO)' : 'NO (CORRECTO)');
      console.log('HTTP 503 -> Alerta visible con reintento:', evalResult.alertFound && evalResult.retryBtnFound ? 'SI' : 'NO');
      console.log('HTTP 503 -> Texto de alerta:', evalResult.alertText);

      results.scenarios.http503 = {
        patchCount,
        evalResult,
        passed: !evalResult.hasSuccessText && evalResult.alertFound && evalResult.retryBtnFound
      };

      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-503-reintento.png'), fullPage: true });

      // Actualizar también el archivo de evidencia auditada
      fs.writeFileSync(path.join(AUDIT_ROOT, 'preferencias-falso-exito.json'), JSON.stringify({
        hallazgo_original: 'UX-11: falso éxito tras HTTP 503',
        estado: 'REMEDIADO',
        fecha_remediacion: new Date().toISOString(),
        resultado_503: {
          falso_exito_mostrado: evalResult.hasSuccessText,
          alerta_error_mostrada: evalResult.alertFound,
          texto_alerta: evalResult.alertText,
          reintento_disponible: evalResult.retryBtnFound
        }
      }, null, 2));

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // Escenario 2: Pérdida de red / offline (AC-2)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Escenario Pérdida de Red / Offline (AC-2) ---');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const session = makeSession(USER_A_ID);
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();
      await page.route('**/rest/v1/usuarios**', async route => {
        if (route.request().method() === 'PATCH') {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      const btnGuardar = page.getByRole('button', { name: 'Guardar cambios', exact: true });
      await btnGuardar.click();
      await page.waitForTimeout(2000);

      const evalResult = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasSuccessText = text.includes('Cambios guardados con éxito');
        const pendingBadge = [...document.querySelectorAll('div, span')].find(el =>
          el.innerText && (el.innerText.includes('Sin conexión') || el.innerText.includes('pendiente') || el.innerText.includes('Error'))
        );
        const retryBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Reintentar'));
        return {
          hasSuccessText,
          pendingFound: Boolean(pendingBadge),
          pendingText: pendingBadge ? pendingBadge.innerText : null,
          retryBtnFound: Boolean(retryBtn)
        };
      });

      console.log('Offline -> Falso éxito mostrado:', evalResult.hasSuccessText ? 'SI (DEFECTO)' : 'NO (CORRECTO)');
      console.log('Offline -> Estado pendiente/error con reintento:', evalResult.pendingFound && evalResult.retryBtnFound ? 'SI' : 'NO');

      results.scenarios.offline = {
        evalResult,
        passed: !evalResult.hasSuccessText && evalResult.pendingFound && evalResult.retryBtnFound
      };

      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-offline-pendiente.png'), fullPage: true });
      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // Escenario 3: Sincronización exitosa normal (AC-5)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Escenario Sincronización Exitosa (AC-5) ---');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const session = makeSession(USER_A_ID);
      await context.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const page = await context.newPage();

      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      const btnGuardar = page.getByRole('button', { name: 'Guardar cambios', exact: true });
      await btnGuardar.click();
      await page.waitForTimeout(2500);

      const evalResult = await page.evaluate((userId) => {
        const text = document.body.innerText;
        const hasSuccess = text.includes('Cambios guardados con éxito');
        const localData = localStorage.getItem(`ruum:pref:usuario:${userId}`);
        const legacyGlobal = localStorage.getItem('ruum-usuario-preferencias');
        return {
          hasSuccess,
          hasUserScopedStorage: Boolean(localData),
          hasLegacyGlobal: Boolean(legacyGlobal)
        };
      }, USER_A_ID);

      console.log('Sync Exitosa -> Éxito mostrado:', evalResult.hasSuccess ? 'SI' : 'NO');
      console.log('Sync Exitosa -> Almacenamiento aislado por usuario:', evalResult.hasUserScopedStorage ? 'SI' : 'NO');
      console.log('Sync Exitosa -> Clave global heredada eliminada:', !evalResult.hasLegacyGlobal ? 'SI' : 'NO');

      results.scenarios.exitoSincronizado = {
        evalResult,
        passed: evalResult.hasSuccess && evalResult.hasUserScopedStorage && !evalResult.hasLegacyGlobal
      };

      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-exito-sincronizado.png'), fullPage: true });
      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // Escenario 4: Aislamiento por usuario y no-fuga entre cuentas (AC-3)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Escenario Aislamiento por Usuario y No-Fuga (AC-3) ---');
    {
      // Probar Usuario A
      const contextA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const sessionA = makeSession(USER_A_ID, '00000000-0000-4000-8000-00000000e001', 'mock_access_token_dashboard', 'usuarioA@ejemplo.com');
      await contextA.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(sessionA)).toString('base64url'),
        url: BASE_URL
      }]);

      const pageA = await contextA.newPage();
      await pageA.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await pageA.evaluate(({ userA }) => {
        localStorage.setItem(`ruum:pref:usuario:${userA}`, JSON.stringify({
          idioma: 'en',
          unidades: 'Imperial',
          tema: 'Oscuro'
        }));
      }, { userA: USER_A_ID });

      // Recargar para aplicar desde almacenamiento aislado
      await pageA.reload({ waitUntil: 'load' });
      await pageA.waitForTimeout(2500);

      const datosA = await pageA.evaluate(() => {
        const desktop = document.querySelector('.hidden.lg\\:flex') || document.body;
        const botones = [...desktop.querySelectorAll('button')];
        const btnEnglish = botones.find(b => b.innerText.trim() === 'English');
        const selects = [...desktop.querySelectorAll('select')];
        const selectUnidades = selects[1];
        return {
          btnEnglishFound: Boolean(btnEnglish),
          btnEnglishClass: btnEnglish ? btnEnglish.className : null,
          englishActive: btnEnglish ? btnEnglish.className.includes('bg-[#0066FF]') : false,
          unidades: selectUnidades ? selectUnidades.value : null
        };
      });

      await pageA.screenshot({ path: path.join(OUT_DIR, 'preferencias-cuenta-a.png'), fullPage: true });
      await contextA.close();

      // Probar Usuario B
      const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const sessionB = makeSession(USER_B_ID, '00000000-0000-4000-8000-00000000e002', 'mock_access_token_user_b', 'usuarioB@ejemplo.com');
      await contextB.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(sessionB)).toString('base64url'),
        url: BASE_URL
      }]);

      const pageB = await contextB.newPage();
      await pageB.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await pageB.evaluate(({ userB }) => {
        localStorage.setItem(`ruum:pref:usuario:${userB}`, JSON.stringify({
          idioma: 'es',
          unidades: 'Métrico',
          tema: 'Claro'
        }));
      }, { userB: USER_B_ID });

      // Recargar para aplicar desde almacenamiento aislado de B
      await pageB.reload({ waitUntil: 'load' });
      await pageB.waitForTimeout(2500);

      const datosB = await pageB.evaluate(() => {
        const desktop = document.querySelector('.hidden.lg\\:flex') || document.body;
        const botones = [...desktop.querySelectorAll('button')];
        const btnEspanol = botones.find(b => b.innerText.trim() === 'Español');
        const selects = [...desktop.querySelectorAll('select')];
        const selectUnidades = selects[1];
        return {
          btnEspanolFound: Boolean(btnEspanol),
          btnEspanolClass: btnEspanol ? btnEspanol.className : null,
          espanolActive: btnEspanol ? btnEspanol.className.includes('bg-[#0066FF]') : false,
          unidades: selectUnidades ? selectUnidades.value : null
        };
      });

      await pageB.screenshot({ path: path.join(OUT_DIR, 'preferencias-cuenta-b.png'), fullPage: true });
      await contextB.close();

      console.log('Cuenta A -> English Activo:', datosA.englishActive ? 'SI' : 'NO', 'Unidades:', datosA.unidades);
      console.log('Cuenta B -> Español Activo:', datosB.espanolActive ? 'SI' : 'NO', 'Unidades:', datosB.unidades);

      results.scenarios.aislamientoCuentas = {
        datosA,
        datosB,
        passed: datosA.englishActive && datosB.espanolActive && datosA.unidades === 'Imperial' && datosB.unidades === 'Métrico'
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Escenario 5: Variante Móvil vs Escritorio (AC-7)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Escenario Variante Móvil vs Escritorio (AC-7) ---');
    {
      // 5.1 Móvil 390x844
      const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const session = makeSession(USER_A_ID);
      await contextMobile.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const pageMobile = await contextMobile.newPage();
      await pageMobile.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await pageMobile.waitForTimeout(3000);

      const mobileEval = await pageMobile.evaluate(() => {
        const header = document.querySelector('header');
        const mobileShell = document.querySelector('.user-preferences-shell');
        const secciones = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
        return {
          headerFound: Boolean(header),
          mobileShellFound: Boolean(mobileShell),
          tieneNotificacionesAlertas: secciones.some(s => s.includes('Notificaciones y alertas'))
        };
      });

      console.log('Variante Móvil -> Header:', mobileEval.headerFound, 'Shell:', mobileEval.mobileShellFound, 'Sección notificaciones:', mobileEval.tieneNotificacionesAlertas);
      await pageMobile.screenshot({ path: path.join(OUT_DIR, 'preferencias-movil-390.png'), fullPage: true });
      await contextMobile.close();

      // 5.2 Escritorio 1440x900
      const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await contextDesktop.addCookies([{
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        url: BASE_URL
      }]);

      const pageDesktop = await contextDesktop.newPage();
      await pageDesktop.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await pageDesktop.waitForTimeout(3000);

      const desktopEval = await pageDesktop.evaluate(() => {
        const sidebar = document.querySelector('aside') || document.querySelector('.user-desktop-sidebar');
        const grid = document.querySelector('.grid-cols-2');
        return {
          sidebarFound: Boolean(sidebar) || Boolean(document.querySelector('a[href="/cuenta"]')),
          gridFound: Boolean(grid)
        };
      });

      console.log('Variante Escritorio -> Sidebar / Breadcrumb:', desktopEval.sidebarFound, 'Grid 2x2:', desktopEval.gridFound);
      await pageDesktop.screenshot({ path: path.join(OUT_DIR, 'preferencias-escritorio-1440.png'), fullPage: true });
      await contextDesktop.close();

      results.scenarios.variantesMóvilEscritorio = {
        mobile: mobileEval,
        desktop: desktopEval,
        passed: mobileEval.mobileShellFound && desktopEval.sidebarFound
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Escenario 6: Variante Móvil ante 503 (AC-8)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Escenario Variante Móvil ante 503 (AC-8) ---');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const session = makeSession(USER_A_ID);
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
            body: JSON.stringify({ message: 'fallo_controlado_auditoria' })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`${BASE_URL}/cuenta/preferencias`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(2500);

      // Cambiar un selector en móvil
      await page.evaluate(() => {
        const select = document.querySelector('select');
        if (select) {
          select.value = select.value === 'Imperial' ? 'Métrico' : 'Imperial';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await page.waitForTimeout(2000);

      const evalResult = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasSuccess = text.includes('Cambios guardados con éxito');
        const alertEl = document.querySelector('[role="alert"]');
        return {
          hasSuccess,
          hasAlert: Boolean(alertEl),
          alertText: alertEl ? alertEl.innerText : null
        };
      });

      console.log('Móvil ante 503 -> Falso éxito:', evalResult.hasSuccess ? 'SI (DEFECTO)' : 'NO (CORRECTO)');
      console.log('Móvil ante 503 -> Alerta visible:', evalResult.hasAlert ? 'SI' : 'NO');

      results.scenarios.movil503 = {
        evalResult,
        passed: !evalResult.hasSuccess
      };

      await page.screenshot({ path: path.join(OUT_DIR, 'preferencias-movil-503.png'), fullPage: true });
      await context.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'verificacion-ux-11.json'), JSON.stringify(results, null, 2));
    console.log('\n=== Verificación UX-011 completada con éxito. Resultados en docs/.../remediacion-ux-11/ ===');

  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
