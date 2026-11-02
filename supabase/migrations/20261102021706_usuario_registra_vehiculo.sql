-- Alta de flota sin traslado. No se reabre el INSERT directo del cliente.
create function public.usuario_registra_vehiculo(p_id uuid, p_datos jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid;
  v_existente public.vehiculos%rowtype;
  v_marca text; v_modelo text; v_color text; v_placas text; v_vin text; v_alias text;
  v_anio integer; v_tipo public.tipo_vehiculo; v_transmision text;
  v_tarjeta boolean; v_verificacion boolean; v_circula boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida' using errcode='42501'; end if;
  select id into v_usuario from public.usuarios where auth_user_id=auth.uid() and estado_cuenta='activa';
  if v_usuario is null then raise exception 'Cuenta no disponible' using errcode='42501'; end if;
  if p_id is null or p_datos is null or jsonb_typeof(p_datos)<>'object' then raise exception 'Datos de vehículo inválidos'; end if;
  if exists (select 1 from jsonb_object_keys(p_datos) k where k not in
    ('alias','marca','modelo','anio','tipo','color','placas','vin','transmision','tiene_tarjeta_circulacion','tiene_verificacion','puede_circular_rodando')) then
    raise exception 'El registro contiene campos no permitidos';
  end if;
  if exists (select 1 from jsonb_each(p_datos) e where
    (e.key in ('alias','marca','modelo','tipo','color','placas','vin','transmision') and jsonb_typeof(e.value)<>'string') or
    (e.key in ('tiene_tarjeta_circulacion','tiene_verificacion','puede_circular_rodando') and jsonb_typeof(e.value)<>'boolean')) then
    raise exception 'Formato de vehículo inválido';
  end if;
  v_marca:=btrim(p_datos->>'marca'); v_modelo:=btrim(p_datos->>'modelo'); v_color:=btrim(p_datos->>'color');
  v_alias:=btrim(coalesce(p_datos->>'alias',''));
  v_placas:=upper(regexp_replace(coalesce(p_datos->>'placas',''),'[[:space:]-]','','g'));
  v_vin:=upper(btrim(coalesce(p_datos->>'vin','')));
  if v_marca is null or char_length(v_marca) not between 2 and 80 or v_modelo is null or char_length(v_modelo) not between 2 and 80
    or v_color is null or char_length(v_color) not between 2 and 40 or char_length(v_alias)>60 then raise exception 'Revisa marca, modelo, color y alias'; end if;
  if jsonb_typeof(p_datos->'anio') is distinct from 'number' then raise exception 'Año inválido'; end if;
  v_anio:=(p_datos->>'anio')::integer;
  if v_anio not between 1980 and extract(year from current_date)::integer+1 then raise exception 'Año inválido'; end if;
  v_tipo:=(p_datos->>'tipo')::public.tipo_vehiculo;
  v_transmision:=p_datos->>'transmision';
  if v_tipo is null or v_transmision is null or v_transmision not in ('manual','automatica','electrica') then raise exception 'Revisa tipo y transmisión'; end if;
  if (v_placas='' and v_vin='') or (v_placas<>'' and v_placas !~ '^[A-Z0-9]{5,10}$')
    or (v_vin<>'' and v_vin !~ '^[A-HJ-NPR-Z0-9]{17}$') then raise exception 'Indica placas o VIN válidos'; end if;
  v_tarjeta:=coalesce((p_datos->>'tiene_tarjeta_circulacion')::boolean,false);
  v_verificacion:=coalesce((p_datos->>'tiene_verificacion')::boolean,false);
  v_circula:=coalesce((p_datos->>'puede_circular_rodando')::boolean,false);
  perform pg_advisory_xact_lock(hashtextextended(v_usuario::text,0));
  select * into v_existente from public.vehiculos where id=p_id;
  if found then
    if v_existente.usuario_id<>v_usuario then raise exception 'Solicitud de registro inválida' using errcode='42501'; end if;
    if (v_existente.alias,v_existente.marca,v_existente.modelo,v_existente.color,v_existente.anio,v_existente.tipo,v_existente.transmision,
      v_existente.placas,v_existente.vin,v_existente.tiene_tarjeta_circulacion,v_existente.tiene_verificacion,v_existente.puede_circular_rodando)
      is distinct from (nullif(v_alias,''),v_marca,v_modelo,v_color,v_anio,v_tipo,v_transmision,nullif(v_placas,''),nullif(v_vin,''),v_tarjeta,v_verificacion,v_circula)
      then raise exception 'La solicitud anterior contiene otros datos'; end if;
    return p_id;
  end if;
  if exists (select 1 from public.vehiculos where usuario_id=v_usuario and (
    (v_placas<>'' and upper(regexp_replace(coalesce(placas,''),'[[:space:]-]','','g'))=v_placas) or
    (v_vin<>'' and upper(btrim(coalesce(vin,'')))=v_vin))) then raise exception 'El vehículo ya está registrado en tu cuenta'; end if;
  insert into public.vehiculos(id,usuario_id,alias,marca,modelo,anio,tipo,color,placas,vin,transmision,tiene_placas,tiene_tarjeta_circulacion,tiene_verificacion,puede_circular_rodando)
    values(p_id,v_usuario,nullif(v_alias,''),v_marca,v_modelo,v_anio,v_tipo,v_color,nullif(v_placas,''),nullif(v_vin,''),v_transmision,v_placas<>'',v_tarjeta,v_verificacion,v_circula);
  insert into public.registro_auditoria(evento,actor,actor_id,datos)
    values('modificacion_vehiculo','usuario',v_usuario,jsonb_build_object('vehiculo_id',p_id,'accion','registro_desde_perfil'));
  return p_id;
end;
$$;
revoke all on function public.usuario_registra_vehiculo(uuid,jsonb) from public, anon;
grant execute on function public.usuario_registra_vehiculo(uuid,jsonb) to authenticated;
