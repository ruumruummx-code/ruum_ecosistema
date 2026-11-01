-- A transfer's summary cannot claim resolution while a dispute lacks one.
create or replace function private.validar_resumen_disputa()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado::text='disputa_resuelta' and (
    not exists(select 1 from public.disputas where traslado_id=new.id)
    or exists(select 1 from public.disputas where traslado_id=new.id and
      (estado::text not in ('resuelta','resuelta_senior') or resolucion is null or resuelta_en is null))
  ) then
    raise exception using errcode='23514',message='DISPUTA_SIN_RESOLVER: registra la resolución desde Disputas.';
  end if;
  if tg_op='UPDATE' and old.cerrado_en is not null and new.cerrado_en is distinct from old.cerrado_en then
    raise exception using errcode='23514',message='La fecha de cierre operativo es inmutable.';
  end if;
  return new;
end $$;
revoke all on function private.validar_resumen_disputa() from public,anon,authenticated;
create trigger validar_resumen_disputa before insert or update of estado,cerrado_en on public.traslados
for each row execute function private.validar_resumen_disputa();

create or replace function private.validar_resolucion_disputa()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Shared lock order: transfer, then dispute for normal RPCs.
  perform 1 from public.traslados where id=new.traslado_id for update;
  if tg_op='UPDATE' and new.traslado_id is distinct from old.traslado_id then
    raise exception using errcode='23514',message='No se puede mover una disputa a otro traslado.';
  end if;
  if new.estado::text in ('resuelta','resuelta_senior') and (new.resolucion is null or new.resuelta_en is null) then
    raise exception using errcode='23514',message='La disputa requiere resolución y fecha de resolución.';
  end if;
  return new;
end $$;
revoke all on function private.validar_resolucion_disputa() from public,anon,authenticated;
create trigger validar_resolucion_disputa before insert or update on public.disputas
for each row execute function private.validar_resolucion_disputa();

-- Keep the existing independent-incident behavior: never force an active
-- operation into a post-close stage. Reconcile only an existing dispute summary.
create or replace function private.sincronizar_resumen_disputa()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_estado text; v_nuevo public.estado_traslado;
begin
  v_id:=coalesce(new.traslado_id,old.traslado_id);
  select estado::text into v_estado from public.traslados where id=v_id for update;
  if v_estado not in ('disputa_abierta','disputa_resuelta') then return null; end if;
  if exists(select 1 from public.disputas where traslado_id=v_id and
    (estado::text not in ('resuelta','resuelta_senior') or resolucion is null or resuelta_en is null)) then
    v_nuevo:='disputa_abierta';
  elsif exists(select 1 from public.disputas where traslado_id=v_id) then
    v_nuevo:='disputa_resuelta';
  else
    -- Deleting the final case must not fabricate a resolution.
    raise exception using errcode='23514',message='No se puede eliminar la última disputa de un traslado con seguimiento.';
  end if;
  if v_estado is distinct from v_nuevo::text then
    update public.traslados set estado=v_nuevo,version=version+1 where id=v_id;
  end if;
  return null;
end $$;
revoke all on function private.sincronizar_resumen_disputa() from public,anon,authenticated;
create trigger sincronizar_resumen_disputa after insert or update of estado,resolucion,resuelta_en or delete on public.disputas
for each row execute function private.sincronizar_resumen_disputa();

insert into public.estado_transiciones_validas(estado_actual,estado_siguiente)
values('disputa_resuelta','disputa_abierta') on conflict do nothing;

CREATE OR REPLACE FUNCTION public.admin_resuelve_disputa(p_disputa_id uuid, p_estado estado_disputa, p_resolucion resolucion_disputa, p_detalle text, p_mantener_estado boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_admin_id uuid;
  v_disputa record;
  v_traslado_id uuid;
  v_es_resuelta boolean;
begin
  if auth.uid() is null or not public.admin_tiene_permiso('disputas:resolver') then
    raise exception using errcode='42501',message='PERMISO_INSUFICIENTE';
  end if;
  v_admin_id := public.admin_actual_id();
  if v_admin_id is null then
    raise exception 'No se encontró un admin autenticado.';
  end if;

  select traslado_id into v_traslado_id from public.disputas where id=p_disputa_id;
  perform 1 from public.traslados where id=v_traslado_id for update;

  select * into v_disputa
  from public.disputas
  where id = p_disputa_id
  for update;

  if v_disputa.id is null then
    raise exception 'No se encontró la disputa.';
  end if;

  v_es_resuelta := p_estado in ('resuelta', 'resuelta_senior');
  if v_es_resuelta and p_resolucion is null then
    raise exception 'Selecciona una resolución para cerrar la disputa.';
  end if;

  update public.disputas
    set estado = p_estado,
        resolucion = case when v_es_resuelta then p_resolucion else null end,
        resolucion_detalle = nullif(btrim(coalesce(p_detalle, '')), ''),
        resuelta_en = case when v_es_resuelta then now() else null end
  where id = p_disputa_id;

  if v_es_resuelta
     and not coalesce(p_mantener_estado, false) then
    update public.traslados
    set estado = 'disputa_resuelta'
    where id = v_disputa.traslado_id
      and estado = 'disputa_abierta'
      and not exists(select 1 from public.disputas where traslado_id=v_disputa.traslado_id
        and (estado::text not in ('resuelta','resuelta_senior') or resolucion is null or resuelta_en is null));
  end if;

  insert into public.registro_auditoria (traslado_id, evento, actor, actor_id, datos)
  values (
    v_disputa.traslado_id,
    'resolucion_disputa',
    'admin',
    v_admin_id,
    jsonb_build_object(
      'disputa_id', p_disputa_id,
      'estado', p_estado,
      'resolucion', p_resolucion,
      'detalle', nullif(btrim(coalesce(p_detalle, '')), ''),
      'estado_mantenido', coalesce(p_mantener_estado, false)
    )
  );
end;
$function$
;

-- Retire the ambiguous four-argument overload without deleting its definition.
-- The canonical five-argument function keeps DEFAULT false and serves both callers.
alter function public.admin_resuelve_disputa(uuid,public.estado_disputa,public.resolucion_disputa,text) set schema private;
revoke all on function private.admin_resuelve_disputa(uuid,public.estado_disputa,public.resolucion_disputa,text) from public,anon,authenticated;
revoke all on function public.admin_resuelve_disputa(uuid,public.estado_disputa,public.resolucion_disputa,text,boolean) from public,anon;
grant execute on function public.admin_resuelve_disputa(uuid,public.estado_disputa,public.resolucion_disputa,text,boolean) to authenticated;

-- Reconcile the summary without adjudicating any dispute.
with candidatos as materialized (
  select id,estado,estado_operativo,cerrado_en,version from public.traslados t
  where estado::text='disputa_resuelta' and exists(select 1 from public.disputas d where d.traslado_id=t.id
    and (d.estado::text not in ('resuelta','resuelta_senior') or d.resolucion is null or d.resuelta_en is null))
), corregidos as (
  update public.traslados t set estado='disputa_abierta',version=t.version+1 from candidatos c where t.id=c.id returning t.id,t.estado
)
insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
select c.id,'modificacion_traslado_activo','sistema','00000000-0000-0000-0000-000000000000',
  jsonb_build_object('accion','reconciliar_resumen_disputa','antes',to_jsonb(o),'estado_nuevo',c.estado,'sin_adjudicar_disputa',true)
from corregidos c join candidatos o on o.id=c.id;

notify pgrst, 'reload schema';
