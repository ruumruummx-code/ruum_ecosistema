-- La firma extendida conserva los argumentos anteriores mediante valores
-- predeterminados. La firma antigua duplicada vuelve ambiguas las llamadas
-- PostgREST que sólo envían p_tipo, p_version_app y p_detalle.
drop function if exists public.registrar_evento_operativo_app(text, text, jsonb);

notify pgrst, 'reload schema';
