-- Una carga consume una solicitud de cotización, no una por vehículo.
-- El cálculo conserva las mismas funciones normativas del wizard individual.
create or replace function public.usuario_previsualizar_tarifas_masivas(p_filas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  f jsonb;
  resultados jsonb := '[]'::jsonb;
  permitido boolean;
  categoria public.categoria_tarifa_vehiculo;
  gama public.gama_vehiculo;
  condicion public.condicion_vehiculo;
  horario public.horario_traslado;
  dia public.dia_traslado;
  distancia numeric;
  horas numeric;
  momento timestamptz;
  tarifa numeric;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '42501'; end if;
  if jsonb_typeof(p_filas) is distinct from 'array' then raise exception 'Se requiere un lote'; end if;
  if jsonb_array_length(p_filas) not between 1 and 100 then raise exception 'El lote debe contener entre 1 y 100 filas'; end if;
  select r.permitido into permitido from public.consumir_rate_limit('tarifa-prev-masiva', 'uid:' || auth.uid()::text, 5, 60) r;
  if not coalesce(permitido, false) then raise exception 'RATE_LIMITED' using errcode = 'P0001'; end if;
  for f in select value from jsonb_array_elements(p_filas) loop
    distancia := (f->>'distanciaKm')::numeric;
    horas := (f->>'tiempoEstimadoHoras')::numeric;
    if distancia is null or horas is null or distancia < 0 or horas < 0 or distancia::text in ('NaN','Infinity','-Infinity') or horas::text in ('NaN','Infinity','-Infinity') then
      raise exception 'Distancia y tiempo inválidos';
    end if;
    select c.categoria_tarifa, c.gama into categoria, gama
      from public.catalogar_vehiculo_para_tarifa(btrim(f->>'marca'), btrim(f->>'modelo')) c;
    if categoria is null or gama is null then
      resultados := resultados || jsonb_build_array(jsonb_build_object('indice', f->'indice', 'disponible', false, 'motivo', 'La combinación marca/modelo no tiene una clasificación única en el catálogo.'));
      continue;
    end if;
    condicion := coalesce(nullif(f->>'condicion',''), 'seminueva')::public.condicion_vehiculo;
    momento := coalesce(nullif(f->>'fechaHora','')::timestamptz, now());
    horario := public.horario_desde_timestamp(momento);
    dia := public.dia_desde_timestamp(momento);
    tarifa := public.calcular_tarifa_traslado(categoria, public.rango_desde_distancia(distancia), gama, condicion, horario, dia, distancia, horas);
    resultados := resultados || jsonb_build_array(jsonb_build_object(
      'indice', f->'indice', 'disponible', true, 'tarifa', tarifa,
      'categoria_tarifa', categoria, 'gama', gama, 'condicion', condicion, 'horario', horario, 'dia', dia
    ));
  end loop;
  return resultados;
end;
$$;
revoke all on function public.usuario_previsualizar_tarifas_masivas(jsonb) from public, anon;
grant execute on function public.usuario_previsualizar_tarifas_masivas(jsonb) to authenticated;
