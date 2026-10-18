-- Migración: agrega la columna fecha_nacimiento a la tabla public.usuarios
-- PRD §4.1 — Datos personales del usuario en aplicación usuario.

alter table public.usuarios
  add column if not exists fecha_nacimiento date;

comment on column public.usuarios.fecha_nacimiento is
  'Fecha de nacimiento del usuario. Validada en interfaz de usuario para mayores de 18 años.';
