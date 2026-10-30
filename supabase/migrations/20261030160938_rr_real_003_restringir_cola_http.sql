-- Refuerzo de grants directos. Los grants del dueño de extensión supabase_admin
-- requieren ese dueño: no asumir que este REVOKE elimina el grant PUBLIC heredado.
-- Verificado por REST: net no se expone (PGRST106); solo public y graphql_public.
-- La petición solo contiene un token efímero para ejecutar una tarea ya programada,
-- nunca claves persistentes de Stripe o service_role.
revoke all on table net.http_request_queue from public, anon, authenticated;
revoke all on table net._http_response from public, anon, authenticated;
