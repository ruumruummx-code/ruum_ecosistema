#!/usr/bin/env node

/**
 * Runner unificado de pruebas de accesibilidad (a11y).
 * Consolida audit-a11y.mjs, run-a11y-playwright.mjs y test-route-a11y.mjs
 * en una única herramienta con subcomandos:
 *
 *   pnpm a11y audit [--route /ruta]            Ejecuta auditoría completa (ESLint + Axe + Playwright + Lighthouse opcional)
 *   pnpm a11y axe <ruta>                       Ejecuta Axe Core en una ruta específica (gate CI: falla si hay critical/serious)
 *   pnpm a11y route <ruta>                     Prueba de accesibilidad en una sola ruta (modo interactivo)
 *   pnpm a11y playwright [args...]             Ejecuta Playwright a11y con soporte de servidor dev
 *
 * Reemplaza: audit-a11y.mjs, run-a11y-playwright.mjs, test-route-a11y.mjs
 */

import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const DEFAULT_ORIGIN = process.env.A11Y_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

const DEFAULT_ROUTES = [
  '/', '/onboarding', '/login', '/nueva-password', '/recuperar-password',
  '/registro', '/panel', '/ganancias', '/configuracion', '/cuenta',
  '/cuenta/perfil', '/cuenta/datos-bancarios', '/cuenta/documentos',
  '/cuenta/legal', '/cuenta/seguridad', '/cuenta/soporte', '/cuenta/preferencias',
  '/legal/privacidad', '/legal/terminos'
];

function log(message, type = 'info') {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m' };
  const reset = '\x1b[0m';
  const color = colors[type] || colors.info;
  console.log(`${color}[A11Y]${reset} ${message}`);
}

// ── Utilidades de servidor ──────────────────────────────────────────

async function isServerReady(origin) {
  try {
    const response = await fetch(origin, { redirect: 'manual' });
    return response.status < 500;
  } catch { return false; }
}

async function waitForServer(origin, timeoutMs = 45_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReady(origin)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function commandForLocalBin(name) {
  return process.platform === 'win32'
    ? resolve(projectRoot, 'node_modules', '.bin', `${name}.cmd`)
    : resolve(projectRoot, 'node_modules', '.bin', name);
}

// ── Subcomando: audit ───────────────────────────────────────────────

async function runAxeAudit(origin, routes) {
  log(`Iniciando auditoría Axe Core en ${routes.length} ruta(s)...`, 'info');
  const resultsDir = resolve(projectRoot, 'results');
  if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true });

  const axeResults = [];
  const browser = await chromium.launch();

  try {
    for (const route of routes) {
      log(`Auditando: ${route}`);
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await page.goto(`${origin}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
        const report = await new AxeBuilder({ page }).analyze();
        axeResults.push({ route, violations: report.violations || [], passes: report.passes || [] });
        const slug = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-+/, '');
        writeFileSync(resolve(resultsDir, `axe-${slug}.json`), JSON.stringify(report, null, 2));
        if (report.violations.length > 0) {
          log(`⚠️  ${report.violations.length} violación(es) en ${route}`, 'warning');
        } else {
          log(`✅ Sin violaciones en ${route}`, 'success');
        }
      } catch (error) {
        log(`❌ Error en ${route}: ${error.message}`, 'error');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const hasViolations = axeResults.some(r => r.violations.length > 0);
  writeFileSync(resolve(resultsDir, 'axe-consolidated-report.json'), JSON.stringify(axeResults, null, 2));
  return { ok: !hasViolations, results: axeResults };
}

async function runESLintA11y() {
  log('Ejecutando ESLint con reglas de accesibilidad...', 'info');
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('pnpm lint:a11y', { shell: true, cwd: projectRoot, stdio: 'inherit' });
      child.on('close', (code) => (code === 0 ? resolve(true) : reject(new Error(`exit ${code}`))));
    });
    log('✅ ESLint a11y completado', 'success');
    return true;
  } catch (e) {
    log(`❌ ESLint a11y falló: ${e.message}`, 'error');
    return false;
  }
}

async function runPlaywrightA11y(args = []) {
  log('Ejecutando Playwright a11y...', 'info');
  try {
    await new Promise((resolve, reject) => {
      const result = spawnSync(commandForLocalBin('playwright'), ['test', 'tests/a11y', ...args], {
        cwd: projectRoot, env: process.env, shell: process.platform === 'win32', stdio: 'inherit'
      });
      result.error ? reject(result.error) : (result.status === 0 ? resolve(true) : reject(new Error(`exit ${result.status}`)));
    });
    log('✅ Playwright a11y completado', 'success');
    return true;
  } catch (e) {
    log(`❌ Playwright a11y falló: ${e.message}`, 'error');
    return false;
  }
}

async function cmdAudit(options) {
  const origin = options.origin ?? DEFAULT_ORIGIN;
  const routes = options.route ? [options.route] : DEFAULT_ROUTES;
  log(`Rutas a auditar: ${routes.join(', ')}`);

  const eslintOk = options.skipEslint ? true : await runESLintA11y();
  const axeResult = await runAxeAudit(origin, routes);
  const pwOk = options.skipPlaywright ? true : await runPlaywrightA11y();

  const ok = eslintOk && axeResult.ok && pwOk;
  if (ok) log('🎉 Auditoría a11y completada con éxito', 'success');
  else log('⚠️  Algunos controles no pasaron', 'error');
  process.exit(ok ? 0 : 1);
}

// ── Subcomando: axe (gate CI) ───────────────────────────────────────

async function cmdAxe(origin) {
  log(`Axe gate en ${origin}`);
  const context = await (await chromium.launch()).newContext({ bypassCSP: true });
  const page = await context.newPage();
  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.locator('#contenido-principal').waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 20_000 });

    const report = await new AxeBuilder({ page }).analyze();
    const outputPath = resolve(process.cwd(), 'results/axe-report.json');
    if (!existsSync(resolve(process.cwd(), 'results'))) mkdirSync(resolve(process.cwd(), 'results'), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Axe audit completed for ${page.url()}`);
    console.log(`Report saved to ${outputPath}`);
    console.log(`Violations: ${report.violations.length}`);

    const criticalViolations = report.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error(`❌ Axe gate: ${criticalViolations.length} violación(es) crítica(s)/seria(s) detectada(s):`);
      for (const v of criticalViolations) {
        console.error(`  - ${v.id}: ${v.description} (${v.impact})`);
      }
      process.exit(1);
    }
    if (report.violations.length > 0) {
      console.warn(`⚠️  Axe gate: ${report.violations.length} violación(es) menor(es) detectada(s) (no bloqueante).`);
    }
    process.exit(0);
  } finally {
    await context.close();
    await (await chromium.launch()).close();
  }
}

// ── Subcomando: route (interactivo) ─────────────────────────────────

async function cmdRoute(route) {
  if (!route.startsWith('/')) {
    console.error('❌ La ruta debe empezar con /');
    process.exit(1);
  }

  const origin = DEFAULT_ORIGIN;
  log(`Probando accesibilidad en ${origin}${route}`);

  if (!(await isServerReady(origin))) {
    log(`⚠️  Servidor no disponible en ${origin}. Asegúrate de ejecutar pnpm dev primero.`, 'warning');
    process.exit(1);
  }

  const { ok } = await runAxeAudit(origin, [route]);
  process.exit(ok ? 0 : 1);
}

// ── Subcomando: playwright ──────────────────────────────────────────

async function cmdPlaywright(args) {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const serverAlreadyRunning = await isServerReady(DEFAULT_ORIGIN);

  if (!isCI && !serverAlreadyRunning) {
    log('Iniciando servidor de desarrollo para Playwright...', 'info');
    const serverUrl = new URL(DEFAULT_ORIGIN);
    const serverPort = serverUrl.port || '3001';
    const resultsDir = resolve(projectRoot, 'results');
    if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true });
    const serverLogPath = resolve(resultsDir, 'a11y-dev-server.log');
    const serverLog = openSync(serverLogPath, 'w');
    const nextBin = require.resolve('next/dist/bin/next', { paths: [projectRoot] });

    const serverProcess = spawn(process.execPath, [nextBin, 'start', '-p', serverPort], {
      cwd: projectRoot, detached: true, stdio: ['ignore', serverLog, serverLog]
    });

    if (!(await waitForServer(DEFAULT_ORIGIN, 90_000))) {
      const { stopProcessTree, closeSync } = await import('./a11y-runner-helpers.mjs');
      stopProcessTree(serverProcess.pid);
      closeSync(serverLog);
      console.error(`No se pudo iniciar ${DEFAULT_ORIGIN}`);
      process.exit(1);
    }

    const result = spawnSync(commandForLocalBin('playwright'), ['test', 'tests/a11y', ...args], {
      cwd: projectRoot,
      env: { ...process.env, A11Y_BASE_URL: DEFAULT_ORIGIN, PLAYWRIGHT_BASE_URL: DEFAULT_ORIGIN, PLAYWRIGHT_SKIP_WEBSERVER: '1' },
      shell: process.platform === 'win32', stdio: 'inherit'
    });
    process.exit(result.status ?? 1);
  } else {
    const result = spawnSync(commandForLocalBin('playwright'), ['test', 'tests/a11y', ...args], {
      cwd: projectRoot, env: process.env, shell: process.platform === 'win32', stdio: 'inherit'
    });
    process.exit(result.status ?? 1);
  }
}

// ── Entrada ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
Uso: node scripts/a11y-runner.mjs <comando> [opciones]

Comandos:
  audit [--route /ruta] [--skip-eslint] [--skip-playwright]  Auditoría completa (ESLint + Axe + Playwright)
  axe <url>                                                   Gate CI con Axe Core (falla si hay critical/serious)
  route <ruta>                                                Prueba interactiva en una ruta específica
  playwright [args...]                                        Ejecuta Playwright a11y

Ejemplos:
  node scripts/a11y-runner.mjs audit
  node scripts/a11y-runner.mjs audit --route /login
  node scripts/a11y-runner.mjs axe http://localhost:3001
  node scripts/a11y-runner.mjs route /panel
  node scripts/a11y-runner.mjs playwright --project=chromium
`);
    process.exit(0);
  }

  switch (cmd) {
    case 'audit': {
      const route = args.find((a, i) => args[i - 1] === '--route');
      const skipEslint = args.includes('--skip-eslint');
      const skipPlaywright = args.includes('--skip-playwright');
      await cmdAudit({ route, skipEslint, skipPlaywright });
      break;
    }
    case 'axe': {
      await cmdAxe(args[1] ?? DEFAULT_ORIGIN);
      break;
    }
    case 'route': {
      await cmdRoute(args[1]);
      break;
    }
    case 'playwright': {
      await cmdPlaywright(args.slice(1));
      break;
    }
    default:
      console.error(`❌ Comando desconocido: ${cmd}`);
      process.exit(1);
  }
}

main().catch((error) => {
  log(`❌ Error inesperado: ${error.message}`, 'error');
  process.exit(1);
});
