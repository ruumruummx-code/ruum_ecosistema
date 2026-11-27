-- Aplicada directamente en producción el 2026-11-27; versionada para alinear repo y remoto.
-- Las políticas de traslados evalúan este helper con el rol de la sesión.
GRANT EXECUTE ON FUNCTION public.conductor_id_actual() TO authenticated;
