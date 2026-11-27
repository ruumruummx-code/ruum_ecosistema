-- Las políticas SELECT de usuarios evalúan estos helpers con el rol de la sesión.
revoke execute on function
  public.empresa_id_del_titular_actual(),
  public.usuario_ids_de_traslados_asignados_conductor()
from public, anon;

grant execute on function
  public.empresa_id_del_titular_actual(),
  public.usuario_ids_de_traslados_asignados_conductor()
to authenticated;
