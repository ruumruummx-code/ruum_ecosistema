/**
 * Flujo operativo completo contra un Supabase REAL (sin mocks).
 *
 * Las suites E2E de las apps usan un Supabase falso (mock-supabase.mjs), así
 * que nunca ejercitan GRANTs, RLS, triggers ni RPCs reales: por eso "todo
 * pasaba" mientras los flujos se rompían tras cada migración de endurecimiento.
 * Esta suite recorre el ciclo de vida de un traslado con JWT reales de cada rol
 * (usuario, Torre de Control, conductor) y las mismas funciones de @ruum/api que
 * usan las apps.
 *
 *   pnpm db:start            # Supabase local con todas las migraciones
 *   pnpm test:flujo-real
 *
 * Variables opcionales: FLUJO_SUPABASE_URL, FLUJO_ANON_KEY, FLUJO_SERVICE_ROLE_KEY
 * (por defecto, las del stack local de `supabase start`).
 */
import { createHash, randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { confirmarEvidenciaCompleta } from "../../src/services/evidencia";
import { guardarFotoEvidenciaSincronizada } from "../../src/custody/evidencia";
import { guardarAcuseRecepcion } from "../../src/custody/recepcion";
import { guardarInspeccionTraslado } from "../../src/drivers/inspecciones";
import { desactivarDispositivoPush, registrarDispositivoPush } from "../../src/drivers/push";
import { subirCapturaRepuve } from "../../src/services/repuve";
import { confirmarLlegadaDestino, crearCalificacion } from "../../src/services/traslados";
import { crearIncidenciaSistemaDanoNoReportado } from "../../src/services/incidencias";
import { crearTicketSoporte, resolverTicketSoporte } from "../../src/services/tickets-soporte";
import { cambiarEstatusAdmin, asignarConductorAdmin } from "../../src/transfers/operativa";

type Cliente = SupabaseClient;
interface Actor { c: Cliente; authId: string }

function credenciales() {
  if (process.env.FLUJO_SUPABASE_URL && process.env.FLUJO_ANON_KEY && process.env.FLUJO_SERVICE_ROLE_KEY) {
    return { url: process.env.FLUJO_SUPABASE_URL, anon: process.env.FLUJO_ANON_KEY, servicio: process.env.FLUJO_SERVICE_ROLE_KEY };
  }
  const salida = execSync("npx supabase status -o env", { cwd: `${__dirname}/../../../..`, stdio: ["ignore", "pipe", "pipe"] }).toString();
  const v = (k: string) => new RegExp(`^${k}="?([^"\\n]+)"?$`, "m").exec(salida)?.[1] ?? "";
  return { url: v("API_URL"), anon: v("ANON_KEY"), servicio: v("SERVICE_ROLE_KEY") };
}

const { url, anon, servicio } = credenciales();
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(url) && process.env.FLUJO_PERMITIR_REMOTO !== "1") {
  throw new Error(`Esta suite crea datos de prueba; sólo corre contra Supabase local (recibido ${url}).`);
}
const admin = createClient(url, servicio, { auth: { persistSession: false } });
const corrida = Date.now().toString(36);
const sinError = <T>({ data, error }: { data: T; error: unknown }) => { if (error) throw error; return data; };

async function actor(etiqueta: string, meta: Record<string, unknown> = {}): Promise<Actor> {
  const email = `${etiqueta}+${corrida}@flujo-real.test`;
  const password = `Flujo-${corrida}-Prueba-2026!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (error) throw error;
  const c = createClient(url, anon, { auth: { persistSession: false } });
  sinError(await c.auth.signInWithPassword({ email, password }));
  return { c, authId: data.user.id };
}

const estado = async (id: string) => sinError(await admin.from("traslados").select("estado").eq("id", id).single()).estado as string;

describe("Flujo real: usuario → pago → Torre → conductor → cierre", () => {
  let U: Actor, A: Actor, C: Actor;
  let trasladoId = "";
  let conductorId = "";
  const vehiculo = {
    tipo: "sedan", transmision: "automatica", marca: "Nissan", modelo: "Versa", anio: 2022, color: "Gris",
    placas: `F${corrida.slice(-6).toUpperCase()}`, vin: `3N1CN8AP5NL${corrida.slice(-6).toUpperCase().padStart(6, "0")}`,
    tiene_tarjeta_circulacion: true, tiene_verificacion: true, tiene_placas: true, puede_circular_rodando: true
  };
  const traslado = {
    contacto_entrega_nombre: "Ana Pérez", contacto_entrega_telefono: "5512345678",
    contacto_recepcion_nombre: "Luis Gómez", contacto_recepcion_telefono: "5587654321",
    origen_lat: 19.4326, origen_lng: -99.1332, origen_direccion: "Av. Reforma 100, CDMX", origen_ciudad: "Ciudad de México",
    destino_lat: 19.391, destino_lng: -99.2837, destino_direccion: "Av. Toluca 200, CDMX", destino_ciudad: "Ciudad de México",
    modalidad_programacion: "lo_antes_posible", fecha_hora_programada: null, distancia_km: 18.5, tiempo_estimado_horas: 0.8
  };

  beforeAll(async () => {
    U = await actor("cliente", { tipo_registro: "usuario", nombre: "Cliente Flujo", tipo_cuenta: "personal", telefono: `+5255${String(Date.now()).slice(-8)}` });
    sinError(await admin.from("usuarios").update({ estado_verificacion: "verificado" }).eq("auth_user_id", U.authId));

    A = await actor("torre");
    sinError(await admin.from("admins").insert({ auth_user_id: A.authId, nombre: "Torre Flujo", rol_operativo: "supervisor" }));

    C = await actor("chofer");
    conductorId = sinError(await admin.from("conductores")
      .insert({ auth_user_id: C.authId, nombre: "Chofer Flujo", estado: "activo", documentos_vigentes: true })
      .select("id").single()).id;
    for (const paso of ["listo_para_enviar", "en_revision", "aprobado"]) {
      sinError(await admin.rpc("cambiar_estado_expediente_conductor", { p_conductor_id: conductorId, p_destino: paso }));
    }
  });

  it("usuario cotiza, crea el traslado y acepta la cotización", async () => {
    const snapshot = sinError(await admin.rpc("servidor_cotizar_traslado_individual", {
      p_auth_user_id: U.authId, p_vehiculo_id: null, p_vehiculo: vehiculo, p_traslado: traslado, p_paradas: []
    }));
    const creado = sinError(await U.c.rpc("usuario_crea_traslado", {
      p_vehiculo_id: null, p_vehiculo: vehiculo, p_traslado: { ...traslado, snapshot_tarifa: snapshot },
      p_clave_idempotencia: randomUUID(), p_paradas: []
    })) as { id: string };
    trasladoId = creado.id;
    expect(await estado(trasladoId)).toBe("cotizacion_generada");
    expect(sinError(await U.c.rpc("usuario_acepta_cotizacion", { p_traslado_id: trasladoId }))).toBe("cotizacion_aceptada");
  });

  it("usuario abre un ticket de soporte y Torre lo resuelve", async () => {
    const { id } = await crearTicketSoporte(U.c as never, {
      id: randomUUID(), trasladoId, motivo: "Duda de pago", descripcion: "Quiero confirmar que mi pago se refleje."
    });
    await resolverTicketSoporte(A.c as never, id);
  });

  it("Stripe confirma el pago (webhook con service_role)", async () => {
    const monto = sinError(await admin.from("traslados").select("precio_cotizado").eq("id", trasladoId).single()).precio_cotizado as number;
    const intent = `pi_flujo_${corrida}`;
    sinError(await admin.from("pagos").insert({ traslado_id: trasladoId, monto, momento: "anticipado", metodo: "tarjeta", estado: "pendiente", stripe_payment_intent_id: intent }));
    sinError(await admin.rpc("aplicar_verificacion_pago_stripe", { p_datos: {
      id: `evt_${intent}`, origen: "webhook", intent_id: intent, traslado_id: trasladoId, moneda: "mxn",
      monto_centavos: Math.round(monto * 100), monto_recibido: Math.round(monto * 100),
      livemode: false, modo_esperado: false, estado_proveedor: "succeeded"
    } }));
    expect(await estado(trasladoId)).toBe("servicio_confirmado");
  });

  it("Torre (supervisor, sin pagos:leer) publica el traslado a conductores", async () => {
    await cambiarEstatusAdmin(A.c as never, trasladoId, "servicio_confirmado", "pendiente_de_conductor");
    expect(await estado(trasladoId)).toBe("pendiente_de_conductor");
  });

  it("conductor ve la oportunidad, la solicita y Torre lo asigna", async () => {
    const disponibles = sinError(await C.c.from("pasaporte_digital").select("traslado_id").eq("estado", "pendiente_de_conductor")) as { traslado_id: string }[];
    expect(disponibles.map((d) => d.traslado_id)).toContain(trasladoId);
    sinError(await C.c.rpc("conductor_solicita_asignacion", { p_traslado_id: trasladoId, p_lat: 19.43, p_lng: -99.13 }));
    await asignarConductorAdmin(A.c as never, trasladoId, conductorId, "pendiente_de_conductor");
    expect(await estado(trasladoId)).toBe("conductor_asignado");
  });

  async function avanzar(evento: string, esperado: string) {
    sinError(await C.c.rpc("conductor_avanza_traslado", { p_traslado_id: trasladoId, p_evento: evento }));
    expect(await estado(trasladoId)).toBe(esperado);
  }

  async function capturar(tipo: "inicial" | "final", angulos: string[]) {
    for (const angulo of angulos) {
      const bytes = Buffer.from(`${trasladoId}-${tipo}-${angulo}`);
      const id = randomUUID();
      const ruta = `${C.authId}/${trasladoId}/${tipo}/${id}.jpg`;
      sinError(await C.c.storage.from("evidencia").upload(ruta, bytes, { contentType: "image/jpeg" }));
      const r = await guardarFotoEvidenciaSincronizada(C.c as never, {
        id, traslado_id: trasladoId, tipo, angulo: angulo as never, url: ruta, capturada_en: new Date().toISOString(),
        lat: 19.43, lng: -99.13, sha256: createHash("sha256").update(bytes).digest("hex")
      });
      expect(r.estado).toBe("registrada");
    }
    await guardarInspeccionTraslado(C.c as never, {
      traslado_id: trasladoId, tipo, combustible: "3/4", kilometraje: 45210, llaves_recibidas: "2",
      holograma_verificacion: true, talon_verificacion: "si", tarjeta_circulacion: "si",
      placa_delantera: "si", placa_trasera: "si", notas: null
    } as never);
  }

  const ANGULOS = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"];

  it("conductor recoge: camino, llegada, REPUVE, evidencia inicial, recepción", async () => {
    await avanzar("conductor_en_camino", "conductor_en_camino_al_origen");
    await avanzar("llegada_origen", "conductor_en_punto_de_recoleccion");
    await avanzar("iniciar_verificacion", "verificacion_vehiculo_en_proceso");
    const captura = await subirCapturaRepuve(C.c as never, trasladoId, "data:image/png;base64,iVBORw0KGgo=");
    sinError(await C.c.rpc("conductor_registra_verificacion_repuve", {
      p_traslado_id: trasladoId, p_vin_fisico: vehiculo.vin, p_placas_fisicas: vehiculo.placas, p_resultado: "limpio", p_captura_path: captura
    }));
    await avanzar("iniciar_evidencia_inicial", "evidencia_inicial_en_proceso");
    await capturar("inicial", ANGULOS);
    expect(await confirmarEvidenciaCompleta(C.c as never, trasladoId, "evidencia_inicial_en_proceso", "inicial")).toBe("evidencia_inicial_completada");
    await avanzar("vehiculo_recibido", "vehiculo_recibido");
    await avanzar("iniciar_traslado", "traslado_en_curso");
  });

  it("usuario sigue su traslado en curso", async () => {
    const fila = sinError(await U.c.from("pasaporte_digital").select("estado,conductor_nombre").eq("traslado_id", trasladoId).single()) as { estado: string; conductor_nombre: string };
    expect(fila).toMatchObject({ estado: "traslado_en_curso", conductor_nombre: "Chofer Flujo" });
  });

  it("conductor llega a destino y completa la evidencia final", async () => {
    await confirmarLlegadaDestino(C.c as never, trasladoId, { fueraGeocerca: false, distanciaM: 20, precisionM: 10, antiguedadS: 5 });
    expect(await estado(trasladoId)).toBe("llegada_a_destino");
    await avanzar("iniciar_evidencia_final", "evidencia_final_en_proceso");
    await capturar("final", ANGULOS);
    expect(await confirmarEvidenciaCompleta(C.c as never, trasladoId, "evidencia_final_en_proceso", "final")).toBe("evidencia_final_completada");
  });

  it("conductor confirma entrega, guarda acuse y cierra el servicio", async () => {
    await avanzar("confirmar_entrega", "entrega_confirmada");
    await guardarAcuseRecepcion(C.c as never, { trasladoId, receptorNombre: "Luis Gómez", firmaDataUrl: "data:image/png;base64,iVBORw0KGgo=" } as never);
    await avanzar("cerrar_viaje", "servicio_cerrado");
  });

  it("el cierre actualiza el historial del usuario (trigger interno)", async () => {
    const fila = sinError(await admin.from("usuarios").select("traslados_completados_sin_incidencia").eq("auth_user_id", U.authId).single());
    expect(fila.traslados_completados_sin_incidencia).toBe(1);
  });

  it("incidencia automática por daño no reportado con la sesión del conductor", async () => {
    await crearIncidenciaSistemaDanoNoReportado(C.c as never, trasladoId, "Daño visible en el registro final que no aparece en el inicial.");
    const incidencias = sinError(await admin.from("incidencias").select("id").eq("traslado_id", trasladoId).eq("tipo", "dano_no_reportado"));
    expect(incidencias).toHaveLength(1);
    const fila = sinError(await admin.from("usuarios").select("traslados_completados_sin_incidencia").eq("auth_user_id", U.authId).single());
    expect(fila.traslados_completados_sin_incidencia).toBe(0);
  });

  it("usuario califica el servicio cerrado", async () => {
    await crearCalificacion(U.c as never, trasladoId, conductorId, 5, "Excelente servicio");
  });

  it("el contador derivado sigue protegido contra escrituras directas", async () => {
    await U.c.from("usuarios").update({ traslados_completados_sin_incidencia: 99 }).eq("auth_user_id", U.authId);
    const fila = sinError(await admin.from("usuarios").select("traslados_completados_sin_incidencia").eq("auth_user_id", U.authId).single());
    expect(fila.traslados_completados_sin_incidencia).not.toBe(99);
  });

  it("conductor cierra sesión y se desactiva su dispositivo push", async () => {
    const deviceId = `dev-${corrida}`;
    await registrarDispositivoPush(C.c as never, { deviceId, tokenPush: `tok-${corrida}`, plataforma: "android" });
    await desactivarDispositivoPush(C.c as never, deviceId);
    const fila = sinError(await admin.from("dispositivos_push").select("activo").eq("device_id", deviceId).single());
    expect(fila.activo).toBe(false);
  });
});
