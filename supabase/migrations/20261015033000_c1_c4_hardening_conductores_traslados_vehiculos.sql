-- Fix C2: no exponer conductores directo
drop policy if exists "usuarios_ven_conductores_activos" on public.conductores;

-- Opción mínima: revocar SELECT amplio y exponer vista pública
revoke select on public.conductores from authenticated;
create or replace view public.conductores_publicos as
select id, estado, nivel_operativo_vigente, calificacion_promedio
from public.conductores
where estado in ('activo','modo_prueba_supervisada');
grant select on public.conductores_publicos to authenticated;

-- Garantizar que conductores mantengan acceso a su propio registro bajo RLS
grant select on public.conductores to authenticated;

-- Fix C3: blindar columnas traslados
create or replace function public.proteger_campos_traslado_conductor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.es_admin() then return new; end if;
  if auth.uid() is null then return new; end if;
  if new.usuario_id is distinct from old.usuario_id
    or new.precio_cotizado is distinct from old.precio_cotizado
    or new.precio_final is distinct from old.precio_final
    or new.origen_lat is distinct from old.origen_lat
    or new.origen_lng is distinct from old.origen_lng
    or new.destino_lat is distinct from old.destino_lat
    or new.destino_lng is distinct from old.destino_lng
    or new.vehiculo_id is distinct from old.vehiculo_id
    or new.conductor_id is distinct from old.conductor_id then
    raise exception 'Conductor no autorizado a modificar precio/ruta/titularidad.';
  end if;
  return new;
end; $$;

drop trigger if exists proteger_campos_traslado on public.traslados;
create trigger proteger_campos_traslado before update on public.traslados
for each row execute function public.proteger_campos_traslado_conductor();

-- Fix C4: WITH CHECK en vehiculos (y explicitar en usuarios/traslados)
drop policy if exists "usuario_administra_sus_vehiculos" on public.vehiculos;
create policy "usuario_administra_sus_vehiculos" on public.vehiculos for all
to authenticated
using (usuario_id in (select id from public.usuarios where auth_user_id=auth.uid()))
with check (usuario_id in (select id from public.usuarios where auth_user_id=auth.uid()));

drop policy if exists "usuario_actualiza_su_registro" on public.usuarios;
create policy "usuario_actualiza_su_registro" on public.usuarios for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "conductor_actualiza_sus_traslados_asignados" on public.traslados;
create policy "conductor_actualiza_sus_traslados_asignados" on public.traslados for update
to authenticated
using (conductor_id = public.conductor_id_actual())
with check (conductor_id = public.conductor_id_actual());
