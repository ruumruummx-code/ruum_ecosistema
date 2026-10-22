-- RT-68 — La evidencia registrada no se sobrescribe: tampoco en Storage.
--
-- La policy "conductor_actualiza_su_evidencia_storage" (20260708000047)
-- permitía que un cliente con la sesión del conductor ACTUALIZARA (y por tanto
-- sobrescribiera) un objeto ya subido en su propia carpeta. Con la cola de
-- evidencia en modo insert-only (RT-68, `upsert: false`) ningún flujo de la
-- app necesita esa capacidad:
--   · una subida parcial deja el objeto en su sitio (409) y el flujo continúa;
--   · el INSERT en public.evidencia_fotos decide con el sha256 si es un
--     reintento idempotente o un conflicto de custodia.
--
-- Sin esta policy, la única forma de cambiar los bytes de una evidencia
-- registrada es que la Torre de Control lo haga con service_role, que queda
-- fuera del alcance del cliente.
--
-- El bucket `evidencia` conserva: INSERT en la carpeta propia, SELECT (propio,
-- del usuario dueño del traslado y admin) y nada más.

drop policy if exists "conductor_actualiza_su_evidencia_storage" on storage.objects;
