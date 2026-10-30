import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.RR_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scalar=async(q,p=[])=>Object.values((await db.query(q,p)).rows[0])[0];
await db.exec(`
create role anon;create role authenticated;create role service_role;
create schema private;create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table admins(id uuid primary key,auth_user_id uuid);
create function es_admin() returns boolean language sql stable as $$select exists(select 1 from admins where auth_user_id=auth.uid())$$;
create function admin_tiene_permiso(text) returns boolean language sql stable as $$select es_admin()$$;
create type estado_asignacion as enum('pendiente','ofrecida','aceptada','activa','completada','cancelada','rechazada');
create table conductores(id uuid primary key,auth_user_id uuid,nivel integer default 4);
create table empresas(id uuid primary key,rfc text,razon_social text,regimen_fiscal text,codigo_postal_fiscal text,uso_cfdi text,correo_facturacion text);
create table usuarios(id uuid primary key,auth_user_id uuid,empresa_id uuid,rfc text,razon_social text,regimen_fiscal text,codigo_postal_fiscal text,uso_cfdi text,correo_facturacion text);
create table payouts_conductor(id uuid primary key default gen_random_uuid(),conductor_id uuid,periodo_inicio date,periodo_fin date,monto_bruto numeric,ajustes numeric,monto_neto numeric,estado text);
create table traslados(id uuid primary key,conductor_id uuid,usuario_id uuid,estado text,precio_final numeric,precio_cotizado numeric default 2381.67,ganancia_conductor_congelada numeric,cerrado_en timestamptz,actualizado_en timestamptz default now(),payout_id uuid,origen_lat numeric,origen_lng numeric,fecha_hora_programada timestamptz,nivel_requerido integer default 1);
create table registro_auditoria(traslado_id uuid,evento text,actor text,actor_id uuid,datos jsonb);
create table auditoria_admin_seguridad(auth_user_id uuid,admin_id uuid,tipo text,recurso text,accion text,datos jsonb);
create table pagos(id uuid default gen_random_uuid(),traslado_id uuid,estado text,monto numeric);
create table asignaciones(id uuid primary key default gen_random_uuid(),traslado_id uuid,conductor_id uuid,estado estado_asignacion,origen text default 'manual',metadata jsonb default '{}',creado_en timestamptz default now(),ofrecida_en timestamptz,aceptada_en timestamptz,completada_en timestamptz,cancelada_en timestamptz,motivo text);
create unique index on asignaciones(traslado_id) where estado in ('pendiente','ofrecida','aceptada','activa');
create table competencias_asignacion(id uuid primary key default gen_random_uuid(),traslado_id uuid,estado text default 'abierta',politica_version integer,cierra_en timestamptz,resuelta_en timestamptz,detalle_resolucion jsonb,conductor_seleccionado_id uuid);
create table solicitudes_asignacion(id uuid primary key default gen_random_uuid(),competencia_id uuid,traslado_id uuid,conductor_id uuid,estado text default 'solicitada',solicitada_en timestamptz default now(),categoria_puntualidad text,puntualidad_porcentaje numeric,puntualidad_muestra integer,asignaciones_7d integer,ultima_asignacion_en timestamptz,clave_desempate text,ubicacion_lat numeric,ubicacion_lng numeric,distancia_origen_km numeric,eta_aproximado_min integer,viabilidad text,elegibilidad_snapshot jsonb,unique(competencia_id,conductor_id));
create table private.politica_asignacion(id boolean primary key,version integer,ventana_solicitud_segundos integer,velocidad_aproximacion_kmh numeric,tolerancia_puntualidad_min integer,ubicacion_requerida_programados boolean);
insert into private.politica_asignacion values(true,1,60,40,10,false);
-- Eligibility is a fixture dependency; request, winner resolution and new guards are real SQL.
create function private.evaluar_elegibilidad_asignacion(p_t uuid,p_c uuid) returns jsonb language sql set search_path=public,pg_temp as $$ select jsonb_build_object('elegible',exists(select 1 from conductores c join traslados t on t.id=p_t where c.id=p_c and c.nivel>=t.nivel_requerido and t.estado='pendiente_de_conductor' and t.conductor_id is null and not exists(select 1 from traslados x where x.conductor_id=c.id and x.id<>p_t and x.estado not in ('servicio_cerrado','servicio_cancelado','traslado_fallido'))),'motivos',jsonb_build_array('elegibilidad_fixture')) $$;
create function private.resumen_puntualidad_conductor(uuid) returns table(categoria text,porcentaje numeric,muestra integer) language sql as $$select 'sin_datos'::text,1::numeric,0$$;
create function private.estadisticas_equidad_conductor(uuid) returns table(asignaciones_7d integer,ultima_asignacion_en timestamptz) language sql as $$select 0,null::timestamptz$$;
create function calcular_pago_conductor_traslado(uuid,uuid) returns numeric language sql as $$select 952.67::numeric$$;
create function verificar_cadena_custodia(uuid) returns boolean language sql as $$select true$$;
create table tracking_sesiones(traslado_id uuid,estado text,finalizada_en timestamptz);
`);
const core=read('supabase/migrations/20260902131724_asignacion_automatica_concer.sql');
await db.exec(core.slice(core.indexOf('create or replace function private.abrir_competencia_asignacion('),core.indexOf('create or replace function private.trigger_abrir_competencia_asignacion(')));
await db.exec(core.slice(core.indexOf('create or replace function public.conductor_solicita_asignacion('),core.indexOf('create or replace function private.confirmar_puntualidad_vencida(')));
for(const p of ['20261030162822_rr_real_006_asignacion_autonoma.sql','20261030162823_rr_real_007_solicitud_fiscal.sql','20261030162824_rr_real_008_009_cierre_finanzas.sql']) await db.exec(read('supabase/migrations/'+p));
const a=crypto.randomUUID(),b=crypto.randomUUID(),u=crypto.randomUUID(),ua=crypto.randomUUID(),ub=crypto.randomUUID(),uu=crypto.randomUUID(),admin=crypto.randomUUID();
await db.query('insert into conductores(id,auth_user_id) values($1,$2),($3,$4)',[a,ua,b,ub]);
await db.query('insert into usuarios(id,auth_user_id) values($1,$2)',[u,uu]);
await db.query('insert into admins values($1,$1)',[admin]);
const actor=(id)=>scalar("select set_config('request.jwt.claim.sub',$1,false)",[id]);
async function trip(state='pendiente_de_conductor') {const id=crypto.randomUUID();await db.query('insert into traslados(id,usuario_id,estado) values($1,$2,$3)',[id,u,state]);return id;}
test('RR-REAL-006/007/008/009 isolated server acceptance',async(t)=>{
  const manual=await trip(),offer=crypto.randomUUID();
  await db.query("insert into asignaciones(id,traslado_id,conductor_id,estado) values($1,$2,$3,'ofrecida')",[offer,manual,a]);
  await t.test('directed offer exposes its ID and accepts it exactly once',async()=>{
    await actor(ua);assert.equal((await scalar('select consultar_oportunidad_asignacion($1)',[manual])).asignacion_id,offer);
    await scalar('select aceptar_asignacion($1)',[offer]);await scalar('select aceptar_asignacion($1)',[offer]);
    assert.equal(await scalar('select conductor_id from traslados where id=$1',[manual]),a);
    assert.equal(await scalar("select count(*)::int from registro_auditoria where evento='aceptacion_asignacion'"),1);
    await actor(ub);await assert.rejects(scalar('select aceptar_asignacion($1)',[offer]),/Solo el conductor/);
  });
  await t.test('occupied driver cannot take another transfer and expired offers fail',async()=>{
    const another=await trip(),of=crypto.randomUUID();
    await db.query("insert into asignaciones(id,traslado_id,conductor_id,estado) values($1,$2,$3,'ofrecida')",[of,another,a]);
    await actor(ua);await assert.rejects(scalar('select aceptar_asignacion($1)',[of]),/No elegible/);
    await db.query("update asignaciones set expira_en=now()-interval '1 second' where id=$1",[of]);
    await assert.rejects(scalar('select aceptar_asignacion($1)',[of]),/expiró/);
    await db.query("update traslados set estado='servicio_cancelado' where id=$1",[manual]);
  });
  const open=await trip();
  await t.test('open competition persists one request on retry, resolves one winner and links assignment',async()=>{
    await actor(ua);const first=await scalar('select conductor_solicita_asignacion($1)',[open]);
    await scalar('select conductor_solicita_asignacion($1)',[open]);
    await actor(ub);await scalar('select conductor_solicita_asignacion($1)',[open]);
    assert.equal(await scalar('select count(*)::int from solicitudes_asignacion where traslado_id=$1',[open]),2);
    await db.query("update competencias_asignacion set cierra_en=now()-interval '1 second' where id=$1",[first.competencia_id]);
    assert.equal(await scalar('select private.resolver_competencia_asignacion($1)',[first.competencia_id]),true);
    assert.equal(await scalar('select private.resolver_competencia_asignacion($1)',[first.competencia_id]),false);
    assert.equal(await scalar("select count(*)::int from solicitudes_asignacion where traslado_id=$1 and estado='seleccionada'",[open]),1);
    assert.equal(await scalar("select count(*)::int from asignaciones where traslado_id=$1 and origen='competencia'",[open]),1);
    await assert.rejects(scalar('select conductor_solicita_asignacion($1)',[open]),/no está disponible/);
  });
  const closed=await trip('entrega_confirmada');
  await db.query("update traslados set estado='servicio_cerrado',conductor_id=$2,ganancia_conductor_congelada=952.67,cerrado_en='2026-10-29T20:00:00Z' where id=$1",[closed,a]);
  await db.query("insert into pagos(traslado_id,estado,monto) values($1,'completado',2381.67)",[closed]);
  await t.test('incomplete fiscal data persists a rejection; retries keep one request',async()=>{
    await actor(uu);const res=await scalar('select solicitar_factura_traslado($1)',[closed]);
    assert.equal(res.estado,'rechazada');assert.equal(res.error_codigo,'datos_fiscales_incompletos');
    const again=await scalar('select solicitar_factura_traslado($1)',[closed]);assert.equal(res.id,again.id);
    assert.equal(await scalar('select count(*)::int from solicitudes_factura'),1);
  });
  await t.test('configured receiver with no issuer/provider returns persistent controlled rejection',async()=>{
    await db.query("update usuarios set rfc='RFC_DE_PRUEBA',razon_social='Receptor prueba',regimen_fiscal='601',codigo_postal_fiscal='01000',uso_cfdi='G03',correo_facturacion='fiscal@example.test' where id=$1",[u]);
    const res=await scalar('select solicitar_factura_traslado($1)',[closed]);assert.equal(res.estado,'rechazada');assert.equal(res.error_codigo,'emision_no_configurada');assert.equal(res.uuid_fiscal,null);
    await assert.rejects(db.exec("update solicitudes_factura set estado='emitida'"),/factura_emitida_con_comprobante/);
    await actor(ua);await assert.rejects(scalar('select solicitar_factura_traslado($1)',[closed]),/esta cuenta/);
  });
  await t.test('cut is idempotent, has an explicit single transfer link and does not claim external payment',async()=>{
    await actor(admin);const first=await scalar("select admin_generar_payouts_periodo('2026-10-25','2026-10-31')");assert.equal(first.payouts_generados,1);
    const again=await scalar("select admin_generar_payouts_periodo('2026-10-25','2026-10-31')");assert.equal(again.payouts_generados,0);
    assert.equal(await scalar('select count(*)::int from payout_traslados where traslado_id=$1',[closed]),1);
    assert.equal(await scalar('select monto_neto::text from payouts_conductor'),'952.67');
    assert.equal(await scalar('select pagado_en from payouts_conductor'),null);
    assert.equal(await scalar('select fecha_prevista from payouts_conductor'),null);
  });
  await t.test('definitive total retains its source and rejects post-close edits',async()=>{
    assert.equal(await scalar('select total::text from totales_definitivos_traslado where traslado_id=$1',[closed]),'2381.67');
    assert.equal(await scalar('select fuente from totales_definitivos_traslado where traslado_id=$1',[closed]),'cotizacion_aceptada');
    await assert.rejects(db.query('update traslados set precio_final=1 where id=$1',[closed]),/congelado/);
  });
  await t.test('reception proposal compiles and fails closed until operations defines its policy',async()=>{
    await db.exec(read('supabase/proposals/rr_real_009_recepcion_por_confirmar.sql'));
    const c=crypto.randomUUID(),cu=crypto.randomUUID(),id=await trip('evidencia_final_completada');
    await db.query('insert into conductores(id,auth_user_id) values($1,$2)',[c,cu]);
    await db.query('update traslados set conductor_id=$2 where id=$1',[id,c]);await actor(cu);
    await assert.rejects(scalar("select registrar_declaracion_recepcion($1,'Persona receptora')",[id]),/pendiente de definición/);
    // Fixture policy approval only; the proposal is not applied to the live project.
    await db.exec('update private.politica_recepcion set confirmada_por_operacion=true,requiere_pin_firma=true');
    await assert.rejects(scalar("select registrar_declaracion_recepcion($1,'Persona receptora')",[id]),/exige PIN/);
    await db.exec('update private.politica_recepcion set requiere_pin_firma=false');
    await scalar("select registrar_declaracion_recepcion($1,'Persona receptora')",[id]);
    await scalar("select registrar_declaracion_recepcion($1,'Persona receptora')",[id]);
    assert.equal(await scalar('select count(*)::int from confirmaciones_recepcion where traslado_id=$1',[id]),1);
    assert.equal(await scalar('select mecanismo from confirmaciones_recepcion where traslado_id=$1',[id]),'declaracion_conductor');
    assert.equal(await scalar('select verificada from confirmaciones_recepcion where traslado_id=$1',[id]),false);
  });
  await db.close();
});
