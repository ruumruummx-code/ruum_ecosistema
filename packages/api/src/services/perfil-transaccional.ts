import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ruum/shared/types";
import { rpcTipado } from "../supabase/funciones";
import {
  validarFotoPerfilUsuario,
  obtenerUrlFotoPerfilUsuario,
} from "./usuarios";

type Cliente = SupabaseClient<Database>;
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

export class ErrorConflictoVersionPerfil extends Error {
  readonly codigo = "conflicto_version";
  readonly versionActual?: number;
  readonly versionEsperada?: number;

  constructor(mensaje: string, versionActual?: number, versionEsperada?: number) {
    super(mensaje);
    this.name = "ErrorConflictoVersionPerfil";
    this.versionActual = versionActual;
    this.versionEsperada = versionEsperada;
  }
}

export class ErrorValidacionPerfilServer extends Error {
  readonly codigo = "validacion_perfil_fallida";
  readonly campo?: string;

  constructor(mensaje: string, campo?: string) {
    super(mensaje);
    this.name = "ErrorValidacionPerfilServer";
    this.campo = campo;
  }
}

export interface DatosActualizarPerfilTransaccional {
  nombre: string;
  telefono?: string | null;
  pais?: string | null;
  estado?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  colonia?: string | null;
  calle?: string | null;
  numero?: string | null;
  referencias?: string | null;
  direccionPrincipal?: string | null;
  fechaNacimiento?: string | null;
  fotoUrl?: string | null;
}

export interface ParametrosSagaPerfil {
  datos: DatosActualizarPerfilTransaccional;
  versionEsperada?: number | null;
  archivoNuevaFoto?: File | null;
  fotoUrlPrevia?: string | null;
}

export interface ResultadoPerfilActualizado {
  ok: true;
  version: number;
  usuario: UsuarioRow;
  fotoUrlFirmada: string | null;
  limpiezaFotoPreviaPendiente?: boolean;
}

/**
 * Valida server-side las longitudes y reglas de dominio antes de mutar la base de datos (CB-3 / CA-8).
 */
export function validarLimitesDatosPersonalesServer(datos: DatosActualizarPerfilTransaccional): void {
  const nombre = (datos.nombre ?? "").trim();
  if (nombre.length < 2 || nombre.length > 100) {
    throw new ErrorValidacionPerfilServer("El nombre debe tener entre 2 y 100 caracteres.", "nombre");
  }

  if (datos.telefono) {
    const tel = datos.telefono.trim();
    if (tel.length < 10 || tel.length > 20) {
      throw new ErrorValidacionPerfilServer("El teléfono debe tener entre 10 y 20 caracteres.", "telefono");
    }
  }

  if (datos.pais && datos.pais.trim().length > 50) {
    throw new ErrorValidacionPerfilServer("El país no puede exceder 50 caracteres.", "pais");
  }

  if (datos.codigoPostal) {
    const cp = datos.codigoPostal.trim();
    const esMexico = (datos.pais ?? "México").trim().toLowerCase() === "méxico" || (datos.pais ?? "México").trim().toLowerCase() === "mexico";
    if (esMexico && !/^\d{5}$/.test(cp)) {
      throw new ErrorValidacionPerfilServer("En México el código postal debe contener exactamente 5 dígitos.", "codigoPostal");
    }
    if (cp.length > 12) {
      throw new ErrorValidacionPerfilServer("El código postal no puede exceder 12 caracteres.", "codigoPostal");
    }
  }

  if (datos.calle && datos.calle.trim().length > 150) {
    throw new ErrorValidacionPerfilServer("La calle no puede exceder 150 caracteres.", "calle");
  }

  if (datos.numero && datos.numero.trim().length > 20) {
    throw new ErrorValidacionPerfilServer("El número exterior/interior no puede exceder 20 caracteres.", "numero");
  }

  if (datos.colonia && datos.colonia.trim().length > 100) {
    throw new ErrorValidacionPerfilServer("La colonia no puede exceder 100 caracteres.", "colonia");
  }

  if (datos.ciudad && datos.ciudad.trim().length > 100) {
    throw new ErrorValidacionPerfilServer("La ciudad no puede exceder 100 caracteres.", "ciudad");
  }

  if (datos.estado && datos.estado.trim().length > 100) {
    throw new ErrorValidacionPerfilServer("El estado no puede exceder 100 caracteres.", "estado");
  }

  if (datos.referencias && datos.referencias.trim().length > 250) {
    throw new ErrorValidacionPerfilServer("Las referencias no pueden exceder 250 caracteres.", "referencias");
  }

  if (datos.fechaNacimiento) {
    const fecha = new Date(`${datos.fechaNacimiento.trim()}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) {
      throw new ErrorValidacionPerfilServer("La fecha de nacimiento no es válida.", "fechaNacimiento");
    }
    const hoy = new Date();
    if (fecha > hoy) {
      throw new ErrorValidacionPerfilServer("La fecha de nacimiento no puede ser futura.", "fechaNacimiento");
    }
    const edad =
      hoy.getFullYear() -
      fecha.getFullYear() -
      (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate()) ? 1 : 0);
    if (fecha < new Date("1900-01-01T00:00:00") || edad > 125) {
      throw new ErrorValidacionPerfilServer("La fecha de nacimiento no es válida (debe ser posterior a 1900).", "fechaNacimiento");
    }
    if (edad < 18) {
      throw new ErrorValidacionPerfilServer("Debes ser mayor de 18 años para utilizar Ruum Ruum.", "fechaNacimiento");
    }
  }
}

/**
 * Invoca la RPC transaccional que consolida perfil general y fecha de nacimiento
 * bajo control de versión optimista (CB-1 / CA-1, CA-2).
 */
export async function actualizarPerfilTransaccionalRpc(
  cliente: Cliente,
  datos: DatosActualizarPerfilTransaccional,
  versionEsperada?: number | null
): Promise<{ ok: boolean; version: number; usuario: UsuarioRow }> {
  validarLimitesDatosPersonalesServer(datos);

  const payload: Record<string, unknown> = {
    nombre: datos.nombre.trim(),
    telefono: datos.telefono?.trim() || null,
    pais: datos.pais?.trim() || "México",
    estado: datos.estado?.trim() || null,
    ciudad: datos.ciudad?.trim() || null,
    codigo_postal: datos.codigoPostal?.trim() || null,
    colonia: datos.colonia?.trim() || null,
    calle: datos.calle?.trim() || null,
    numero: datos.numero?.trim() || null,
    referencias: datos.referencias?.trim() || null,
    direccion_principal: datos.direccionPrincipal?.trim() || null,
    fecha_nacimiento: datos.fechaNacimiento?.trim() || null,
    foto_url: datos.fotoUrl?.trim() || null,
  };

  const { data, error } = await rpcTipado(cliente, "usuario_actualiza_perfil_transaccional", {
    p_datos: payload as unknown as Json,
    p_version_esperada: versionEsperada ?? null,
  });

  if (error) {
    const errObj = error as { message?: string; details?: string; code?: string };
    const mensaje = (errObj.message || errObj.details || String(error)).toLowerCase();

    if (mensaje.includes("conflicto_version") || errObj.code === "40001") {
      throw new ErrorConflictoVersionPerfil(
        "El perfil fue actualizado en otra sesión o pestaña. Recarga la información para evitar sobrescribir cambios.",
        undefined,
        versionEsperada ?? undefined
      );
    }

    if (mensaje.includes("usuario_menor_de_edad")) {
      throw new ErrorValidacionPerfilServer("Debes ser mayor de 18 años para utilizar la plataforma.", "fechaNacimiento");
    }

    if (mensaje.includes("fecha_nacimiento_futura")) {
      throw new ErrorValidacionPerfilServer("La fecha de nacimiento no puede ser futura.", "fechaNacimiento");
    }

    if (mensaje.includes("fecha_nacimiento_imposible")) {
      throw new ErrorValidacionPerfilServer("La fecha de nacimiento no es válida (debe ser posterior a 1900).", "fechaNacimiento");
    }

    throw new Error(errObj.message || "Error al actualizar los datos personales.");
  }

  const res = data as unknown as { ok: boolean; version: number; usuario: UsuarioRow };
  if (!res || !res.usuario) {
    throw new Error("Respuesta inválida del servidor al actualizar perfil.");
  }

  return res;
}

/**
 * Saga de actualización de datos personales con soporte de fotografía:
 * 1. Sube la foto primero con magic bytes a ruta versionada aislada por uid.
 * 2. Ejecuta la RPC transaccional con versión.
 * 3. Si la RPC falla: compensación inmediata (elimina la foto recién subida).
 * 4. Si la RPC triunfa: limpieza asíncrona de la foto anterior (si hubo cambio).
 * 5. Retorna la respuesta actualizada con URL firmada (TTL 15 min) sin refresh completo.
 *
 * (CB-2 / CB-3 / CA-1 a CA-7)
 */
export async function ejecutarSagaActualizacionPerfil(
  cliente: Cliente,
  params: ParametrosSagaPerfil
): Promise<ResultadoPerfilActualizado> {
  const { data: sesion } = await cliente.auth.getUser();
  if (!sesion.user) throw new Error("Sin sesión activa.");
  const authUserId = sesion.user.id;

  let nuevaFotoPath: string | null = null;
  let fotoUrlFirmada: string | null = null;
  let limpiezaFotoPreviaPendiente = false;

  // Paso 1: Subida de nueva foto si se proporcionó un archivo (Saga / Paso 1)
  if (params.archivoNuevaFoto) {
    const validado = await validarFotoPerfilUsuario(params.archivoNuevaFoto);
    // Ruta versionada única para evitar colisiones y permitir rollback limpio
    nuevaFotoPath = `${authUserId}/perfil_${Date.now()}.${validado.extension}`;

    const { error: errUpload } = await cliente.storage
      .from("fotos-perfil")
      .upload(nuevaFotoPath, params.archivoNuevaFoto, {
        upsert: false,
        cacheControl: "0",
        contentType: validado.mime,
      });

    if (errUpload) {
      throw new Error(`No pudimos subir la fotografía: ${errUpload.message}`);
    }
  }

  const datosAEnviar: DatosActualizarPerfilTransaccional = {
    ...params.datos,
    fotoUrl: nuevaFotoPath ?? params.datos.fotoUrl ?? null,
  };

  // Paso 2: Ejecución transaccional en base de datos con versión (Saga / Paso 2)
  let resultadoRpc: { ok: boolean; version: number; usuario: UsuarioRow };
  try {
    resultadoRpc = await actualizarPerfilTransaccionalRpc(cliente, datosAEnviar, params.versionEsperada);
  } catch (errRpc) {
    // Paso 3: Compensación Inmediata (Saga / Compensación ante fallo en DB)
    if (nuevaFotoPath) {
      try {
        const { error: errRemove } = await cliente.storage.from("fotos-perfil").remove([nuevaFotoPath]);
        if (errRemove) throw errRemove;
      } catch (errCompensar) {
        console.warn("[cuenta/saga] fallo_compensacion_inmediata_foto", {
          path: nuevaFotoPath,
          error: errCompensar instanceof Error ? errCompensar.message : String(errCompensar),
        });
        // Reconciliación durable outbox: se encola el huérfano para el worker/cron (CB-2)
        try {
          await (cliente as any).rpc("encolar_limpieza_foto_perfil", {
            p_usuario_id: authUserId,
            p_storage_path: nuevaFotoPath,
            p_motivo: "compensacion_fallida_huerfano",
          });
        } catch (errCola) {
          console.warn("[cuenta/saga] fallo_encolar_huerfano_storage", errCola);
        }
      }
    }
    throw errRpc;
  }

  // Paso 4: Limpieza Asíncrona de la foto anterior si se reemplazó (Saga / Limpieza)
  if (nuevaFotoPath && params.fotoUrlPrevia && params.fotoUrlPrevia !== nuevaFotoPath) {
    const pathAnterior = params.fotoUrlPrevia;
    cliente.storage
      .from("fotos-perfil")
      .remove([pathAnterior])
      .then(({ error: errRemove }) => {
        if (errRemove) {
          console.warn("[cuenta/foto] fallo_limpieza_foto_previa", {
            pathAnterior,
            error: errRemove.message,
          });
          // Si el borrado directo falla, se transfiere a la cola durable
          void (cliente as any).rpc("encolar_limpieza_foto_perfil", {
            p_usuario_id: resultadoRpc.usuario.id,
            p_storage_path: pathAnterior,
            p_motivo: "reemplazo_foto_previa",
          }).catch(() => {});
        }
      })
      .catch((errLimpieza) => {
        limpiezaFotoPreviaPendiente = true;
        console.warn("[cuenta/foto] excepcion_limpieza_foto_previa", {
          pathAnterior,
          error: errLimpieza instanceof Error ? errLimpieza.message : String(errLimpieza),
        });
        // Si el borrado directo falla con excepción, se transfiere a la cola durable
        void (cliente as any).rpc("encolar_limpieza_foto_perfil", {
          p_usuario_id: resultadoRpc.usuario.id,
          p_storage_path: pathAnterior,
          p_motivo: "reemplazo_foto_previa",
        }).catch(() => {});
      });
  }

  // Paso 5: Generación de URL firmada con TTL de 900 s (15 minutos) (CB-3 / CA-7)
  const rutaFinalFoto = resultadoRpc.usuario.foto_url;
  if (rutaFinalFoto) {
    try {
      fotoUrlFirmada = await obtenerUrlFotoPerfilUsuario(cliente, rutaFinalFoto);
    } catch (errFirma) {
      console.warn("[cuenta/foto] no_se_pudo_firmar_url_nueva", errFirma);
    }
  }

  return {
    ok: true,
    version: resultadoRpc.version,
    usuario: resultadoRpc.usuario,
    fotoUrlFirmada,
    limpiezaFotoPreviaPendiente,
  };
}
