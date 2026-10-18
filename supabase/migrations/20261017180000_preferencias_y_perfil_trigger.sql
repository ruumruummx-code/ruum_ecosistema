-- 20261017180000_preferencias_y_perfil_trigger.sql
-- 1. Añadir columna jsonb preferencias en usuarios para sincronización entre dispositivos
alter table public.usuarios
  add column if not exists preferencias jsonb not null default '{}'::jsonb;

-- 2. Asegurar índice único de clave_idempotencia en traslados para protección de idempotencia
create unique index if not exists traslados_usuario_clave_idempotencia_uidx
  on public.traslados(usuario_id, clave_idempotencia);

