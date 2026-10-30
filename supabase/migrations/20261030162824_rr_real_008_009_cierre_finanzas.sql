-- Devengo/corte y transferencia son hechos separados.
alter table public.payouts_conductor add column if not exists fecha_prevista date;
alter table public.payouts_conductor add column if not exists pagado_en timestamptz;
alter table public.payouts_conductor add column if not exists referencia_externa_validada text;
create table public.payout_traslados (
  traslado_id uuid primary key references public.traslados(id),payout_id uuid not null references public.payouts_conductor(id),
  ganancia_congelada numeric(12,2) not null,ajuste numeric(12,2) not null default 0,
  agregado_en timestamptz not null default now()
);
alter table public.payout_traslados enable row level security;
revoke all on public.payout_traslados from public,anon,authenticated;
grant select on public.payout_traslados to authenticated;
create policy detalle_corte_visible on public.payout_traslados for select to authenticated using(public.es_admin() or exists(
  select 1 from public.payouts_conductor p join public.conductores c on c.id=p.conductor_id where p.id=payout_id and c.auth_user_id=auth.uid()));
insert into public.payout_traslados(traslado_id,payout_id,ganancia_congelada)
select id,payout_id,ganancia_conductor_congelada from public.traslados where payout_id is not null and ganancia_conductor_congelada is not null on conflict do nothing;

create or replace function public.admin_generar_payouts_periodo(p_periodo_inicio date,p_periodo_fin date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_admin uuid;v_c uuid;v_id uuid;v_ids uuid[];v_bruto numeric;v_result jsonb:='[]';
begin
  if not public.admin_tiene_permiso('pagos:ejecutar') then raise exception using errcode='42501',message='PERMISO_INSUFICIENTE'; end if;
  if p_periodo_inicio is null or p_periodo_fin is null or p_periodo_fin<p_periodo_inicio then raise exception 'PERIODO_INVALIDO'; end if;
  select id into strict v_admin from public.admins where auth_user_id=auth.uid();
  perform pg_advisory_xact_lock(hashtextextended('generacion_cortes_conductor',0));
  for v_c in select distinct conductor_id from public.traslados where estado='servicio_cerrado' and payout_id is null and conductor_id is not null
    and ganancia_conductor_congelada is not null and (cerrado_en at time zone 'America/Mexico_City')::date between p_periodo_inicio and p_periodo_fin order by conductor_id loop
    select array_agg(id),sum(ganancia_conductor_congelada) into v_ids,v_bruto from (
      select id,ganancia_conductor_congelada from public.traslados where conductor_id=v_c and estado='servicio_cerrado' and payout_id is null
      and ganancia_conductor_congelada is not null and (cerrado_en at time zone 'America/Mexico_City')::date between p_periodo_inicio and p_periodo_fin for update
    ) t;
    if coalesce(cardinality(v_ids),0)=0 then continue; end if;
    insert into public.payouts_conductor(conductor_id,periodo_inicio,periodo_fin,monto_bruto,ajustes,monto_neto,estado)
    values(v_c,p_periodo_inicio,p_periodo_fin,v_bruto,0,v_bruto,'pendiente') returning id into v_id;
    insert into public.payout_traslados(traslado_id,payout_id,ganancia_congelada)
    select id,v_id,ganancia_conductor_congelada from public.traslados where id=any(v_ids);
    update public.traslados set payout_id=v_id where id=any(v_ids);
    v_result:=v_result||jsonb_build_array(jsonb_build_object('payout_id',v_id,'conductor_id',v_c,'monto_bruto',v_bruto,'traslados',cardinality(v_ids)));
  end loop;
  insert into public.auditoria_admin_seguridad(auth_user_id,admin_id,tipo,recurso,accion,datos)
  values(auth.uid(),v_admin,'mutacion','payouts_conductor','generar_periodo',jsonb_build_object('periodo_inicio',p_periodo_inicio,'periodo_fin',p_periodo_fin,'detalle',v_result));
  return jsonb_build_object('payouts_generados',jsonb_array_length(v_result),'detalle',v_result);
end $$;
revoke all on function public.admin_generar_payouts_periodo(date,date) from public,anon;
grant execute on function public.admin_generar_payouts_periodo(date,date) to authenticated;

create table public.totales_definitivos_traslado (
  traslado_id uuid primary key references public.traslados(id),total numeric(12,2) not null,moneda text not null default 'mxn',
  fuente text not null check(fuente in ('precio_final','cotizacion_aceptada')),cotizado numeric(12,2) not null,
  congelado_en timestamptz not null default now(),historico boolean not null default false
);
alter table public.totales_definitivos_traslado enable row level security;
revoke all on public.totales_definitivos_traslado from public,anon,authenticated;
grant select on public.totales_definitivos_traslado to authenticated;
create policy total_visible on public.totales_definitivos_traslado for select to authenticated using(public.es_admin() or exists(
  select 1 from public.traslados t left join public.usuarios u on u.id=t.usuario_id left join public.conductores c on c.id=t.conductor_id
  where t.id=traslado_id and (u.auth_user_id=auth.uid() or c.auth_user_id=auth.uid())));
insert into public.totales_definitivos_traslado(traslado_id,total,fuente,cotizado,congelado_en,historico)
select id,coalesce(precio_final,precio_cotizado),case when precio_final is null then 'cotizacion_aceptada' else 'precio_final' end,
  precio_cotizado,coalesce(cerrado_en,actualizado_en),true from public.traslados where estado='servicio_cerrado';
insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
select traslado_id,'modificacion_traslado_activo','sistema','00000000-0000-0000-0000-000000000000',
  jsonb_build_object('accion','total_historico_documentado','total',total,'fuente',fuente,'sin_modificar_precio_original',true)
from public.totales_definitivos_traslado where historico;

create function private.congelar_total_definitivo()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.estado::text='servicio_cerrado' and (new.precio_final,new.precio_cotizado) is distinct from (old.precio_final,old.precio_cotizado) then
    raise exception 'El total cerrado está congelado; requiere ajuste financiero documentado.';
  end if;
  if new.estado::text='servicio_cerrado' and old.estado is distinct from new.estado then
    if coalesce(new.precio_final,new.precio_cotizado) is null then raise exception 'Falta el total definitivo.'; end if;
    insert into public.totales_definitivos_traslado(traslado_id,total,fuente,cotizado)
    values(new.id,coalesce(new.precio_final,new.precio_cotizado),case when new.precio_final is null then 'cotizacion_aceptada' else 'precio_final' end,new.precio_cotizado)
    on conflict(traslado_id) do nothing;
    insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
    values(new.id,'cierre_traslado','sistema',coalesce(auth.uid(),'00000000-0000-0000-0000-000000000000'),
      jsonb_build_object('accion','total_definitivo_congelado','total',coalesce(new.precio_final,new.precio_cotizado),'fuente',case when new.precio_final is null then 'cotizacion_aceptada' else 'precio_final' end));
  end if;
  return new;
end $$;
revoke all on function private.congelar_total_definitivo() from public;
create trigger congelar_total_definitivo before update on public.traslados for each row execute function private.congelar_total_definitivo();
