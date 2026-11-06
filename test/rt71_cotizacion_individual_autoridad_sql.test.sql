-- Contrato antifraude: solo el servidor emite una cotización; el usuario consume
-- el mismo payload una vez. Ejecutar con supabase test db test/rt71_*.test.sql.
create extension if not exists pgtap with schema extensions;
begin;
select plan(27);
create or replace function pg_temp.cotizacion_individual_regresion() returns setof text language plpgsql as $$
declare
  v_auth uuid := gen_random_uuid();
  v_otro_auth uuid := gen_random_uuid();
  v_usuario uuid;
  v_otro_usuario uuid;
  v_vehiculo uuid;
  v_traslado jsonb;
  v_snapshot jsonb;
  v_expirado jsonb;
  v_resultado jsonb;
  v_reintento jsonb;
  v_clave uuid := gen_random_uuid();
  v_rechazado boolean;
  v_cambio jsonb;
  v_fallo jsonb;
  v_nuevo jsonb := '{"tipo":"sedan","transmision":"manual","marca":"Nissan","modelo":"Versa","anio":2024,"color":"gris","placas":"TAR-FAIL","vin":"VIN-TAR-FAIL","estado_general_declarado":"Buen estado","tiene_tarjeta_circulacion":true,"tiene_verificacion":true,"tiene_placas":true,"puede_circular_rodando":true}';
begin
  insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
    (v_auth,v_auth||'@tarifa.test','{}','{}',now(),now()),
    (v_otro_auth,v_otro_auth||'@tarifa.test','{}','{}',now(),now());
  insert into public.usuarios(auth_user_id,tipo_cuenta,rol,estado_verificacion)
    values(v_auth,'personal','personal','verificado') returning id into v_usuario;
  insert into public.usuarios(auth_user_id,tipo_cuenta,rol,estado_verificacion)
    values(v_otro_auth,'personal','personal','verificado') returning id into v_otro_usuario;
  insert into public.vehiculos(usuario_id,tipo,marca,modelo,anio,placas,tiene_tarjeta_circulacion,
    tiene_verificacion,tiene_placas,puede_circular_rodando,categoria_tarifa,gama,condicion)
    values(v_usuario,'van','Regresion','Camion',2024,'TAR-071',true,true,true,true,'camion','entrada','seminueva') returning id into v_vehiculo;
  -- Configuración determinista en transacción: ninguna tarifa real se modifica.
  update public.tarifas_vehiculo set base=7200,por_km=16 where categoria='camion' and rango='rango_4';
  update public.tarifas_config set tarifa_hora=21.5,tope_factor_variable=2 where id=true;
  update public.tarifas_gama set factor=1 where gama='entrada';
  update public.tarifas_condicion set factor=1 where condicion='seminueva';
  update public.tarifas_horario set factor=1 where horario='diurno';
  update public.tarifas_dia set factor=1 where dia='entre_semana';
  v_traslado := jsonb_build_object('contacto_entrega_nombre','Entrega','contacto_entrega_telefono','+525500000001',
    'contacto_recepcion_nombre','Recepcion','contacto_recepcion_telefono','+525500000002',
    'origen_lat',19.43,'origen_lng',-99.13,'origen_direccion','Origen de prueba','origen_ciudad','CDMX',
    'destino_lat',20.1,'destino_lng',-99.5,'destino_direccion','Destino de prueba','destino_ciudad','Destino',
    'modalidad_programacion','programado','fecha_hora_programada',date_trunc('week',now()+interval '14 days')+interval '12 hours',
    'distancia_km',100,'tiempo_estimado_horas',3,'tipo_ruta','foraneo');

  return next ok(not has_function_privilege('authenticated','public.servidor_cotizar_traslado_individual(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'usuario no puede emitir cotizaciones');
  return next ok(not has_function_privilege('anon','public.servidor_cotizar_traslado_individual(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'anon no puede emitir cotizaciones');
  return next ok(has_function_privilege('service_role','public.servidor_cotizar_traslado_individual(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'servidor sí puede emitir cotizaciones');
  return next ok(not has_table_privilege('authenticated','private.cotizaciones_individuales','SELECT,INSERT,UPDATE,DELETE'),'usuario no puede leer ni modificar evidencia privada');
  return next ok(coalesce(not has_function_privilege('authenticated',to_regprocedure('public.usuario_crea_traslado(uuid,jsonb,jsonb,uuid)'), 'EXECUTE'), true),'firma antigua ausente o sin permisos para eludir la cotización');

  perform set_config('request.jwt.claim.sub',v_auth::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_auth,'role','authenticated')::text,true);
  begin
    perform public.servidor_cotizar_traslado_individual(v_auth,v_vehiculo,null,v_traslado,'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'JWT de usuario no puede emitir aunque invoque el cuerpo privilegiado');
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  v_snapshot:=public.servidor_cotizar_traslado_individual(v_auth,v_vehiculo,null,v_traslado,'[]');
  return next is((v_snapshot->>'monto')::numeric,8864.50::numeric,'camión 100 km usa rango 4: no cobra los 4864.50 del cálculo duplicado');
  return next ok(v_snapshot->'inputs'->>'categoria'='camion','respeta categoría guardada; no usa ligero_b por defecto');
  update public.tarifas_config set tarifa_hora=100 where id=true;
  v_cambio:=public.servidor_cotizar_traslado_individual(v_auth,v_vehiculo,null,v_traslado,'[]');
  return next is((v_cambio->>'monto')::numeric,9100::numeric,'nueva cotización usa configuración administrativa vigente');
  begin
    perform public.servidor_cotizar_traslado_individual(v_otro_auth,v_vehiculo,null,v_traslado,'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'no cotiza vehículo ajeno');
  begin
    perform public.servidor_cotizar_traslado_individual(v_auth,null,'{"marca":"Desconocida71","modelo":"SinClasificacion71"}',v_traslado,'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'catálogo desconocido bloquea en vez de abaratar');

  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_auth,'role','authenticated')::text,true);
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado,gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'RPC directo sin cotización se rechaza');
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot||'{"monto":1}'),gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'alterar monto a un peso se rechaza');
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot)||'{"distancia_km":1}',gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'alterar distancia del payload se rechaza');
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot)||'{"destino_direccion":"Otro destino"}',gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'cambiar destino después de cotizar se rechaza');
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),gen_random_uuid(),'[{"tipo":"escala"}]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'añadir o cambiar paradas después de cotizar se rechaza');
  perform set_config('request.jwt.claim.sub',v_otro_auth::text,true);
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'otro usuario no puede consumir la cotización');
  perform set_config('request.jwt.claim.sub',v_auth::text,true);
  update public.vehiculos set condicion='rescate_mecanico' where id=v_vehiculo;
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'cambiar condición del vehículo guardado invalida la cotización');
  update public.vehiculos set condicion='seminueva' where id=v_vehiculo;
  -- Reemitir después de editar el vehículo (incluye actualizado_en en esquema real).
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.tarifas_config set tarifa_hora=21.5 where id=true;
  v_snapshot:=public.servidor_cotizar_traslado_individual(v_auth,v_vehiculo,null,v_traslado,'[]');
  v_expirado:=public.servidor_cotizar_traslado_individual(v_auth,v_vehiculo,null,v_traslado,'[]');
  update private.cotizaciones_individuales set expira_en=now()-interval '1 second' where id=(v_expirado->>'nonce')::uuid;
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_expirado),gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'cotización expirada no autoriza crear traslado');
  v_fallo:=public.servidor_cotizar_traslado_individual(v_auth,null,v_nuevo,v_traslado,'[{"tipo":"desconocida"}]');
  begin
    perform public.usuario_crea_traslado(null,v_nuevo,v_traslado||jsonb_build_object('snapshot_tarifa',v_fallo),gen_random_uuid(),'[{"tipo":"desconocida"}]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'fallo de persistencia se rechaza después de validar cotización');
  return next ok((select traslado_id is null from private.cotizaciones_individuales where id=(v_fallo->>'nonce')::uuid),'fallo de creación no consume cotización');
  return next ok(not exists(select 1 from public.vehiculos where usuario_id=v_usuario and placas='TAR-FAIL'),'fallo de creación revierte vehículo y traslado sin dejar huérfanos');
  v_resultado:=public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),v_clave,'[]');
  return next is((v_resultado->>'precio_cotizado')::numeric,8864.50::numeric,'creación persiste el importe autorizado');
  return next ok((select traslado_id=(v_resultado->>'id')::uuid from private.cotizaciones_individuales where id=(v_snapshot->>'nonce')::uuid),'cotización consumida en la misma transacción');
  v_reintento:=public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),v_clave,'[]');
  return next ok(v_reintento->>'id'=v_resultado->>'id','reintento con misma clave es idempotente');
  begin
    perform public.usuario_crea_traslado(v_vehiculo,null,v_traslado||jsonb_build_object('snapshot_tarifa',v_snapshot),gen_random_uuid(),'[]'); v_rechazado:=false;
  exception when others then v_rechazado:=true; end;
  return next ok(v_rechazado,'replay con otra clave idempotente se rechaza');
  return next is((select count(*) from public.traslados where usuario_id=v_usuario)::numeric,1::numeric,'rechazos y reintentos no crean traslados extra');
end;
$$;
select * from pg_temp.cotizacion_individual_regresion();
select * from finish();
rollback;
