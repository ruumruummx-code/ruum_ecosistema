set search_path = public, extensions;

begin;
select plan(4);

select ok(
  not (select prosecdef from pg_proc where oid = 'public.obs_resolver_correlation(text)'::regprocedure),
  'obs_resolver_correlation es SECURITY INVOKER'
);

select ok(
  has_function_privilege('authenticated', 'public.obs_resolver_correlation(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.obs_resolver_correlation(text)', 'EXECUTE'),
  'authenticated puede resolver correlation; anon no'
);

insert into auth.users (id, email, aud, role, raw_user_meta_data)
values ('00000000-0000-4000-8000-0000000000e1', 'rt58@ruum.test', 'authenticated', 'authenticated', '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);

select lives_ok(
  $$ select public.registrar_evento_operativo_app('sync_failure', '1.0.0', '{"pantalla":"inicio"}'::jsonb) $$,
  'Un usuario autenticado puede registrar un evento operativo de la app'
);

select is(
  (select count(*)::int from public.eventos_operativos_app where tipo = 'sync_failure'),
  1,
  'El evento queda guardado y visible para su autor'
);

select * from finish();
rollback;
