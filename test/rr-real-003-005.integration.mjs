import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const modulePath=process.env.RR_PGLITE_MODULE;
const { PGlite }=await import(modulePath || '@electric-sql/pglite');
const { pgcrypto }=await import(modulePath ? modulePath.replace('dist/index.js','dist/contrib/pgcrypto.js') : '@electric-sql/pglite/contrib/pgcrypto');
const db=new PGlite({ extensions: { pgcrypto } });
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema private; create schema auth; create schema storage; create schema extensions; create schema net;
create extension pgcrypto with schema extensions;
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create function public.es_admin() returns boolean language sql stable as $$ select false $$;
create type estado_traslado as enum('solicitud_creada','documentacion_pendiente','cotizacion_aceptada','cotizacion_generada','servicio_confirmado','entrega_confirmada','pago_pendiente','pago_completado','servicio_cerrado','servicio_cancelado','traslado_fallido','evidencia_inicial_completada','evidencia_final_completada','traslado_en_curso');
create type estado_pago as enum('pendiente','completado','fallido','reembolsado');
create type tipo_evidencia as enum('inicial','final');
create type angulo_evidencia as enum('frente','lado_piloto','lado_copiloto','trasera','tablero');
create table conductores(id uuid primary key, auth_user_id uuid,traslados_completados int default 0);
create table usuarios(id uuid primary key,auth_user_id uuid,traslados_completados_sin_incidencia int default 0);
create table traslados(id uuid primary key,conductor_id uuid,usuario_id uuid,estado estado_traslado,tipo_pago text default 'anticipado');
create table incidencias(id uuid primary key default gen_random_uuid(),traslado_id uuid);
create table pagos(id uuid primary key default gen_random_uuid(),traslado_id uuid,monto numeric,estado estado_pago,stripe_payment_intent_id text unique,stripe_event_id text unique);
create table registro_auditoria(id uuid default gen_random_uuid(),traslado_id uuid,evento text,actor text,actor_id uuid,datos jsonb);
create table evidencia_fotos(id uuid primary key,traslado_id uuid,tipo tipo_evidencia,angulo angulo_evidencia,url text,local_path text,capturada_en timestamptz,lat numeric,lng numeric,sincronizada boolean);
create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));
create table test_requests(id bigserial,body jsonb);
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds int) returns bigint language sql as $$ insert into test_requests(body) values(body) returning id $$;
create function proteger_campos_conductor() returns trigger language plpgsql as $$ begin if auth.uid()=old.auth_user_id and new.traslados_completados<>old.traslados_completados then raise exception 'contador protegido'; end if; return new; end $$;
create trigger proteger_contador before update on conductores for each row execute function proteger_campos_conductor();
create function proteger_verificacion_usuario() returns trigger language plpgsql as $$ begin return new; end $$;
`);
const driver=crypto.randomUUID(),user=crypto.randomUUID(),identity=crypto.randomUUID(),tripId=crypto.randomUUID();
await db.query('insert into conductores(id,auth_user_id) values($1,$2)',[driver,identity]);
await db.query('insert into usuarios(id) values($1)',[user]);
await db.query("insert into traslados(id,conductor_id,usuario_id,estado) values($1,$2,$3,'servicio_cerrado'),($4,$2,$3,'servicio_cerrado')",[crypto.randomUUID(),driver,user,crypto.randomUUID()]);
await db.exec(read('supabase/migrations/20261030160726_rr_real_003_conciliacion_stripe.sql').replace('create extension if not exists pg_net with schema extensions;','-- pg_net transport mocked; real PostgreSQL functions below'));
await db.exec(read('supabase/migrations/20261030160727_rr_real_004_evidencia_idempotente.sql'));
await db.exec(read('supabase/migrations/20261030160818_rr_real_005_historial.sql'));
const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[identity]);
await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:identity,role:'authenticated'})]);
await db.query("insert into traslados(id,conductor_id,usuario_id,estado) values($1,$2,$3,'cotizacion_aceptada')",[tripId,driver,user]);
await db.query("insert into pagos(traslado_id,monto,estado,stripe_payment_intent_id) values($1,2381.67,'pendiente','pi_rr_test')",[tripId]);
const verification={id:'evt_test_1',intent_id:'pi_rr_test',traslado_id:tripId,estado_proveedor:'succeeded',monto_centavos:238167,monto_recibido:238167,moneda:'mxn',livemode:false,modo_esperado:false,origen:'webhook'};
const apply=(v)=>scalar('select aplicar_verificacion_pago_stripe($1::jsonb)',[JSON.stringify(v)]);
async function photos(id) {
  for(const tipo of ['inicial','final']) for(const angle of ['frente','lado_piloto','lado_copiloto','trasera','tablero']) {
    const capture=crypto.randomUUID(),url=`${identity}/${id}/${tipo}/${capture}-${angle}.jpg`;
    const foto={id:capture,traslado_id:id,tipo,angulo:angle,url,capturada_en:new Date().toISOString(),sha256:'a'.repeat(64)};
    await db.query("insert into storage.objects values('evidencia',$1)",[url]);
    await scalar('select registrar_foto_idempotente($1::jsonb)',[JSON.stringify(foto)]);
  }
}
test('RR-REAL-003/004/005 server behavior',async(t)=>{
  await t.test('historical counters reconcile from zero to two',async()=>{
    assert.equal(await scalar('select traslados_completados from conductores where id=$1',[driver]),2);
    assert.equal(await scalar('select traslados_completados_sin_incidencia from usuarios where id=$1',[user]),2);
  });
  await t.test('mismatched amount, mode, currency and transfer fail without any payment change',async()=>{
    for(const change of [{monto_centavos:1},{livemode:true},{moneda:'usd'},{traslado_id:crypto.randomUUID()},{monto_recibido:0}]) await assert.rejects(apply({...verification,...change}));
    assert.equal(await scalar('select estado from pagos where stripe_payment_intent_id=$1',['pi_rr_test']),'pendiente');
    assert.equal(await scalar('select count(*)::int from registro_auditoria'),0);
  });
  await t.test('missing event is recovered, retry and a second succeeded event do not duplicate charge audit or confirmation',async()=>{
    await apply({...verification,id:'reconcile:pi_rr_test:succeeded',origen:'conciliacion'});
    assert.equal(await scalar('select estado from pagos where stripe_payment_intent_id=$1',['pi_rr_test']),'completado');
    assert.equal(await scalar('select estado from traslados where id=$1',[tripId]),'servicio_confirmado');
    await apply({...verification,id:'reconcile:pi_rr_test:succeeded',origen:'conciliacion'});
    await apply(verification); await apply(verification);
    assert.equal(await scalar('select count(*)::int from pagos'),1);
    assert.equal(await scalar('select count(*)::int from registro_auditoria'),1);
    assert.equal(await scalar('select count(*)::int from stripe_verificaciones'),2);
  });
  await t.test('pending and failed provider states do not become completed',async()=>{
    for(const status of ['processing','requires_action','requires_payment_method','canceled']) {
      const id=crypto.randomUUID(),pi='pi_'+id.replaceAll('-','');
      await db.query("insert into pagos(traslado_id,monto,estado,stripe_payment_intent_id) values($1,2381.67,'pendiente',$2)",[tripId,pi]);
      await apply({...verification,id:'event_'+status,intent_id:pi,estado_proveedor:status,monto_recibido:0});
      assert.notEqual(await scalar('select estado from pagos where stripe_payment_intent_id=$1',[pi]),'completado');
    }
  });
  await t.test('three scheduler invocations create actual work and one-use authentication rejects replay',async()=>{
    for(let i=0;i<3;i++) {
      const id=await scalar('select reconciliar_pagos_stripe()');
      const body=await scalar('select body from test_requests order by id desc limit 1');
      assert.equal(body.ejecucion_id,id);
      assert.equal(await scalar('select tomar_ejecucion_conciliacion($1,$2)',[id,'bad']),false);
      assert.equal(await scalar('select tomar_ejecucion_conciliacion($1,$2)',[id,body.nonce]),true);
      assert.equal(await scalar('select tomar_ejecucion_conciliacion($1,$2)',[id,body.nonce]),false);
    }
  });
  await t.test('photo retries preserve one row and original content; different hash records a real conflict',async()=>{
    const id=crypto.randomUUID(),url=`${identity}/${tripId}/final/${id}-frente.jpg`;
    await db.query("insert into storage.objects values('evidencia',$1)",[url]);
    const foto={id,traslado_id:tripId,tipo:'final',angulo:'frente',url,capturada_en:new Date().toISOString(),sha256:'b'.repeat(64)};
    for(let i=0;i<3;i++) assert.equal((await scalar('select registrar_foto_idempotente($1::jsonb)',[JSON.stringify(foto)])).ok,true);
    assert.equal(await scalar('select count(*)::int from evidencia_fotos where id=$1',[id]),1);
    assert.equal((await scalar('select registrar_foto_idempotente($1::jsonb)',[JSON.stringify({...foto,sha256:'c'.repeat(64)})])).conflicto,true);
    assert.equal(await scalar('select sha256 from evidencia_fotos where id=$1',[id]),'b'.repeat(64));
    await assert.rejects(db.query("update traslados set estado='servicio_cerrado' where id=$1",[tripId]),/Conflicto real/);
  });
  const completed=crypto.randomUUID();
  await t.test('missing photo blocks closure; ten mandatory views allow it',async()=>{
    await db.query("insert into traslados(id,conductor_id,usuario_id,estado) values($1,$2,$3,'entrega_confirmada')",[completed,driver,user]);
    await assert.rejects(db.query("update traslados set estado='servicio_cerrado' where id=$1",[completed]),/Faltan fotografías/);
    await photos(completed);
    await db.query("update traslados set estado='servicio_cerrado' where id=$1",[completed]);
    assert.equal(await scalar('select traslados_completados from conductores where id=$1',[driver]),3);
  });
  await t.test('repeated close does not increment; canceled and failed do not count; incidence revises user indicator',async()=>{
    await db.query("update traslados set estado='servicio_cerrado' where id=$1",[completed]);
    for(const state of ['servicio_cancelado','traslado_fallido']) await db.query('insert into traslados(id,conductor_id,usuario_id,estado) values($1,$2,$3,$4)',[crypto.randomUUID(),driver,user,state]);
    assert.equal(await scalar('select traslados_completados from conductores where id=$1',[driver]),3);
    await db.query('insert into incidencias(traslado_id) values($1)',[completed]);
    assert.equal(await scalar('select traslados_completados_sin_incidencia from usuarios where id=$1',[user]),2);
    assert.equal(await scalar('select auth.uid()'),identity);
    await assert.rejects(db.query('update conductores set traslados_completados=99 where id=$1',[driver]),/protegido/);
  });
  await t.test('clients cannot apply provider confirmations or start a reconciliation',async()=>{
    await db.exec('set role authenticated');
    await assert.rejects(apply(verification),/permission denied/);
    await assert.rejects(scalar('select reconciliar_pagos_stripe()'),/permission denied/);
    await db.exec('reset role');
  });
  await db.close();
});
