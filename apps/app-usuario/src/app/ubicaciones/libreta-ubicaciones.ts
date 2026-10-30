export class ErrorLibreta extends Error {}
export const CLAVE_LIBRETA = "ubicaciones_v1";
export interface DatosUbicacion {
  alias: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencia: string;
  tipo: "trabajo" | "otro";
  lat: number | null;
  lng: number | null;
}
export interface UbicacionGuardada extends DatosUbicacion {
  id: string;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
}
export interface LibretaUbicaciones {
  version: 1;
  entradas: UbicacionGuardada[];
  favoritos: Record<string, boolean>;
  ocultas: string[];
}
export type OperacionUbicacion =
  | {
      tipo: "guardar";
      id: string;
      datos: DatosUbicacion;
      versionEsperada: number | null;
      reemplazarId?: string;
      favorita: boolean;
    }
  | { tipo: "favorita"; id: string; valor: boolean }
  | { tipo: "eliminar"; id: string; versionEsperada?: number };
export function libretaVacia(): LibretaUbicaciones {
  return { version: 1, entradas: [], favoritos: {}, ocultas: [] };
}
const objeto = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);
export function idUbicacionValido(id: unknown): id is string {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length <= 800 &&
    !/[\u0000-\u001f]/.test(id) &&
    !["__proto__", "constructor", "prototype"].includes(id)
  );
}
export function coordenadasValidas(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
export function validarDatosUbicacion(valor: unknown): DatosUbicacion {
  if (!objeto(valor))
    throw new ErrorLibreta("Revisa los datos de la ubicación.");
  const texto = (key: string, max: number, requerido = false) => {
    const v = valor[key];
    if (
      typeof v !== "string" ||
      v.length > max ||
      /[\u0000-\u001f]/.test(v) ||
      (requerido && v.trim().length < 2)
    )
      throw new ErrorLibreta("Revisa los campos de la ubicación.");
    return v.trim();
  };
  const alias = texto("alias", 80, true),
    direccion = texto("direccion", 300, true),
    ciudad = texto("ciudad", 100, true),
    estado = texto("estado", 100),
    codigoPostal = texto("codigoPostal", 5),
    referencia = texto("referencia", 300);
  if (codigoPostal && !/^\d{5}$/.test(codigoPostal))
    throw new ErrorLibreta("El código postal debe tener 5 dígitos.");
  if (valor.tipo !== "trabajo" && valor.tipo !== "otro")
    throw new ErrorLibreta("Selecciona un tipo de ubicación válido.");
  const sinCoordenadas = valor.lat === null && valor.lng === null;
  if (!sinCoordenadas && !coordenadasValidas(valor.lat, valor.lng))
    throw new ErrorLibreta(
      "Revisa la latitud y longitud. Debes proporcionar ambas coordenadas.",
    );
  return {
    alias,
    direccion,
    ciudad,
    estado,
    codigoPostal,
    referencia,
    tipo: valor.tipo,
    lat: sinCoordenadas ? null : (valor.lat as number),
    lng: sinCoordenadas ? null : (valor.lng as number),
  };
}
export function leerLibreta(preferencias: unknown): LibretaUbicaciones {
  const libreta = libretaVacia();
  if (!objeto(preferencias) || !objeto(preferencias[CLAVE_LIBRETA]))
    return libreta;
  const valor = preferencias[CLAVE_LIBRETA];
  if (valor.version !== 1) return libreta;
  if (Array.isArray(valor.entradas))
    for (const raw of valor.entradas.slice(0, 200)) {
      if (
        !objeto(raw) ||
        typeof raw.id !== "string" ||
        !/^guardada:[\da-f-]{36}$/i.test(raw.id) ||
        !Number.isInteger(raw.version) ||
        Number(raw.version) < 1 ||
        typeof raw.creadoEn !== "string" ||
        typeof raw.actualizadoEn !== "string" ||
        !Number.isFinite(Date.parse(raw.creadoEn)) ||
        !Number.isFinite(Date.parse(raw.actualizadoEn))
      )
        continue;
      try {
        const datos = validarDatosUbicacion(raw);
        if (!libreta.entradas.some((e) => e.id === raw.id))
          libreta.entradas.push({
            ...datos,
            id: raw.id,
            version: Number(raw.version),
            creadoEn: raw.creadoEn,
            actualizadoEn: raw.actualizadoEn,
          });
      } catch {
        /* Ignore malformed legacy entries, never infer missing fields. */
      }
    }
  if (objeto(valor.favoritos))
    libreta.favoritos = Object.fromEntries(
      Object.entries(valor.favoritos)
        .filter(([id, v]) => idUbicacionValido(id) && typeof v === "boolean")
        .slice(0, 1000),
    ) as Record<string, boolean>;
  if (Array.isArray(valor.ocultas))
    libreta.ocultas = [
      ...new Set(valor.ocultas.filter(idUbicacionValido)),
    ].slice(0, 1000);
  return libreta;
}
export function aplicarOperacionLibreta(
  libro: LibretaUbicaciones,
  operacion: OperacionUbicacion,
  ahora = new Date().toISOString(),
): LibretaUbicaciones {
  if (!objeto(operacion) || !idUbicacionValido(operacion.id))
    throw new ErrorLibreta("La ubicación no es válida.");
  const nuevo: LibretaUbicaciones = {
    version: 1,
    entradas: libro.entradas.map((e) => ({ ...e })),
    favoritos: { ...libro.favoritos },
    ocultas: [...libro.ocultas],
  };
  if (operacion.tipo === "favorita") {
    if (typeof operacion.valor !== "boolean")
      throw new ErrorLibreta("El estado de favorito no es válido.");
    if (
      !Object.hasOwn(nuevo.favoritos, operacion.id) &&
      Object.keys(nuevo.favoritos).length >= 1000
    )
      throw new ErrorLibreta("Alcanzaste el límite de favoritos de tu cuenta.");
    nuevo.favoritos[operacion.id] = operacion.valor;
  } else if (operacion.tipo === "eliminar") {
    if (operacion.id.startsWith("guardada:")) {
      const entrada = nuevo.entradas.find((e) => e.id === operacion.id);
      if (!entrada || entrada.version !== operacion.versionEsperada)
        throw new ErrorLibreta(
          "Esta ubicación cambió en otra sesión. Actualiza la lista antes de continuar.",
        );
      nuevo.entradas = nuevo.entradas.filter((e) => e.id !== operacion.id);
      delete nuevo.favoritos[operacion.id];
    } else {
      if (!nuevo.ocultas.includes(operacion.id)) {
        if (nuevo.ocultas.length >= 1000)
          throw new ErrorLibreta(
            "Alcanzaste el límite de ubicaciones archivadas.",
          );
        nuevo.ocultas.push(operacion.id);
      }
    }
  } else if (operacion.tipo === "guardar") {
    if (
      !/^guardada:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        operacion.id,
      ) ||
      typeof operacion.favorita !== "boolean"
    )
      throw new ErrorLibreta("La ubicación guardada no es válida.");
    const datos = validarDatosUbicacion(operacion.datos),
      index = nuevo.entradas.findIndex((e) => e.id === operacion.id),
      actual = nuevo.entradas[index];
    if (
      (actual && actual.version !== operacion.versionEsperada) ||
      (!actual && operacion.versionEsperada !== null)
    )
      throw new ErrorLibreta(
        "Esta ubicación cambió en otra sesión. Actualiza la lista antes de continuar.",
      );
    if (!actual && nuevo.entradas.length >= 200)
      throw new ErrorLibreta(
        "Puedes guardar hasta 200 direcciones adicionales.",
      );
    const entrada = {
      ...datos,
      id: operacion.id,
      version: (actual?.version ?? 0) + 1,
      creadoEn: actual?.creadoEn ?? ahora,
      actualizadoEn: ahora,
    };
    if (index >= 0) nuevo.entradas[index] = entrada;
    else nuevo.entradas.push(entrada);
    nuevo.favoritos[operacion.id] = operacion.favorita;
    if (operacion.reemplazarId) {
      if (
        !idUbicacionValido(operacion.reemplazarId) ||
        operacion.reemplazarId.startsWith("guardada:")
      )
        throw new ErrorLibreta("La dirección de origen no es válida.");
      if (!nuevo.ocultas.includes(operacion.reemplazarId))
        nuevo.ocultas.push(operacion.reemplazarId);
    }
  } else throw new ErrorLibreta("La operación no es válida.");
  if (Object.keys(nuevo.favoritos).length > 1000 || nuevo.ocultas.length > 1000)
    throw new ErrorLibreta(
      "Alcanzaste el límite de ubicaciones archivadas o favoritas.",
    );
  return nuevo;
}
