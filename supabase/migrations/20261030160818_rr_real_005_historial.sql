-- RR-REAL-005: conductor = servicio_cerrado; usuario = cerrado sin incidencias registradas.
-- Se recalcula del historial real, nunca se suma ciegamente.
-- Solo permite al trigger anidado cambiar el contador a su valor derivado exacto.
-- El resto del perfil conserva la misma protección; las solicitudes directas no pasan.
do $$ declare v_def text; begin
  v_def:=pg_get_functiondef('public.proteger_campos_conductor()'::regprocedure);
  execute regexp_replace(v_def,'\mbegin\M', $guard$begin
    if pg_trigger_depth()>1 and
      (to_jsonb(new)-'traslados_completados'-'actualizado_en') is not distinct from
      (to_jsonb(old)-'traslados_completados'-'actualizado_en') and
      new.traslados_completados=(select count(*) from public.traslados where conductor_id=new.id and estado='servicio_cerrado')
    then return new; end if;
  $guard$,'i');
  v_def:=pg_get_functiondef('public.proteger_verificacion_usuario()'::regprocedure);
  execute regexp_replace(v_def,'\mbegin\M', $guard$begin
    if pg_trigger_depth()>1 and
      (to_jsonb(new)-'traslados_completados_sin_incidencia'-'actualizado_en') is not distinct from
      (to_jsonb(old)-'traslados_completados_sin_incidencia'-'actualizado_en') and
      new.traslados_completados_sin_incidencia=(select count(*) from public.traslados t where t.usuario_id=new.id and estado='servicio_cerrado'
        and not exists(select 1 from public.incidencias i where i.traslado_id=t.id))
    then return new; end if;
  $guard$,'i');
end $$;
create or replace function private.recalcular_historial(p_conductor uuid, p_usuario uuid)
returns void language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  if p_conductor is not null then
    perform 1 from public.conductores where id=p_conductor for update;
    update public.conductores c set traslados_completados=(
      select count(*) from public.traslados t where t.conductor_id=c.id and t.estado='servicio_cerrado'
    ) where c.id=p_conductor;
  end if;
  if p_usuario is not null then
    perform 1 from public.usuarios where id=p_usuario for update;
    update public.usuarios u set traslados_completados_sin_incidencia=(
      select count(*) from public.traslados t where t.usuario_id=u.id and t.estado='servicio_cerrado'
      and not exists(select 1 from public.incidencias i where i.traslado_id=t.id)
    ) where u.id=p_usuario;
  end if;
end $$;
revoke all on function private.recalcular_historial(uuid,uuid) from public;

create function private.actualizar_historial_por_traslado()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_op='DELETE' then
    perform private.recalcular_historial(old.conductor_id,old.usuario_id); return old;
  end if;
  perform private.recalcular_historial(new.conductor_id,new.usuario_id);
  if tg_op='UPDATE' and (old.conductor_id,old.usuario_id) is distinct from (new.conductor_id,new.usuario_id) then
    perform private.recalcular_historial(old.conductor_id,old.usuario_id);
  end if;
  return new;
end $$;
revoke all on function private.actualizar_historial_por_traslado() from public;
create trigger actualizar_historial_por_traslado after insert or update of estado,conductor_id,usuario_id or delete
on public.traslados for each row execute function private.actualizar_historial_por_traslado();

create function private.actualizar_historial_por_incidencia()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_traslado uuid; v_usuario uuid;
begin
  v_traslado := case when tg_op='DELETE' then old.traslado_id else new.traslado_id end;
  select usuario_id into v_usuario from public.traslados where id=v_traslado;
  perform private.recalcular_historial(null,v_usuario);
  if tg_op='UPDATE' and old.traslado_id is distinct from new.traslado_id then
    select usuario_id into v_usuario from public.traslados where id=old.traslado_id;
    perform private.recalcular_historial(null,v_usuario);
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.actualizar_historial_por_incidencia() from public;
create trigger actualizar_historial_por_incidencia after insert or update or delete on public.incidencias
for each row execute function private.actualizar_historial_por_incidencia();

-- Conciliación histórica con el mismo criterio del trigger.
do $$ declare v_id uuid; begin
  for v_id in select id from public.conductores order by id loop perform private.recalcular_historial(v_id,null); end loop;
  for v_id in select id from public.usuarios order by id loop perform private.recalcular_historial(null,v_id); end loop;
end $$;
