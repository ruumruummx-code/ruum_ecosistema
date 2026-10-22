-- RT-67 — El gate de rol del middleware de app-conductor es fail-open a propósito:
-- un conductor en plena ruta con red inestable no debe quedar bloqueado y RLS
-- protege las mutaciones. Ese fail-open solo es defendible si RLS impide que
-- una cuenta de rol `usuario` toque las tablas del conductor.
--
-- La policy "conductor_crea_su_registro" (20260708000021) permitía que cualquier
-- cuenta autenticada insertara SU PROPIA fila en public.conductores, con lo que
-- una cuenta de rol `usuario` podía autoproclamarse conductor.
--
-- Ninguna app inserta en public.conductores como cliente autenticado: el alta la
-- hacen las funciones `security definer` del flujo de solicitud (RT-05/RT-11).
-- Por eso se puede cerrar el hueco sin romper el auto-registro de conductor: la
-- cuenta que se registra como conductor no tiene fila en public.usuarios.

drop policy if exists "conductor_crea_su_registro" on public.conductores;

create policy "conductor_crea_su_registro"
  on public.conductores for insert
  with check (
    auth.uid() = auth_user_id
    and not exists (
      select 1
      from public.usuarios u
      where u.auth_user_id = auth.uid()
    )
  );

comment on policy "conductor_crea_su_registro" on public.conductores is
  'RT-67: auto-registro de conductor. Una cuenta de rol usuario no puede crear su propio perfil de conductor.';
