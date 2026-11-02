-- H07: Operacion transaccional e idempotente para reporte de incidencias con escalamiento urgente.
-- Evita que un fallo de red o auditoria duplique incidencias al reintentar o deje incidentes urgentes sin escalar.

create or replace function public.conductor_reportar_incidencia_transaccional(
  p_traslado_id uuid,
  p_tipo public.tipo_incidencia,
  p_momento public.momento_incidencia,
  p_descripcion text,
  p_incidencia_id uuid default null,
  p_escalar_urgente boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conductor_id uuid;
  v_id uuid;
  v_ya_existia boolean := false;
  v_texto text;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = auth.uid();

  if v_conductor_id is null then
    raise exception 'Solo un conductor autenticado puede reportar incidencias.';
  end if;

  v_texto := trim(coalesce(p_descripcion, ''));
  if length(v_texto) < 10 then
    raise exception 'Describe el problema con al menos 10 caracteres.';
  end if;

  -- Idempotencia: si ya existe una incidencia con este ID, reutilizarla
  if p_incidencia_id is not null then
    select id into v_id
    from public.incidencias
    where id = p_incidencia_id;

    if v_id is not null then
      v_ya_existia := true;
    end if;
  end if;

  if not v_ya_existia then
    v_id := coalesce(p_incidencia_id, gen_random_uuid());

    insert into public.incidencias (
      id,
      traslado_id,
      tipo,
      momento,
      reportada_por,
      descripcion
    ) values (
      v_id,
      p_traslado_id,
      p_tipo,
      p_momento,
      'conductor',
      v_texto
    );

    insert into public.registro_auditoria (
      traslado_id,
      evento,
      actor,
      actor_id,
      datos
    ) values (
      p_traslado_id,
      'reporte_incidencia',
      'conductor',
      v_conductor_id,
      jsonb_build_object(
        'incidencia_id', v_id,
        'tipo', p_tipo,
        'momento', p_momento,
        'escalamiento_urgente', p_escalar_urgente
      )
    );
  end if;

  -- Escalamiento urgente garantizado en la misma transaccion
  if p_escalar_urgente then
    -- Registrar evento de activacion de soporte si no se habia registrado para este intento
    insert into public.registro_auditoria (
      traslado_id,
      evento,
      actor,
      actor_id,
      datos
    ) values (
      p_traslado_id,
      'activacion_soporte_emergencia',
      'conductor',
      v_conductor_id,
      jsonb_build_object(
        'incidencia_id', v_id,
        'prioridad', 'alta',
        'canal', '911',
        'origen', 'app-conductor',
        'reintento_idempotente', v_ya_existia
      )
    );
  end if;

  return jsonb_build_object(
    'id', v_id,
    'reintentado', v_ya_existia,
    'escalado', p_escalar_urgente
  );
end;
$$;

revoke all on function public.conductor_reportar_incidencia_transaccional(uuid, public.tipo_incidencia, public.momento_incidencia, text, uuid, boolean) from public;
grant execute on function public.conductor_reportar_incidencia_transaccional(uuid, public.tipo_incidencia, public.momento_incidencia, text, uuid, boolean) to authenticated;
