import { expect, test } from '@playwright/test';
import { seedMockAuthSession } from './fixtures/sesion';
import { esperarHidratacion } from './fixtures/navegacion';

const id = '10000000-0000-4000-8000-000000000001';
const road = [[-99.531, 19.266], [-99.528, 19.265], [-99.525, 19.268], [-99.524, 19.274], [-99.517, 19.279], [-99.510, 19.286]];

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
test.beforeEach(async ({ page }) => {
  await page.route('https://api.mapbox.com/**', async route => {
    const url = route.request().url();
    if (url.includes('/directions/')) return route.fulfill({ json: { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: road }, duration: 720, distance: 8400 }] } });
    if (url.includes('/styles/')) return route.fulfill({ json: {
      version: 8, sources: { streets: { type: 'geojson', data: { type: 'FeatureCollection', features: Array.from({ length: 16 }, (_, i) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-99.55, 19.25 + i * .003], [-99.49, 19.28 + i * .003]] } })) } } },
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8eef5' } }, { id: 'roads', type: 'line', source: 'streets', paint: { 'line-color': '#ffffff', 'line-width': 2 } }],
    } });
    return route.fulfill({ json: {} });
  });
  await page.routeWebSocket(/realtime\/v1/, ws => {
    ws.onMessage(message => {
      const frame = JSON.parse(String(message));
      if (frame.event === 'phx_join' || frame.event === 'heartbeat' || frame.event === 'phx_leave') {
        ws.send(JSON.stringify({ topic: frame.topic, event: 'phx_reply', ref: frame.ref, join_ref: frame.join_ref, payload: { status: 'ok', response: { postgres_changes: (frame.payload?.config?.postgres_changes ?? []).map((change: object, index: number) => ({ ...change, id: index + 1 })) } } }));
      }
    });
  });
});

test('Inicio desktop: datos, GPS, no scroll, contactos y navegación operativa', async ({ page }) => {
  test.setTimeout(360_000);
  page.setDefaultNavigationTimeout(120_000);
  await seedMockAuthSession(page, { token: 'mock_access_token_dashboard' });
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await esperarHidratacion(page);
  const dashboard = page.getByTestId('desktop-dashboard');
  await expect(dashboard.getByRole('heading', { name: 'Tu traslado, en orden.' })).toBeVisible();
  await expect(dashboard.getByText('Bienvenido de nuevo, Carlos')).toBeVisible();
  const activo = dashboard.getByRole('article', { name: 'Traslado activo' });
  await expect(activo.getByText('12 min')).toBeVisible({ timeout: 30_000 });
  await expect(activo.getByText('8.4 km')).toBeVisible();
  await expect(page.locator('#userDashboardSidebar').getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute('aria-current', 'page');
  for (const [width, height] of [[1024, 768], [1280, 640], [1366, 768], [1672, 941], [1920, 1080], [3840, 2160]]) {
    await page.setViewportSize({ width, height });
    await expect(dashboard.getByRole('heading', { name: 'Tips Ruum Ruum' })).toBeInViewport({ ratio: 1 });
    await expect(dashboard.getByRole('link', { name: 'Contactar soporte', exact: true })).toBeInViewport({ ratio: 1 });
    const geometry = await dashboard.evaluate(el => {
      const main = document.getElementById('desktopMainContent')!;
      const table = el.querySelector('[aria-label="Tabla de últimos traslados"]')!;
      const modules = Array.from(el.children).map(child => child.getBoundingClientRect());
      return { main: main.scrollHeight - main.clientHeight, dashboard: el.scrollHeight - el.clientHeight, width: document.documentElement.scrollWidth - innerWidth, tableScrolls: table.scrollHeight > table.clientHeight, tableOverflow: getComputedStyle(table).overflowY, overlap: modules.some((rect, i) => i > 0 && rect.top < modules[i - 1].bottom - 1) };
    });
    expect(geometry.main, `${width}x${height}`).toBeLessThanOrEqual(1);
    expect(geometry.dashboard, `${width}x${height}`).toBeLessThanOrEqual(1);
    expect(geometry.width).toBeLessThanOrEqual(1);
    expect(geometry.tableOverflow).toBe("auto");
    if (height <= 1080) expect(geometry.tableScrolls).toBe(true);
    expect(geometry.overlap).toBe(false);
  }
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.screenshot({ path: 'test-results/dashboard-desktop.png' });
  await dashboard.getByRole('button', { name: 'Tip siguiente' }).click();
  await expect(dashboard.getByRole('heading', { name: 'Tu traslado, siempre a la vista' })).toBeVisible();
  await dashboard.getByRole('button', { name: 'Tip anterior' }).click();
  await expect(dashboard.getByRole('heading', { name: 'Optimiza tus traslados' })).toBeVisible();
  await dashboard.getByRole('button', { name: 'Llamar a Jorge Ramírez' }).click();
  await expect(dashboard.getByRole('alert')).toBeVisible();
  await expect(dashboard.getByRole('link', { name: 'Contactar soporte por WhatsApp' })).toHaveAttribute('href', /https:\/\/wa.me\//);
  await dashboard.getByRole('button', { name: 'Opciones del traslado PEM789', exact: true }).first().click();
  await expect(dashboard.getByRole('link', { name: 'Solicitar ayuda' })).toHaveAttribute('href', `/soporte?traslado=${id}`);
  await page.keyboard.press('Escape');
  for (const [name, path] of [['Registrar nuevo traslado', '/viajes/nuevo'], ['Carga masiva de traslados', '/viajes/masivo'], ['Mis vehículos registrados', '/cuenta/vehiculos'], ['Ver historial de traslados', '/mis-viajes']]) {
    await dashboard.getByRole('navigation', { name: 'Acciones rápidas' }).getByRole('link', { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('#userDashboardSidebar')).toBeVisible();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(dashboard).toBeVisible();
  }
  await dashboard.getByRole('link', { name: 'Abrir en mapa' }).click();
  await expect(page).toHaveURL(new RegExp(`/viajes/${id}#en-ruta$`));
  await expect(page.getByRole('tab', { name: /En ruta/ })).toBeVisible();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dashboard.getByRole('link', { name: 'Enviar mensaje a Jorge Ramírez' }).click();
  await expect(page).toHaveURL(new RegExp(`/viajes/${id}#chat-conductor$`));
  await expect(page.getByRole('tab', { name: /Chat/ })).toHaveAttribute('aria-selected', 'true');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dashboard.getByRole('link', { name: 'Contactar soporte', exact: true }).click();
  await expect(page).toHaveURL(/\/soporte$/);
  await expect(page.getByRole('heading', { name: 'Ayuda y soporte' })).toBeVisible();
});

test('Inicio desktop: cuenta sin traslados y vista móvil preservada', async ({ page }) => {
  await seedMockAuthSession(page, { variante: 'verificada' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const dashboard = page.getByTestId('desktop-dashboard');
  await expect(dashboard.getByText('No tienes traslados activos')).toBeVisible();
  await expect(dashboard.getByText('Chrysler Cirrus 2024')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dashboard).toBeHidden();
  await expect(page.locator('#userDashboardSidebar')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
