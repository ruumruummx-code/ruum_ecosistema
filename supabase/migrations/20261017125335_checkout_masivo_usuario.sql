-- Cotizaciones de servidor inmutables durante el cobro. El cliente solo puede leer las propias.
create table public.checkout_traslados_masivos (
  id uuid primary key,
  auth_user_id uuid not null references auth.users(id),
  filas jsonb not null check (jsonb_array_length(filas) between 1 and 100),
  cotizaciones jsonb not null,
  monto_centavos bigint not null check (monto_centavos > 0),
  stripe_payment_intent_id text unique,
  carga_id uuid references public.cargas_traslados_masivos(id),
  pagado_en timestamptz,
  creado_en timestamptz not null default now()
);
alter table public.checkout_traslados_masivos enable row level security;
grant select on public.checkout_traslados_masivos to authenticated;
grant all on public.checkout_traslados_masivos to service_role;
create policy checkout_masivo_propio on public.checkout_traslados_masivos for select to authenticated using (auth_user_id = (select auth.uid()));
alter table public.pagos add column checkout_masivo_id uuid references public.checkout_traslados_masivos(id);

-- Solo el webhook firmado o la reconciliación que consulta Stripe usan esta función.
create or replace function public.confirmar_checkout_masivo(p_id uuid, p_intent text, p_monto bigint, p_moneda text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.checkout_traslados_masivos%rowtype;
  r jsonb;
  c uuid;
  f record;
  precio numeric;
  claims text;
  sub text;
begin
  select * into strict v from public.checkout_traslados_masivos where id = p_id for update;
  if v.stripe_payment_intent_id is distinct from p_intent or v.monto_centavos <> p_monto or p_moneda <> 'mxn' then
    raise exception 'Pago masivo no coincide con la cotización';
  end if;
  if v.pagado_en is not null then return v.carga_id; end if;
  -- Contexto limitado a esta transacción para reutilizar el motor existente del usuario.
  claims := current_setting('request.jwt.claims', true);
  sub := current_setting('request.jwt.claim.sub', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v.auth_user_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v.auth_user_id::text, true);
  r := public.usuario_crea_traslados_masivos('carga-' || v.id || '.csv', v.filas,
    encode(extensions.digest(v.id::text, 'sha256'), 'hex'), octet_length(v.filas::text), 'text/csv');
  c := (r->>'carga_id')::uuid;
  if coalesce((r->>'filas_error')::int,0) > 0 then raise exception 'La carga contiene errores'; end if;
  r := public.usuario_procesa_carga_traslados_masivos(c, 100);
  if (r->>'estado') <> 'procesada' then raise exception 'No se pudieron generar todos los traslados: %', r; end if;
  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  perform set_config('request.jwt.claim.sub', coalesce(sub, ''), true);
  for f in select * from public.filas_carga_traslados_masivos where carga_id = c order by numero_fila loop
    precio := (v.cotizaciones->(f.numero_fila - 1)->>'tarifa')::numeric;
    if precio is null or precio <= 0 then raise exception 'Cotización inválida'; end if;
    -- Se conserva al centavo el precio aceptado, aunque la tarifa vigente haya cambiado.
    update public.traslados set precio_cotizado = precio, tipo_pago = 'anticipado', estado = 'cotizacion_generada' where id = f.traslado_id;
    update public.traslados set estado = 'cotizacion_aceptada' where id = f.traslado_id;
    insert into public.pagos(traslado_id, monto, momento, estado, metodo, checkout_masivo_id)
      values (f.traslado_id, precio, 'anticipado', 'completado', 'stripe', v.id);
    update public.traslados set estado = 'servicio_confirmado' where id = f.traslado_id;
  end loop;
  update public.checkout_traslados_masivos set carga_id = c, pagado_en = now() where id = v.id;
  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  perform set_config('request.jwt.claim.sub', coalesce(sub, ''), true);
  return c;
end $$;
revoke all on function public.confirmar_checkout_masivo(uuid,text,bigint,text) from public, anon, authenticated;
grant execute on function public.confirmar_checkout_masivo(uuid,text,bigint,text) to service_role;
