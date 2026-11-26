import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { vi } from "vitest";

type Ruta = { metodo: string; recurso: string; filtros: URLSearchParams; datos: unknown };

export const adminId = "admin-finanzas";
export const rechazoBd = (message: string) => Response.json({ code: "42501", message }, { status: 403 });

export function clienteFinanzas(
  responder: (ruta: Ruta) => Response = ({ recurso }) => {
    throw new Error(`Llamada no esperada a ${recurso}`);
  },
  permiso = true,
) {
  const solicitudes: Ruta[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    const recurso = url.pathname.replace(/^\/rest\/v1\//, "");
    const cuerpo = await req.text();
    const ruta = {
      metodo: req.method,
      recurso,
      filtros: url.searchParams,
      datos: cuerpo ? JSON.parse(cuerpo) : null,
    };
    solicitudes.push(ruta);
    if (recurso === "admins") return Response.json([{ id: adminId, rol_operativo: "finanzas" }]);
    if (recurso === "rpc/admin_tiene_permiso") return Response.json(permiso);
    if (recurso === "rpc/registrar_permiso_admin_denegado") return Response.json(null);
    return responder(ruta);
  };
  const cliente = createClient<Database>("https://supabase.ruum.test", "anon-de-prueba", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch },
  });
  vi.spyOn(cliente.auth, "getUser").mockResolvedValue({
    data: { user: { id: "usuario-finanzas", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "" } },
    error: null,
  });
  return { cliente, solicitudes };
}
