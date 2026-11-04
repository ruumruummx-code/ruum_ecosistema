-- RUUM-USR-F2-001 — consumidor durable de estados Auth -> perfil.
-- El job externo invoca esta RPC cada 5 minutos con service_role.
create or replace function public.reconciliar_registro_saga_auth(p_limite integer default 50)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_fila record;
  v_reconciliados integer := 0;
  v_errores integer := 0;
begin
  if p_limite is null or p_limite < 1 or p_limite > 200 then
    raise exception 'Límite de reconciliación inválido.';
  end if;

  for v_fila in
    select s.auth_user_id, au.raw_user_meta_data
    from public.registro_saga_auth s
    join auth.users au on au.id = s.auth_user_id
    where s.estado <> 'perfil_creado'
    order by s.actualizado_en
    limit p_limite
    for update of s skip locked
  loop
    begin
      -- Reparación mínima y fail-safe: jamás asigna conductor desde reconciliación.
      insert into public.usuarios(auth_user_id, nombre, tipo_cuenta, rol, estado_verificacion, telefono)
      values (
        v_fila.auth_user_id,
        nullif(v_fila.raw_user_meta_data->>'nombre', ''),
        'personal',
        'sin_rol'::public.rol_usuario,
        'pendiente',
        nullif(v_fila.raw_user_meta_data->>'telefono', '')
      )
      on conflict (auth_user_id) do nothing;

      update public.registro_saga_auth
      set estado = case when exists (
        select 1 from public.usuarios u where u.auth_user_id = v_fila.auth_user_id
      ) then 'perfil_creado' else 'reconciliacion_requerida' end,
        intentos = intentos + 1,
        ultimo_error = null,
        actualizado_en = now()
      where auth_user_id = v_fila.auth_user_id;
      v_reconciliados := v_reconciliados + 1;
    exception when others then
      update public.registro_saga_auth
      set estado = 'reconciliacion_requerida',
        intentos = intentos + 1,
        ultimo_error = left(sqlerrm, 500),
        actualizado_en = now()
      where auth_user_id = v_fila.auth_user_id;
      v_errores := v_errores + 1;
    end;
  end loop;

  return jsonb_build_object('reconciliados', v_reconciliados, 'errores', v_errores);
end;
$$;

revoke all on function public.reconciliar_registro_saga_auth(integer) from public, anon, authenticated;
grant execute on function public.reconciliar_registro_saga_auth(integer) to service_role;

comment on function public.reconciliar_registro_saga_auth(integer) is
  'F2-001: job cada 5 minutos; repara perfiles pendientes con sin_rol o deja reconciliacion_requerida con error auditable.';
