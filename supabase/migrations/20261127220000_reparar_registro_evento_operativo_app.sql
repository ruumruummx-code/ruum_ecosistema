-- Repara el registro de eventos operativos de las apps (`registrar_evento_operativo_app`).
--
-- Problema: el lote F1.1-3 (20261123000003) revocó EXECUTE de `obs_resolver_correlation`
-- a `authenticated`. `registrar_evento_operativo_app` es SECURITY INVOKER y llama a ese
-- helper con el rol del usuario, así que cada llamada fallaba con
-- "permission denied for function obs_resolver_correlation" (HTTP 401 en PostgREST).
-- Resultado verificado en producción: `eventos_operativos_app` nunca recibió una fila.
--
-- Corrección: el helper no necesita privilegios (solo lee un GUC de sesión y genera un
-- UUID), así que deja de ser SECURITY DEFINER y se concede EXECUTE a `authenticated`.
-- Al ser SECURITY INVOKER no reabre el aviso del advisor sobre funciones DEFINER
-- ejecutables por clientes. `anon` y `public` siguen sin acceso.

begin;

alter function public.obs_resolver_correlation(text) security invoker;

revoke execute on function public.obs_resolver_correlation(text) from public, anon;
grant execute on function public.obs_resolver_correlation(text) to authenticated, service_role;

commit;
