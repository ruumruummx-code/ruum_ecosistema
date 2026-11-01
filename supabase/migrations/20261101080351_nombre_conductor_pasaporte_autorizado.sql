-- Expose only the assigned driver's name to actors authorized for this trip.
create or replace function public.nombre_conductor_del_traslado(p_traslado_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select c.nombre from public.traslados t
  join public.conductores c on c.id = t.conductor_id
  where t.id = p_traslado_id and auth.uid() is not null and (
    public.es_admin() or c.auth_user_id = auth.uid() or exists (
      select 1 from public.usuarios u where u.id = t.usuario_id and u.auth_user_id = auth.uid()
    )
  );
$$;
revoke all on function public.nombre_conductor_del_traslado(uuid) from public, anon;
grant execute on function public.nombre_conductor_del_traslado(uuid) to authenticated;

do $$
declare definicion text;
begin
  definicion := pg_get_viewdef('public.pasaporte_digital'::regclass, true);
  if position('c.nombre AS conductor_nombre' in definicion) = 0 then
    raise exception 'La proyección del conductor cambió; revisar antes de migrar';
  end if;
  definicion := replace(definicion, 'c.nombre AS conductor_nombre',
    'public.nombre_conductor_del_traslado(t.id) AS conductor_nombre');
  -- Append columns to preserve the existing view column order and grants.
  definicion := replace(definicion, 'AS ganancia_conductor',
    'AS ganancia_conductor, t.estado_operativo, t.cerrado_en');
  execute 'create or replace view public.pasaporte_digital with (security_invoker=true) as ' || definicion;
end $$;
