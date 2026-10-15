// Local-only audit reproductions. No network, provider credentials or production writes.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
function load(relative, dependencies, deno) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const safeRequire = name => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
    return dependencies[name];
  };
  new Function('require', 'module', 'exports', 'Deno', js)(safeRequire, module, module.exports, deno);
  return module.exports;
}
(async () => {
  for (const key of ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID','PHONE_VERIFY_SECRET','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_ANON_KEY']) delete process.env[key];
  process.env.NODE_ENV = 'production';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-public-key-for-local-audit';
  const phone = load('apps/app-usuario/src/lib/phone-verification.ts', {
    crypto: require('node:crypto'),
    './registro-usuario': { soloDigitos: (s, n) => s.replace(/\D/g, '').slice(0,n), telefonoMx: s => '+52' + s },
  });
  const otp = await phone.verificarCodigoTwilioVerify('5500000000', '123456');
  assert.equal(otp.ok, true);
  assert.equal(otp.mock, true);
  const now = String(Date.now());
  const sig = require('node:crypto').createHmac('sha256', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).update('5500000000:' + now).digest('hex');
  const publicKeyTokenAccepted = phone.validarTokenTelefono('5500000000', '5500000000:' + now + ':' + sig).valido;
  assert.equal(publicKeyTokenAccepted, true);

  const logic = load('supabase/functions/stripe-webhook/logica.ts', {});
  let handler;
  let event = { id: 'evt_local_success', type: 'payment_intent.succeeded', data: { object: { id: 'pi_local', metadata: { traslado_id: 'trip_local' } } } };
  const payment = { stripe_event_id: null, traslado_id: 'trip_local', estado: 'pendiente' };
  const trip = { estado: 'cotizacion_aceptada', tipo_pago: 'anticipado' };
  let tripUpdateAttempts = 0;
  function from(table) {
    let operation = 'select', payload;
    const q = {
      select() { return q; }, eq() { return q; }, maybeSingle() { return q; },
      update(value) { operation = 'update'; payload = value; return q; },
      insert(value) { operation = 'insert'; payload = value; return q; },
      then(resolve, reject) {
        let result = { data: null, error: null };
        if (table === 'pagos' && operation === 'select') result.data = { ...payment };
        if (table === 'pagos' && operation === 'update') Object.assign(payment, payload);
        if (table === 'traslados' && operation === 'select') result.data = { ...trip };
        if (table === 'traslados' && operation === 'update') {
          tripUpdateAttempts++;
          result.error = { message: 'Synthetic transient failure after payment write' };
        }
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return q;
  }
  class Stripe {
    static createFetchHttpClient() { return {}; }
    constructor() { this.webhooks = { constructEventAsync: async () => event }; }
  }
  load('supabase/functions/stripe-webhook/index.ts', {
    'npm:stripe@^17': Stripe,
    'npm:@supabase/supabase-js@2': { createClient: () => ({ from }) },
    './logica.ts': logic,
  }, { env: { get: () => 'synthetic-local-only' }, serve: callback => { handler = callback; } });
  const request = () => new Request('http://localhost/audit-only', { method: 'POST', headers: { 'stripe-signature': 'mock-local-signature' }, body: '{}' });
  const first = await handler(request());
  const retry = await handler(request());
  assert.equal(first.status, 500);
  assert.equal(retry.status, 200);
  assert.equal(tripUpdateAttempts, 1);
  assert.equal(trip.estado, 'cotizacion_aceptada');
  const afterRetry = { payment: payment.estado, trip: trip.estado, first: first.status, retry: retry.status, tripUpdateAttempts };
  event = { ...event, id: 'evt_local_older_failure', type: 'payment_intent.payment_failed' };
  await handler(request());
  assert.equal(payment.estado, 'fallido');
  // Middleware cookie refresh must preserve the nonce forwarded to RootLayout.
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic-audit.invalid';
  const nextResponse = {
    next: options => ({ headers: new Headers(), cookies: { set() {} }, forwardedHeaders: options.request.headers }),
  };
  const middleware = load('apps/app-usuario/src/middleware.ts', {
    'next/server': { NextResponse: nextResponse },
    '@ruum/api/supabase': { crearClienteServidor: (_url, _key, adapter) => ({ auth: { getUser: async () => {
      adapter.setAll([{ name: 'synthetic-cookie', value: 'synthetic', options: {} }]);
      return { data: { user: { id: 'synthetic-user' } } };
    } } }) },
    './lib/csp': {
      buildCspUsuario: nonce => "script-src 'nonce-" + nonce + "'",
      headersSeguridadEstaticos: () => [], cabeceraReportToCsp: () => ({}), sufijoReporteCsp: () => '',
    },
  });
  const response = await middleware.middleware({ headers: new Headers(), cookies: { getAll: () => [], set() {} }, nextUrl: { pathname: '/cuenta', origin: 'https://synthetic-audit.invalid' } });
  const nonceLostOnRefresh = Boolean(response.headers.get('x-nonce')) && !response.forwardedHeaders.get('x-nonce');
  assert.equal(nonceLostOnRefresh, true);
  const evidence = {
    safety: 'Synthetic providers, no network, no production writes or real secrets',
    phone: { productionWithoutTwilioAcceptsDemoCode: otp.ok && otp.mock, publicKeyTokenAccepted },
    webhook: { afterRetry, lateFailureDowngradesCompletedPayment: payment.estado === 'fallido' },
    middleware: { nonceLostOnCookieRefresh: nonceLostOnRefresh },
  };
  fs.writeFileSync(path.join(__dirname, 'reproducciones.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
