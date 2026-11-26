set search_path = public, extensions;

begin;
select plan(3);

select is_empty($$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and p.prosecdef
    and not exists (
      select from pg_depend d
      where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
    )
    and not exists (select from unnest(p.proconfig) c where c like 'search_path=%')
$$, 'Todas las funciones SECURITY DEFINER de la aplicación fijan search_path');

select is_empty($$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where n.nspname in ('public', 'private') and p.prosecdef
    and not exists (
      select from pg_depend d
      where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
    )
    and a.grantee = 0 and a.privilege_type = 'EXECUTE'
$$, 'Ninguna función SECURITY DEFINER de la aplicación concede EXECUTE a PUBLIC');

select is_empty($$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
    and p.proname like 'proteger_columnas_sensibles_%'
    and (has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
$$, 'Los triggers de protección no dan EXECUTE a los roles de cliente');

select * from finish();
rollback;
