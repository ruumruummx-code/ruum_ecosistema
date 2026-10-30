-- BORRADOR: requiere acordar mecanismo de recepción con operación antes de aplicarse.
create table private.politica_recepcion(singleton boolean primary key default true check(singleton),requiere_pin_firma boolean not null default false,confirmada_por_operacion boolean not null default false);
insert into private.politica_recepcion(singleton) values(true);
create table public.confirmaciones_recepcion (
  traslado_id uuid primary key references public.traslados(id),receptor_nombre text not null check(length(trim(receptor_nombre))>=3),
  mecanismo text not null check(mecanismo in ('declaracion_conductor','pin','firma')),
  confirmante_auth_id uuid not null,confirmada_en timestamptz not null default now(),
  verificada boolean not null default false,referencia text,
  check(not verificada or (mecanismo in ('pin','firma') and nullif(referencia,'') is not null))
);
alter table public.confirmaciones_recepcion enable row level security;
revoke all on public.confirmaciones_recepcion from public,anon,authenticated;
grant select on public.confirmaciones_recepcion to authenticated;
grant all on public.confirmaciones_recepcion to service_role;
create policy recepcion_visible on public.confirmaciones_recepcion for select to authenticated using(public.es_admin() or exists(
  select 1 from public.traslados t left join public.usuarios u on u.id=t.usuario_id left join public.conductores c on c.id=t.conductor_id
  where t.id=traslado_id and (u.auth_user_id=auth.uid() or c.auth_user_id=auth.uid())));

create function public.registrar_declaracion_recepcion(p_traslado_id uuid,p_receptor_nombre text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_c uuid;v_e text;v_previa public.confirmaciones_recepcion%rowtype;
begin
  select t.conductor_id,t.estado::text into v_c,v_e from public.traslados t join public.conductores c on c.id=t.conductor_id
  where t.id=p_traslado_id and c.auth_user_id=auth.uid() for update of t;
  if v_c is null then raise exception using errcode='42501',message='Solo el conductor asignado registra la recepción.'; end if;
  select * into v_previa from public.confirmaciones_recepcion where traslado_id=p_traslado_id;
  if v_previa.traslado_id is not null then
    if v_previa.receptor_nombre=trim(p_receptor_nombre) then return; end if;
    raise exception 'La recepción ya está registrada; requiere corrección auditada por operación.';
  end if;
  if v_e not in ('evidencia_final_en_proceso','evidencia_final_completada') then raise exception 'No es momento de confirmar recepción.'; end if;
  if not (select confirmada_por_operacion from private.politica_recepcion where singleton) then raise exception 'Política de recepción pendiente de definición con operación.'; end if;
  if (select requiere_pin_firma from private.politica_recepcion where singleton) then raise exception 'El producto exige PIN o firma verificados; la declaración no sustituye esa validación.'; end if;
  insert into public.confirmaciones_recepcion(traslado_id,receptor_nombre,mecanismo,confirmante_auth_id)
  values(p_traslado_id,trim(p_receptor_nombre),'declaracion_conductor',auth.uid());
  insert into public.registro_auditoria(traslado_id,evento,actor,actor_id,datos)
  values(p_traslado_id,'confirmacion_entrega','conductor',v_c,jsonb_build_object('mecanismo','declaracion_conductor','receptor_nombre',trim(p_receptor_nombre),'confirmante_auth_id',auth.uid()));
end $$;
revoke all on function public.registrar_declaracion_recepcion(uuid,text) from public,anon;
grant execute on function public.registrar_declaracion_recepcion(uuid,text) to authenticated;

create function private.validar_recepcion_cierre()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_r public.confirmaciones_recepcion%rowtype;
begin
  if new.estado is not distinct from old.estado or new.estado::text not in ('entrega_confirmada','servicio_cerrado') then return new; end if;
  if not (select confirmada_por_operacion from private.politica_recepcion where singleton) then raise exception 'Falta acordar el mecanismo de recepción con operación.'; end if;
  select * into v_r from public.confirmaciones_recepcion where traslado_id=new.id;
  if v_r.traslado_id is null then raise exception 'Registra quién recibe y el mecanismo de confirmación antes de cerrar.'; end if;
  if (select requiere_pin_firma from private.politica_recepcion where singleton) and not v_r.verificada then raise exception 'Falta PIN o firma verificados por el servidor.'; end if;
  if not public.verificar_cadena_custodia(new.id) then raise exception 'La cadena de custodia requiere revisión.'; end if;
  return new;
end $$;
revoke all on function private.validar_recepcion_cierre() from public;
create trigger validar_recepcion_cierre before update of estado on public.traslados for each row execute function private.validar_recepcion_cierre();

-- Comprobación al final del ciclo de triggers; no depende de que la app siga abierta.
create function private.conciliar_terminal_operativo()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido') then
    update public.tracking_sesiones set estado='cerrada',finalizada_en=coalesce(finalizada_en,now()) where traslado_id=new.id and estado='activa';
    update public.asignaciones set estado=case when new.estado::text='servicio_cerrado' then 'completada'::public.estado_asignacion else 'cancelada'::public.estado_asignacion end,
      completada_en=case when new.estado::text='servicio_cerrado' then coalesce(completada_en,now()) else completada_en end,
      cancelada_en=case when new.estado::text<>'servicio_cerrado' then coalesce(cancelada_en,now()) else cancelada_en end
    where traslado_id=new.id and estado in ('pendiente','ofrecida','aceptada','activa');
  end if;
  return new;
end $$;
revoke all on function private.conciliar_terminal_operativo() from public;
create trigger z_conciliar_terminal_operativo after update of estado on public.traslados for each row execute function private.conciliar_terminal_operativo();
