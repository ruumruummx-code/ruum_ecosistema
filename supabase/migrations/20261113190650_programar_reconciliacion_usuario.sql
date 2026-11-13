create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table private.reconciliacion_usuario_config (
  singleton boolean primary key default true check (singleton),
  edge_url text not null check (edge_url ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/reconciliar-usuario$')
);

create table private.reconciliacion_usuario_invocaciones (
  tipo text primary key check (tipo in ('individual', 'masivo')),
  nonce_hash text not null,
  expira_en timestamptz not null,
  request_id bigint
);

create function private.encolar_reconciliacion_usuario(p_tipo text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_url text;
  v_nonce text;
  v_request bigint;
begin
  if p_tipo is null or p_tipo not in ('individual', 'masivo') then
    raise exception 'Tipo de reconciliación inválido';
  end if;
  select edge_url into v_url from private.reconciliacion_usuario_config where singleton;
  if v_url is null then return null; end if;
  v_nonce := encode(extensions.gen_random_bytes(32), 'hex');
  v_request := net.http_post(
    url := v_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('tipo', p_tipo, 'nonce', v_nonce),
    timeout_milliseconds := 120000
  );
  insert into private.reconciliacion_usuario_invocaciones(tipo, nonce_hash, expira_en, request_id)
  values (p_tipo, encode(extensions.digest(v_nonce, 'sha256'), 'hex'), now() + interval '1 minute', v_request)
  on conflict (tipo) do update set nonce_hash = excluded.nonce_hash,
    expira_en = excluded.expira_en, request_id = excluded.request_id;
  return v_request;
end;
$$;
revoke all on function private.encolar_reconciliacion_usuario(text) from public, anon, authenticated;

create function public.tomar_reconciliacion_usuario(p_tipo text, p_nonce text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update private.reconciliacion_usuario_invocaciones set expira_en = now()
  where tipo = p_tipo and expira_en > now()
    and nonce_hash = encode(extensions.digest(p_nonce, 'sha256'), 'hex');
  return found;
end;
$$;
revoke all on function public.tomar_reconciliacion_usuario(text, text) from public, anon, authenticated;
grant execute on function public.tomar_reconciliacion_usuario(text, text) to service_role;

select cron.schedule('ruum-reconciliar-usuario-individual', '*/5 * * * *',
  $$select private.encolar_reconciliacion_usuario('individual');$$);
select cron.schedule('ruum-reconciliar-usuario-masivo', '* * * * *',
  $$select private.encolar_reconciliacion_usuario('masivo');$$);
