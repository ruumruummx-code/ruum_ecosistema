-- RUUM-SEC-002b: alinea los grants de EXECUTE que divergían entre producción y staging.
-- Detectado el 2026-11-27 comparando el catálogo de ambos proyectos (cuerpos de función,
-- políticas, índices, triggers, columnas, RLS, buckets y cron eran idénticos; solo
-- divergían los ACL de estas funciones). Idempotente: en el entorno ya alineado es no-op.

-- 1) Helpers usados en políticas RLS evaluadas como `authenticated`.
--    Producción había perdido el EXECUTE de `authenticated`, lo que rompe con
--    "permission denied for function" las políticas de ubicaciones_traslado (tracking),
--    empresas, empresa_miembros, empresa_sucursales, operaciones y SLA de empresa.
--    Estado esperado según 20261123000003 (lote 3): authenticated + service_role, sin anon/public.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as proc_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'auth_es_conductor_de_traslado',
        'auth_es_conductor_de_traslado_activo',
        'auth_es_usuario_de_traslado',
        'empresa_tiene_permiso',
        'mis_empresas_miembro'
      )
  loop
    execute format('revoke execute on function %s from public, anon;', r.proc_name);
    execute format('grant execute on function %s to authenticated, service_role;', r.proc_name);
  end loop;
end $$;

-- 2) usuario_cancela_traslado: camino directo cerrado en 20261119000001 (cancelaba
--    traslados pagados sin reembolso). La cancelación va por la Edge Function
--    `cancelar-traslado-usuario` -> servidor_cancela_traslado (service_role).
--    Producción conservaba EXECUTE para `authenticated` y staging lo tenía para `anon`.
revoke all on function public.usuario_cancela_traslado(uuid, text) from public, anon, authenticated;
revoke all on function public.usuario_cancela_traslado(uuid, text, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.usuario_cancela_traslado(uuid, text) to service_role;
grant execute on function public.usuario_cancela_traslado(uuid, text, numeric, numeric, text) to service_role;
