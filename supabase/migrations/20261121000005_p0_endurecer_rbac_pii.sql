-- ============================================================================
-- P0 RLS hardening — PII (mensajes_chat, llamadas_enmascaradas)
-- ============================================================================
-- Cierra bugs:
-- 1. admin_acceso_total_mensajes (ALL, es_admin(), with_check=NULL):
--    cualquier admin podía UPDATE/DELETE/INSERT mensajes de chat.
--    Riesgo: borrar historial legal, alterar contenido PII.
-- 2. admin_acceso_total_llamadas (ALL, es_admin(), with_check=NULL):
--    cualquier admin podía alterar twilio SID, número virtual, iniciada_por.
--    Riesgo: romper trazabilidad forense de llamadas.
--
-- Fix:
-- - SELECT admin: Traslados:leer OR Traslados:gestionar
-- - UPDATE mensajes_chat: admin con Traslados:gestionar, solo `reportado` mutable
-- - UPDATE llamadas_enmascaradas: nadie desde cliente (solo service_role/superadmin)
-- - INSERT/DELETE: sin policy (RPC SECURITY DEFINER / inmutables)
-- - Triggers protectores de columnas sensibles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- mensajes_chat
-- ----------------------------------------------------------------------------
drop policy if exists "admin_acceso_total_mensajes" on public.mensajes_chat;

create policy "admin_lee_mensajes_chat"
  on public.mensajes_chat
  for select to authenticated
  using (
    public.admin_tiene_permiso('Traslados:leer')
    or public.admin_tiene_permiso('Traslados:gestionar')
  );

create policy "admin_modera_mensajes_chat"
  on public.mensajes_chat
  for update to authenticated
  using (public.admin_tiene_permiso('Traslados:gestionar'))
  with check (public.admin_tiene_permiso('Traslados:gestionar'));

-- Sin INSERT policy: chat va por RPC SECURITY DEFINER.
-- Sin DELETE policy: historial de chat inmutable.

create or replace function public.proteger_columnas_sensibles_mensaje_chat()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if public.is_superadmin()
     or coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if new.contenido is distinct from old.contenido then
    raise exception 'No puedes modificar el contenido de un mensaje de chat'
      using errcode = 'insufficient_privilege';
  end if;

  if new.remitente is distinct from old.remitente then
    raise exception 'No puedes modificar el remitente de un mensaje de chat'
      using errcode = 'insufficient_privilege';
  end if;

  if new.traslado_id is distinct from old.traslado_id then
    raise exception 'No puedes mover un mensaje a otro traslado'
      using errcode = 'insufficient_privilege';
  end if;

  if new.enviado_en is distinct from old.enviado_en then
    raise exception 'No puedes modificar la fecha de envío del mensaje'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_columnas_sensibles_mensaje_chat
  on public.mensajes_chat;

create trigger proteger_columnas_sensibles_mensaje_chat
  before update on public.mensajes_chat
  for each row execute function public.proteger_columnas_sensibles_mensaje_chat();

-- ----------------------------------------------------------------------------
-- llamadas_enmascaradas
-- ----------------------------------------------------------------------------
drop policy if exists "admin_acceso_total_llamadas" on public.llamadas_enmascaradas;

create policy "admin_lee_llamadas_enmascaradas"
  on public.llamadas_enmascaradas
  for select to authenticated
  using (
    public.admin_tiene_permiso('Traslados:leer')
    or public.admin_tiene_permiso('Traslados:gestionar')
  );

-- Sin UPDATE policy: solo service_role (webhook Twilio) o superadmin.
-- Sin INSERT policy: llamadas se crean vía RPC.
-- Sin DELETE policy: historial inmutable.

create or replace function public.proteger_columnas_sensibles_llamada()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if public.is_superadmin()
     or coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  -- Nadie más puede UPDATE. Bloqueo total desde cliente.
  raise exception 'Llamadas enmascaradas solo se actualizan desde webhook de Twilio o superadmin'
    using errcode = 'insufficient_privilege';
end;
$$;

drop trigger if exists proteger_columnas_sensibles_llamada
  on public.llamadas_enmascaradas;

create trigger proteger_columnas_sensibles_llamada
  before update on public.llamadas_enmascaradas
  for each row execute function public.proteger_columnas_sensibles_llamada();