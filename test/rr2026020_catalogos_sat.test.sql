-- Ejecutar con la migración RR-2026-020 presente. Todas las pruebas se revierten.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(1);
select lives_ok($test$
do $$
declare
  v_auth uuid := gen_random_uuid();
  v_usuario uuid;
  v_empresa uuid;
begin
  assert (select count(*) from public.sat_regimenes_fiscales where vigente_hasta is null) = 19;
  assert (select count(*) from public.sat_usos_cfdi where vigente_hasta is null) = 24;
  assert not has_table_privilege('authenticated', 'public.sat_regimenes_fiscales', 'INSERT');
  assert has_table_privilege('anon', 'public.sat_usos_cfdi', 'SELECT');

  insert into auth.users(id, raw_user_meta_data) values(v_auth, '{}'::jsonb);
  insert into public.usuarios(auth_user_id, tipo_cuenta) values(v_auth, 'personal') returning id into v_usuario;
  perform set_config('request.jwt.claim.sub', v_auth::text, true);
  perform public.actualizar_datos_facturacion('ABC010101AB1', 'Prueba SAT', '601', '01234', 'G03', 'sat-test@example.invalid');
  assert (select regimen_fiscal = '601' and uso_cfdi = 'G03' from public.usuarios where id = v_usuario);
  begin
    perform public.actualizar_datos_facturacion('ABC010101AB1', 'Prueba SAT', '601', '01234', 'D01', null);
    raise exception 'Se aceptó un uso incompatible';
  exception when check_violation then null;
  end;
  assert (select uso_cfdi = 'G03' from public.usuarios where id = v_usuario);
  begin
    update public.usuarios set regimen_fiscal = '999' where id = v_usuario;
    raise exception 'Se aceptó una clave inexistente';
  exception when check_violation then null;
  end;
  begin
    update public.usuarios set rfc = 'ABCD010101AB1' where id = v_usuario;
    raise exception 'Se aceptó un régimen moral para persona física';
  exception when check_violation then null;
  end;
  update public.usuarios set rfc = 'ABCD010101AB1', regimen_fiscal = '605', uso_cfdi = 'CN01' where id = v_usuario;
  assert (select uso_cfdi = 'CN01' from public.usuarios where id = v_usuario);

  insert into public.empresas(nombre, rfc, regimen_fiscal, uso_cfdi) values('Prueba SAT', 'ABC010101AB1', '626', 'CP01') returning id into v_empresa;
  begin
    update public.empresas set uso_cfdi = 'D01' where id = v_empresa;
    raise exception 'Se aceptó un uso incompatible en empresa';
  exception when check_violation then null;
  end;
  raise notice 'RR-2026-020: catálogo, RPC, rollback, tipo de persona, empresa y permisos correctos';
end;
$$;
$test$, 'Catálogos SAT, RPC atómica, rechazo de claves incompatibles y permisos');
select * from finish();
rollback;
