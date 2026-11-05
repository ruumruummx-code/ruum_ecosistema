-- =====================================================================
-- Flujo 5: Reconciliación Durable y DLQ para Verificaciones Didit (RUUM-USR-F5-001)
-- =====================================================================

alter table public.verificaciones_identidad_didit
  add column if not exists reintentos_webhook integer not null default 0,
  add column if not exists ultimo_error_webhook text,
  add column if not exists ultimo_intento_webhook timestamptz;

-- Índice para el job de reconciliación periódica (sesiones pendientes antiguas)
create index if not exists verificaciones_identidad_didit_reconciliacion_idx
  on public.verificaciones_identidad_didit (estado, creado_en)
  where procesado_en is null;

-- RPC atómica para reconciliación de sesiones Didit sin webhook recibido
create or replace function public.reconciliar_verificacion_didit_resultado(
  p_session_id text,
  p_decision text,
  p_motivo text default 'Reconciliación automática por consulta activa a Didit.'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_reg public.verificaciones_identidad_didit;
  v_estado_normalizado text;
begin
  select * into v_reg
  from public.verificaciones_identidad_didit
  where session_id = p_session_id
  for update;

  if v_reg.id is null then
    return jsonb_build_object('ok', false, 'error', 'Sesión no encontrada');
  end if;

  if v_reg.procesado_en is not null then
    return jsonb_build_object('ok', true, 'ya_procesado', true, 'estado', v_reg.estado);
  end if;

  v_estado_normalizado := lower(trim(p_decision));

  if v_estado_normalizado in ('approved', 'completed', 'aprobado') then
    update public.verificaciones_identidad_didit
    set estado = 'aprobado'
    where id = v_reg.id;

    if v_reg.usuario_id is not null then
      perform public.aprobar_usuario_por_verificacion_sistema(v_reg.usuario_id, v_reg.id);
    elsif v_reg.solicitud_id is not null then
      perform public.aprobar_solicitud_conductor_sistema(v_reg.solicitud_id, v_reg.id);
    end if;

    return jsonb_build_object('ok', true, 'resultado', 'aprobado');

  elsif v_estado_normalizado in ('declined', 'rejected', 'rechazado') then
    update public.verificaciones_identidad_didit
    set estado = 'rechazado'
    where id = v_reg.id;

    if v_reg.usuario_id is not null then
      perform public.rechazar_usuario_por_verificacion_sistema(v_reg.usuario_id, v_reg.id, p_motivo);
    elsif v_reg.solicitud_id is not null then
      perform public.rechazar_solicitud_por_verificacion_sistema(v_reg.solicitud_id, v_reg.id);
    end if;

    return jsonb_build_object('ok', true, 'resultado', 'rechazado');

  elsif v_estado_normalizado in ('expired', 'expirado', 'abandoned', 'cancelled', 'cancelado') then
    update public.verificaciones_identidad_didit
    set estado = 'expirado', procesado_en = now()
    where id = v_reg.id;

    return jsonb_build_object('ok', true, 'resultado', 'expirado');
  else
    return jsonb_build_object('ok', false, 'error', 'Estado no terminal', 'estado', p_decision);
  end if;
end;
$$;

revoke all on function public.reconciliar_verificacion_didit_resultado(text, text, text) from public, anon, authenticated;
grant execute on function public.reconciliar_verificacion_didit_resultado(text, text, text) to service_role;
