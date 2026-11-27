-- Remediación P0/P1 del flujo operativo de registro (usuario y conductor).
--
--  1. P0-1: `registrar_estado_saga_auth()` y `reconciliar_registro_saga_auth()`
--     no filtraban `tipo_registro = 'usuario'`, marcando a todos los conductores
--     como `perfil_pendiente` e insertándolos en `public.usuarios` con `rol = 'sin_rol'`,
--     lo que provocaba bloqueo 403 en `app-conductor` vía `clasificarRolApp()`.
--  2. Limpieza idempotente de filas fantasma (`registro_saga_auth` y `usuarios`
--     con `rol = 'sin_rol'`) generadas para cuentas de conductor.
--  3. P1-6: `iniciar_solicitud_conductor()` rechaza explícitamente cuentas que ya
--     operan como `usuario` o `admin` para impedir mezcla de roles en un mismo `auth_user_id`.

begin;

-- ---------------------------------------------------------------------------
-- 1. Trigger de saga Auth -> perfil: únicamente para registros de tipo 'usuario'
-- ---------------------------------------------------------------------------
create or replace function public.registrar_estado_saga_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  -- Sólo los registros de pasajero/usuario deben materializar fila en public.usuarios.
  -- Los conductores crean fila en public.solicitudes_conductor y no pertenecen a esta saga.
  if coalesce(new.raw_user_meta_data->>'tipo_registro', '') <> 'usuario' then
    return new;
  end if;

  insert into public.registro_saga_auth(auth_user_id, estado)
  values (
    new.id,
    case when exists (select 1 from public.usuarios where auth_user_id = new.id)
      then 'perfil_creado' else 'perfil_pendiente' end
  )
  on conflict (auth_user_id) do update set
    estado = excluded.estado,
    actualizado_en = now();

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Reconciliador de saga: filtrar tipo_registro = 'usuario' y excluir conductores/admins
-- ---------------------------------------------------------------------------
create or replace function public.reconciliar_registro_saga_auth(p_limite integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_fila record;
  v_reconciliados integer := 0;
  v_errores integer := 0;
  v_omitidos integer := 0;
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
    -- Si el registro no es de tipo 'usuario' o ya pertenece a conductor/solicitud/admin,
    -- retirarlo de la cola de saga de usuarios sin contaminar public.usuarios.
    if coalesce(v_fila.raw_user_meta_data->>'tipo_registro', '') <> 'usuario'
       or exists (select 1 from public.solicitudes_conductor sc where sc.auth_user_id = v_fila.auth_user_id)
       or exists (select 1 from public.conductores c where c.auth_user_id = v_fila.auth_user_id)
       or exists (select 1 from public.admins a where a.auth_user_id = v_fila.auth_user_id) then
      delete from public.registro_saga_auth where auth_user_id = v_fila.auth_user_id;
      v_omitidos := v_omitidos + 1;
      continue;
    end if;

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

  return jsonb_build_object(
    'reconciliados', v_reconciliados,
    'errores', v_errores,
    'omitidos', v_omitidos
  );
end;
$$;

revoke all on function public.reconciliar_registro_saga_auth(integer) from public, anon, authenticated;
grant execute on function public.reconciliar_registro_saga_auth(integer) to service_role;

-- ---------------------------------------------------------------------------
-- 3. Limpieza idempotente de filas contaminadas por el trigger anterior
-- ---------------------------------------------------------------------------
delete from public.registro_saga_auth s
using auth.users au
where au.id = s.auth_user_id
  and coalesce(au.raw_user_meta_data->>'tipo_registro', '') <> 'usuario';

delete from public.usuarios u
where u.rol = 'sin_rol'::public.rol_usuario
  and exists (
    select 1 from auth.users au
    where au.id = u.auth_user_id
      and coalesce(au.raw_user_meta_data->>'tipo_registro', '') = 'conductor'
  )
  and (
    exists (select 1 from public.solicitudes_conductor sc where sc.auth_user_id = u.auth_user_id)
    or exists (select 1 from public.conductores c where c.auth_user_id = u.auth_user_id)
  )
  and not exists (select 1 from public.traslados t where t.usuario_id = u.id)
  and not exists (select 1 from public.vehiculos v where v.usuario_id = u.id);

-- ---------------------------------------------------------------------------
-- 4. Aislamiento de rol en iniciar_solicitud_conductor()
-- ---------------------------------------------------------------------------
create or replace function public.iniciar_solicitud_conductor()
returns table(
  solicitud_id uuid,
  conductor_id uuid,
  estado public.estado_expediente_conductor,
  paso_actual smallint
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_auth uuid := auth.uid();
  v_solicitud public.solicitudes_conductor;
  v_conductor uuid;
  v_confirmado boolean;
begin
  if v_auth is null then
    raise exception 'Inicia sesión para comenzar tu solicitud.';
  end if;

  if exists (
    select 1 from public.usuarios u
    where u.auth_user_id = v_auth
      and u.rol <> 'sin_rol'::public.rol_usuario
  ) then
    raise exception 'Esta cuenta ya está registrada como usuario. Usa un correo distinto para registrarte como conductor.';
  end if;

  if exists (select 1 from public.admins a where a.auth_user_id = v_auth) then
    raise exception 'Una cuenta administrativa no puede iniciar una solicitud de conductor.';
  end if;

  perform pg_advisory_xact_lock(hashtext('iniciar_solicitud:' || v_auth::text));

  select c.id into v_conductor from public.conductores c where c.auth_user_id = v_auth;
  select s.* into v_solicitud from public.solicitudes_conductor s
    where s.auth_user_id = v_auth and s.estado not in ('aprobado', 'rechazado')
    order by s.actualizado_en desc limit 1;

  if v_solicitud.id is null and v_conductor is null then
    begin
      insert into public.solicitudes_conductor(
        auth_user_id, estado, paso_actual, version_registro, origen_modelo
      ) values (v_auth, 'borrador', 0, 2, 'v2_minimo') returning * into v_solicitud;
    exception when unique_violation then
      select s.* into v_solicitud from public.solicitudes_conductor s
        where s.auth_user_id = v_auth and s.estado not in ('aprobado', 'rechazado')
        order by s.actualizado_en desc limit 1;
    end;
  end if;

  select u.email_confirmed_at is not null into v_confirmado from auth.users u where u.id = v_auth;
  if v_solicitud.id is not null and coalesce(v_confirmado, false) then
    if v_solicitud.estado = 'borrador' then
      perform public.cambiar_estado_solicitud_conductor(v_solicitud.id, 'correo_pendiente');
      perform public.cambiar_estado_solicitud_conductor(v_solicitud.id, 'datos_incompletos');
      v_solicitud.estado := 'datos_incompletos';
    elsif v_solicitud.estado = 'correo_pendiente' then
      perform public.cambiar_estado_solicitud_conductor(v_solicitud.id, 'datos_incompletos');
      v_solicitud.estado := 'datos_incompletos';
    end if;
  end if;

  if v_solicitud.id is null and v_conductor is not null then
    select s.* into v_solicitud from public.solicitudes_conductor s
      where s.auth_user_id = v_auth order by s.actualizado_en desc limit 1;
  end if;

  return query select v_solicitud.id, v_conductor, v_solicitud.estado, v_solicitud.paso_actual;
end;
$$;

revoke all on function public.iniciar_solicitud_conductor() from public, anon;
grant execute on function public.iniciar_solicitud_conductor() to authenticated;

commit;
