-- Aplicada directamente en producción el 2026-11-27; versionada para alinear repo y remoto.
ALTER FUNCTION public.titular_es_dueno_de_empresa_de_usuario(uuid) SET SCHEMA private;
ALTER FUNCTION public.conductor_operativamente_aprobado(uuid) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.titular_es_dueno_de_empresa_de_usuario(uuid), private.conductor_operativamente_aprobado(uuid) TO authenticated;
CREATE FUNCTION public.titular_es_dueno_de_empresa_de_usuario(p_usuario_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' RETURN private.titular_es_dueno_de_empresa_de_usuario(p_usuario_id);
CREATE FUNCTION public.conductor_operativamente_aprobado(p_auth_user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' RETURN private.conductor_operativamente_aprobado(p_auth_user_id);
REVOKE EXECUTE ON FUNCTION public.titular_es_dueno_de_empresa_de_usuario(uuid), public.conductor_operativamente_aprobado(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.titular_es_dueno_de_empresa_de_usuario(uuid), public.conductor_operativamente_aprobado(uuid) TO service_role;
