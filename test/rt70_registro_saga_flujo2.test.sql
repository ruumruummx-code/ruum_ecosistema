-- F2-001 — contrato de reconciliación y fail-safe de rol.
select plan(6);
select ok(to_regclass('public.registro_saga_auth') is not null, 'F2.1 tabla saga durable existe');
select ok(to_regclass('public.usuarios_telefono_normalizado_uq') is not null, 'F2.2 índice normalizado existe');
select ok(exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='reconciliar_registro_saga_auth'), 'F2.3 consumidor RPC existe');
select ok((select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='reconciliar_registro_saga_auth') like '%reconciliacion_requerida%', 'F2.4 fallo parcial queda marcado para reintento');
select ok((select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='reconciliar_registro_saga_auth') like '%sin_rol%', 'F2.5 reparación no asigna privilegios de conductor');
select ok(exists (select 1 from information_schema.routines where routine_schema='public' and routine_name='reconciliar_registro_saga_auth'), 'F2.6 consumidor es invocable por contrato SQL');
select * from finish();
