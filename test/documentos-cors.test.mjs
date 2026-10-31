import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORS_DOCUMENTOS } from '../supabase/functions/_shared/cors-documentos.ts';
test('preflight permite multipart con cabeceras del SDK y trazas sin habilitar credenciales', () => {
  const allowed = new Set(CORS_DOCUMENTOS['Access-Control-Allow-Headers'].split(', '));
  for (const header of ['authorization','apikey','content-type','x-client-info','x-region','x-supabase-client-platform','sentry-trace','baggage']) {
    assert.ok(allowed.has(header), header);
  }
  assert.equal(CORS_DOCUMENTOS['Access-Control-Allow-Origin'], '*');
  assert.equal(CORS_DOCUMENTOS['Access-Control-Allow-Methods'], 'POST, OPTIONS');
  assert.equal(CORS_DOCUMENTOS['Access-Control-Allow-Credentials'], undefined);
});
