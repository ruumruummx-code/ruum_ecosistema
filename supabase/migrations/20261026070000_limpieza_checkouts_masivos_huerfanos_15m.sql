-- Migración para limpieza periódica de checkouts masivos huérfanos sin PaymentIntent
create index if not exists idx_checkout_masivos_sin_intent
  on public.checkout_traslados_masivos (creado_en)
  where stripe_payment_intent_id is null;

-- Función de mantenimiento para eliminar checkouts huérfanos sin PaymentIntent tras N minutos (defecto: 15)
create or replace function public.limpiar_checkouts_masivos_sin_intent(p_minutos int default 15)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_count int := 0;
begin
  with eliminados as (
    delete from public.checkout_traslados_masivos
    where stripe_payment_intent_id is null
      and creado_en < (now() - (p_minutos || ' minutes')::interval)
    returning id
  )
  select count(*) into v_count from eliminados;
  return v_count;
end $$;

revoke all on function public.limpiar_checkouts_masivos_sin_intent(int) from public, anon, authenticated;
grant execute on function public.limpiar_checkouts_masivos_sin_intent(int) to service_role;
