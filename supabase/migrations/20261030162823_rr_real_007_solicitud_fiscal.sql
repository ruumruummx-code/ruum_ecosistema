create table private.configuracion_emision_fiscal (
  singleton boolean primary key default true check(singleton), proveedor text,
  ambiente text check(ambiente in ('pruebas','produccion')), emisor_configurado boolean not null default false,
  activo boolean not null default false
);
insert into private.configuracion_emision_fiscal(singleton) values(true);
create table public.solicitudes_factura (
  id uuid primary key default gen_random_uuid(),traslado_id uuid not null unique references public.traslados(id),
  usuario_id uuid not null references public.usuarios(id), estado text not null check(estado in ('solicitada','en_proceso','rechazada','emitida')),
  monto numeric(12,2) not null, moneda text not null default 'mxn' check(moneda='mxn'), receptor jsonb not null,
  error_codigo text,error_detalle text,errores jsonb not null default '[]', intentos integer not null default 1,
  proveedor text,ambiente text check(ambiente in ('pruebas','produccion')), proveedor_id text,uuid_fiscal uuid,
  xml_ruta text,pdf_ruta text,respuesta_proveedor jsonb,correo_entregado_en timestamptz,
  creada_en timestamptz not null default now(),actualizada_en timestamptz not null default now(),
  constraint factura_emitida_con_comprobante check(estado<>'emitida' or
    (uuid_fiscal is not null and nullif(xml_ruta,'') is not null and nullif(pdf_ruta,'') is not null
     and nullif(proveedor_id,'') is not null and nullif(proveedor,'') is not null and ambiente is not null and respuesta_proveedor is not null))
);
create unique index solicitud_factura_uuid_unico on public.solicitudes_factura(uuid_fiscal) where uuid_fiscal is not null;
create unique index solicitud_factura_proveedor_unico on public.solicitudes_factura(proveedor,ambiente,proveedor_id) where proveedor_id is not null;
alter table public.solicitudes_factura enable row level security;
revoke all on public.solicitudes_factura from public,anon,authenticated;
grant select on public.solicitudes_factura to authenticated;
grant all on public.solicitudes_factura to service_role;
create policy solicitud_fiscal_visible on public.solicitudes_factura for select to authenticated using(public.es_admin() or
  usuario_id in(select id from public.usuarios where auth_user_id=auth.uid()));

create function public.solicitar_factura_traslado(p_traslado_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_t public.traslados%rowtype; v_u public.usuarios%rowtype; v_receptor jsonb; v_config private.configuracion_emision_fiscal%rowtype;
  v_s public.solicitudes_factura%rowtype; v_codigo text; v_error text; v_monto numeric;
begin
  select t.* into v_t from public.traslados t join public.usuarios u on u.id=t.usuario_id
  where t.id=p_traslado_id and u.auth_user_id=auth.uid() for update of t;
  if not found then raise exception using errcode='42501',message='Traslado no disponible para esta cuenta.'; end if;
  select * into v_s from public.solicitudes_factura where traslado_id=p_traslado_id;
  if v_s.estado in ('emitida','solicitada','en_proceso') then return to_jsonb(v_s); end if;
  select * into v_u from public.usuarios where id=v_t.usuario_id;
  v_receptor:=to_jsonb(v_u);
  if v_u.empresa_id is not null then
    select to_jsonb(e) into v_receptor from public.empresas e where id=v_u.empresa_id;
  end if;
  v_receptor:=jsonb_build_object('rfc',v_receptor->>'rfc','razon_social',v_receptor->>'razon_social',
    'regimen_fiscal',v_receptor->>'regimen_fiscal','codigo_postal_fiscal',v_receptor->>'codigo_postal_fiscal',
    'uso_cfdi',v_receptor->>'uso_cfdi','correo_facturacion',v_receptor->>'correo_facturacion');
  v_monto:=coalesce(v_t.precio_final,v_t.precio_cotizado);
  select * into v_config from private.configuracion_emision_fiscal where singleton;
  if v_t.estado::text<>'servicio_cerrado' or not exists(select 1 from public.pagos where traslado_id=p_traslado_id and estado='completado' and monto=v_monto) then
    v_codigo:='traslado_no_elegible';v_error:='La solicitud requiere servicio cerrado y pago completado por el importe correspondiente.';
  elsif exists(select 1 from jsonb_each_text(v_receptor) where nullif(btrim(value),'') is null)
    or coalesce(v_receptor->>'codigo_postal_fiscal','') !~ '^[0-9]{5}$'
    or coalesce(v_receptor->>'correo_facturacion','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    v_codigo:='datos_fiscales_incompletos';v_error:='Completa y verifica los datos fiscales del receptor antes de solicitar emisión.';
  elsif not v_config.activo or not v_config.emisor_configurado or v_config.proveedor is null then
    v_codigo:='emision_no_configurada';v_error:='La emisión fiscal aún no está configurada. Facturación pendiente/no ejercitada.';
  end if;
  insert into public.solicitudes_factura(traslado_id,usuario_id,estado,monto,receptor,error_codigo,error_detalle,errores,proveedor,ambiente)
  values(p_traslado_id,v_u.id,case when v_codigo is null then 'solicitada' else 'rechazada' end,v_monto,v_receptor,v_codigo,v_error,
    case when v_codigo is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('codigo',v_codigo,'detalle',v_error,'fecha',now())) end,v_config.proveedor,v_config.ambiente)
  on conflict(traslado_id) do update set estado=excluded.estado,monto=excluded.monto,receptor=excluded.receptor,
    error_codigo=excluded.error_codigo,error_detalle=excluded.error_detalle,errores=solicitudes_factura.errores||excluded.errores,
    intentos=solicitudes_factura.intentos+1,actualizada_en=now(),proveedor=excluded.proveedor,ambiente=excluded.ambiente
  returning * into v_s;
  return to_jsonb(v_s);
end $$;
revoke all on function public.solicitar_factura_traslado(uuid) from public,anon;
grant execute on function public.solicitar_factura_traslado(uuid) to authenticated;
