set search_path = public, extensions;

begin;
select plan(6);

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

select ok(
  has_function_privilege('authenticated', 'public.empresa_id_del_titular_actual()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.empresa_id_del_titular_actual()', 'EXECUTE'),
  'La política para titulares puede consultar su empresa con una sesión autenticada'
);

select ok(
  has_function_privilege('authenticated', 'public.usuario_ids_de_traslados_asignados_conductor()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.usuario_ids_de_traslados_asignados_conductor()', 'EXECUTE'),
  'La política para conductores puede consultar sus solicitantes con una sesión autenticada'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"56000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok(
  $$select id from public.usuarios where auth_user_id = (select auth.uid())$$,
  'La comprobación de rol puede consultar usuarios para una cuenta sin perfil de usuario'
);

reset role;

select * from finish();
rollback;
