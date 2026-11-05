import { obtenerEstadoVerificacionDiditUsuario, obtenerUsuarioActual } from "@ruum/api/services";

export type ResultadoVerificacionDidit = "verificado" | "rechazado" | "asincrono";

export interface OpcionesSuscripcionDidit {
  cliente: any;
  sessionId: string;
  onResultado?: (resultado: ResultadoVerificacionDidit) => void;
  tiempoEsperaMaximoMs?: number;
  signal?: AbortSignal;
}

/**
 * RUUM-USR-F5-001 (CB-2): Sustituye el sondeo agresivo de 12 s (2 queries/s)
 * por Supabase Realtime con autorización de canal por usuario y política de fallback.
 *
 * Si Realtime no conecta o el webhook tarda, aplica polling degradado con backoff
 * espaciado (máximo 3 consultas espaciadas) y resolución explícita a estado asíncrono.
 */
export function esperarResultadoDidit({
  cliente,
  sessionId,
  onResultado,
  tiempoEsperaMaximoMs = 20_000,
  signal,
}: OpcionesSuscripcionDidit): Promise<ResultadoVerificacionDidit> {
  return new Promise<ResultadoVerificacionDidit>((resolve) => {
    let terminado = false;
    let canal: any = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const terminar = (resultado: ResultadoVerificacionDidit) => {
      if (terminado) return;
      terminado = true;
      limpiar();
      onResultado?.(resultado);
      resolve(resultado);
    };

    const limpiar = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      if (canal) {
        try {
          if (typeof canal.unsubscribe === "function") {
            canal.unsubscribe();
          }
          if (typeof cliente.removeChannel === "function") {
            cliente.removeChannel(canal);
          }
        } catch {
          // Ignorar fallos de limpieza
        }
        canal = null;
      }
    };

    if (signal?.aborted) {
      terminar("asincrono");
      return;
    }
    signal?.addEventListener("abort", () => terminar("asincrono"), { once: true });

    // Función de consulta puntual segura
    const consultarPuntual = async () => {
      if (terminado) return;
      try {
        const [usuario, verificacion] = await Promise.all([
          Promise.resolve().then(() => obtenerUsuarioActual(cliente)).catch(() => null),
          Promise.resolve().then(() => obtenerEstadoVerificacionDiditUsuario(cliente, sessionId)).catch(() => null),
        ]);

        if (terminado) return;

        if (usuario?.estado_verificacion === "verificado") {
          terminar("verificado");
          return;
        }

        if (verificacion && verificacion.session_id === sessionId) {
          if (verificacion.estado === "aprobado") {
            terminar("verificado");
            return;
          }
          if (["rechazado", "error", "expirado", "cancelado"].includes(verificacion.estado ?? "")) {
            terminar("rechazado");
            return;
          }
        }
      } catch {
        // Continuar esperando
      }
    };

    // 1. Iniciar suscripción a Supabase Realtime
    try {
      if (typeof cliente.channel === "function") {
        canal = cliente.channel(`didit-verif-${sessionId}`);
        if (typeof canal.on === "function") {
          canal.on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "verificaciones_identidad_didit",
              filter: `session_id=eq.${sessionId}`,
            },
            (payload: any) => {
              const nuevoEstado = payload?.new?.estado;
              if (nuevoEstado === "aprobado") {
                terminar("verificado");
              } else if (["rechazado", "error", "expirado", "cancelado"].includes(nuevoEstado)) {
                terminar("rechazado");
              }
            }
          );
        }
        if (typeof canal.subscribe === "function") {
          canal.subscribe((status: string) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              // Activar fallback anticipado si el canal falla
              void consultarPuntual();
            }
          });
        }
      }
    } catch {
      // Si la librería no tiene Realtime disponible, opera directamente con fallback
    }

    // 2. Fallback degradado espaciado con backoff (a los 4s, 10s y 16s)
    const backoffDelays = [4_000, 10_000, 16_000];
    backoffDelays.forEach((delay) => {
      const timer = setTimeout(() => {
        if (!terminado) void consultarPuntual();
      }, delay);
      timers.push(timer);
    });

    // 3. Timeout máximo: si el webhook no llega dentro de la ventana de espera,
    // resuelve a estado asíncrono sin bloquear la UI ni dar falsos veredictos.
    const timerMax = setTimeout(() => {
      if (!terminado) {
        terminar("asincrono");
      }
    }, tiempoEsperaMaximoMs);
    timers.push(timerMax);
  });
}
