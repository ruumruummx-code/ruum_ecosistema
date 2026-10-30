alter table public.asignaciones add column if not exists expira_en timestamptz;
update public.asignaciones set expira_en=coalesce(ofrecida_en,creado_en)+interval '15 minutes' where estado in ('pendiente','ofrecida') and origen in ('manual','reasignacion');
alter table public.asignaciones alter column expira_en set default (now()+interval '15 minutes');

-- El reintento legacy leía records sin inicializar. Recuperar sus snapshots guardados.
do $$ declare v_def text; begin
  v_def:=pg_get_functiondef('public.conductor_solicita_asignacion(uuid,numeric,numeric)'::regprocedure);
  if position('if not v_existente then' in v_def)=0 then raise exception 'Revisar versión del RPC de competencia antes de aplicar.'; end if;
  execute replace(v_def,'if not v_existente then',$patch$
    if v_existente then
      select s.categoria_puntualidad as categoria,s.puntualidad_porcentaje as porcentaje,s.puntualidad_muestra as muestra
      into v_puntualidad from public.solicitudes_asignacion s where s.competencia_id=v_competencia.id and s.conductor_id=v_conductor_id;
      select s.asignaciones_7d,s.ultima_asignacion_en into v_equidad from public.solicitudes_asignacion s where s.competencia_id=v_competencia.id and s.conductor_id=v_conductor_id;
    end if;
    if not v_existente then
  $patch$);
end $$;

create function public.consultar_oportunidad_asignacion(p_traslado_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_conductor uuid; v_oferta public.asignaciones%rowtype; v_solicitud record; v_elegibilidad jsonb; v_t public.traslados%rowtype;
begin
  select id into v_conductor from public.conductores where auth_user_id=auth.uid();
  if v_conductor is null then raise exception using errcode='42501',message='Conductor no autenticado.'; end if;
  select * into v_t from public.traslados where id=p_traslado_id;
  v_elegibilidad:=private.evaluar_elegibilidad_asignacion(p_traslado_id,v_conductor);
  select * into v_oferta from public.asignaciones where traslado_id=p_traslado_id and estado in ('pendiente','ofrecida') order by creado_en desc limit 1;
  if v_oferta.id is not null then
    if v_oferta.conductor_id<>v_conductor then
      v_elegibilidad:=jsonb_build_object('elegible',false,'motivos',jsonb_build_array('oferta_dirigida_a_otro_conductor'));
    elsif v_oferta.expira_en<=now() then
      v_elegibilidad:=jsonb_build_object('elegible',false,'motivos',jsonb_build_array('oferta_expirada'));
    end if;
  end if;
  select s.estado,c.cierra_en,c.estado as competencia_estado into v_solicitud
  from public.solicitudes_asignacion s join public.competencias_asignacion c on c.id=s.competencia_id
  where s.traslado_id=p_traslado_id and s.conductor_id=v_conductor order by s.solicitada_en desc limit 1;
  return jsonb_build_object('modo',case when v_oferta.id is not null then 'dirigida' else 'competencia' end,
    'asignacion_id',case when v_oferta.conductor_id=v_conductor then v_oferta.id else null end,
    'elegible',coalesce((v_elegibilidad->>'elegible')::boolean,false),'motivos',v_elegibilidad->'motivos',
    'expira_en',v_oferta.expira_en,'solicitud_estado',v_solicitud.estado,'cierra_en',v_solicitud.cierra_en,
    'asignada_a_mi',v_t.conductor_id=v_conductor,'tomada',v_t.conductor_id is not null and v_t.conductor_id<>v_conductor);
end $$;
revoke all on function public.consultar_oportunidad_asignacion(uuid) from public,anon;
grant execute on function public.consultar_oportunidad_asignacion(uuid) to authenticated;

create or replace function public.aceptar_asignacion(p_asignacion_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_a public.asignaciones%rowtype; v_conductor uuid; v_elegibilidad jsonb; v_t public.traslados%rowtype;
begin
  select id into v_conductor from public.conductores where auth_user_id=auth.uid();
  select * into v_a from public.asignaciones where id=p_asignacion_id;
  if v_conductor is null or v_a.id is null or v_a.conductor_id<>v_conductor then raise exception using errcode='42501',message='Solo el conductor de la oferta puede aceptar.'; end if;
  select * into v_t from public.traslados where id=v_a.traslado_id for update;
  select * into v_a from public.asignaciones where id=p_asignacion_id for update;
  if v_a.estado in ('aceptada','activa','completada') and v_t.conductor_id=v_conductor then return; end if;
  if v_a.estado not in ('pendiente','ofrecida') or v_a.expira_en<=now() then raise exception 'La oferta expiró o ya no admite aceptación.'; end if;
  perform 1 from public.conductores where id=v_conductor for update;
  v_elegibilidad:=private.evaluar_elegibilidad_asignacion(v_a.traslado_id,v_conductor);
  if not (v_elegibilidad->>'elegible')::boolean then raise exception 'No elegible: %',v_elegibilidad->'motivos'; end if;
  perform set_config('ruum.asignacion_gestionada','1',true);
  update public.asignaciones set estado='aceptada',aceptada_en=now() where id=v_a.id;
  update public.traslados set estado='conductor_asignado',conductor_id=v_conductor where id=v_a.traslado_id;
  perform set_config('ruum.asignacion_gestionada','0',true);
  insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
  values(v_a.traslado_id,'aceptacion_asignacion','conductor',v_conductor,jsonb_build_object('asignacion_id',v_a.id,'origen',v_a.origen));
end $$;
revoke all on function public.aceptar_asignacion(uuid) from public,anon;
grant execute on function public.aceptar_asignacion(uuid) to authenticated;

create function private.validar_solicitud_abierta()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform 1 from public.traslados where id=new.traslado_id for update;
  update public.asignaciones set estado='cancelada',cancelada_en=now(),motivo=coalesce(motivo,'')||' | Oferta expirada'
  where traslado_id=new.traslado_id and estado in ('pendiente','ofrecida') and expira_en<=now();
  if exists(select 1 from public.asignaciones where traslado_id=new.traslado_id and estado in ('pendiente','ofrecida','aceptada','activa')) then
    raise exception 'Este traslado tiene una oferta dirigida; utiliza su identificador de asignación.';
  end if;
  return new;
end $$;
revoke all on function private.validar_solicitud_abierta() from public;
create trigger validar_solicitud_abierta before insert on public.solicitudes_asignacion for each row execute function private.validar_solicitud_abierta();

create function private.validar_ocupacion_conductor()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.conductor_id is null or new.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido') then return new; end if;
  if tg_op='UPDATE' and new.conductor_id is not distinct from old.conductor_id then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('ocupacion:'||new.conductor_id::text,0));
  if exists(select 1 from public.traslados where conductor_id=new.conductor_id and id<>new.id and estado::text not in ('servicio_cerrado','servicio_cancelado','traslado_fallido')) then
    raise exception 'El conductor ya tiene un traslado activo.';
  end if;
  return new;
end $$;
revoke all on function private.validar_ocupacion_conductor() from public;
create trigger validar_ocupacion_conductor before insert or update of conductor_id on public.traslados for each row execute function private.validar_ocupacion_conductor();

create function private.vincular_ganador_asignacion()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.estado::text='resuelta' and new.conductor_seleccionado_id is not null then
    update public.asignaciones set origen='competencia',metadata=metadata||jsonb_build_object('competencia_id',new.id)
    where traslado_id=new.traslado_id and conductor_id=new.conductor_seleccionado_id and estado in ('aceptada','activa');
    if not found then
      insert into public.asignaciones(traslado_id,conductor_id,estado,origen,aceptada_en,metadata)
      values(new.traslado_id,new.conductor_seleccionado_id,'aceptada','competencia',now(),jsonb_build_object('competencia_id',new.id));
    end if;
  end if;
  return new;
end $$;
revoke all on function private.vincular_ganador_asignacion() from public;
create trigger vincular_ganador_asignacion after update of estado on public.competencias_asignacion for each row execute function private.vincular_ganador_asignacion();
