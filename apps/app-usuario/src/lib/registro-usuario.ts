export const CLAVE_CORREO_CONFIRMACION = "ruum:correo-confirmacion";
export const CLAVE_CORREO_ENVIADO_EN = "ruum:correo-confirmacion-enviado-en";
export const CLAVE_REENVIO_CONFIRMACION_HASTA = "ruum:reenvio-confirmacion-hasta";
export const ESPERA_REENVIO_SEGUNDOS = 60;
export const VERIFICACION_TELEFONO_REQUERIDA = "verificacion_telefono_requerida";

export function guardarCorreoConfirmacion(correo: string, enviadoEn?: number) {
  try {
    const storage = window.sessionStorage;
    storage.setItem(CLAVE_CORREO_CONFIRMACION, correo);
    if (enviadoEn !== undefined) {
      storage.setItem(CLAVE_CORREO_ENVIADO_EN, String(enviadoEn));
      storage.setItem(CLAVE_REENVIO_CONFIRMACION_HASTA, String(enviadoEn + ESPERA_REENVIO_SEGUNDOS * 1000));
    } else {
      storage.removeItem(CLAVE_CORREO_ENVIADO_EN);
      storage.removeItem(CLAVE_REENVIO_CONFIRMACION_HASTA);
    }
  } catch {
    // El paso de confirmación también admite capturar el correo manualmente.
  }
}

export function soloDigitos(valor: string, maximo?: number) {
  const limpio = valor.replace(/\D/g, "");
  return maximo ? limpio.slice(0, maximo) : limpio;
}

export function telefonoLocalMx(valor: string) {
  const limpio = soloDigitos(valor);
  if (limpio.length > 10 && limpio.startsWith("521")) return limpio.slice(3, 13);
  if (limpio.length > 10 && limpio.startsWith("52")) return limpio.slice(2, 12);
  return limpio.slice(0, 10);
}

export function telefonoMx(diezDigitos: string) {
  const telefono = soloDigitos(diezDigitos, 10);
  return telefono ? `+52${telefono}` : "";
}

export function normalizarCorreoRegistro(valor: string) {
  return valor.trim().toLowerCase();
}

export function nombreCompleto(nombre: string, apellido: string) {
  return [nombre.trim(), apellido.trim()].filter(Boolean).join(" ");
}

export function crearRedirectConfirmacion(origen: string) {
  const destino = new URL("/auth/callback", origen);
  destino.searchParams.set("next", "/");
  return destino.toString();
}
