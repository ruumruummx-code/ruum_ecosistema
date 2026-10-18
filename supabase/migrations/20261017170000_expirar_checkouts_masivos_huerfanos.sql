-- Migración para soportar expiración y descarte de checkouts masivos huérfanos
alter table public.checkout_traslados_masivos add column if not exists expirado_en timestamptz;

create index if not exists idx_checkout_masivos_pendientes
  on public.checkout_traslados_masivos (auth_user_id, creado_en desc)
  where pagado_en is null and expirado_en is null;

-- Política para permitir que el usuario descarte sus propios checkouts no pagados
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'checkout_traslados_masivos' and policyname = 'checkout_masivo_descartar_propio'
  ) then
    create policy checkout_masivo_descartar_propio
      on public.checkout_traslados_masivos
      for update
      to authenticated
      using (auth_user_id = (select auth.uid()))
      with check (auth_user_id = (select auth.uid()) and pagado_en is null);
  end if;
end $$;

-- Función de mantenimiento para marcar checkouts huérfanos expirados
create or replace function public.expirar_checkouts_masivos_huerfanos(p_horas int default 24)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_count int := 0;
begin
  with expirados as (
    update public.checkout_traslados_masivos
    set expirado_en = now()
    where pagado_en is null
      and expirado_en is null
      and creado_en < (now() - (p_horas || ' hours')::interval)
    returning id
  )
  select count(*) into v_count from expirados;
  return v_count;
end $$;

revoke all on function public.expirar_checkouts_masivos_huerfanos(int) from public, anon, authenticated;
grant execute on function public.expirar_checkouts_masivos_huerfanos(int) to service_role;
