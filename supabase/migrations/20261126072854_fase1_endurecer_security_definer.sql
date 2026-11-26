-- Estas funciones son triggers de protección y se ejecutan desde sus tablas.
-- Los roles de cliente no necesitan EXECUTE para que se dispare un trigger existente.
revoke execute on function
  public.proteger_columnas_sensibles_conductor(),
  public.proteger_columnas_sensibles_datos_bancarios(),
  public.proteger_columnas_sensibles_empresa(),
  public.proteger_columnas_sensibles_llamada(),
  public.proteger_columnas_sensibles_mensaje_chat(),
  public.proteger_columnas_sensibles_pago(),
  public.proteger_columnas_sensibles_payout(),
  public.proteger_columnas_sensibles_usuario()
from public, anon, authenticated;
