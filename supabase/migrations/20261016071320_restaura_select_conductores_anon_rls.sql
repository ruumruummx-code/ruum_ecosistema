-- Corrección a 20261016071319: el `revoke select on conductores from anon`
-- rompió la evaluación de RLS como anónimo (p. ej. la policy de
-- public.documentos_conductor consulta public.conductores para validar
-- propiedad — 20260710000106_permiso_lectura_conductor_rls.sql). Sin ese grant,
-- el SELECT como anon muere con `permission denied for table conductores`
-- en vez de devolver 0 filas (RT-25.1/RT-25.2, línea 38 del test).
-- El aislamiento real lo da RLS (sin policy permisiva para anon = 0 filas),
-- no la ausencia del grant. Se restaura el grant; la protección C2
-- (vista conductores_publicos como única superficie) queda intacta.

grant select on public.conductores to anon;
