-- HOTFIX 2026-10-19 — El registro de conductor quedaba bloqueado en el paso 5.
--
-- Causa: en la base remota la función `manejar_nuevo_usuario_auth` seguía
-- creando una fila en `conductores` al confirmar la cuenta, en lugar de una
-- `solicitud_conductor` (RT-05, migración 20260710000104). Al existir ya un
-- conductor, `iniciar_solicitud_conductor()` devolvía NULL, la RPC
-- `guardar_borrador_conductor` nunca se ejecutaba y por tanto no se enviaba la
-- solicitud ni se iniciaba Didit.
--
-- Esta migración:
--   1. Restaura el trigger mínimo correcto (crea solicitud, no conductor).
--   2. Elimina los conductores fantasma sin datos creados por el trigger viejo.
--   3. Crea la solicitud que faltaba para que esas cuentas puedan reintentar.

create or replace function public.manejar_nuevo_usuario_auth()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tipo_registro text := new.raw_user_meta_data->>'tipo_registro';
  v_version_registro integer := coalesce(nullif(new.raw_user_meta_data->>'version_registro','')::integer, 1);
  v_solicitud_id uuid;
begin
  if v_tipo_registro = 'conductor' then
    insert into public.solicitudes_conductor(
      auth_user_id, estado, paso_actual, datos_personales, domicilio, licencia, contacto_emergencia,
      version_registro, origen_modelo
    ) values (
      new.id, 'borrador', 0, '{}', '{}', '{}', '{}', v_version_registro,
      case when v_version_registro = 2 then 'v2_minimo' else 'legacy_metadata' end
    ) returning id into v_solicitud_id;
    insert into public.registro_auditoria(evento, actor, actor_id, datos)
    values ('creacion_cuenta', 'conductor', v_solicitud_id, jsonb_build_object(
      'auth_user_id', new.id, 'tipo_registro', 'conductor', 'version_registro', v_version_registro));
  elsif v_tipo_registro = 'usuario' then
    perform public.crear_usuario_legacy_desde_auth(new);
  end if;
  return new;
end;
$$;

comment on function public.manejar_nuevo_usuario_auth() is
  'RT-05: trigger mínimo; crea la solicitud de conductor (no el conductor operativo).';

-- 2. Conductores fantasma: filas vacías creadas por el trigger defectuoso.
--    Sólo se eliminan cuando no tienen ningún dato operativo asociado.
delete from public.conductores c
where coalesce(btrim(c.nombre), '') = ''
  and c.estado_expediente = 'datos_incompletos'
  and exists (
    select 1 from auth.users u
    where u.id = c.auth_user_id
      and coalesce(u.raw_user_meta_data->>'tipo_registro', '') = 'conductor'
  )
  and not exists (select 1 from public.documentos_conductor d where d.conductor_id = c.id)
  and not exists (select 1 from public.preferencias_conductor p where p.conductor_id = c.id)
  and not exists (select 1 from public.solicitudes_conductor s where s.conductor_id = c.id);

-- 3. Recrear la solicitud pendiente para las cuentas afectadas. El trigger
--    `validar_auth_solicitud_sin_conductor` exige que ya no exista el conductor
--    fantasma, por eso la limpieza va antes.
insert into public.solicitudes_conductor(
  auth_user_id, estado, paso_actual, datos_personales, domicilio, licencia, contacto_emergencia,
  version_registro, origen_modelo
)
select
  u.id, 'borrador', 0, '{}', '{}', '{}', '{}',
  coalesce(nullif(u.raw_user_meta_data->>'version_registro', '')::integer, 1),
  case when coalesce(nullif(u.raw_user_meta_data->>'version_registro', '')::integer, 1) = 2
    then 'v2_minimo' else 'legacy_metadata' end
from auth.users u
where coalesce(u.raw_user_meta_data->>'tipo_registro', '') = 'conductor'
  and not exists (select 1 from public.solicitudes_conductor s where s.auth_user_id = u.id)
  and not exists (select 1 from public.conductores c where c.auth_user_id = u.id);
