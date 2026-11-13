-- Normaliza solo los campos de presentación de vehículos y ciudades de traslado.
-- Las placas reales conservan su valor y el marcador de ausencia se guarda como NULL.
create function private.normalizar_datos_vehiculo_traslado()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.marca := initcap(btrim(new.marca));
  new.modelo := initcap(btrim(new.modelo));
  if btrim(new.placas) = '' or btrim(new.placas) ~* '^no[[:space:]]+disponible$' then
    new.placas := null;
  end if;
  if new.placas is null then
    new.tiene_placas := false;
  end if;
  return new;
end;
$$;

create function private.normalizar_ciudades_traslado()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.origen_ciudad := initcap(btrim(new.origen_ciudad));
  new.destino_ciudad := initcap(btrim(new.destino_ciudad));
  return new;
end;
$$;

create trigger normalizar_datos_vehiculo_traslado
before insert or update of marca, modelo, placas, tiene_placas on public.vehiculos
for each row execute function private.normalizar_datos_vehiculo_traslado();

create trigger normalizar_ciudades_traslado
before insert or update of origen_ciudad, destino_ciudad on public.traslados
for each row execute function private.normalizar_ciudades_traslado();

-- Los triggers aplican la misma normalización al backfill y a las nuevas escrituras.
update public.vehiculos
set marca = marca, modelo = modelo, placas = placas
where marca is distinct from initcap(btrim(marca))
   or modelo is distinct from initcap(btrim(modelo))
   or btrim(placas) = ''
   or btrim(placas) ~* '^no[[:space:]]+disponible$';

update public.traslados
set origen_ciudad = origen_ciudad, destino_ciudad = destino_ciudad
where origen_ciudad is distinct from initcap(btrim(origen_ciudad))
   or destino_ciudad is distinct from initcap(btrim(destino_ciudad));
