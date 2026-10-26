-- Migración para soportar pago parcial y guardado de filas erróneas en borrador
-- Permite que el usuario pague un subconjunto de traslados válidos y conserve
-- las filas con errores para su corrección y reintento posterior.

alter table public.checkout_traslados_masivos
  add column if not exists filas_pendientes_correccion jsonb not null default '[]'::jsonb;

comment on column public.checkout_traslados_masivos.filas_pendientes_correccion is
  'Filas del lote original que presentaron errores o faltantes de cotización, guardadas como borrador para reintento posterior.';
