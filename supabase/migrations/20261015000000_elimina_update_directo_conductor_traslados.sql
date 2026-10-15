-- FIX C2 (ticket seguridad Fase 2): la migración 20260823000500 reintrodujo
-- "conductor_actualiza_sus_traslados_asignados" (UPDATE directo sobre
-- public.traslados), anulando la protección de 20260708000030 que restringe
-- al conductor a la RPC conductor_avanza_traslado. Se elimina: el único camino
-- de escritura del conductor es vía RPCs security definer con FOR UPDATE.
drop policy if exists "conductor_actualiza_sus_traslados_asignados" on public.traslados;
