-- Cierre: NEW no contiene aún el nivel generado en un BEFORE UPDATE.
-- Normalizar antes de validar el contador evita rechazar el cierre legítimo.
create or replace function public.proteger_campos_conductor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_normal text[] := array[
    'telefono',
    'codigo_postal',
    'estado_residencia',
    'ciudad_municipio',
    'colonia',
    'calle',
    'numero',
    'referencias',
    'contacto_emergencia_nombre',
    'contacto_emergencia_telefono'
  ];
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_generada text;
begin
  -- Todo campo fuera de A queda protegido. Se excluyen solamente A, el
  -- timestamp tecnico y columnas generadas por PostgreSQL. Estas ultimas no
  -- deben compararse en un BEFORE trigger: NEW puede exponerlas como NULL
  -- antes de que PostgreSQL las recalcule.
  for v_generada in
    select attname
      from pg_attribute
     where attrelid = 'public.conductores'::regclass
       and attnum > 0
       and not attisdropped
       and attgenerated <> ''
  loop
    v_old := v_old - v_generada;
    v_new := v_new - v_generada;
  end loop;

  -- El contador solo se actualiza por un trigger anidado y al valor derivado
  -- exacto. Las columnas generadas ya fueron excluidas de ambas imágenes.
  if pg_trigger_depth() > 1
    and (v_new - 'traslados_completados' - 'actualizado_en') is not distinct from
        (v_old - 'traslados_completados' - 'actualizado_en')
    and new.traslados_completados = (
      select count(*) from public.traslados
      where conductor_id = new.id and estado = 'servicio_cerrado'
    )
  then
    return new;
  end if;

  -- Los administradores y procesos de backend tienen RPCs propias y no
  -- deben quedar bloqueados por la proteccion destinada al conductor.
  if public.es_admin() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() is distinct from old.auth_user_id then
    return new;
  end if;

  if coalesce(current_setting('ruum.cambio_perfil_autorizado', true), '') <> 'si' then
    raise exception using
      errcode = '42501',
      message = 'Los cambios del perfil deben realizarse mediante la RPC autorizada.';
  end if;

  if (v_new - v_normal - 'actualizado_en') is distinct from
     (v_old - v_normal - 'actualizado_en') then
    raise exception using
      errcode = '42501',
      message = 'No puedes modificar campos operativos, legales o administrativos de tu perfil de conductor.';
  end if;

  return new;
end;
$$;

