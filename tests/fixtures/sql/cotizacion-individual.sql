-- Solo fixtures de pruebas, dentro de BEGIN/ROLLBACK; nunca migrar a producción.
-- Simula la llamada de Next.js con service_role antes del consumo autenticado.
create or replace function pg_temp.cotizar_individual(
  p_vehiculo_id uuid, p_vehiculo jsonb, p_traslado jsonb, p_paradas jsonb default '[]'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_claims text := current_setting('request.jwt.claims', true);
  v_auth uuid := auth.uid();
  v_snapshot jsonb;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub',v_auth,'role','service_role')::text, true);
  v_snapshot := public.servidor_cotizar_traslado_individual(v_auth,p_vehiculo_id,p_vehiculo,p_traslado,p_paradas);
  perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
  return p_traslado || jsonb_build_object('snapshot_tarifa',v_snapshot);
end;
$$;
