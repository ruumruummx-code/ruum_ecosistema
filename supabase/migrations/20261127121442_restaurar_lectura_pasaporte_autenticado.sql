-- pasaporte_digital conserva la función por OID y sigue aplicando RLS al lector.
-- El permiso del lector vive fuera de los esquemas expuestos por PostgREST.
begin;

alter function public.calcular_pago_conductor(public.certificacion_conductor, numeric)
  set schema private;

alter function private.calcular_pago_conductor(public.certificacion_conductor, numeric)
  set search_path = '';

grant execute on function private.calcular_pago_conductor(public.certificacion_conductor, numeric)
  to authenticated;

-- Conserva la firma pública para las llamadas internas existentes.
create function public.calcular_pago_conductor(
  p_certificacion public.certificacion_conductor,
  p_precio numeric
)
returns numeric
language sql
set search_path = ''
return private.calcular_pago_conductor(p_certificacion, p_precio);

revoke execute on function public.calcular_pago_conductor(public.certificacion_conductor, numeric)
  from public, anon, authenticated;

grant execute on function public.calcular_pago_conductor(public.certificacion_conductor, numeric)
  to service_role;

commit;
