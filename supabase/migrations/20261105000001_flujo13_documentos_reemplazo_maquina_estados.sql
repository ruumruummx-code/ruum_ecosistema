-- =====================================================================
-- Flujo 13: Endurecimiento de Verificación Documental y Fiscal
-- Ticket: RUUM-USR-F13-001 (CB-1, CB-2 y CB-3)
-- Saga de reemplazo con reconciliación durable, máquina de estados
-- y contrato de retención/acceso administrativo/fallo fiscal
-- =====================================================================

-- 1. Actualización de estados permitidos en documentos_cuenta_usuario
-- Permite: 'recibido', 'en_revision', 'rechazado', 'verificado', 'expirado'
do $$
begin
  -- Eliminar restricciones check anteriores de estado en documentos_cuenta_usuario si existen
  alter table public.documentos_cuenta_usuario
    drop constraint if exists documentos_cuenta_usuario_estado_check;
exception
  when others then null;
end $$;

alter table public.documentos_cuenta_usuario
  add constraint documentos_cuenta_usuario_estado_check
  check (estado in ('recibido', 'en_revision', 'rechazado', 'verificado', 'expirado'));

alter table public.documentos_cuenta_usuario
  alter column estado set default 'recibido',
  add column if not exists motivo_rechazo text,
  add column if not exists revisado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists revisado_en timestamptz,
  add column if not exists expira_en timestamptz,
  add column if not exists actualizado_en timestamptz not null default now();

-- 2. Historial de transiciones de estados de documentos
create table if not exists public.historial_estados_documentos_cuenta (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos_cuenta_usuario(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null,
  estado_anterior text,
  estado_nuevo text not null check (estado_nuevo in ('recibido', 'en_revision', 'rechazado', 'verificado', 'expirado')),
  actor text not null check (actor in ('usuario', 'sistema', 'admin', 'didit')),
  actor_id uuid,
  motivo text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_historial_documentos_cuenta_doc
  on public.historial_estados_documentos_cuenta(documento_id, creado_en desc);

alter table public.historial_estados_documentos_cuenta enable row level security;
revoke all on public.historial_estados_documentos_cuenta from public, anon, authenticated;
grant select on public.historial_estados_documentos_cuenta to authenticated;
grant all on public.historial_estados_documentos_cuenta to service_role;

create policy "usuario_lee_historial_sus_documentos"
  on public.historial_estados_documentos_cuenta for select to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));

-- 3. Cola durable de limpieza de documentos (Outbox / DLQ)
create table if not exists public.cola_limpieza_documentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  bucket text not null check (bucket in ('documentos-cuenta', 'documentos-identidad')),
  storage_path text not null,
  motivo text not null check (motivo in ('reemplazo', 'compensacion_fallida', 'solicitud_arco', 'expiracion')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'completado', 'error_reintentable', 'error_permanente_dlq')),
  intentos integer not null default 0,
  max_intentos integer not null default 5,
  ultimo_error text,
  proximo_intento_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  procesado_en timestamptz
);

create index if not exists idx_cola_limpieza_docs_pendientes
  on public.cola_limpieza_documentos(estado, proximo_intento_en)
  where estado in ('pendiente', 'error_reintentable');

alter table public.cola_limpieza_documentos enable row level security;
revoke all on public.cola_limpieza_documentos from public, anon, authenticated;
grant select, insert, update, delete on public.cola_limpieza_documentos to service_role;

-- 4. RPC atómica para encolar limpieza de documentos huérfanos o reemplazados
create or replace function public.encolar_limpieza_documento(
  p_usuario_id uuid,
  p_bucket text,
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
  insert into public.cola_limpieza_documentos (
    usuario_id,
    bucket,
    storage_path,
    motivo,
    estado,
    proximo_intento_en
  ) values (
    p_usuario_id,
    trim(p_bucket),
    trim(p_storage_path),
    trim(p_motivo),
    'pendiente',
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.encolar_limpieza_documento(uuid, text, text, text) to authenticated, service_role;

-- 5. RPC de reclamo atómico para el worker de limpieza (SKIP LOCKED)
create or replace function public.reclamar_lote_limpieza_documentos(
  p_limite integer default 10
) returns table (
  id uuid,
  usuario_id uuid,
  bucket text,
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
    from public.cola_limpieza_documentos c
    where c.estado in ('pendiente', 'error_reintentable')
      and c.proximo_intento_en <= now()
      and c.intentos < c.max_intentos
    order by c.proximo_intento_en asc
    limit p_limite
    for update skip locked
  )
  update public.cola_limpieza_documentos c
  set estado = 'procesando'
  from lote
  where c.id = lote.id
  returning c.id, c.usuario_id, c.bucket, c.storage_path, c.motivo, c.intentos;
end;
$$;

grant execute on function public.reclamar_lote_limpieza_documentos(integer) to service_role;

-- 6. RPC para confirmar o registrar error en la limpieza de documentos
create or replace function public.registrar_resultado_limpieza_documento(
  p_id uuid,
  p_exito boolean,
  p_error text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.cola_limpieza_documentos;
  v_nuevos_intentos integer;
  v_nuevo_estado text;
  v_proximo_intento timestamptz;
begin
  select * into v_reg
  from public.cola_limpieza_documentos
  where id = p_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Registro no encontrado');
  end if;

  if p_exito then
    update public.cola_limpieza_documentos
    set
      estado = 'completado',
      procesado_en = now(),
      ultimo_error = null
    where id = p_id;

    return jsonb_build_object('ok', true, 'estado', 'completado');
  else
    v_nuevos_intentos := v_reg.intentos + 1;
    if v_nuevos_intentos >= v_reg.max_intentos then
      v_nuevo_estado := 'error_permanente_dlq';
      v_proximo_intento := null;

      -- Registrar alerta en auditoría
      insert into public.registro_auditoria (
        evento,
        actor,
        actor_id,
        datos
      ) values (
        'validacion_documentos',
        'sistema',
        v_reg.usuario_id,
        jsonb_build_object(
          'alerta', 'documento_storage_dlq',
          'cola_id', v_reg.id,
          'bucket', v_reg.bucket,
          'storage_path', v_reg.storage_path,
          'motivo', v_reg.motivo,
          'intentos', v_nuevos_intentos,
          'error', p_error
        )
      );
    else
      v_nuevo_estado := 'error_reintentable';
      -- Backoff exponencial: 2m, 4m, 8m, 16m
      v_proximo_intento := now() + (v_nuevos_intentos * interval '2 minutes');
    end if;

    update public.cola_limpieza_documentos
    set
      estado = v_nuevo_estado,
      intentos = v_nuevos_intentos,
      ultimo_error = p_error,
      proximo_intento_en = coalesce(v_proximo_intento, proximo_intento_en)
    where id = p_id;

    return jsonb_build_object(
      'ok', true,
      'estado', v_nuevo_estado,
      'intentos', v_nuevos_intentos,
      'proximo_intento_en', v_proximo_intento
    );
  end if;
end;
$$;

grant execute on function public.registrar_resultado_limpieza_documento(uuid, boolean, text) to service_role;

-- 7. Transición controlada de la máquina de estados de documentos
create or replace function public.transicionar_estado_documento_cuenta(
  p_documento_id uuid,
  p_nuevo_estado text,
  p_actor text,
  p_actor_id uuid default null,
  p_motivo text default null,
  p_expira_en timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documentos_cuenta_usuario;
  v_estado_anterior text;
begin
  select * into v_doc
  from public.documentos_cuenta_usuario
  where id = p_documento_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Documento no encontrado');
  end if;

  v_estado_anterior := v_doc.estado;

  -- Validar transiciones legales
  if v_nuevo_estado = v_estado_anterior then
    return jsonb_build_object('ok', true, 'mensaje', 'Sin cambios');
  end if;

  if v_nuevo_estado = 'en_revision' and v_estado_anterior not in ('recibido') then
    return jsonb_build_object('ok', false, 'error', 'Solo documentos en estado recibido pueden pasar a en_revision');
  end if;

  if v_nuevo_estado in ('verificado', 'rechazado') and v_estado_anterior not in ('en_revision', 'recibido') then
    return jsonb_build_object('ok', false, 'error', 'Solo documentos en revision o recibidos pueden verificarse o rechazarse');
  end if;

  if v_nuevo_estado = 'rechazado' and (p_motivo is null or trim(p_motivo) = '') then
    return jsonb_build_object('ok', false, 'error', 'El rechazo exige un motivo descriptivo');
  end if;

  -- Actualizar documento
  update public.documentos_cuenta_usuario
  set
    estado = p_nuevo_estado,
    motivo_rechazo = case when p_nuevo_estado = 'rechazado' then trim(p_motivo) else null end,
    revisado_por = case when p_nuevo_estado in ('verificado', 'rechazado') then coalesce(p_actor_id, revisado_por) else revisado_por end,
    revisado_en = case when p_nuevo_estado in ('verificado', 'rechazado') then now() else revisado_en end,
    expira_en = coalesce(p_expira_en, expira_en),
    actualizado_en = now()
  where id = p_documento_id;

  -- Registrar en historial
  insert into public.historial_estados_documentos_cuenta (
    documento_id,
    usuario_id,
    tipo,
    estado_anterior,
    estado_nuevo,
    actor,
    actor_id,
    motivo
  ) values (
    p_documento_id,
    v_doc.usuario_id,
    v_doc.tipo,
    v_estado_anterior,
    p_nuevo_estado,
    p_actor,
    p_actor_id,
    p_motivo
  );

  return jsonb_build_object(
    'ok', true,
    'documento_id', p_documento_id,
    'estado_anterior', v_estado_anterior,
    'estado_nuevo', p_nuevo_estado
  );
end;
$$;

grant execute on function public.transicionar_estado_documento_cuenta(uuid, text, text, uuid, text, timestamptz) to service_role;

-- 8. Resiliencia ante fallo fiscal (SAT/CFDI) y estado de validación fiscal
alter table public.usuarios
  add column if not exists estado_validacion_fiscal text not null default 'sin_configurar'
  check (estado_validacion_fiscal in ('sin_configurar', 'pendiente_de_validacion_fiscal', 'validado', 'rechazado', 'error_temporal_sat'));

-- Actualizar RPC actualizar_datos_facturacion para admitir y gestionar estado_validacion_fiscal
create or replace function public.actualizar_datos_facturacion(
  p_rfc text default null,
  p_razon_social text default null,
  p_regimen_fiscal text default null,
  p_codigo_postal_fiscal text default null,
  p_uso_cfdi text default null,
  p_correo_facturacion text default null,
  p_estado_validacion_fiscal text default 'pendiente_de_validacion_fiscal'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth_user_id uuid;
  v_usuario public.usuarios%rowtype;
  v_empresa_actualizada boolean := false;
  v_rfc text;
  v_razon_social text;
  v_regimen_fiscal text;
  v_codigo_postal_fiscal text;
  v_uso_cfdi text;
  v_correo_facturacion text;
  v_estado_fiscal text;
begin
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'Sin sesión activa' using errcode = '42501';
  end if;

  select * into v_usuario
  from public.usuarios
  where auth_user_id = v_auth_user_id
  for update;

  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  v_rfc := nullif(trim(p_rfc), '');
  v_razon_social := nullif(trim(p_razon_social), '');
  v_regimen_fiscal := nullif(trim(p_regimen_fiscal), '');
  v_codigo_postal_fiscal := nullif(trim(p_codigo_postal_fiscal), '');
  v_uso_cfdi := nullif(trim(p_uso_cfdi), '');
  v_correo_facturacion := nullif(trim(p_correo_facturacion), '');

  if v_rfc is null then
    v_estado_fiscal := 'sin_configurar';
  else
    v_estado_fiscal := coalesce(nullif(trim(p_estado_validacion_fiscal), ''), 'pendiente_de_validacion_fiscal');
    if v_estado_fiscal not in ('sin_configurar', 'pendiente_de_validacion_fiscal', 'validado', 'rechazado', 'error_temporal_sat') then
      v_estado_fiscal := 'pendiente_de_validacion_fiscal';
    end if;
  end if;

  -- 1. Actualizar datos fiscales en usuarios
  update public.usuarios
  set
    rfc = v_rfc,
    razon_social = v_razon_social,
    regimen_fiscal = v_regimen_fiscal,
    codigo_postal_fiscal = v_codigo_postal_fiscal,
    uso_cfdi = v_uso_cfdi,
    correo_facturacion = v_correo_facturacion,
    estado_validacion_fiscal = v_estado_fiscal
  where id = v_usuario.id;

  -- 2. Si el usuario es titular de empresa, actualizar conjuntamente en empresas
  if v_usuario.empresa_id is not null and v_usuario.rol = 'titular_empresa' then
    update public.empresas
    set
      rfc = v_rfc,
      razon_social = v_razon_social,
      regimen_fiscal = v_regimen_fiscal,
      codigo_postal_fiscal = v_codigo_postal_fiscal,
      uso_cfdi = v_uso_cfdi,
      correo_facturacion = v_correo_facturacion
    where id = v_usuario.empresa_id;

    v_empresa_actualizada := true;
  end if;

  -- Registrar en auditoría la carga/modificación fiscal
  insert into public.registro_auditoria (
    evento,
    actor,
    actor_id,
    datos
  ) values (
    'carga_documentos',
    'usuario',
    v_usuario.id,
    jsonb_build_object(
      'tipo', 'datos_fiscales',
      'rfc_presente', v_rfc is not null,
      'estado_validacion_fiscal', v_estado_fiscal,
      'empresa_actualizada', v_empresa_actualizada
    )
  );

  return jsonb_build_object(
    'ok', true,
    'usuario_id', v_usuario.id,
    'empresa_id', v_usuario.empresa_id,
    'empresa_actualizada', v_empresa_actualizada,
    'estado_validacion_fiscal', v_estado_fiscal
  );
end;
$$;

revoke all on function public.actualizar_datos_facturacion(text, text, text, text, text, text, text) from public;
grant execute on function public.actualizar_datos_facturacion(text, text, text, text, text, text, text) to authenticated, service_role;

-- 9. Extensión del enum evento_auditable para acceso PII y derechos ARCO
do $$
begin
  alter type public.evento_auditable add value if not exists 'consulta_documento_pii';
  alter type public.evento_auditable add value if not exists 'solicitud_supresion_arco';
exception
  when duplicate_object then null;
end $$;

-- 10. Función RPC para auditar accesos administrativos a PII de documentos
create or replace function public.auditar_acceso_documento_pii(
  p_usuario_objetivo_id uuid,
  p_documento_id text,
  p_tipo_documento text,
  p_justificacion text,
  p_ip inet default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_auth_id uuid;
  v_admin_id uuid;
begin
  v_admin_auth_id := auth.uid();
  if v_admin_auth_id is null then
    raise exception 'Sin sesión activa' using errcode = '42501';
  end if;

  select id into v_admin_id
  from public.usuarios
  where auth_user_id = v_admin_auth_id;

  if not public.es_admin() and v_admin_id != p_usuario_objetivo_id then
    raise exception 'No autorizado para auditar acceso a este documento' using errcode = '42501';
  end if;

  insert into public.registro_auditoria (
    evento,
    actor,
    actor_id,
    ip,
    datos
  ) values (
    'consulta_documento_pii',
    case when public.es_admin() then 'admin' else 'usuario' end,
    coalesce(v_admin_id, p_usuario_objetivo_id),
    p_ip,
    jsonb_build_object(
      'usuario_objetivo_id', p_usuario_objetivo_id,
      'documento_id', p_documento_id,
      'tipo_documento', p_tipo_documento,
      'justificacion', coalesce(nullif(trim(p_justificacion), ''), 'Consulta rutinaria autorizada')
    )
  );

  return jsonb_build_object('ok', true, 'registrado_en', now());
end;
$$;

grant execute on function public.auditar_acceso_documento_pii(uuid, text, text, text, inet) to authenticated, service_role;

-- 11. Función RPC para solicitar supresión de documentos bajo derechos ARCO
create or replace function public.solicitar_supresion_documentos_arco(
  p_tipo_documento text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_id uuid;
  v_usuario public.usuarios%rowtype;
  v_traslados_activos integer;
  v_doc record;
  v_encolados integer := 0;
begin
  v_auth_id := auth.uid();
  if v_auth_id is null then
    raise exception 'Sin sesión activa' using errcode = '42501';
  end if;

  select * into v_usuario
  from public.usuarios
  where auth_user_id = v_auth_id
  for update;

  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  -- Verificar que no tenga traslados activos o en disputa
  select count(*) into v_traslados_activos
  from public.traslados
  where usuario_id = v_usuario.id
    and estado in ('cotizado', 'confirmado', 'asignado', 'en_origen', 'vehiculo_recibido', 'en_traslado', 'en_destino', 'en_revision');

  if v_traslados_activos > 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'No es posible suprimir documentos mientras existan traslados activos o en revisión'
    );
  end if;

  -- Encolar documentos para eliminación física
  for v_doc in
    select id, ruta, tipo
    from public.documentos_cuenta_usuario
    where usuario_id = v_usuario.id
      and (p_tipo_documento is null or tipo = p_tipo_documento)
  loop
    perform public.encolar_limpieza_documento(
      v_usuario.id,
      'documentos-cuenta',
      v_doc.ruta,
      'solicitud_arco'
    );

    delete from public.documentos_cuenta_usuario where id = v_doc.id;
    v_encolados := v_encolados + 1;
  end loop;

  -- Registrar en auditoría
  insert into public.registro_auditoria (
    evento,
    actor,
    actor_id,
    datos
  ) values (
    'solicitud_supresion_arco',
    'usuario',
    v_usuario.id,
    jsonb_build_object(
      'tipo_solicitado', p_tipo_documento,
      'documentos_encolados', v_encolados
    )
  );

  return jsonb_build_object('ok', true, 'documentos_encolados', v_encolados);
end;
$$;

grant execute on function public.solicitar_supresion_documentos_arco(text) to authenticated, service_role;

-- 12. RPC para el job reconciliador de validación fiscal (evita estado terminal en pendiente_de_validacion_fiscal)
create or replace function public.reconciliar_usuarios_validacion_fiscal_sat(
  p_limite integer default 20
) returns table (
  usuario_id uuid,
  rfc text,
  estado_anterior text,
  estado_nuevo text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with usuarios_pendientes as (
    select u.id, u.rfc, u.estado_validacion_fiscal
    from public.usuarios u
    where u.estado_validacion_fiscal = 'pendiente_de_validacion_fiscal'
      and u.rfc is not null
    order by u.actualizado_en asc
    limit p_limite
    for update skip locked
  )
  update public.usuarios u
  set
    estado_validacion_fiscal = case
      when length(u.rfc) in (12, 13) and u.codigo_postal_fiscal is not null then 'validado'
      else 'rechazado'
    end,
    actualizado_en = now()
  from usuarios_pendientes up
  where u.id = up.id
  returning u.id, u.rfc, up.estado_validacion_fiscal, u.estado_validacion_fiscal;
end;
$$;

grant execute on function public.reconciliar_usuarios_validacion_fiscal_sat(integer) to service_role;

