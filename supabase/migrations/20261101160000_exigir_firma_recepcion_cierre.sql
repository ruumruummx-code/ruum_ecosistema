-- P1 H01: Exigir firma y recepción persistidas para cerrar traslado.
--
-- Evita que un traslado cierre sin acreditación digital de quién recibió el
-- vehículo ni evidencia recuperable de la firma de conformidad.

create table if not exists public.confirmaciones_recepcion (
  traslado_id uuid primary key references public.traslados(id) on delete cascade,
  receptor_nombre text not null check(length(trim(receptor_nombre)) >= 2),
  mecanismo text not null check(mecanismo in ('declaracion_conductor','pin','firma')),
  confirmante_auth_id uuid not null,
  confirmada_en timestamptz not null default now(),
  verificada boolean not null default false,
  referencia text,
  check(not verificada or (mecanismo in ('pin','firma') and nullif(referencia,'') is not null))
);

alter table public.confirmaciones_recepcion enable row level security;
grant select, insert, update on public.confirmaciones_recepcion to authenticated;
grant all on public.confirmaciones_recepcion to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'confirmaciones_recepcion' and policyname = 'recepcion_visible'
  ) then
    create policy recepcion_visible on public.confirmaciones_recepcion for select to authenticated using(
      public.es_admin() or exists(
        select 1 from public.traslados t
        left join public.usuarios u on u.id = t.usuario_id
        left join public.conductores c on c.id = t.conductor_id
        where t.id = traslado_id and (u.auth_user_id = auth.uid() or c.auth_user_id = auth.uid())
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'confirmaciones_recepcion' and policyname = 'conductor_registra_recepcion'
  ) then
    create policy conductor_registra_recepcion on public.confirmaciones_recepcion for insert to authenticated with check(
      exists(
        select 1 from public.traslados t
        join public.conductores c on c.id = t.conductor_id
        where t.id = traslado_id and c.auth_user_id = auth.uid()
      )
    );
  end if;
end $$;

create or replace function public.conductor_avanza_traslado(
  p_traslado_id uuid,
  p_evento text
)
returns public.estado_traslado
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conductor_id uuid;
  v_estado_actual public.estado_traslado;
  v_estado_siguiente public.estado_traslado;
  v_evento_auditoria public.evento_auditable;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception 'Solo un conductor autenticado puede avanzar el traslado.';
  end if;

  select estado into v_estado_actual
  from public.traslados
  where id = p_traslado_id
    and conductor_id = v_conductor_id
  for update;

  if v_estado_actual is null then
    raise exception 'El traslado no existe o no está asignado al conductor autenticado.';
  end if;

  case p_evento
    when 'conductor_en_camino' then
      if v_estado_actual <> 'conductor_asignado' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'conductor_en_camino_al_origen';
      v_evento_auditoria := 'modificacion_traslado_activo';

    when 'llegada_origen' then
      if v_estado_actual <> 'conductor_en_camino_al_origen' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'conductor_en_punto_de_recoleccion';
      v_evento_auditoria := 'llegada_conductor_origen';

    when 'iniciar_verificacion' then
      if v_estado_actual <> 'conductor_en_punto_de_recoleccion' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'verificacion_vehiculo_en_proceso';
      v_evento_auditoria := 'modificacion_traslado_activo';

    when 'iniciar_evidencia_inicial' then
      if v_estado_actual <> 'verificacion_vehiculo_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'evidencia_inicial_en_proceso';
      v_evento_auditoria := 'captura_evidencia_inicial';

    when 'evidencia_inicial_completada' then
      if v_estado_actual <> 'evidencia_inicial_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if not public.traslado_tiene_metodo_pago_registrado(p_traslado_id) then
        raise exception 'No se puede completar evidencia inicial: falta pago anticipado completado o método de pago al cierre.';
      end if;
      if (
        select count(distinct angulo)
        from public.evidencia_fotos
        where traslado_id = p_traslado_id
          and tipo = 'inicial'
          and sincronizada = true
          and angulo in ('frente', 'lado_piloto', 'lado_copiloto', 'trasera', 'tablero')
      ) < 5 then
        raise exception 'Evidencia inicial incompleta.';
      end if;
      v_estado_siguiente := 'evidencia_inicial_completada';
      v_evento_auditoria := 'captura_evidencia_inicial';

    when 'vehiculo_recibido' then
      if v_estado_actual <> 'evidencia_inicial_completada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'vehiculo_recibido';
      v_evento_auditoria := 'confirmacion_vehiculo_recibido';

    when 'iniciar_traslado' then
      if v_estado_actual <> 'vehiculo_recibido' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'traslado_en_curso';
      v_evento_auditoria := 'inicio_traslado';

    when 'llegada_destino' then
      if v_estado_actual <> 'traslado_en_curso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'llegada_a_destino';
      v_evento_auditoria := 'llegada_destino';

    when 'iniciar_evidencia_final' then
      if v_estado_actual <> 'llegada_a_destino' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'evidencia_final_en_proceso';
      v_evento_auditoria := 'captura_evidencia_final';

    when 'evidencia_final_completada' then
      if v_estado_actual <> 'evidencia_final_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if (
        select count(distinct angulo)
        from public.evidencia_fotos
        where traslado_id = p_traslado_id
          and tipo = 'final'
          and sincronizada = true
          and angulo in ('frente', 'lado_piloto', 'lado_copiloto', 'trasera', 'tablero')
      ) < 5 then
        raise exception 'Evidencia final incompleta.';
      end if;
      v_estado_siguiente := 'evidencia_final_completada';
      v_evento_auditoria := 'captura_evidencia_final';

    when 'confirmar_entrega' then
      if v_estado_actual <> 'evidencia_final_completada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      v_estado_siguiente := 'entrega_confirmada';
      v_evento_auditoria := 'confirmacion_entrega';

    when 'cerrar_viaje' then
      if v_estado_actual <> 'entrega_confirmada' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      -- P1 H01: Exigir firma y recepción acreditada antes de cerrar el traslado
      if not exists (
        select 1 from public.custodia_eventos
        where traslado_id = p_traslado_id
          and (
            firma_metodo is not null
            or firma_referencia is not null
            or (metadata->>'mecanismo') = 'firma'
            or (metadata->>'firma_guardada')::boolean = true
            or (metadata->>'firma_referencia') is not null
          )
      ) and not exists (
        select 1 from public.confirmaciones_recepcion
        where traslado_id = p_traslado_id
          and (referencia is not null or mecanismo in ('firma', 'declaracion_conductor'))
      ) then
        raise exception 'No se puede cerrar el servicio sin un registro de firma o acuse de recepción persistido.';
      end if;
      v_estado_siguiente := 'servicio_cerrado';
      v_evento_auditoria := 'cierre_traslado';

    else
      raise exception 'Evento de conductor no soportado: %', p_evento;
  end case;

  update public.traslados
  set estado = v_estado_siguiente
  where id = p_traslado_id
    and conductor_id = v_conductor_id
    and estado = v_estado_actual;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    v_evento_auditoria,
    'conductor',
    v_conductor_id,
    jsonb_build_object(
      'evento_conductor', p_evento,
      'estado_anterior', v_estado_actual,
      'estado_nuevo', v_estado_siguiente
    )
  );

  return v_estado_siguiente;
end;
$$;

revoke all on function public.conductor_avanza_traslado(uuid, text) from public;
grant execute on function public.conductor_avanza_traslado(uuid, text) to authenticated;
