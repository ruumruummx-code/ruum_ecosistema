-- RT-68 — Cadena de custodia: la evidencia registrada no se sobrescribe.
--
-- Con `upsert: true` sobre public.evidencia_fotos, un reintento de la cola (o
-- cualquier actor con la misma sesión) podía reemplazar una foto ya
-- registrada: eso rompe la cadena de custodia. El `upsert` se usaba para que
-- los reintentos fueran idempotentes, pero la idempotencia correcta es
-- "insert + comparar sha256", no "sobrescribir".
--
-- A partir de aquí:
--   · la escritura es insert-only (nunca sobrescribe);
--   · un duplicado con el MISMO sha256 es un reintento idempotente (éxito);
--   · un duplicado con sha256 DISTINTO (o sin sha256 comparable) es un
--     conflicto de custodia: la evidencia se marca y se avisa a soporte.

alter table public.evidencia_fotos
  add column if not exists sha256 text,
  add column if not exists conflicto boolean not null default false,
  add column if not exists conflicto_detalle text,
  add column if not exists conflicto_detectado_en timestamptz;

comment on column public.evidencia_fotos.sha256 is
  'Huella sha256 del archivo subido: define la identidad de la evidencia en la cadena de custodia.';
comment on column public.evidencia_fotos.conflicto is
  'true cuando se detecto un intento de sobrescribir evidencia con un sha256 distinto al registrado.';
comment on column public.evidencia_fotos.conflicto_detalle is
  'Detalle del conflicto (sha256 registrado vs. recibido). No contiene datos personales.';
comment on column public.evidencia_fotos.conflicto_detectado_en is
  'Momento en que se detecto el conflicto de custodia.';

create index if not exists evidencia_fotos_conflicto_idx
  on public.evidencia_fotos (conflicto_detectado_en)
  where conflicto;

-- Tipo de incidencia para que la Torre de Control atienda el conflicto.
alter type public.tipo_incidencia add value if not exists 'conflicto_evidencia';
