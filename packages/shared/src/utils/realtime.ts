export type RealtimeStatusCallback = (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void;

export interface OpcionesReintento {
  /** Nº máximo de reintentos tras error. Por defecto Infinity (hasta cleanup). */
  maxIntentos?: number;
  /** Base del backoff exponencial en ms. Por defecto 1000. */
  baseMs?: number;
  /** Techo del backoff en ms. Por defecto 15000. */
  maxMs?: number;
  /** Reintentar también ante CLOSED (por defecto solo CHANNEL_ERROR/TIMED_OUT). */
  reintentarEnCierre?: boolean;
}

export interface OpcionesSuscripcionSegura {
  timeoutMs?: number;
  onError?: (error: Error) => void;
  onStatusChange?: RealtimeStatusCallback;
  /**
   * FIX A1 (ticket seguridad Fase 2): backoff con reintento para WebSockets
   * móviles (Capacitor mata el socket en background/sin cobertura). `true`
   * usa defaults; objeto para afinar. Por defecto DESACTIVADO para no cambiar
   * el comportamiento de llamadores existentes.
   */
  reintentar?: boolean | OpcionesReintento;
}

export interface CanalSuscribible {
  subscribe(callback?: (status: string, err?: Error) => void, timeout?: number): unknown;
}

export interface ClienteConRemoveChannel {
  removeChannel(channel: unknown): Promise<unknown>;
}

/**
 * Suscribe un canal Supabase Realtime con manejo de errores, timeout y limpieza segura.
 * Devuelve una función cleanup idempotente que garantiza desuscripción (removeChannel)
 * sin memory leaks ni errores no controlados.
 */
export function suscribirCanalSeguro<C extends CanalSuscribible = CanalSuscribible>(
  cliente: ClienteConRemoveChannel,
  canal: C,
  opciones: OpcionesSuscripcionSegura = {}
): () => Promise<void> {
  const { timeoutMs, onError, onStatusChange, reintentar } = opciones;
  const cfg: OpcionesReintento | null =
    reintentar === true ? {} : reintentar ? reintentar : null;
  const maxIntentos = cfg?.maxIntentos ?? Number.POSITIVE_INFINITY;
  const baseMs = cfg?.baseMs ?? 1000;
  const maxMs = cfg?.maxMs ?? 15000;
  let cerrado = false;
  let intentos = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function demoraBackoff(): number {
    return Math.min(baseMs * 2 ** intentos, maxMs);
  }

  function programarReintento(): void {
    if (cerrado || intentos >= maxIntentos) {
      void limpiar();
      return;
    }
    const espera = demoraBackoff();
    intentos += 1;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (cerrado) return;
      canal.subscribe(manejarStatus, timeoutMs);
    }, espera);
  }

  function manejarStatus(status: string, err?: Error): void {
    onStatusChange?.(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);

    if (status === "SUBSCRIBED") {
      intentos = 0;
      return;
    }

    const reintentable =
      status === "CHANNEL_ERROR" ||
      status === "TIMED_OUT" ||
      (status === "CLOSED" && cfg?.reintentarEnCierre === true);

    if (!reintentable) return;

    const errorReal = err ?? new Error(`Error en suscripción realtime: ${status}`);
    onError?.(errorReal);

    // Sin backoff: comportamiento histórico (desuscribir y listo).
    if (!cfg) {
      void limpiar();
      return;
    }
    programarReintento();
  }

  function reconectarInmediato(): void {
    if (cerrado) return;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    canal.subscribe(manejarStatus, timeoutMs);
  }

  canal.subscribe(manejarStatus, timeoutMs);

  // En móvil el socket muere al cambiar de red; al recuperar conectividad se
  // reintenta de inmediato en vez de esperar el backoff.
  let sinEscuchaOnline: (() => void) | null = null;
  if (cfg && typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("online", reconectarInmediato);
    sinEscuchaOnline = () => window.removeEventListener("online", reconectarInmediato);
  }

  async function limpiar(): Promise<void> {
    if (cerrado) return;
    cerrado = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    sinEscuchaOnline?.();
    try {
      await cliente.removeChannel(canal);
    } catch {
      // Ignorar rechazos si el socket ya estaba cerrado o el canal ya fue desmontado
    }
  }

  return () => {
    void limpiar();
    return Promise.resolve();
  };
}

/**
 * Limpia de manera segura una lista de canales o recursos de suscripción,
 * capturando cualquier error o excepción que ocurra al desmontar.
 */
export async function limpiarCanalesSeguros(
  cliente: ClienteConRemoveChannel,
  canales: Array<unknown>
): Promise<void> {
  const validos = canales.filter((c) => c != null);
  if (validos.length === 0) return;

  await Promise.allSettled(
    validos.map(async (canal) => {
      try {
        await cliente.removeChannel(canal);
      } catch {
        // Ignorar errores en cleanup
      }
    })
  );
}
