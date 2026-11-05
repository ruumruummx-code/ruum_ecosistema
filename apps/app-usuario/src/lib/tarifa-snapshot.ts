import { createHash, createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { getRedis } from "@/lib/csp-rate-limit";
import { logStructuredWarn } from "@/lib/logger";
import { hashPseudonimoViajes } from "./viajes-policy";

export const VERSION_TARIFA = "2.0";
export const SNAPSHOT_TTL_MS = 15 * 60 * 1000; // 15 minutos (acotado a la ventana de creación del wizard)

export interface InputsTarifaSnapshot {
  origenCodigoPostal: string;
  destinoCodigoPostal: string;
  origenCoords?: { lat: number; lng: number };
  destinoCoords?: { lat: number; lng: number };
  paradasCount: number;
  categoria: "ligero_a" | "ligero_b" | "mediano" | "camion";
  gama: "entrada" | "media" | "alta" | "premium";
  condicion: "nueva" | "seminueva" | "rescate_mecanico";
  modalidad: "lo_antes_posible" | "programado";
  fechaProgramada?: string | null;
  distanciaKm: number;
  tiempoEstimadoHoras: number;
}

export interface SnapshotTarifaPayload {
  version: string;
  hash: string;
  inputs: InputsTarifaSnapshot;
  monto: number;
  timestamp: string;
  expiraEn: string;
  nonce: string;
}

export interface SnapshotTarifaFirmado extends SnapshotTarifaPayload {
  firma: string;
}

export function obtenerSecretoSnapshot(): string {
  const secreto =
    process.env.TARIFA_SNAPSHOT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "ruum-secret-snapshot-fallback-dev-only";
  return secreto;
}

/**
 * Genera un hash determinista SHA-256 de los inputs ordenados canónicamente.
 */
export function generarHashInputsTarifa(inputs: InputsTarifaSnapshot): string {
  const canonical = JSON.stringify({
    cat: inputs.categoria,
    cond: inputs.condicion,
    dist: Number(inputs.distanciaKm.toFixed(2)),
    dcp: inputs.destinoCodigoPostal.trim(),
    fp: inputs.fechaProgramada || null,
    gama: inputs.gama,
    mod: inputs.modalidad,
    ocp: inputs.origenCodigoPostal.trim(),
    paradas: inputs.paradasCount,
    t: Number(inputs.tiempoEstimadoHoras.toFixed(2)),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * RUUM-USR-F6-001 (CB-1 / CA-1): Recálculo de tarifa en el servidor como única fuente de verdad.
 * Replica el modelo tarifario v2 oficial de la base de datos (calcular_tarifa_traslado).
 */
export function calcularTarifaServidor(params: {
  categoria: "ligero_a" | "ligero_b" | "mediano" | "camion";
  gama: "entrada" | "media" | "alta" | "premium";
  condicion: "nueva" | "seminueva" | "rescate_mecanico";
  distanciaKm: number;
  tiempoEstimadoHoras: number;
  modalidad: "lo_antes_posible" | "programado";
  fechaHoraProgramada?: string | null;
}): number {
  const { categoria, gama, condicion, distanciaKm, tiempoEstimadoHoras, fechaHoraProgramada } = params;

  // 1. Rango de distancia
  const rango =
    distanciaKm <= 50 ? "rango_1" : distanciaKm <= 150 ? "rango_2" : distanciaKm <= 350 ? "rango_3" : "rango_4";

  // 2. Base y costo por km
  const tablaTarifas: Record<string, Record<string, { base: number; porKm: number }>> = {
    ligero_a: { rango_1: { base: 650, porKm: 7 }, rango_2: { base: 700, porKm: 7 }, rango_3: { base: 720, porKm: 7 }, rango_4: { base: 750, porKm: 7 } },
    ligero_b: { rango_1: { base: 700, porKm: 7.5 }, rango_2: { base: 750, porKm: 7.5 }, rango_3: { base: 780, porKm: 7.5 }, rango_4: { base: 820, porKm: 7.5 } },
    mediano: { rango_1: { base: 1100, porKm: 11 }, rango_2: { base: 1800, porKm: 11 }, rango_3: { base: 2600, porKm: 11 }, rango_4: { base: 3800, porKm: 11 } },
    camion: { rango_1: { base: 1800, porKm: 16 }, rango_2: { base: 3200, porKm: 16 }, rango_3: { base: 4800, porKm: 16 }, rango_4: { base: 7200, porKm: 16 } },
  };

  const configCat = tablaTarifas[categoria]?.[rango] ?? tablaTarifas.ligero_b.rango_1;

  // 3. Factores multiplicadores
  const factorGama = { entrada: 1.0, media: 1.15, alta: 1.4, premium: 1.8 }[gama] ?? 1.0;
  // CB-3 / T8: Rescate mecánico aplica recargo oficial de 1.25x
  const factorCondicion = { nueva: 1.1, seminueva: 1.0, rescate_mecanico: 1.25 }[condicion] ?? 1.0;

  const fechaRef = fechaHoraProgramada ? new Date(fechaHoraProgramada) : new Date();
  const hora = fechaRef.getHours();
  const esNocturno = hora >= 20 || hora < 6;
  const factorHorario = esNocturno ? 1.15 : 1.0;

  const diaSemana = fechaRef.getDay(); // 0 = domingo, 6 = sábado
  const esFinSemana = diaSemana === 0 || diaSemana === 6;
  const factorDia = esFinSemana ? 1.1 : 1.0;

  const tarifaHora = 21.5;
  const topeFactorVariable = 2.0;

  const baseCategoria = configCat.base * factorGama;
  const subtotal = baseCategoria + distanciaKm * configCat.porKm + tiempoEstimadoHoras * tarifaHora;
  const factorVariable = Math.min(factorCondicion * factorHorario * factorDia, topeFactorVariable);

  return Number((subtotal * factorVariable).toFixed(2));
}

/**
 * Genera la firma HMAC-SHA256 del snapshot.
 */
function firmarPayload(payload: SnapshotTarifaPayload, secreto: string): string {
  const contenido = `${payload.version}:${payload.hash}:${payload.monto.toFixed(2)}:${payload.timestamp}:${payload.expiraEn}:${payload.nonce}`;
  return createHmac("sha256", secreto).update(contenido).digest("hex");
}

/**
 * RUUM-USR-F6-001 (CB-1 / CA-2): Genera el snapshot firmado con hash, inputs, monto, timestamp y nonce.
 */
export function generarSnapshotFirmado(
  inputs: InputsTarifaSnapshot,
  monto: number,
  ttlMs: number = SNAPSHOT_TTL_MS
): SnapshotTarifaFirmado {
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + ttlMs);
  const hash = generarHashInputsTarifa(inputs);
  const nonce = randomUUID();

  const payload: SnapshotTarifaPayload = {
    version: VERSION_TARIFA,
    hash,
    inputs,
    monto: Number(monto.toFixed(2)),
    timestamp: ahora.toISOString(),
    expiraEn: expira.toISOString(),
    nonce,
  };

  const secreto = obtenerSecretoSnapshot();
  const firma = firmarPayload(payload, secreto);

  return { ...payload, firma };
}

/**
 * RUUM-USR-F6-001 (CA-3 / CA-4): Valida el snapshot firmado con protección anti-replay y expiración.
 *
 * REGLA DE SEGURIDAD CRÍTICA (CA-4):
 * La firma del snapshot valida únicamente autenticidad e integridad del presupuesto;
 * NO autoriza cobros directos sin recálculo ni validación de estado en la base de datos.
 */
export async function verificarSnapshotFirmado(
  snapshot: unknown
): Promise<{ valido: boolean; error?: string; snapshot?: SnapshotTarifaFirmado }> {
  if (!snapshot || typeof snapshot !== "object") {
    return { valido: false, error: "Snapshot no proporcionado o inválido" };
  }

  const s = snapshot as Partial<SnapshotTarifaFirmado>;
  if (
    !s.version ||
    !s.hash ||
    !s.inputs ||
    typeof s.monto !== "number" ||
    !s.timestamp ||
    !s.expiraEn ||
    !s.nonce ||
    !s.firma
  ) {
    return { valido: false, error: "Snapshot con campos incompletos" };
  }

  // 1. Verificar firma HMAC
  const secreto = obtenerSecretoSnapshot();
  const firmaEsperada = firmarPayload(s as SnapshotTarifaPayload, secreto);
  try {
    const bufFirma = Buffer.from(s.firma, "hex");
    const bufEsperada = Buffer.from(firmaEsperada, "hex");

    // Mitigación de fuga de longitud (RUUM-USR-F6-001-C / C3 / D2):
    // timingSafeEqual requiere que ambos buffers tengan idéntica longitud o lanza RangeError.
    // Para prevenir excepciones no controladas y evitar fuga de información por tiempo o branching
    // ante longitudes arbitrarias provistas por un atacante, calculamos el digest SHA-256
    // de ambos buffers (garantizando siempre 32 bytes exactos en cada lado) antes de
    // invocar timingSafeEqual, combinándolo en tiempo constante con la comprobación de longitud.
    const hashFirma = createHash("sha256").update(bufFirma).digest();
    const hashEsperada = createHash("sha256").update(bufEsperada).digest();
    const mismaLongitud = bufFirma.length === bufEsperada.length;
    const firmaCoincide = timingSafeEqual(hashFirma, hashEsperada) && mismaLongitud;

    if (!firmaCoincide) {
      return { valido: false, error: "Firma criptográfica de snapshot inválida" };
    }
  } catch {
    return { valido: false, error: "Error al validar la firma criptográfica" };
  }

  // 2. Verificar vigencia temporal (TTL)
  const ahoraMs = Date.now();
  const expiraMs = new Date(s.expiraEn).getTime();
  if (isNaN(expiraMs) || expiraMs <= ahoraMs) {
    return { valido: false, error: "El snapshot de tarifa ha expirado" };
  }

  // 3. Protección anti-replay vía Redis (CA-3)
  const redis = getRedis();
  if (redis) {
    try {
      const ttlSegundos = Math.max(60, Math.ceil((expiraMs - ahoraMs) / 1000));
      // SET con NX garantiza que el nonce no ha sido consumido previamente
      const resultado = await redis.set(`snapshot-nonce:${s.nonce}`, "1", {
        nx: true,
        ex: ttlSegundos,
      });
      if (!resultado) {
        return { valido: false, error: "Snapshot de tarifa ya consumido previamente (intento de replay detectado)" };
      }
    } catch (err) {
      logStructuredWarn("tarifa-snapshot", "redis_anti_replay_fallido", err, { nonce: s.nonce });
      if (process.env.NODE_ENV === "production") {
        return { valido: false, error: "No se pudo verificar la frescura del snapshot contra anti-replay" };
      }
    }
  }

  return { valido: true, snapshot: s as SnapshotTarifaFirmado };
}

export interface EvaluacionDivergencia {
  esDivergente: boolean;
  deltaMontoPorcentaje: number;
  deltaDistanciaPorcentaje: number;
  accionOperativa: "nominal" | "telemetria" | "rechazo_bloqueo";
  motivo?: string;
}

/**
 * RUUM-USR-F6-001 (CA-1 / T4) & RUUM-USR-F6-001-C (C2 / D3 / CA-C4):
 * Registra y evalúa divergencias entre valores estimados en cliente y recálculo server-side.
 * Decisión de diseño:
 * - Delta <= 10%: Nominal.
 * - Delta > 10% y <= 50%: Telemetría estructurada con sobreescritura soberana en servidor.
 * - Delta > 50% o monto <= 0: Rechazo operativo (rechazo_bloqueo) por manipulación maliciosa de cotización.
 */
export function registrarDivergenciaTarifa(
  clienteValores: { distanciaKm?: number | null; tiempoHoras?: number | null; monto?: number | null },
  servidorValores: { distanciaKm: number; tiempoHoras: number; monto: number },
  usuarioId?: string
): EvaluacionDivergencia {
  const distCliente = clienteValores.distanciaKm ?? null;
  const distServidor = servidorValores.distanciaKm;
  const montoCliente = clienteValores.monto ?? null;
  const montoServidor = servidorValores.monto;

  const deltaDist = distCliente !== null && distServidor > 0
    ? Math.abs(distCliente - distServidor) / distServidor
    : 0;
  const deltaMonto = montoCliente !== null && montoServidor > 0
    ? Math.abs(montoCliente - montoServidor) / montoServidor
    : 0;

  const deltaDistanciaPorcentaje = Number((deltaDist * 100).toFixed(1));
  const deltaMontoPorcentaje = Number((deltaMonto * 100).toFixed(1));

  let accionOperativa: "nominal" | "telemetria" | "rechazo_bloqueo" = "nominal";
  let motivo: string | undefined;

  if (montoCliente !== null && montoCliente <= 0) {
    accionOperativa = "rechazo_bloqueo";
    motivo = "monto_cliente_negativo_o_cero";
  } else if (deltaMonto > 0.50 || deltaDist > 0.50) {
    accionOperativa = "rechazo_bloqueo";
    motivo = "divergencia_critica_excede_50_porciento";
  } else if (deltaMonto > 0.10 || deltaDist > 0.10) {
    accionOperativa = "telemetria";
    motivo = "divergencia_moderada_recálculo_soberano";
  }

  const esDivergente = accionOperativa !== "nominal";

  if (esDivergente) {
    const evento = accionOperativa === "rechazo_bloqueo"
      ? "divergencia_tarifa_critica_bloqueada"
      : "divergencia_tarifa_detectada";

    logStructuredWarn("tarifa-snapshot", evento, undefined, {
      userIdHash: hashPseudonimoViajes(usuarioId ?? "anonimo"),
      cliente: { distanciaKm: distCliente, monto: montoCliente },
      servidor: { distanciaKm: distServidor, monto: montoServidor },
      deltaDistanciaPorcentaje,
      deltaMontoPorcentaje,
      accionOperativa,
      motivo,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    esDivergente,
    deltaMontoPorcentaje,
    deltaDistanciaPorcentaje,
    accionOperativa,
    motivo,
  };
}
