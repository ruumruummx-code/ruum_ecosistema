-- Auditoría 2026-11-19, proyecto asmzetwwwugaoowiukdv.
-- Consultas de catálogo/estado. No invocan las funciones auditadas.
select p.oid::regprocedure::text signature, p.prosecdef security_definer,
  has_function_privilege('anon',p.oid,'execute') anon_execute,
  has_function_privilege('authenticated',p.oid,'execute') authenticated_execute,
  pg_get_functiondef(p.oid) definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in (
  'encolar_limpieza_documento','reclamar_lote_limpieza_documentos',
  'registrar_resultado_limpieza_documento','encolar_limpieza_foto_perfil',
  'reclamar_lote_limpieza_fotos_perfil','registrar_resultado_limpieza_foto_perfil',
  'transicionar_estado_documento_cuenta','obs_registrar_log')
order by p.proname;

select j.jobname,j.schedule,j.active,d.status,d.start_time
from cron.job j left join lateral (
  select status,start_time from cron.job_run_details d
  where d.jobid=j.jobid order by start_time desc limit 1
) d on true order by j.jobname;

select i.tipo,(r.id is not null) response_present,
  r.status_code,r.timed_out,r.error_msg,r.created
from private.reconciliacion_usuario_invocaciones i
left join net._http_response r on r.id=i.request_id;

select id,public from storage.buckets order by id;

select c.relname,c.reloptions,
  has_table_privilege('anon',c.oid,'select') anon_select,
  has_table_privilege('authenticated',c.oid,'select') authenticated_select,
  pg_get_viewdef(c.oid,true) definition
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='conductores_publicos';
