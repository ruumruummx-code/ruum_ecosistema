-- Migración: Endurecimiento del Flujo 12 - Datos personales (RPC transaccional con versión)
-- Ticket: RUUM-USR-F12-001
-- Fecha: 2026-11-04
-- Garantiza atomicidad de perfil general + fecha de nacimiento, control optimista de concurrencia y validación server-side.

-- 1. Agregar columna version a usuarios si no existe
alter table public.usuarios
  add column if not exists version integer not null default 1;

comment on column public.usuarios.version is
  'Versión monotónica de control de concurrencia optimista para el expediente del usuario.';

-- 2. Función RPC Transaccional con Control de Versión y Validaciones Server-Side
create or replace function public.usuario_actualiza_perfil_transaccional(
  p_datos jsonb,
  p_version_esperada integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth_uid uuid;
  v_usuario_id uuid;
  v_version_actual integer;
  v_nombre text;
  v_telefono text;
  v_pais text;
  v_estado text;
  v_ciudad text;
  v_codigo_postal text;
  v_colonia text;
  v_calle text;
  v_numero text;
  v_referencias text;
  v_direccion_principal text;
  v_foto_url text;
  v_fecha_nac_str text;
  v_fecha_nac date;
  v_edad_anios integer;
  v_usuario_actualizado record;
begin
  -- 1. Verificar autenticación activa
  v_auth_uid := auth.uid();
  if v_auth_uid is null then
    raise exception 'sin_sesion: Operación requiere un usuario autenticado.' using errcode = '40001';
  end if;

  -- 2. Bloqueo pesimista para lectura y validación de versión (FOR UPDATE)
  select id, version
  into v_usuario_id, v_version_actual
  from public.usuarios
  where auth_user_id = v_auth_uid
  for update;

  if not found then
    raise exception 'usuario_no_encontrado: No existe registro para el auth_user_id provisto.' using errcode = 'P0002';
  end if;

  -- 3. Control de Concurrencia Optimista (CB-1 / CA-2)
  if p_version_esperada is not null and p_version_esperada != v_version_actual then
    raise exception 'conflicto_version: El perfil fue modificado por otra sesión o pestaña (versión actual %, esperada %).'
      , v_version_actual, p_version_esperada using errcode = '40001';
  end if;

  -- 4. Extracción y validación server-side de longitud y dominios (CB-3 / CA-8)
  v_nombre := trim(coalesce(p_datos->>'nombre', ''));
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 100 then
    raise exception 'nombre_invalido: El nombre debe tener entre 2 y 100 caracteres.' using errcode = '22001';
  end if;

  if p_datos ? 'telefono' and p_datos->>'telefono' is not null and trim(p_datos->>'telefono') != '' then
    v_telefono := trim(p_datos->>'telefono');
    if char_length(v_telefono) < 10 or char_length(v_telefono) > 20 then
      raise exception 'telefono_invalido: El teléfono debe tener entre 10 y 20 caracteres.' using errcode = '22001';
    end if;
  else
    v_telefono := null;
  end if;

  v_pais := trim(coalesce(p_datos->>'pais', 'México'));
  if char_length(v_pais) > 50 then
    raise exception 'pais_invalido: El país no puede exceder 50 caracteres.' using errcode = '22001';
  end if;

  v_codigo_postal := nullif(trim(coalesce(p_datos->>'codigo_postal', '')), '');
  if v_codigo_postal is not null then
    if v_pais = 'México' and not (v_codigo_postal ~ '^[0-9]{5}$') then
      raise exception 'codigo_postal_invalido: En México el código postal debe ser de exactamente 5 dígitos numéricos.' using errcode = '22023';
    elsif char_length(v_codigo_postal) > 12 then
      raise exception 'codigo_postal_invalido: El código postal no puede exceder 12 caracteres.' using errcode = '22001';
    end if;
  end if;

  v_calle := nullif(trim(coalesce(p_datos->>'calle', '')), '');
  if v_calle is not null and char_length(v_calle) > 150 then
    raise exception 'calle_invalida: La calle no puede exceder 150 caracteres.' using errcode = '22001';
  end if;

  v_numero := nullif(trim(coalesce(p_datos->>'numero', '')), '');
  if v_numero is not null and char_length(v_numero) > 20 then
    raise exception 'numero_invalido: El número exterior/interior no puede exceder 20 caracteres.' using errcode = '22001';
  end if;

  v_colonia := nullif(trim(coalesce(p_datos->>'colonia', '')), '');
  if v_colonia is not null and char_length(v_colonia) > 100 then
    raise exception 'colonia_invalida: La colonia no puede exceder 100 caracteres.' using errcode = '22001';
  end if;

  v_ciudad := nullif(trim(coalesce(p_datos->>'ciudad', '')), '');
  if v_ciudad is not null and char_length(v_ciudad) > 100 then
    raise exception 'ciudad_invalida: La ciudad no puede exceder 100 caracteres.' using errcode = '22001';
  end if;

  v_estado := nullif(trim(coalesce(p_datos->>'estado', '')), '');
  if v_estado is not null and char_length(v_estado) > 100 then
    raise exception 'estado_invalido: El estado no puede exceder 100 caracteres.' using errcode = '22001';
  end if;

  v_referencias := nullif(trim(coalesce(p_datos->>'referencias', '')), '');
  if v_referencias is not null and char_length(v_referencias) > 250 then
    raise exception 'referencias_invalidas: Las referencias no pueden exceder 250 caracteres.' using errcode = '22001';
  end if;

  v_direccion_principal := nullif(trim(coalesce(p_datos->>'direccion_principal', '')), '');

  -- 5. Validación de Fecha de Nacimiento (CB-1 / CA-1)
  v_fecha_nac_str := nullif(trim(coalesce(p_datos->>'fecha_nacimiento', '')), '');
  if v_fecha_nac_str is not null then
    begin
      v_fecha_nac := v_fecha_nac_str::date;
    exception when others then
      raise exception 'fecha_nacimiento_invalida: El formato de fecha de nacimiento debe ser YYYY-MM-DD.' using errcode = '22007';
    end;

    if v_fecha_nac > current_date then
      raise exception 'fecha_nacimiento_futura: La fecha de nacimiento no puede ser futura.' using errcode = '22023';
    end if;

    v_edad_anios := extract(year from age(current_date, v_fecha_nac));
    if v_edad_anios < 18 then
      raise exception 'usuario_menor_de_edad: Debes ser mayor de edad (18 años) para usar la plataforma.' using errcode = '22023';
    end if;
  else
    v_fecha_nac := null;
  end if;

  -- 6. Actualización Atómica Única (General + Fecha + Foto + Versión)
  update public.usuarios
  set
    nombre = v_nombre,
    telefono = case when p_datos ? 'telefono' then v_telefono else telefono end,
    pais = v_pais,
    estado = v_estado,
    ciudad = v_ciudad,
    codigo_postal = v_codigo_postal,
    colonia = v_colonia,
    calle = v_calle,
    numero = v_numero,
    referencias = v_referencias,
    direccion_principal = coalesce(v_direccion_principal, direccion_principal),
    fecha_nacimiento = case when p_datos ? 'fecha_nacimiento' then v_fecha_nac else fecha_nacimiento end,
    foto_url = case when p_datos ? 'foto_url' then nullif(trim(p_datos->>'foto_url'), '') else foto_url end,
    version = v_version_actual + 1,
    actualizado_en = timezone('utc'::text, now())
  where auth_user_id = v_auth_uid
  returning * into v_usuario_actualizado;

  -- 7. Registrar evento de auditoría
  insert into public.registro_auditoria (
    evento,
    actor,
    actor_id,
    datos,
    creado_en
  ) values (
    'actualizacion_usuario',
    'usuario',
    v_usuario_id::text,
    jsonb_build_object(
      'version_previa', v_version_actual,
      'version_nueva', v_version_actual + 1,
      'campos_actualizados', (select jsonb_agg(k) from jsonb_object_keys(p_datos) as k)
    ),
    timezone('utc'::text, now())
  );

  -- 8. Respuesta estructurada para actualización local sin refresh completo (CB-3 / CA-6)
  return jsonb_build_object(
    'ok', true,
    'version', v_version_actual + 1,
    'usuario', row_to_json(v_usuario_actualizado)
  );
end;
$$;

revoke all on function public.usuario_actualiza_perfil_transaccional(jsonb, integer) from public;
grant execute on function public.usuario_actualiza_perfil_transaccional(jsonb, integer) to authenticated;

comment on function public.usuario_actualiza_perfil_transaccional(jsonb, integer) is
  'Actualiza atómicamente el perfil general y fecha de nacimiento del usuario con control de versión optimista (anti-lost-update).';
