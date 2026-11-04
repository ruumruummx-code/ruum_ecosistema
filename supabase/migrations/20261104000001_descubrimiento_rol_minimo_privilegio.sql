-- RUUM-USR-F1-001 / CB-1
-- La reparación explícita de una identidad Auth sin perfil no debe inferir
-- permisos de conductor. `sin_rol` es un estado mínimo de privilegio y sólo
-- puede promoverse mediante los flujos autorizados de verificación.
alter type public.rol_usuario add value if not exists 'sin_rol';

comment on type public.rol_usuario is
  'Roles de usuario. sin_rol representa una identidad Auth reparada sin privilegios; no autoriza operaciones de conductor.';
