-- Verificación REPUVE e identidad física de vehículo (VIN/placas) en recolección.
-- Incluye:
-- 1. Tabla append-only public.vehiculo_verificaciones_repuve con RLS por rol y vista resumida para el usuario.
-- 2. Función de validación public.traslado_tiene_verificacion_repuve_valida(uuid).
-- 3. RPC public.conductor_registra_verificacion_repuve con normalización de VIN/placas, muestreo de auditoría y bitácora.
-- 4. RPCs de soporte/admin: public.admin_override_verificacion_repuve y public.admin_dictaminar_auditoria_repuve.
-- 5. Candados en public.conductor_avanza_traslado (iniciar_evidencia_inicial, evidencia_inicial_completada y vehiculo_recibido).

create table if not exists public.vehiculo_verificaciones_repuve (
  id uuid primary key default gen_random_uuid(),
  traslado_id uuid not null references public.traslados(id) on delete cascade,
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  conductor_id uuid references public.conductores(id) on delete set null,
  actor_rol text not null default 'conductor' check (actor_rol in ('conductor', 'admin')),
  vin_esperado text not null,
  placas_esperadas text,
  vin_fisico text not null check (char_length(btrim(vin_fisico)) between 5 and 32),
  placas_fisicas text,
  coincide_vin boolean not null,
  coincide_placas boolean not null,
  coincide boolean not null,
  resultado text not null check (
    resultado in (
      'limpio',
      'con_reporte_robo',
      'con_aviso_recuperado',
      'no_encontrado',
      'error_portal',
      'override_admin'
    )
  ),
  captura_path text,
  es_override_admin boolean not null default false,
  motivo_override text,
  autorizado_por_auth_id uuid references auth.users(id) on delete set null,
  requiere_auditoria boolean not null default false,
  auditoria_dictamen text check (
    auditoria_dictamen is null or auditoria_dictamen in ('pendiente', 'aprobada', 'observada')
  ),
  auditoria_notas text,
  auditoria_revisada_por uuid references auth.users(id) on delete set null,
  auditoria_revisada_en timestamptz,
  creado_en timestamptz not null default now(),
  constraint chk_repuve_captura_conductor check (
    es_override_admin = true
    or (actor_rol = 'conductor' and nullif(btrim(coalesce(captura_path, '')), '') is not null)
  ),
  constraint chk_repuve_override_motivo check (
    (es_override_admin = false and resultado <> 'override_admin')
    or (
      es_override_admin = true
      and actor_rol = 'admin'
      and resultado = 'override_admin'
      and char_length(btrim(coalesce(motivo_override, ''))) >= 10
      and autorizado_por_auth_id is not null
    )
  )
);

create index if not exists idx_verificaciones_repuve_traslado_creado
  on public.vehiculo_verificaciones_repuve(traslado_id, creado_en desc, id desc);

create index if not exists idx_verificaciones_repuve_excepciones
  on public.vehiculo_verificaciones_repuve(creado_en desc)
  where (coincide = false or resultado not in ('limpio', 'override_admin'));

create index if not exists idx_verificaciones_repuve_cola_auditoria
  on public.vehiculo_verificaciones_repuve(creado_en desc)
  where requiere_auditoria = true and (auditoria_dictamen is null or auditoria_dictamen = 'pendiente');

-- Protección append-only: ningún registro de verificación puede borrarse ni alterar sus datos capturados.
create or replace function public.proteger_verificaciones_repuve_append_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'La bitácora de verificaciones REPUVE es append-only y no permite eliminar registros.';
  end if;

  if tg_op = 'UPDATE' then
    if not public.es_admin() then
      raise exception 'La bitácora de verificaciones REPUVE es append-only y no permite modificaciones.';
    end if;

    if (
      new.id is distinct from old.id
      or new.traslado_id is distinct from old.traslado_id
      or new.vehiculo_id is distinct from old.vehiculo_id
      or new.conductor_id is distinct from old.conductor_id
      or new.actor_rol is distinct from old.actor_rol
      or new.vin_esperado is distinct from old.vin_esperado
      or new.placas_esperadas is distinct from old.placas_esperadas
      or new.vin_fisico is distinct from old.vin_fisico
      or new.placas_fisicas is distinct from old.placas_fisicas
      or new.coincide_vin is distinct from old.coincide_vin
      or new.coincide_placas is distinct from old.coincide_placas
      or new.coincide is distinct from old.coincide
      or new.resultado is distinct from old.resultado
      or new.captura_path is distinct from old.captura_path
      or new.es_override_admin is distinct from old.es_override_admin
      or new.motivo_override is distinct from old.motivo_override
      or new.autorizado_por_auth_id is distinct from old.autorizado_por_auth_id
      or new.requiere_auditoria is distinct from old.requiere_auditoria
      or new.creado_en is distinct from old.creado_en
    ) then
      raise exception 'Los datos originales de la verificación REPUVE son inmutables (append-only).';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_verificaciones_repuve_append_only on public.vehiculo_verificaciones_repuve;
create trigger trg_proteger_verificaciones_repuve_append_only
  before update or delete on public.vehiculo_verificaciones_repuve
  for each row execute function public.proteger_verificaciones_repuve_append_only();

alter table public.vehiculo_verificaciones_repuve enable row level security;
revoke all on public.vehiculo_verificaciones_repuve from public, anon, authenticated;
grant select, insert on public.vehiculo_verificaciones_repuve to authenticated;
grant all on public.vehiculo_verificaciones_repuve to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehiculo_verificaciones_repuve'
      and policyname = 'admin_lee_todo_verificaciones_repuve'
  ) then
    create policy admin_lee_todo_verificaciones_repuve
      on public.vehiculo_verificaciones_repuve
      for select
      to authenticated
      using (public.es_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehiculo_verificaciones_repuve'
      and policyname = 'conductor_lee_verificaciones_repuve_asignadas'
  ) then
    create policy conductor_lee_verificaciones_repuve_asignadas
      on public.vehiculo_verificaciones_repuve
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.traslados t
          join public.conductores c on c.id = t.conductor_id
          where t.id = vehiculo_verificaciones_repuve.traslado_id
            and c.auth_user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehiculo_verificaciones_repuve'
      and policyname = 'conductor_inserta_verificacion_repuve'
  ) then
    create policy conductor_inserta_verificacion_repuve
      on public.vehiculo_verificaciones_repuve
      for insert
      to authenticated
      with check (
        actor_rol = 'conductor'
        and es_override_admin = false
        and exists (
          select 1
          from public.traslados t
          join public.conductores c on c.id = t.conductor_id
          where t.id = vehiculo_verificaciones_repuve.traslado_id
            and t.vehiculo_id = vehiculo_verificaciones_repuve.vehiculo_id
            and c.id = vehiculo_verificaciones_repuve.conductor_id
            and c.auth_user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehiculo_verificaciones_repuve'
      and policyname = 'admin_inserta_override_repuve'
  ) then
    create policy admin_inserta_override_repuve
      on public.vehiculo_verificaciones_repuve
      for insert
      to authenticated
      with check (
        public.es_admin()
        and actor_rol = 'admin'
        and es_override_admin = true
      );
  end if;
end $$;

-- Función que evalúa si un traslado cuenta con verificación REPUVE válida para avanzar.
-- Reglas:
-- 1. Debe existir al menos un registro en vehiculo_verificaciones_repuve para el traslado.
-- 2. Si existe un reporte previo de robo ('con_reporte_robo') o aviso ('con_aviso_recuperado'),
--    el conductor no puede auto-desbloquearlo sin que exista un override posterior de administración.
-- 3. El último registro debe ser:
--    a) un override autorizado de admin (es_override_admin = true y resultado = 'override_admin'), o
--    b) una verificación del conductor con resultado = 'limpio', coincide = true (VIN y placas) y captura_path presente.
create or replace function public.traslado_tiene_verificacion_repuve_valida(
  p_traslado_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ultima record;
  v_ultimo_reporte_grave timestamptz;
  v_ultimo_override timestamptz;
begin
  select
    id,
    resultado,
    coincide,
    coincide_vin,
    coincide_placas,
    captura_path,
    es_override_admin,
    creado_en
  into v_ultima
  from public.vehiculo_verificaciones_repuve
  where traslado_id = p_traslado_id
  order by creado_en desc, id desc
  limit 1;

  if v_ultima.id is null then
    return false;
  end if;

  if v_ultima.es_override_admin = true and v_ultima.resultado = 'override_admin' then
    return true;
  end if;

  select max(creado_en)
  into v_ultimo_reporte_grave
  from public.vehiculo_verificaciones_repuve
  where traslado_id = p_traslado_id
    and resultado in ('con_reporte_robo', 'con_aviso_recuperado');

  if v_ultimo_reporte_grave is not null then
    select max(creado_en)
    into v_ultimo_override
    from public.vehiculo_verificaciones_repuve
    where traslado_id = p_traslado_id
      and es_override_admin = true
      and resultado = 'override_admin';

    if v_ultimo_override is null or v_ultimo_override < v_ultimo_reporte_grave then
      return false;
    end if;
  end if;

  return (
    v_ultima.resultado = 'limpio'
    and v_ultima.coincide = true
    and v_ultima.coincide_vin = true
    and v_ultima.coincide_placas = true
    and nullif(btrim(coalesce(v_ultima.captura_path, '')), '') is not null
  );
end;
$$;

revoke all on function public.traslado_tiene_verificacion_repuve_valida(uuid) from public;
grant execute on function public.traslado_tiene_verificacion_repuve_valida(uuid) to authenticated;

-- RPC de estatus resumido (segura para usuario dueño del traslado, conductor asignado y admin).
-- El usuario solo recibe el estatus resumido sin rutas de storage ni notas internas de override/auditoría.
create or replace function public.obtener_resumen_verificacion_repuve(
  p_traslado_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_autorizado boolean := false;
  v_ultima record;
  v_valida boolean;
  v_estatus_resumido text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autenticación requerida.';
  end if;

  if public.es_admin() then
    v_autorizado := true;
  else
    select exists (
      select 1
      from public.traslados t
      left join public.usuarios u on u.id = t.usuario_id
      left join public.conductores c on c.id = t.conductor_id
      where t.id = p_traslado_id
        and (u.auth_user_id = (select auth.uid()) or c.auth_user_id = (select auth.uid()))
    ) into v_autorizado;
  end if;

  if not v_autorizado then
    raise exception using errcode = '42501', message = 'Sin permiso para consultar el estatus de verificación del traslado.';
  end if;

  select
    id,
    coincide,
    coincide_vin,
    coincide_placas,
    resultado,
    es_override_admin,
    creado_en
  into v_ultima
  from public.vehiculo_verificaciones_repuve
  where traslado_id = p_traslado_id
  order by creado_en desc, id desc
  limit 1;

  if v_ultima.id is null then
    return jsonb_build_object(
      'traslado_id', p_traslado_id,
      'registrada', false,
      'valida_para_avanzar', false,
      'estatus_resumido', 'pendiente',
      'coincide', null,
      'actualizado_en', null
    );
  end if;

  v_valida := public.traslado_tiene_verificacion_repuve_valida(p_traslado_id);

  v_estatus_resumido := case
    when v_valida and v_ultima.es_override_admin then 'autorizado_por_soporte'
    when v_valida then 'verificado_limpio'
    else 'en_revision_soporte'
  end;

  return jsonb_build_object(
    'traslado_id', p_traslado_id,
    'registrada', true,
    'valida_para_avanzar', v_valida,
    'estatus_resumido', v_estatus_resumido,
    'coincide', v_ultima.coincide,
    'actualizado_en', v_ultima.creado_en
  );
end;
$$;

revoke all on function public.obtener_resumen_verificacion_repuve(uuid) from public;
grant execute on function public.obtener_resumen_verificacion_repuve(uuid) to authenticated;

-- RPC del conductor para registrar la verificación física y de REPUVE.
create or replace function public.conductor_registra_verificacion_repuve(
  p_traslado_id uuid,
  p_vin_fisico text,
  p_placas_fisicas text,
  p_resultado text,
  p_captura_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conductor_id uuid;
  v_estado_actual public.estado_traslado;
  v_vehiculo_id uuid;
  v_vin_esperado text;
  v_placas_esperadas text;
  v_tiene_placas boolean;
  v_tipo_vehiculo public.tipo_vehiculo;
  v_gama_vehiculo public.gama_vehiculo;
  v_vin_esp_norm text;
  v_vin_fis_norm text;
  v_placas_esp_norm text;
  v_placas_fis_norm text;
  v_coincide_vin boolean;
  v_coincide_placas boolean;
  v_coincide boolean;
  v_intentos_previos int;
  v_probabilidad_muestreo numeric;
  v_requiere_auditoria boolean;
  v_captura_limpia text;
  v_verificacion_id uuid;
  v_creado_en timestamptz;
  v_puede_avanzar boolean;
begin
  select id into v_conductor_id
  from public.conductores
  where auth_user_id = (select auth.uid());

  if v_conductor_id is null then
    raise exception 'Solo un conductor autenticado puede registrar la verificación REPUVE.';
  end if;

  select estado, vehiculo_id
  into v_estado_actual, v_vehiculo_id
  from public.traslados
  where id = p_traslado_id
    and conductor_id = v_conductor_id
  for update;

  if v_estado_actual is null then
    raise exception 'El traslado no existe o no está asignado al conductor autenticado.';
  end if;

  if v_estado_actual not in ('conductor_en_punto_de_recoleccion', 'verificacion_vehiculo_en_proceso') then
    raise exception 'La verificación REPUVE solo puede registrarse en el punto de recolección (estado actual: %).', v_estado_actual;
  end if;

  if p_resultado not in ('limpio', 'con_reporte_robo', 'con_aviso_recuperado', 'no_encontrado', 'error_portal') then
    raise exception 'Resultado de consulta REPUVE no válido: %', coalesce(p_resultado, 'null');
  end if;

  v_captura_limpia := btrim(coalesce(p_captura_path, ''));
  if v_captura_limpia = '' or position('..' in v_captura_limpia) > 0 then
    raise exception 'Es obligatorio adjuntar una captura de pantalla válida de la consulta REPUVE.';
  end if;

  select
    vin,
    placas,
    coalesce(tiene_placas, true),
    tipo,
    gama
  into
    v_vin_esperado,
    v_placas_esperadas,
    v_tiene_placas,
    v_tipo_vehiculo,
    v_gama_vehiculo
  from public.vehiculos
  where id = v_vehiculo_id;

  v_vin_esp_norm := upper(regexp_replace(coalesce(v_vin_esperado, ''), '[^A-Za-z0-9]', '', 'g'));
  v_placas_esp_norm := upper(regexp_replace(coalesce(v_placas_esperadas, ''), '[^A-Za-z0-9]', '', 'g'));

  if v_vin_esp_norm = '' then
    raise exception 'El vehículo no tiene un número VIN real registrado en el pasaporte. Reporta a soporte antes de continuar.';
  end if;

  if v_tiene_placas and v_placas_esp_norm = '' then
    raise exception 'El vehículo no tiene placas reales registradas en el pasaporte. Reporta a soporte antes de continuar.';
  end if;

  v_vin_fis_norm := upper(regexp_replace(coalesce(p_vin_fisico, ''), '[^A-Za-z0-9]', '', 'g'));
  v_placas_fis_norm := upper(regexp_replace(coalesce(p_placas_fisicas, ''), '[^A-Za-z0-9]', '', 'g'));

  if char_length(v_vin_fis_norm) < 5 then
    raise exception 'Ingresa el VIN físico completo leído directamente de la unidad.';
  end if;

  if v_tiene_placas and v_placas_fis_norm = '' then
    raise exception 'Ingresa las placas físicas leídas directamente de la unidad.';
  end if;

  v_coincide_vin := (v_vin_esp_norm = v_vin_fis_norm);
  v_coincide_placas := case
    when not v_tiene_placas then
      (v_placas_esp_norm = '' or v_placas_esp_norm = v_placas_fis_norm)
    else
      (v_placas_esp_norm = v_placas_fis_norm)
  end;
  v_coincide := (v_coincide_vin and v_coincide_placas);

  select count(*)
  into v_intentos_previos
  from public.vehiculo_verificaciones_repuve
  where traslado_id = p_traslado_id;

  -- Auditoría por muestreo:
  -- 100% si hay discrepancia, resultado distinto de limpio o reintentos previos;
  -- 40% para vehículos luxury / coleccion / gama premium;
  -- 12% para el resto de la flota.
  v_probabilidad_muestreo := case
    when v_tipo_vehiculo in ('luxury', 'coleccion') or v_gama_vehiculo = 'premium' then 0.40
    else 0.12
  end;

  v_requiere_auditoria := (
    not v_coincide
    or p_resultado <> 'limpio'
    or v_intentos_previos > 0
    or random() < v_probabilidad_muestreo
  );

  insert into public.vehiculo_verificaciones_repuve (
    traslado_id,
    vehiculo_id,
    conductor_id,
    actor_rol,
    vin_esperado,
    placas_esperadas,
    vin_fisico,
    placas_fisicas,
    coincide_vin,
    coincide_placas,
    coincide,
    resultado,
    captura_path,
    es_override_admin,
    requiere_auditoria,
    auditoria_dictamen
  ) values (
    p_traslado_id,
    v_vehiculo_id,
    v_conductor_id,
    'conductor',
    btrim(v_vin_esperado),
    nullif(btrim(coalesce(v_placas_esperadas, '')), ''),
    upper(btrim(p_vin_fisico)),
    nullif(upper(btrim(coalesce(p_placas_fisicas, ''))), ''),
    v_coincide_vin,
    v_coincide_placas,
    v_coincide,
    p_resultado,
    v_captura_limpia,
    false,
    v_requiere_auditoria,
    case when v_requiere_auditoria then 'pendiente' else null end
  )
  returning id, creado_en into v_verificacion_id, v_creado_en;

  v_puede_avanzar := public.traslado_tiene_verificacion_repuve_valida(p_traslado_id);

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    'validacion_documentos',
    'conductor',
    v_conductor_id,
    jsonb_build_object(
      'accion', 'conductor_registra_verificacion_repuve',
      'verificacion_id', v_verificacion_id,
      'vin_fisico', upper(btrim(p_vin_fisico)),
      'placas_fisicas', nullif(upper(btrim(coalesce(p_placas_fisicas, ''))), ''),
      'coincide_vin', v_coincide_vin,
      'coincide_placas', v_coincide_placas,
      'coincide', v_coincide,
      'resultado', p_resultado,
      'captura_path', v_captura_limpia,
      'requiere_auditoria', v_requiere_auditoria,
      'puede_avanzar', v_puede_avanzar
    )
  );

  return jsonb_build_object(
    'id', v_verificacion_id,
    'traslado_id', p_traslado_id,
    'coincide_vin', v_coincide_vin,
    'coincide_placas', v_coincide_placas,
    'coincide', v_coincide,
    'resultado', p_resultado,
    'requiere_auditoria', v_requiere_auditoria,
    'puede_avanzar', v_puede_avanzar,
    'creado_en', v_creado_en
  );
end;
$$;

revoke all on function public.conductor_registra_verificacion_repuve(uuid, text, text, text, text) from public;
grant execute on function public.conductor_registra_verificacion_repuve(uuid, text, text, text, text) to authenticated;

-- RPC de Administración para autorizar un override documentado ante una excepción de REPUVE/VIN.
create or replace function public.admin_override_verificacion_repuve(
  p_traslado_id uuid,
  p_motivo text,
  p_verificacion_origen_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_vehiculo_id uuid;
  v_conductor_id uuid;
  v_vin_esperado text;
  v_placas_esperadas text;
  v_vin_fisico text;
  v_placas_fisicas text;
  v_captura_previa text;
  v_motivo_limpio text;
  v_override_id uuid;
  v_creado_en timestamptz;
begin
  if auth.uid() is null or not public.es_admin() then
    raise exception using errcode = '42501', message = 'Solo administración puede autorizar un override de verificación REPUVE.';
  end if;

  v_motivo_limpio := btrim(coalesce(p_motivo, ''));
  if char_length(v_motivo_limpio) < 10 then
    raise exception 'El motivo de autorización excepcional debe tener al menos 10 caracteres.';
  end if;

  select id into v_admin_id
  from public.admins
  where auth_user_id = (select auth.uid())
  limit 1;

  select vehiculo_id, conductor_id
  into v_vehiculo_id, v_conductor_id
  from public.traslados
  where id = p_traslado_id
  for update;

  if v_vehiculo_id is null then
    raise exception 'El traslado especificado no existe.';
  end if;

  select vin, placas
  into v_vin_esperado, v_placas_esperadas
  from public.vehiculos
  where id = v_vehiculo_id;

  select vin_fisico, placas_fisicas, captura_path
  into v_vin_fisico, v_placas_fisicas, v_captura_previa
  from public.vehiculo_verificaciones_repuve
  where traslado_id = p_traslado_id
    and (p_verificacion_origen_id is null or id = p_verificacion_origen_id)
  order by creado_en desc, id desc
  limit 1;

  insert into public.vehiculo_verificaciones_repuve (
    traslado_id,
    vehiculo_id,
    conductor_id,
    actor_rol,
    vin_esperado,
    placas_esperadas,
    vin_fisico,
    placas_fisicas,
    coincide_vin,
    coincide_placas,
    coincide,
    resultado,
    captura_path,
    es_override_admin,
    motivo_override,
    autorizado_por_auth_id,
    requiere_auditoria,
    auditoria_dictamen
  ) values (
    p_traslado_id,
    v_vehiculo_id,
    v_conductor_id,
    'admin',
    coalesce(nullif(btrim(v_vin_esperado), ''), 'SIN_VIN_REGISTRADO'),
    nullif(btrim(coalesce(v_placas_esperadas, '')), ''),
    coalesce(nullif(btrim(v_vin_fisico), ''), coalesce(nullif(btrim(v_vin_esperado), ''), 'OVERRIDE_ADMIN')),
    coalesce(v_placas_fisicas, v_placas_esperadas),
    true,
    true,
    true,
    'override_admin',
    v_captura_previa,
    true,
    v_motivo_limpio,
    (select auth.uid()),
    false,
    'aprobada'
  )
  returning id, creado_en into v_override_id, v_creado_en;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    p_traslado_id,
    'validacion_documentos',
    'admin',
    coalesce(v_admin_id, (select auth.uid())),
    jsonb_build_object(
      'accion', 'admin_override_verificacion_repuve',
      'override_id', v_override_id,
      'verificacion_origen_id', p_verificacion_origen_id,
      'motivo', v_motivo_limpio,
      'autorizado_por_auth_id', (select auth.uid())
    )
  );

  return jsonb_build_object(
    'id', v_override_id,
    'traslado_id', p_traslado_id,
    'resultado', 'override_admin',
    'es_override_admin', true,
    'motivo_override', v_motivo_limpio,
    'creado_en', v_creado_en
  );
end;
$$;

revoke all on function public.admin_override_verificacion_repuve(uuid, text, uuid) from public;
grant execute on function public.admin_override_verificacion_repuve(uuid, text, uuid) to authenticated;

-- RPC de Administración/Soporte para dictaminar una verificación seleccionada en la cola de muestreo.
create or replace function public.admin_dictaminar_auditoria_repuve(
  p_verificacion_id uuid,
  p_dictamen text,
  p_notas text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_traslado_id uuid;
  v_notas_limpias text;
begin
  if auth.uid() is null or not public.es_admin() then
    raise exception using errcode = '42501', message = 'Solo administración o soporte puede dictaminar auditorías REPUVE.';
  end if;

  if p_dictamen not in ('aprobada', 'observada') then
    raise exception 'El dictamen de auditoría debe ser aprobada u observada.';
  end if;

  v_notas_limpias := nullif(btrim(coalesce(p_notas, '')), '');
  if p_dictamen = 'observada' and (v_notas_limpias is null or char_length(v_notas_limpias) < 5) then
    raise exception 'Indica una nota explicativa al marcar una verificación como observada.';
  end if;

  select id into v_admin_id
  from public.admins
  where auth_user_id = (select auth.uid())
  limit 1;

  update public.vehiculo_verificaciones_repuve
  set
    auditoria_dictamen = p_dictamen,
    auditoria_notas = v_notas_limpias,
    auditoria_revisada_por = (select auth.uid()),
    auditoria_revisada_en = now()
  where id = p_verificacion_id
  returning traslado_id into v_traslado_id;

  if v_traslado_id is null then
    raise exception 'No se encontró el registro de verificación REPUVE especificado.';
  end if;

  insert into public.registro_auditoria (
    traslado_id,
    evento,
    actor,
    actor_id,
    datos
  ) values (
    v_traslado_id,
    'validacion_documentos',
    'admin',
    coalesce(v_admin_id, (select auth.uid())),
    jsonb_build_object(
      'accion', 'admin_dictaminar_auditoria_repuve',
      'verificacion_id', p_verificacion_id,
      'dictamen', p_dictamen,
      'notas', v_notas_limpias
    )
  );

  return jsonb_build_object(
    'id', p_verificacion_id,
    'traslado_id', v_traslado_id,
    'auditoria_dictamen', p_dictamen,
    'auditoria_notas', v_notas_limpias,
    'auditoria_revisada_en', now()
  );
end;
$$;

revoke all on function public.admin_dictaminar_auditoria_repuve(uuid, text, text) from public;
grant execute on function public.admin_dictaminar_auditoria_repuve(uuid, text, text) to authenticated;

-- Actualización de conductor_avanza_traslado con los candados REPUVE en:
-- 1. iniciar_evidencia_inicial (candado primario)
-- 2. evidencia_inicial_completada (defensa ante salto directo)
-- 3. vehiculo_recibido (defensa en profundidad)
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
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede iniciar la captura de evidencia: se requiere verificación REPUVE con resultado limpio y coincidencia de VIN/placas (o autorización de soporte).';
      end if;
      v_estado_siguiente := 'evidencia_inicial_en_proceso';
      v_evento_auditoria := 'captura_evidencia_inicial';

    when 'evidencia_inicial_completada' then
      if v_estado_actual <> 'evidencia_inicial_en_proceso' then
        raise exception 'Evento no permitido desde estado %', v_estado_actual;
      end if;
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede completar evidencia inicial sin verificación REPUVE válida.';
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
      if not public.traslado_tiene_verificacion_repuve_valida(p_traslado_id) then
        raise exception 'No se puede confirmar la recepción del vehículo sin verificación REPUVE válida o autorización de soporte.';
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
