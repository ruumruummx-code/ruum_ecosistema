import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.RR_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
const id=()=>crypto.randomUUID();
const driver=id(),auth=id(),admin=id(),trip=id(),repair=id(),repairDispute=id(),repairSession=id();
await db.exec(`
create schema auth; create schema private;
create role anon; create role authenticated;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function es_admin() returns boolean language sql stable as $$select coalesce(current_setting('test.admin',true)='true',false)$$;
create function admin_actual_id() returns uuid language sql stable as $$select case when es_admin() then nullif(current_setting('test.admin_id',true),'')::uuid end$$;
create function admin_tiene_permiso(text) returns boolean language sql stable as $$select es_admin() and coalesce(current_setting('test.permiso',true),'true')<>'false'$$;
create type estado_traslado as enum('traslado_en_curso','entrega_confirmada','servicio_cerrado','servicio_cancelado','traslado_fallido','disputa_abierta','disputa_resuelta','reclamo_resuelto','cierre_operativo_con_incidencia_abierta','conductor_en_camino_al_origen');
create type estado_disputa as enum('abierta','en_revision','escalada','resuelta','resuelta_senior');
create type resolucion_disputa as enum('favor_reclamante','en_contra','solucion_parcial');
create table conductores(id uuid primary key,auth_user_id uuid);
create table traslados(id uuid primary key,conductor_id uuid,estado estado_traslado,estado_operativo text,cerrado_en timestamptz,version bigint default 0,destino_lat numeric,destino_lng numeric);
create table disputas(id uuid primary key,traslado_id uuid,estado estado_disputa,resolucion resolucion_disputa,resolucion_detalle text,resuelta_en timestamptz);
create table registro_auditoria(traslado_id uuid,evento text,actor text,actor_id uuid,datos jsonb);
create table estado_transiciones_validas(estado_actual estado_traslado,estado_siguiente estado_traslado,primary key(estado_actual,estado_siguiente));
create table ubicaciones_traslado(id uuid primary key default gen_random_uuid(),traslado_id uuid,conductor_id uuid,local_id uuid,lat numeric,lng numeric,precision_m numeric,velocidad_mps numeric,direccion_grados numeric,altitud_m numeric,dispositivo_timestamp timestamptz,servidor_timestamp timestamptz,estado_viaje text,fuente text,bateria_pct integer,online boolean,registrado_en timestamptz default now());
create unique index punto_local_unico on ubicaciones_traslado(traslado_id,local_id) where local_id is not null;
create table tracking_sesiones(id uuid primary key default gen_random_uuid(),traslado_id uuid,conductor_id uuid,estado text default 'activa',iniciada_en timestamptz default now(),finalizada_en timestamptz,ultimo_heartbeat_en timestamptz,ultima_lat numeric,ultima_lng numeric,ultima_precision_m numeric,ultima_velocidad_mps numeric,ultima_bateria_pct integer,ultima_distancia_destino_km numeric,desviacion_sospechosa boolean default false,plataforma text,metadata jsonb default '{}');
create unique index sesion_activa_unica on tracking_sesiones(traslado_id) where estado='activa';
create table tracking_salud_traslado(traslado_id uuid primary key,conductor_id uuid,ultimo_punto_id uuid,ultima_ubicacion_en timestamptz,ultimo_envio_en timestamptz,fuente text,online boolean,precision_m numeric,actualizado_en timestamptz);
create function evaluar_salud_tracking(uuid) returns jsonb language sql as $$select '{"estado":"HEALTHY"}'::jsonb$$;
create function admin_resuelve_disputa(uuid,estado_disputa,resolucion_disputa,text) returns void language plpgsql as $$begin return; end$$;
create function cerrar_tracking_al_terminar() returns trigger language plpgsql as $$begin return new; end$$;
create trigger traslados_cerrar_tracking after update on traslados for each row execute function cerrar_tracking_al_terminar();
grant usage on schema public,auth to authenticated;
grant all on all tables in schema public to authenticated;
`);
await db.query('insert into conductores values($1,$2)',[driver,auth]);
await db.query("insert into traslados(id,conductor_id,estado,estado_operativo,cerrado_en) values($1,$2,'disputa_resuelta','closed',now()-interval '1 hour')",[repair,driver]);
const originalClosure=(await db.query('select cerrado_en from traslados where id=$1',[repair])).rows[0].cerrado_en;
await db.query("insert into disputas(id,traslado_id,estado) values($1,$2,'abierta')",[repairDispute,repair]);
await db.query('insert into tracking_sesiones(id,traslado_id,conductor_id) values($1,$2,$3)',[repairSession,repair,driver]);
const migration=readFileSync(new URL('../supabase/migrations/20261101141513_bloquear_tracking_post_cierre.sql',import.meta.url),'utf8') + readFileSync(new URL('../supabase/migrations/20261101142918_unificar_resolucion_disputas_segura.sql',import.meta.url),'utf8');
await db.exec(migration);
await db.exec('create trigger actualizar_salud_desde_punto after insert on ubicaciones_traslado for each row execute function private.actualizar_salud_desde_punto()');
await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('test.admin_id',$2,false)",[auth,admin]);
const row=async(table,uuid)=> (await db.query(`select * from ${table} where id=$1`,[uuid])).rows[0];
const active=async(uuid)=>Number((await db.query("select count(*) n from tracking_sesiones where traslado_id=$1 and estado='activa'",[uuid])).rows[0].n);
const batch=async(uuid,points)=>(await db.query('select registrar_telemetria_lote($1,$2::jsonb) r',[uuid,JSON.stringify(points)])).rows[0].r;
const point=(timestamp=new Date().toISOString())=>({localId:id(),lat:20,lng:-100,deviceTimestamp:timestamp,fuente:'web_foreground'});
const resolve=async(uuid,state='resuelta',decision='en_contra',keep=false)=>db.query('select admin_resuelve_disputa($1,$2::estado_disputa,$3::resolucion_disputa,$4,$5)',[uuid,state,decision,'Resolución sintética',keep]);

test('tracking terminal y coherencia de disputas en PostgreSQL',async t=>{
 await t.test('repara contradicciones con auditoría sin adjudicar el caso ni mover el cierre',async()=>{
  assert.equal((await row('traslados',repair)).estado,'disputa_abierta');
  assert.deepEqual((await row('traslados',repair)).cerrado_en,originalClosure);
  assert.equal((await row('disputas',repairDispute)).estado,'abierta');
  assert.equal((await row('disputas',repairDispute)).resolucion,null);
  assert.equal((await row('tracking_sesiones',repairSession)).estado,'cerrada');
  assert.equal(Number((await db.query('select count(*) n from registro_auditoria')).rows[0].n),2);
 });
 await db.query("insert into traslados(id,conductor_id,estado,estado_operativo) values($1,$2,'traslado_en_curso','in_transit')",[trip,driver]);
 await t.test('ingiere puntos activos con sesión y conserva la idempotencia',async()=>{
  const p=point(); assert.equal((await batch(trip,[p])).insertados,1); assert.equal((await batch(trip,[p])).duplicados,1); assert.equal(await active(trip),1);
 });
 await db.query("update traslados set estado='servicio_cerrado',estado_operativo='closed',cerrado_en=now() where id=$1",[trip]);
 const closure=(await row('traslados',trip)).cerrado_en;
 const d1=id(),d2=id();
 await db.query("insert into disputas(id,traslado_id,estado) values($1,$3,'abierta'),($2,$3,'abierta')",[d1,d2,trip]);
 await db.query("update traslados set estado='disputa_abierta' where id=$1",[trip]);
 await t.test('el cierre apaga la sesión y una disputa no permite inicio, heartbeat ni escritura directa',async()=>{
  assert.equal(await active(trip),0);
  await assert.rejects(db.query('select iniciar_sesion_tracking($1)',[trip]),/CERRADO/);
  await assert.rejects(db.query('select registrar_heartbeat_tracking($1,20,-100)',[trip]),/CERRADO/);
  await assert.rejects(db.query('insert into tracking_sesiones(traslado_id,conductor_id) values($1,$2)',[trip,driver]),/CERRADO/);
  await assert.rejects(db.query('insert into ubicaciones_traslado(traslado_id,conductor_id,lat,lng) values($1,$2,20,-100)',[trip,driver]),/CERRADO/);
 });
 await t.test('archiva un punto offline previo al cierre sin reactivar sesión ni salud',async()=>{
  const health=(await db.query('select ultimo_punto_id from tracking_salud_traslado where traslado_id=$1',[trip])).rows[0].ultimo_punto_id;
  const old=point(new Date(new Date(closure).getTime()-10000).toISOString());
  const late=point(new Date(new Date(closure).getTime()+10000).toISOString());
  const result=await batch(trip,[old,late]);
  assert.equal(result.insertados,1); assert.equal(result.rechazados,1);
  assert.equal(result.rechazadosPermanentes[0].razon,'traslado_cerrado');
  assert.equal((await batch(trip,[old])).duplicados,1);
  assert.equal(await active(trip),0);
  assert.equal((await db.query('select ultimo_punto_id from tracking_salud_traslado where traslado_id=$1',[trip])).rows[0].ultimo_punto_id,health);
  assert.match((await db.query('select fuente from ubicaciones_traslado where local_id=$1',[old.localId])).rows[0].fuente,/archivo_offline/);
 });
 await t.test('no permite falsificar resolución desde un cambio genérico del traslado',async()=>{
  await assert.rejects(db.query("update traslados set estado='disputa_resuelta' where id=$1",[trip]),/DISPUTA_SIN_RESOLVER/);
  await assert.rejects(db.query("update disputas set estado='resuelta' where id=$1",[d1]),/requiere resolución/);
  await assert.rejects(db.query('update traslados set cerrado_en=now() where id=$1',[trip]),/inmutable/);
 });
 await t.test('exige permiso real de resolución y conserva la atomicidad',async()=>{
  await assert.rejects(resolve(d1),/PERMISO_INSUFICIENTE/);
  assert.equal((await row('disputas',d1)).estado,'abierta');
  await db.exec("select set_config('test.admin','true',false),set_config('test.permiso','false',false)");
  await assert.rejects(resolve(d1),/PERMISO_INSUFICIENTE/);
  await db.exec("select set_config('test.permiso','true',false)");
  await assert.rejects(resolve(d1,'resuelta',null),/Selecciona una resolución/);
 });
 await t.test('resolver una de dos disputas mantiene abierto el resumen; la última lo resuelve',async()=>{
  await resolve(d1); assert.equal((await row('traslados',trip)).estado,'disputa_abierta');
  await db.query("select admin_resuelve_disputa($1,'resuelta'::estado_disputa,'en_contra'::resolucion_disputa,'Resolución legacy')",[d2]);
  assert.equal((await row('traslados',trip)).estado,'disputa_resuelta');
  assert.deepEqual((await row('traslados',trip)).cerrado_en,closure); assert.equal(await active(trip),0);
 });
 await t.test('reabrir un caso vuelve a seguimiento abierto sin reabrir la operación',async()=>{
  await resolve(d1,'en_revision',null);
  assert.equal((await row('traslados',trip)).estado,'disputa_abierta');
  assert.equal((await row('traslados',trip)).estado_operativo,'closed');
  assert.equal((await row('disputas',d1)).resolucion,null); assert.equal(await active(trip),0);
 });
 await t.test('una disputa independiente durante tránsito conserva el estado operativo',async()=>{
  const live=id(),d=id(); await db.query("insert into traslados(id,conductor_id,estado,estado_operativo) values($1,$2,'traslado_en_curso','in_transit')",[live,driver]);
  await db.query("insert into disputas(id,traslado_id,estado) values($1,$2,'abierta')",[d,live]);
  await resolve(d,'resuelta','en_contra',true); assert.equal((await row('traslados',live)).estado,'traslado_en_curso');
 });
 await t.test('un conductor ajeno no puede enviar lotes ni consultar el guard mediante INSERT',async()=>{
  await db.exec("select set_config('test.admin','false',false)");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id()]);
  await assert.rejects(batch(trip,[point()]),/no está autorizado/);
  await db.exec('set role authenticated');
  await assert.rejects(db.query('insert into tracking_sesiones(traslado_id,conductor_id) values($1,$2)',[trip,driver]),/Sin autorización/);
  await db.exec('reset role');
 });
});
