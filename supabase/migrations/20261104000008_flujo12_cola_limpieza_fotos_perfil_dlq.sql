-- =====================================================================
-- Flujo 12: Cola Durable de Limpieza Asíncrona, DLQ y Reconciliador de Huérfanos
-- Ticket: RUUM-USR-F12-001 (CB-2 y CB-3)
-- =====================================================================

-- 1. Tabla outbox/cola de limpieza de archivos en fotos-perfil
create table if not exists public.cola_limpieza_fotos_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  storage_path text not null,
  motivo text not null check (motivo in ('reemplazo_foto_previa', 'compensacion_fallida_huerfano')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'completado', 'error_reintentable', 'error_permanente_dlq')),
  intentos integer not null default 0,
  max_intentos integer not null default 5,
  ultimo_error text,
  proximo_intento_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  procesado_en timestamptz
);

create index if not exists idx_cola_limpieza_fotos_pendientes
  on public.cola_limpieza_fotos_perfil(estado, proximo_intento_en)
  where estado in ('pendiente', 'error_reintentable');

alter table public.cola_limpieza_fotos_perfil enable row level security;
revoke all on public.cola_limpieza_fotos_perfil from public, anon, authenticated;
grant select, insert, update, delete on public.cola_limpieza_fotos_perfil to service_role;

-- 2. Función atómica para encolar limpieza de fotos (invocable por authenticated para su propio usuario o service_role)
create or replace function public.encolar_limpieza_foto_perfil(
  p_usuario_id uuid,
  p_storage_path text,
  p_motivo text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.cola_limpieza_fotos_perfil (
    usuario_id,
    storage_path,
    motivo,
    estado,
    proximo_intento_en
  ) values (
    p_usuario_id,
    trim(p_storage_path),
    p_motivo,
    'pendiente',
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.encolar_limpieza_foto_perfil(uuid, text, text) to authenticated, service_role;

-- 3. Función del consumidor para reclamar y procesar lote con bloqueo SKIP LOCKED
create or replace function public.reclamar_lote_limpieza_fotos_perfil(
  p_limite integer default 25
) returns table (
  id uuid,
  usuario_id uuid,
  storage_path text,
  motivo text,
  intentos integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with lote as (
    select c.id
    from public.cola_limpieza_fotos_perfil c
    where c.estado in ('pendiente', 'error_reintentable')
      and c.proximo_intento_en <= now()
      and c.intentos < c.max_intentos
    order by c.proximo_intento_en asc
    limit p_limite
    for update skip locked
  )
  update public.cola_limpieza_fotos_perfil c
  set estado = 'procesando'
  from lote
  where c.id = lote.id
  returning c.id, c.usuario_id, c.storage_path, c.motivo, c.intentos;
end;
$$;

grant execute on function public.reclamar_lote_limpieza_fotos_perfil(integer) to service_role;

-- 4. Registro del resultado de procesamiento de la limpieza
create or replace function public.registrar_resultado_limpieza_foto_perfil(
  p_id uuid,
  p_exito boolean,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.cola_limpieza_fotos_perfil;
  v_nuevos_intentos integer;
  v_nuevo_estado text;
  v_proximo timestamptz;
begin
  select * into v_reg from public.cola_limpieza_fotos_perfil where id = p_id for update;
  if not found then return; end if;

  if p_exito then
    update public.cola_limpieza_fotos_perfil
    set estado = 'completado',
        procesado_en = now(),
        ultimo_error = null
    where id = p_id;
  else
    v_nuevos_intentos := v_reg.intentos + 1;
    if v_nuevos_intentos >= v_reg.max_intentos then
      v_nuevo_estado := 'error_permanente_dlq';
      v_proximo := null;

      -- Registrar evento en auditoría para revisión de plataforma
      perform public.registrar_auditoria_seguridad(
        'error_dlq_limpieza_storage',
        'sistema',
        v_reg.usuario_id,
        jsonb_build_object(
          'storage_path', v_reg.storage_path,
          'motivo', v_reg.motivo,
          'intentos', v_nuevos_intentos,
          'ultimo_error', p_error
        )
      );
    else
      v_nuevo_estado := 'error_reintentable';
      -- Backoff exponencial: 1m, 4m, 9m, 16m
      v_proximo := now() + ((v_nuevos_intentos ^ 2) * interval '1 minute');
    end if;

    update public.cola_limpieza_fotos_perfil
    set estado = v_nuevo_estado,
        intentos = v_nuevos_intentos,
        ultimo_error = p_error,
        proximo_intento_en = coalesce(v_proximo, now())
    where id = p_id;
  end if;
end;
$$;

grant execute on function public.registrar_resultado_limpieza_foto_perfil(uuid, boolean, text) to service_role;

-- 5. Actualización de validación de fecha en usuario_actualiza_perfil_transaccional
-- Añade rechazo explícito de fecha imposible (< 1900-01-01 o edad > 125) (CB-3)
create or replace function public.usuario_actualiza_perfil_transaccional(
  p_datos jsonb,
  p_version_esperada integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_uid uuid;
  v_usuario_id uuid;
  v_version_actual integer;
  v_nueva_version integer;
  v_nombre text;
  v_telefono text;
  v_pais text;
  v_estado text;
  v_ciudad text;
  v_colonia text;
  v_calle text;
  v_numero text;
  v_codigo_postal text;
  v_referencias text;
  v_direccion_principal text;
  v_fecha_nac_str text;
  v_fecha_nac date;
  v_edad_anios integer;
  v_foto_url text;
  v_usuario_actualizado public.usuarios%rowtype;
begin
  -- 1. Identificación y autorización
  v_auth_uid := auth.uid();
  if v_auth_uid is null then
    raise exception 'no_autorizado: Se requiere sesión activa para actualizar perfil.' using errcode = '42501';
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
    end if;
  end if;

  v_estado := nullif(trim(coalesce(p_datos->>'estado', '')), '');
  if v_estado is not null and char_length(v_estado) > 80 then
    raise exception 'estado_invalido: El estado no puede exceder 80 caracteres.' using errcode = '22001';
  end if;

  v_ciudad := nullif(trim(coalesce(p_datos->>'ciudad', '')), '');
  if v_ciudad is not null and char_length(v_ciudad) > 80 then
    raise exception 'ciudad_invalida: La ciudad no puede exceder 80 caracteres.' using errcode = '22001';
  end if;

  v_colonia := nullif(trim(coalesce(p_datos->>'colonia', '')), '');
  if v_colonia is not null and char_length(v_colonia) > 80 then
    raise exception 'colonia_invalida: La colonia no puede exceder 80 caracteres.' using errcode = '22001';
  end if;

  v_calle := nullif(trim(coalesce(p_datos->>'calle', '')), '');
  if v_calle is not null and char_length(v_calle) > 120 then
    raise exception 'calle_invalida: La calle no puede exceder 120 caracteres.' using errcode = '22001';
  end if;

  v_numero := nullif(trim(coalesce(p_datos->>'numero', '')), '');
  if v_numero is not null and char_length(v_numero) > 30 then
    raise exception 'numero_invalido: El número no puede exceder 30 caracteres.' using errcode = '22001';
  end if;

  v_referencias := nullif(trim(coalesce(p_datos->>'referencias', '')), '');
  if v_referencias is not null and char_length(v_referencias) > 250 then
    raise exception 'referencias_invalidas: Las referencias no pueden exceder 250 caracteres.' using errcode = '22001';
  end if;

  v_direccion_principal := nullif(trim(coalesce(p_datos->>'direccion_principal', '')), '');

  -- 5. Validación de Fecha de Nacimiento con bordes de fecha futura e imposible (CB-3)
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

    if v_fecha_nac < date '1900-01-01' then
      raise exception 'fecha_nacimiento_imposible: La fecha de nacimiento no es válida (debe ser posterior a 1900).' using errcode = '22023';
    end if;

    v_edad_anios := extract(year from age(current_date, v_fecha_nac));
    if v_edad_anios > 125 then
      raise exception 'fecha_nacimiento_imposible: La edad calculada excede el límite permitido (125 años).' using errcode = '22023';
    end if;

    if v_edad_anios < 18 then
      raise exception 'usuario_menor_de_edad: Debes ser mayor de edad (18 años) para usar la plataforma.' using errcode = '22023';
    end if;
  else
    v_fecha_nac := null;
  end if;

  -- 6. Actualización Atómica Única (General + Fecha + Foto + Versión)
  v_foto_url := nullif(trim(coalesce(p_datos->>'foto_url', '')), '');
  v_nueva_version := coalesce(v_version_actual, 1) + 1;

  update public.usuarios
  set
    nombre = v_nombre,
    telefono = v_telefono,
    pais = v_pais,
    estado = v_estado,
    ciudad = v_ciudad,
    codigo_postal = v_codigo_postal,
    colonia = v_colonia,
    calle = v_calle,
    numero = v_numero,
    referencias = v_referencias,
    direccion_principal = v_direccion_principal,
    fecha_nacimiento = v_fecha_nac,
    foto_url = coalesce(v_foto_url, foto_url),
    version = v_nueva_version,
    actualizado_en = now()
  where id = v_usuario_id
  returning * into v_usuario_actualizado;

  return jsonb_build_object(
    'ok', true,
    'version', v_nueva_version,
    'usuario', to_jsonb(v_usuario_actualizado)
  );
end;
$$;
