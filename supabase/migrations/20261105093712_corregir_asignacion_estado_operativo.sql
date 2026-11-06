-- Una disputa resuelta es terminal y no ocupa al conductor.
create or replace function private.validar_ocupacion_conductor()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.conductor_id is null or new.estado::text in ('servicio_cerrado','servicio_cancelado','traslado_fallido','disputa_resuelta') then return new; end if;
  if tg_op='UPDATE' and new.conductor_id is not distinct from old.conductor_id then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('ocupacion:'||new.conductor_id::text,0));
  if exists(select 1 from public.traslados where conductor_id=new.conductor_id and id<>new.id and estado::text not in ('servicio_cerrado','servicio_cancelado','traslado_fallido','disputa_resuelta')) then
    raise exception 'El conductor ya tiene un traslado activo.';
  end if;
  return new;
end $$;
revoke all on function private.validar_ocupacion_conductor() from public;

-- Reparar únicamente el desfase confirmado -> pendiente ya autorizado por el ciclo.
update public.traslados set estado_operativo='planned'
where estado='pendiente_de_conductor' and estado_operativo='confirmed' and conductor_id is null;
