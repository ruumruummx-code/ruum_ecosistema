begin;
select plan(7);

-- 1. Verificar índices en public.traslados
select has_index('public', 'traslados', 'traslados_usuario_id_idx', 'traslados tiene índice en usuario_id');
select has_index('public', 'traslados', 'traslados_conductor_id_idx', 'traslados tiene índice en conductor_id');
select has_index('public', 'traslados', 'traslados_estado_idx', 'traslados tiene índice en estado');
select has_index('public', 'traslados', 'traslados_usuario_creado_idx', 'traslados tiene índice en (usuario_id, creado_en desc)');

-- 2. Permisos en usuario_previsualizar_tarifa
select function_privs_are(
  'public',
  'usuario_previsualizar_tarifa',
  ARRAY['text', 'text', 'numeric', 'numeric', 'timestamp with time zone', 'public.condicion_vehiculo'],
  'authenticated',
  ARRAY['EXECUTE'],
  'authenticated puede ejecutar usuario_previsualizar_tarifa'
);

-- 3. Previsualizar tarifa funciona correctamente
select lives_ok(
  $$ select public.usuario_previsualizar_tarifa('Nissan', 'Versa', 20.0, 1.0) $$,
  'usuario_previsualizar_tarifa calcula la cotizacion sin error'
);

-- 4. Rate-limit en usuario_previsualizar_tarifa dispara excepción al superar 30 llamadas
do $$
declare
  i integer;
  excedido boolean := false;
begin
  -- Consumir los 30 intentos del bucket para una clave fija
  for i in 1..35 loop
    begin
      perform public.usuario_previsualizar_tarifa('Nissan', 'Versa', 20.0, 1.0);
    exception when others then
      if sqlerrm like '%RATE_LIMITED%' then
        excedido := true;
        exit;
      end if;
    end;
  end loop;

  if not excedido then
    raise exception 'El rate limit no disparo RATE_LIMITED tras mas de 30 llamadas.';
  end if;
end;
$$;

select pass('usuario_previsualizar_tarifa lanza RATE_LIMITED al superar la cuota por minuto');

select * from finish();
rollback;
