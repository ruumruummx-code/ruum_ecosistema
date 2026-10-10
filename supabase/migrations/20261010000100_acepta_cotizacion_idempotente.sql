-- Robustez: usuario_acepta_cotizacion idempotente ante doble aceptación.
--
-- Contexto: el wizard auto-acepta la cotización al crear el traslado y el
-- Pasaporte ofrece "Aceptar cotización" cuando ve estado cotizacion_generada.
-- Con UI desactualizada (realtime con lag) o doble clic, el segundo llamado
-- llegaba con estado ya en cotizacion_aceptada y la función levantaba
-- 'La cotización no está disponible para aceptación', que PostgREST expone
-- como 400 Bad Request aunque el payload sea correcto.
--
-- Cambio: si el traslado ya está en cotizacion_aceptada o servicio_confirmado
-- (el dueño ya aceptó antes), se devuelve el estado actual sin error. El
-- resto de guardas (dueño, cotización válida, vigencia, grafo) queda intacto:
-- estados terminales o ajenos siguen rechazándose.

create or replace function public.usuario_acepta_cotizacion(p_traslado_id uuid)
returns public.estado_traslado language plpgsql security definer set search_path = public as $$
declare v_traslado public.traslados%rowtype; v_usuario_id uuid; v_siguiente public.estado_traslado;
begin
  select id into v_usuario_id from public.usuarios where auth_user_id = auth.uid();
  if v_usuario_id is null then raise exception 'Usuario no encontrado'; end if;
  select * into v_traslado from public.traslados where id = p_traslado_id and usuario_id = v_usuario_id for update;
  if v_traslado.id is null then raise exception 'Traslado no encontrado'; end if;
  if v_traslado.estado <> 'cotizacion_generada' then
    -- Idempotencia: aceptar dos veces no es error si ya quedó aceptada o
    -- confirmada (p. ej. auto-aceptación del wizard + clic en Pasaporte).
    if v_traslado.estado in ('cotizacion_aceptada', 'servicio_confirmado') then
      return v_traslado.estado;
    end if;
    raise exception 'La cotización no está disponible para aceptación';
  end if;
  if coalesce(v_traslado.precio_cotizado, 0) <= 0 then raise exception 'El traslado todavía no cuenta con una cotización válida'; end if;
  if v_traslado.cotizacion_expira_en is null or v_traslado.cotizacion_expira_en <= now() then raise exception 'La cotización ha vencido'; end if;
  v_siguiente := case when v_traslado.tipo_pago = 'anticipado' then 'cotizacion_aceptada' else 'servicio_confirmado' end;
  update public.traslados set estado = v_siguiente where id = p_traslado_id;
  return v_siguiente;
end; $$;

-- Grants y firma intactos (la función ya existía con revoke/grant a authenticated).
revoke all on function public.usuario_acepta_cotizacion(uuid) from public;
grant execute on function public.usuario_acepta_cotizacion(uuid) to authenticated;

-- Autoverificación: la firma sigue siendo (uuid) -> estado_traslado.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from pg_proc
  where proname = 'usuario_acepta_cotizacion'
    and pronamespace = 'public'::regnamespace
    and pg_get_function_arguments(oid) = 'p_traslado_id uuid';
  if v_count <> 1 then
    raise exception 'La firma de usuario_acepta_cotizacion cambió de forma inesperada';
  end if;
end;
$$;
