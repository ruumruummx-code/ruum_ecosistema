import { createClient } from "@supabase/supabase-js";

/**
 * RUUM-USR-F5-001 (CB-2 / CA-5): Job de reconciliación durable para verificaciones Didit.
 *
 * Resuelve sesiones de verificación donde el webhook no llegó o se perdió,
 * consultando activamente el estado terminal en Didit y aplicando la RPC correspondiente.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const diditApiKey = process.env.DIDIT_API_KEY;

if (!url || !serviceKey) {
  throw new Error("Faltan variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const cliente = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Obtener sesiones pendientes con más de 5 minutos de antigüedad
const limiteTiempo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

const { data: pendientes, error: errorConsulta } = await cliente
  .from("verificaciones_identidad_didit")
  .select("id, session_id, estado, creado_en, usuario_id, solicitud_id")
  .in("estado", ["pendiente", "en_revision"])
  .is("procesado_en", null)
  .lt("creado_en", limiteTiempo)
  .limit(50);

if (errorConsulta) {
  console.error(
    JSON.stringify({
      event: "reconciliacion_didit_consulta_fallida",
      message: errorConsulta.message,
    })
  );
  process.exitCode = 1;
  process.exit();
}

let reconciliadas = 0;
let errores = 0;

for (const reg of pendientes || []) {
  try {
    let decision = "expirado";

    // Si la API de Didit está configurada, consultar estado real activo
    if (diditApiKey) {
      try {
        const res = await fetch(`https://verification.didit.me/v3/session/${reg.session_id}/decision`, {
          headers: {
            "x-api-key": diditApiKey,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const datos = await res.json();
          decision = (datos.status || datos.decision || datos.event || "expirado").toLowerCase();
        } else if (res.status === 404) {
          decision = "expirado";
        }
      } catch (errApi) {
        console.warn(`No fue posible consultar Didit API para sesión ${reg.session_id}:`, errApi);
        continue; // Dejar para el siguiente ciclo si la API externa falla
      }
    }

    const { data: resultado, error: errorRpc } = await cliente.rpc(
      "reconciliar_verificacion_didit_resultado",
      {
        p_session_id: reg.session_id,
        p_decision: decision,
      }
    );

    if (errorRpc || !resultado?.ok) {
      errores += 1;
      console.error(`Error reconciliando sesión ${reg.session_id}:`, errorRpc?.message || resultado?.error);
    } else {
      reconciliadas += 1;
    }
  } catch (err) {
    errores += 1;
    console.error(`Fallo inesperado reconciliando ${reg.session_id}:`, err);
  }
}

console.log(
  JSON.stringify({
    event: "reconciliacion_didit_completada",
    reconciliadas,
    errores,
    totalPendientes: (pendientes || []).length,
    frecuencia: "cada_5_minutos",
  })
);
