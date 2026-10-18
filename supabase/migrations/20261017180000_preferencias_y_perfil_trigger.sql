-- 20261017180000_preferencias_y_perfil_trigger.sql
-- 1. Añadir columna jsonb preferencias en usuarios para sincronización entre dispositivos
alter table public.usuarios
  add column if not exists preferencias jsonb not null default '{}'::jsonb;

-- 2. Asegurar índice único de clave_idempotencia en traslados para protección de idempotencia
create unique index if not exists traslados_usuario_clave_idempotencia_uidx
  on public.traslados(usuario_id, clave_idempotencia);

-- 3. Garantizar creación de perfil de usuario en auth.users (trigger on_auth_user_created)
-- Evita discrepancia lista<->detalle (IDOR 404 simulado) por perfiles ausentes
create or replace function public.manejar_nuevo_usuario_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo_registro text := coalesce(new.raw_user_meta_data->>'tipo_registro', 'usuario');
  v_tipo_cuenta text := coalesce(new.raw_user_meta_data->>'tipo_cuenta', 'personal');
  v_nombre text := coalesce(new.raw_user_meta_data->>'nombre', '');
  v_telefono text := new.raw_user_meta_data->>'telefono';
begin
  if v_tipo_registro = 'conductor' then
    insert into public.conductores (auth_user_id, nombre, telefono)
    values (new.id, v_nombre, v_telefono)
    on conflict (auth_user_id) do nothing;
  else
    insert into public.usuarios (auth_user_id, nombre, tipo_cuenta, rol, estado_verificacion, telefono, preferencias)
    values (
      new.id,
      nullif(v_nombre, ''),
      v_tipo_cuenta,
      (case when v_tipo_cuenta = 'empresa' then 'titular_empresa' else 'personal' end)::rol_usuario,
      'pendiente',
      v_telefono,
      '{}'::jsonb
    )
    on conflict (auth_user_id) do update set
      nombre = coalesce(public.usuarios.nombre, excluded.nombre),
      telefono = coalesce(public.usuarios.telefono, excluded.telefono);
  end if;
  return new;
end;
$$;
