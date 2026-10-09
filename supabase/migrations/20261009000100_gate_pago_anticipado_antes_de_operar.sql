-- F1 — Gate "sin pago anticipado no procede": un traslado con tipo_pago
-- 'anticipado' NO puede entrar a servicio_confirmado ni a
-- pendiente_de_conductor sin un pago electrónico completado (Stripe).
--
-- Contexto: el wizard cobra en el paso 5 (PasoPago) pero no retiene al
-- usuario, y admin_cambiar_estado_traslado / las RPC de asignación solo
-- validaban estado, nunca pagos. Sin este freno, Torre podía empujar un
-- traslado impago hasta conductor_asignado y el fallo aparecía en la calle
-- (recién en evidencia_inicial_completada). Este trigger lo detiene en el
-- origen: la operación (confirmación -> espera de conductor) exige dinero.
--
-- Alcance:
--   * Solo tipo_pago = 'anticipado'. 'al_cierre' queda exento por diseño
--     (históricos cobran en entrega_confirmada/pago_pendiente).
--   * Solo exige EXISTENCIA de un pago con estado = 'completado'. La
--     conciliación monto-vs-precio es higiene del webhook (fuera de alcance).
--   * No bloquea salidas (servicio_cancelado, etc.) ni otros estados.
--   * SECURITY DEFINER para leer pagos con verdad con cualquier rol
--     invocador (un conductor/admin con RLS parcial no debe provocar un
--     falso bloqueo por filas invisibles).
-- Orden de disparo: el nombre ordena alfabéticamente DESPUÉS de
-- traslados_validar_transicion y traslados_validar_transicion_operativa,
-- así los saltos inválidos siguen reportando su mensaje original y este
-- gate solo evalúa transiciones válidas por grafo.

create or replace function public.exigir_pago_anticipado_antes_de_operar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return new;
  end if;

  if new.estado::text in ('servicio_confirmado', 'pendiente_de_conductor')
     and new.tipo_pago::text = 'anticipado'
     and not exists (
       select 1 from public.pagos
       where traslado_id = new.id
         and estado = 'completado'
     ) then
    raise exception 'PAGO_ANTICIPADO_REQUERIDO: el traslado % no puede pasar a % sin un pago electrónico completado (Stripe).',
      new.id, new.estado::text;
  end if;

  return new;
end;
$$;

create trigger traslados_validar_transicion_pago
  before insert or update of estado on public.traslados
  for each row execute function public.exigir_pago_anticipado_antes_de_operar();

-- Autoverificación: el gate existe y está armado en el orden correcto
-- (después de la validación de grafo legacy).
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from pg_trigger
  where tgrelid = 'public.traslados'::regclass
    and tgname = 'traslados_validar_transicion_pago'
    and tgenabled = 'O';
  if v_count <> 1 then
    raise exception 'El trigger traslados_validar_transicion_pago no quedó habilitado';
  end if;
end;
$$;
