-- Restaura dos flujos operativos del conductor rotos por el endurecimiento RBAC.
--
-- 1) Cierre del traslado (`conductor_avanza_traslado(..., 'cerrar_viaje')`).
--    El trigger `private.actualizar_historial_por_traslado` recalcula
--    `usuarios.traslados_completados_sin_incidencia` dentro de la misma
--    transacción. Desde 20261121000001 `proteger_columnas_sensibles_usuario`
--    rechaza ese cambio porque el JWT es del conductor (no service_role), así
--    que ningún conductor podía cerrar un viaje:
--      "No puedes modificar traslados_completados_sin_incidencia".
--    El contador es derivado: sólo lo escribe `private.recalcular_historial`
--    desde triggers. Se permite el cambio cuando llega anidado en otro trigger
--    (pg_trigger_depth() > 1); un UPDATE directo vía PostgREST sigue bloqueado.
--
-- 2) Incidencia automática por daño no reportado y baja de push.
--    20261123000004 revocó EXECUTE a authenticated de
--    `crear_incidencia_sistema_dano_no_reportado` y `desactivar_dispositivo_push`,
--    pero ambas sólo funcionan con la sesión del conductor (validan auth.uid()):
--    con service_role auth.uid() es null. Resultado: al confirmar evidencia
--    final con daño nuevo el conductor veía "permission denied" y la incidencia
--    no se abría; al cerrar sesión en Android fallaba la baja del dispositivo.

begin;

create or replace function public.proteger_columnas_sensibles_usuario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_bypass boolean;
begin
  v_bypass := is_superadmin() or (coalesce(auth.jwt() ->> 'role', '') = 'service_role');
  if v_bypass then
    return new;
  end if;

  if new.rol is distinct from old.rol then
    raise exception 'No puedes modificar rol';
  end if;
  if new.tipo_cuenta is distinct from old.tipo_cuenta then
    raise exception 'No puedes modificar tipo_cuenta';
  end if;
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'No puedes modificar empresa_id';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'No puedes modificar auth_user_id';
  end if;
  if new.estado_cuenta is distinct from old.estado_cuenta then
    raise exception 'No puedes modificar estado_cuenta';
  end if;
  if new.metodo_pago_registrado is distinct from old.metodo_pago_registrado then
    raise exception 'No puedes modificar metodo_pago_registrado';
  end if;
  -- Contador derivado: sólo lo mantiene private.recalcular_historial desde
  -- los triggers de historial (profundidad > 1). Directo: bloqueado.
  if new.traslados_completados_sin_incidencia is distinct from old.traslados_completados_sin_incidencia
     and pg_trigger_depth() <= 1 then
    raise exception 'No puedes modificar traslados_completados_sin_incidencia';
  end if;

  return new;
end;
$$;

revoke execute on function public.proteger_columnas_sensibles_usuario() from public, anon, authenticated;

-- Ambas validan internamente que auth.uid() sea el conductor asignado / dueño del dispositivo.
grant execute on function public.crear_incidencia_sistema_dano_no_reportado(uuid, text) to authenticated;
grant execute on function public.desactivar_dispositivo_push(text) to authenticated;

commit;
