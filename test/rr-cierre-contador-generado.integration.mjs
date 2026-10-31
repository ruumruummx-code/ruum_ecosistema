import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.RR_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
await db.exec(`
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function es_admin() returns boolean language sql stable as $$ select false $$;
create table conductores (
 id uuid primary key, auth_user_id uuid, traslados_completados int default 0,
 calificacion_promedio numeric default 5, telefono text,
 nivel_operativo_vigente text generated always as
   (case when calificacion_promedio>=4.9 then 'coleccion' else 'basico' end) stored,
 actualizado_en timestamptz default now()
);
create table usuarios(id uuid primary key, auth_user_id uuid, traslados_completados_sin_incidencia int default 0);
create table traslados(id uuid primary key, conductor_id uuid, usuario_id uuid, estado text);
create table incidencias(id uuid primary key, traslado_id uuid);
create function proteger_verificacion_usuario() returns trigger language plpgsql as $$ begin return new; end $$;
`);
const hardening = read('supabase/migrations/20260901234331_pr03_hardening_autorizacion_conductor.sql');
await db.exec(hardening.slice(hardening.indexOf('create or replace function public.proteger_campos_conductor()'), hardening.indexOf('drop trigger if exists proteger_campos_conductor')));
await db.exec('create trigger proteger_perfil before update on conductores for each row execute function proteger_campos_conductor();');
const driver = crypto.randomUUID(), identity = crypto.randomUUID(), user = crypto.randomUUID(), trip = crypto.randomUUID();
await db.query('insert into conductores(id,auth_user_id) values($1,$2)', [driver, identity]);
await db.query('insert into usuarios(id) values($1)', [user]);
await db.query("insert into traslados values($1,$2,$3,'entrega_confirmada')", [trip, driver, user]);
await db.exec(read('supabase/migrations/20261030160818_rr_real_005_historial.sql'));
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [identity]);
const close = () => db.query("update traslados set estado='servicio_cerrado' where id=$1", [trip]);
const driverRow = async () => (await db.query('select * from conductores where id=$1', [driver])).rows[0];

test('cierre con nivel calculado y contador protegido', async (t) => {
  await t.test('reproduce el bloqueo anterior en PostgreSQL con columna generada real', async () => {
    await assert.rejects(close(), /No puedes modificar campos operativos/);
    assert.equal((await driverRow()).traslados_completados, 0);
  });
  await db.exec(read('supabase/migrations/20261031192647_fix_cierre_contador_columnas_generadas.sql'));
  await t.test('el cierre actualiza exactamente el contador y conserva nivel y calificación', async () => {
    await close();
    const c = await driverRow();
    assert.equal(c.traslados_completados, 1);
    assert.equal(c.nivel_operativo_vigente, 'coleccion');
    assert.equal(Number(c.calificacion_promedio), 5);
  });
  await t.test('recalcular el mismo cierre no duplica el contador', async () => {
    await close();
    assert.equal((await driverRow()).traslados_completados, 1);
  });
  await t.test('editar directamente el contador sigue prohibido sin autorización de perfil', async () => {
    await assert.rejects(db.query('update conductores set traslados_completados=999 where id=$1', [driver]), /RPC autorizada/);
  });
  await t.test('la autorización de perfil tampoco permite alterar métricas o calificación', async () => {
    await db.exec("select set_config('ruum.cambio_perfil_autorizado','si',false)");
    await assert.rejects(db.query('update conductores set traslados_completados=999 where id=$1', [driver]), /campos operativos/);
    await assert.rejects(db.query('update conductores set calificacion_promedio=1 where id=$1', [driver]), /campos operativos/);
    await db.query("update conductores set telefono='5550000000' where id=$1", [driver]);
    assert.equal((await driverRow()).telefono, '5550000000');
    assert.equal((await driverRow()).traslados_completados, 1);
  });
});
