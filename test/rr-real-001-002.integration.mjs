// Isolated PostgreSQL execution of the shipped migration. No production data.
// npm install --prefix <scratch> @electric-sql/pglite
// RR_PGLITE_MODULE=<absolute package entry> node --test test/rr-real-001-002.integration.mjs
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.RR_PGLITE_MODULE || '@electric-sql/pglite');
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table auth.users(id uuid primary key);
create table public.admins(auth_user_id uuid);
create function public.es_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from public.admins where auth_user_id=auth.uid()) $$;
create table public.conductores(id uuid primary key, auth_user_id uuid);
create table public.usuarios(id uuid primary key,auth_user_id uuid);
create table public.traslados(id uuid primary key, conductor_id uuid, estado text, usuario_id uuid);
create table public.evidencia_inspecciones(id uuid primary key default gen_random_uuid(), traslado_id uuid, tipo text, llaves_recibidas text, unique(traslado_id,tipo));
create table public.ubicaciones_traslado(id uuid primary key default gen_random_uuid(), traslado_id uuid, conductor_id uuid,local_id uuid, lat numeric,lng numeric,precision_m numeric,velocidad_mps numeric,direccion_grados numeric,altitud_m numeric,dispositivo_timestamp timestamptz,servidor_timestamp timestamptz,estado_viaje text,fuente text,bateria_pct integer,online boolean,registrado_en timestamptz default now());
create unique index on public.ubicaciones_traslado(traslado_id,local_id) where local_id is not null;
create table public.tracking_salud_traslado(traslado_id uuid primary key,conductor_id uuid,ultimo_punto_id uuid,ultima_ubicacion_en timestamptz,ultimo_envio_en timestamptz,fuente text,online boolean,precision_m numeric,actualizado_en timestamptz);
create function public.set_actualizado_en() returns trigger language plpgsql as $$ begin new.actualizado_en=now(); return new; end $$;
`);
const tracking = read('supabase/migrations/20260908000007_tracking_operacional.sql');
await db.exec(tracking.slice(tracking.indexOf('create table public.tracking_sesiones'),tracking.indexOf('-- Backfill:')));
await db.exec(tracking.slice(tracking.indexOf('create or replace function public.cerrar_tracking_al_terminar'),tracking.indexOf('-- 10.8/')));
await db.exec(read('supabase/migrations/20261030154958_rr_real_001_002.sql'));
const driver = '10000000-0000-4000-8000-000000000001';
const admin = '10000000-0000-4000-8000-000000000002';
const conductor = '10000000-0000-4000-8000-000000000003';
await db.exec(`insert into auth.users values('${driver}'),('${admin}'); insert into admins values('${admin}'); insert into conductores values('${conductor}','${driver}');`);
const actor = (id) => db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
const scalar = async (sql, params=[]) => Object.values((await db.query(sql,params)).rows[0])[0];
async function trip(final='1') {
  const id = crypto.randomUUID();
  await db.query("insert into traslados(id,conductor_id,estado) values($1,$2,'evidencia_final_completada')",[id,conductor]);
  await db.query("insert into evidencia_inspecciones(traslado_id,tipo,llaves_recibidas) values($1,'inicial','2'),($1,'final',$2)",[id,final]);
  return id;
}

test('RR-REAL server acceptance', async (t) => {
  await actor(driver);
  await t.test('2 → 2 permits delivery', async () => {
    const id=await trip('2');
    await db.query("update traslados set estado='entrega_confirmada' where id=$1",[id]);
    assert.equal(await scalar('select estado from traslados where id=$1',[id]),'entrega_confirmada');
  });
  const id=await trip();
  await t.test('2 → 1 blocks direct SQL delivery and repeated close', async () => {
    for (const state of ['entrega_confirmada','servicio_cerrado','entrega_confirmada']) {
      await assert.rejects(db.query('update traslados set estado=$2 where id=$1',[id,state]),/Diferencia de llaves/);
    }
    assert.equal(await scalar('select estado from traslados where id=$1',[id]),'evidencia_final_completada');
  });
  await t.test('cannot edit or delete either original inventory to bypass discrepancy', async () => {
    await assert.rejects(db.query("update evidencia_inspecciones set llaves_recibidas='2' where traslado_id=$1 and tipo='final'",[id]),/Conserva/);
    await assert.rejects(db.query("delete from evidencia_inspecciones where traslado_id=$1 and tipo='inicial'",[id]),/Conserva/);
  });
  await t.test('driver cannot authorize; admin requires documented reason', async () => {
    await assert.rejects(db.query("select resolver_inventario_llaves($1,'Diferencia de captura confirmada')",[id]),/Solo administración/);
    await actor(admin);
    await assert.rejects(db.query("select resolver_inventario_llaves($1,'')",[id]),/check constraint/);
    await db.query("select resolver_inventario_llaves($1,'Operación confirma diferencia física y autoriza cierre excepcional')",[id]);
    const row=(await db.query('select * from resoluciones_inventario_llaves where traslado_id=$1',[id])).rows[0];
    assert.equal(row.responsable,admin); assert.ok(row.resuelta_en); assert.equal(row.inicial,'2'); assert.equal(row.final,'1');
    await actor(driver);
    await db.query("update traslados set estado='entrega_confirmada' where id=$1",[id]);
    assert.equal(await scalar("select llaves_recibidas from evidencia_inspecciones where traslado_id=$1 and tipo='final'",[id]),'1');
  });
  const trackingId=await trip('2');
  await t.test('session opens at start before first GPS point', async () => {
    await db.query("update traslados set estado='traslado_en_curso' where id=$1",[trackingId]);
    assert.equal(await scalar("select count(*)::int from tracking_sesiones where traslado_id=$1 and estado='activa'",[trackingId]),1);
  });
  const point={localId:crypto.randomUUID(),lat:19,lng:-99,deviceTimestamp:new Date().toISOString(),fuente:'web_foreground',online:true};
  await t.test('upload persists capture, reception, session and health; retry has no duplicate', async () => {
    const first=await scalar('select registrar_telemetria_lote($1,$2::jsonb)',[trackingId,JSON.stringify([point])]);
    assert.equal(first.insertados,1);
    const again=await scalar('select registrar_telemetria_lote($1,$2::jsonb)',[trackingId,JSON.stringify([point])]);
    assert.equal(again.duplicados,1);
    assert.deepEqual(again.duplicadosIds,[point.localId]);
    assert.equal(await scalar('select count(*)::int from ubicaciones_traslado where traslado_id=$1',[trackingId]),1);
    const health=(await db.query('select * from tracking_salud_traslado where traslado_id=$1',[trackingId])).rows[0];
    assert.ok(health.ultimo_envio_en); assert.equal(new Date(health.ultima_ubicacion_en).getTime(),Date.parse(point.deviceTimestamp));
  });
  await t.test('late replay does not move last captured signal backward', async () => {
    const replay={...point,localId:crypto.randomUUID(),deviceTimestamp:new Date(Date.now()-300000).toISOString()};
    await scalar('select registrar_telemetria_lote($1,$2::jsonb)',[trackingId,JSON.stringify([replay])]);
    assert.equal(new Date(await scalar('select ultima_ubicacion_en from tracking_salud_traslado where traslado_id=$1',[trackingId])).getTime(),Date.parse(point.deviceTimestamp));
  });
  await t.test('stale capture alerts after 120 seconds even with recent receipt', async () => {
    await db.query("update tracking_salud_traslado set ultima_ubicacion_en=now()-interval '121 seconds' where traslado_id=$1",[trackingId]);
    assert.equal((await scalar('select evaluar_salud_tracking($1)',[trackingId])).estado,'STALE');
  });
  await t.test('tracking health cannot be read by an unrelated identity', async () => {
    await actor('10000000-0000-4000-8000-000000000099');
    await assert.rejects(scalar('select evaluar_salud_tracking($1)',[trackingId]),/Sin acceso/);
    await actor(driver);
  });
  await t.test('terminal transition closes session and rejects new telemetry', async () => {
    await db.query("update traslados set estado='servicio_cerrado' where id=$1",[trackingId]);
    assert.equal(await scalar("select count(*)::int from tracking_sesiones where traslado_id=$1 and estado='activa'",[trackingId]),0);
    await assert.rejects(scalar('select registrar_telemetria_lote($1,$2::jsonb)',[trackingId,JSON.stringify([point])]),/no está autorizado/);
    await actor(admin);
    await assert.rejects(scalar('select iniciar_sesion_tracking($1)',[trackingId]),/terminado/);
  });
  await db.close();
});
