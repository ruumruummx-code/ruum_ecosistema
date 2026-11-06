/**
 * Control de concurrencia inter-petición e intra-petición para la generación
 * de expedientes PDF (RUUM-USR-F9-001 / CB-2 / T5, T6, T8).
 *
 * Previene el agotamiento del heap de Node.js (OOM kills) bajo concurrencia:
 * 1. Semáforo global inter-petición: limita las peticiones simultáneas de generación
 *    de PDF por instancia Node.js (por defecto 2). Si se supera, rechaza fail-fast con 503.
 * 2. Pool intra-petición: limita la descarga concurrente de imágenes a máx 2 paralelas,
 *    evitando acumular múltiples buffers pesados en memoria de forma simultánea.
 *
 * DT-06: `ejecutarConSemaforoPdf` tiene un timeout máximo de ejecución configurable
 * (por defecto 30 s, variable de entorno `PDF_GENERATION_TIMEOUT_MS`). Si la tarea
 * supera ese tiempo, el semáforo se libera automáticamente y se lanza
 * `SemaforoPdfTimeoutError`. Esto previene que un error no manejado durante la
 * generación bloquee el slot indefinidamente y cause timeouts en cascada.
 */

export class SemaforoPdfOcupadoError extends Error {
  readonly retryAfterSegundos: number;

  constructor(
    mensaje = "El servidor está procesando el límite de expedientes PDF simultáneos. Por favor reintenta en unos segundos.",
    retryAfterSegundos = 5
  ) {
    super(mensaje);
    this.name = "SemaforoPdfOcupadoError";
    this.retryAfterSegundos = retryAfterSegundos;
  }
}

/** Lanzado cuando la generación de PDF supera el timeout máximo configurado. */
export class SemaforoPdfTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(
      `La generación del PDF superó el límite de ${timeoutMs / 1000} segundos y fue cancelada para liberar recursos.`
    );
    this.name = "SemaforoPdfTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

class SemaforoGlobalPdf {
  private activos = 0;
  private readonly maximoConcurrente: number;

  constructor(maximoConcurrente = 2) {
    const envMax = process.env.MAX_CONCURRENT_PDF_GENERATIONS;
    const parsed = envMax ? parseInt(envMax, 10) : NaN;
    this.maximoConcurrente = !Number.isNaN(parsed) && parsed > 0 ? parsed : maximoConcurrente;
  }

  get cupoDisponible(): number {
    return Math.max(0, this.maximoConcurrente - this.activos);
  }

  get generacionesActivas(): number {
    return this.activos;
  }

  adquirir(): boolean {
    if (this.activos >= this.maximoConcurrente) {
      return false;
    }
    this.activos++;
    return true;
  }

  liberar(): void {
    if (this.activos > 0) {
      this.activos--;
    }
  }

  resetParaPruebas(nuevoMaximo?: number): void {
    this.activos = 0;
    if (nuevoMaximo !== undefined) {
      (this as unknown as { maximoConcurrente: number }).maximoConcurrente = nuevoMaximo;
    }
  }
}

export const semaforoPdfGlobal = new SemaforoGlobalPdf();

/** Tiempo máximo de ejecución por defecto para una generación de PDF (30 s). */
const PDF_TIMEOUT_MS_DEFAULT = 30_000;

function leerTimeoutPdf(): number {
  const env = process.env.PDF_GENERATION_TIMEOUT_MS;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return PDF_TIMEOUT_MS_DEFAULT;
}

/**
 * Envoltorio que ejecuta una tarea de generación de PDF protegiendo la instancia Node
 * contra agotamiento de memoria.
 * - Lanza `SemaforoPdfOcupadoError` si no hay cupo disponible (fail-fast 503).
 * - Lanza `SemaforoPdfTimeoutError` si la tarea supera el timeout configurado,
 *   liberando el slot automáticamente para no bloquear las siguientes peticiones.
 */
export async function ejecutarConSemaforoPdf<T>(fn: () => Promise<T>): Promise<T> {
  const adquirido = semaforoPdfGlobal.adquirir();
  if (!adquirido) {
    throw new SemaforoPdfOcupadoError();
  }

  const timeoutMs = leerTimeoutPdf();

  // liberado: garantiza que el slot se decrementa exactamente una vez,
  // ya sea porque la tarea terminó o porque disparó el timeout.
  let liberado = false;
  function liberarUnaVez() {
    if (!liberado) {
      liberado = true;
      semaforoPdfGlobal.liberar();
    }
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      liberarUnaVez();
      reject(new SemaforoPdfTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const resultado = await Promise.race([fn(), timeoutPromise]);
    return resultado;
  } finally {
    clearTimeout(timeoutHandle);
    liberarUnaVez();
  }
}

/**
 * Ejecuta una lista de tareas asíncronas con concurrencia máxima acotada (intra-petición).
 * Conserva el orden original de los resultados.
 */
export async function ejecutarConLimiteConcurrente<T, R>(
  items: T[],
  limite: number,
  iterador: (item: T, indice: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const resultados = new Array<R>(items.length);
  let indiceActual = 0;

  async function trabajador(): Promise<void> {
    while (indiceActual < items.length) {
      const idx = indiceActual++;
      resultados[idx] = await iterador(items[idx], idx);
    }
  }

  const trabajadores = Array.from(
    { length: Math.min(limite, items.length) },
    () => trabajador()
  );

  await Promise.all(trabajadores);
  return resultados;
}
