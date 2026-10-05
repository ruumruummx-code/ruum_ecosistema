-- Fix subida de constancia_situacion_fiscal en app-conductor.
--
-- Causa: el tipo se aceptaba en el cliente (TipoDocumentoConductor), en la
-- Edge Function validar-documento-conductor (TIPOS) y en el checklist de
-- cuenta/documentos, pero la base lo rechazaba en 4 puntos, por lo que la
-- subida fallaba con 500 "No fue posible autorizar la carga validada":
--   1) CHECK documentos_storage_validados.tipo (sello previo al upload)
--   2) policy de storage "conductor_ruta_controlada_documentos_storage"
--   3) allowlist de validar_ruta_documento_conductor()
--   4) CHECK documentos_conductor_tipo_check (INSERT del RPC)
-- Esta migración agrega el tipo en los 4 puntos. No toca los mínimos
-- requeridos para enviar la solicitud (siguen siendo licencia + INE).

-- 1) CHECK de documentos_conductor: reemplazar por lista de 5 tipos.
alter table public.documentos_conductor
  drop constraint if exists documentos_conductor_tipo_check;
alter table public.documentos_conductor
  add constraint documentos_conductor_tipo_check
  check (tipo in ('licencia_frente', 'licencia_reverso', 'identificacion_oficial', 'constancia_situacion_fiscal', 'documento_operativo'));

-- 2) CHECK de documentos_storage_validados (nombre autogenerado
-- documentos_storage_validados_tipo_check por el CHECK inline de 0109;
-- se elimina por definición para no depender del nombre).
do $$
declare v_conname text;
begin
  select c.conname into v_conname
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.conrelid = 'public.documentos_storage_validados'::regclass
    and c.contype = 'c'
    and a.attname = 'tipo'
    and pg_get_constraintdef(c.oid) like '%licencia_frente%';
  if v_conname is not null then
    execute format('alter table public.documentos_storage_validados drop constraint %I', v_conname);
  end if;
end $$;
alter table public.documentos_storage_validados
  add constraint documentos_storage_validados_tipo_check
  check (tipo in ('licencia_frente', 'licencia_reverso', 'identificacion_oficial', 'constancia_situacion_fiscal', 'documento_operativo'));

-- 3) Policy de storage: misma ruta controlada + constancia.
drop policy if exists "conductor_ruta_controlada_documentos_storage" on storage.objects;
create policy "conductor_ruta_controlada_documentos_storage"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos-conductor'
    and coalesce(array_length(storage.foldername(name), 1), 0) = 3
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.objetivo_documento_texto_pertenece_auth((storage.foldername(name))[2])
    and (storage.foldername(name))[3] in (
      'licencia_frente', 'licencia_reverso', 'identificacion_oficial', 'constancia_situacion_fiscal', 'documento_operativo'
    )
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,179}$'
    and public.ruta_documento_validada_para_auth(name)
  );

-- 4) validar_ruta_documento_conductor(): versión vigente (0109, con consumo
-- de sello de un solo uso) + constancia en la allowlist.
create or replace function public.validar_ruta_documento_conductor(
  p_objetivo_id uuid,
  p_tipo text,
  p_ruta text,
  p_auth_user_id uuid default auth.uid()
) returns void
language plpgsql security definer set search_path = public, storage as $$
declare v_partes text[] := string_to_array(p_ruta, '/'); v_autorizada text;
begin
  if p_auth_user_id is null then raise exception 'Inicia sesión para registrar documentos.'; end if;
  if p_tipo not in ('licencia_frente', 'licencia_reverso', 'identificacion_oficial', 'constancia_situacion_fiscal', 'documento_operativo') then
    raise exception 'Tipo documental no permitido.';
  end if;
  if coalesce(array_length(v_partes, 1), 0) <> 4 or v_partes[1] <> p_auth_user_id::text
    or v_partes[2] <> p_objetivo_id::text or v_partes[3] <> p_tipo
    or v_partes[4] !~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,179}$' then
    raise exception 'La ruta documental no cumple auth_user_id/expediente/tipo/documento.';
  end if;
  if not public.objetivo_documento_pertenece_auth(p_objetivo_id, p_auth_user_id) then
    raise exception 'No puedes registrar documentos en un expediente ajeno.';
  end if;
  if not exists(select 1 from storage.objects o where o.bucket_id = 'documentos-conductor' and o.name = p_ruta) then
    raise exception 'El archivo no existe en el bucket privado.';
  end if;
  update public.documentos_storage_validados set consumido_en = now()
  where ruta = p_ruta and auth_user_id = p_auth_user_id and objetivo_id = p_objetivo_id and tipo = p_tipo
    and consumido_en is null and creado_en > now() - interval '10 minutes'
  returning ruta into v_autorizada;
  if v_autorizada is null then
    raise exception 'El archivo no cuenta con una validación de contenido vigente.';
  end if;
end;
$$;
revoke all on function public.validar_ruta_documento_conductor(uuid, text, text, uuid) from public, anon, authenticated;
