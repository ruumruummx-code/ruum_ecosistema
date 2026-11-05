-- La firma de siete argumentos sustituye a la de seis; sus valores por
-- defecto conservan las llamadas existentes y evitan una resolución ambigua
-- tanto en PostgreSQL como en PostgREST. No usar CASCADE.
drop function if exists public.actualizar_datos_facturacion(text, text, text, text, text, text);

notify pgrst, 'reload schema';
