"use client";

import { Capacitor } from "@capacitor/core";
import {
  desactivarDispositivoPush,
  registrarAperturaPush,
  registrarDispositivoPush
} from "@ruum/api/drivers";
import { crearClienteNavegador } from "./supabase-browser";
import { guardarJsonLocalSeguro, leerJsonLocalSeguro, eliminarJsonLocalSeguro } from "./almacenamiento-seguro-local";
import { recordOperationalEvent } from "./observability";

// Tipos de Capacitor PushNotifications
type Token = { value: string };
type PushNotificationSchema = {
  data?: Record<string, string>;
};
type ActionPerformed = {
  notification: PushNotificationSchema;
};

const DEVICE_KEY = "ruum_push_device_id";
export const PUSH_APERTURAS_PENDIENTES_KEY = "ruum_push_aperturas_pendientes";

export interface AperturaPushPendiente {
  notificacionId: string;
  deviceId: string;
  intentos: number;
  creadoEn: string;
}

export async function encolarAperturaPush(notificacionId: string, deviceId: string): Promise<void> {
  const cola = (await leerJsonLocalSeguro<AperturaPushPendiente[]>(PUSH_APERTURAS_PENDIENTES_KEY)) || [];
  cola.push({
    notificacionId,
    deviceId,
    intentos: 0,
    creadoEn: new Date().toISOString(),
  });
  await guardarJsonLocalSeguro(PUSH_APERTURAS_PENDIENTES_KEY, cola);
}

export async function sincronizarAperturasPushPendientes(): Promise<number> {
  const cola = await leerJsonLocalSeguro<AperturaPushPendiente[]>(PUSH_APERTURAS_PENDIENTES_KEY);
  if (!cola || cola.length === 0) return 0;

  let cliente: ReturnType<typeof crearClienteNavegador>;
  try {
    cliente = crearClienteNavegador();
  } catch {
    return 0;
  }

  const pendientesRestantes: AperturaPushPendiente[] = [];
  let sincronizados = 0;

  for (const item of cola) {
    try {
      await registrarAperturaPush(cliente, {
        notificacionId: item.notificacionId,
        deviceId: item.deviceId,
      });
      sincronizados++;
    } catch {
      if (item.intentos < 5) {
        pendientesRestantes.push({ ...item, intentos: item.intentos + 1 });
      }
    }
  }

  if (pendientesRestantes.length > 0) {
    await guardarJsonLocalSeguro(PUSH_APERTURAS_PENDIENTES_KEY, pendientesRestantes);
  } else {
    await eliminarJsonLocalSeguro(PUSH_APERTURAS_PENDIENTES_KEY);
  }

  return sincronizados;
}

export async function registrarAperturaPushSegura(notificacionId: string): Promise<void> {
  const deviceId = await uuidLocal();
  try {
    const cliente = crearClienteNavegador();
    await registrarAperturaPush(cliente, { notificacionId, deviceId });
  } catch (err) {
    console.warn("[push] Falló registro de apertura push; encolando para reintento durable:", err);
    await encolarAperturaPush(notificacionId, deviceId);
  }
}

async function uuidLocal(): Promise<string> {
  const existente = await leerJsonLocalSeguro<string>(DEVICE_KEY);
  if (existente) return existente;
  const nuevo = crypto.randomUUID();
  void guardarJsonLocalSeguro(DEVICE_KEY, nuevo);
  return nuevo;
}

export async function obtenerDeviceIdPush(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return await leerJsonLocalSeguro<string>(DEVICE_KEY) ?? null;
}

async function registrarToken(token: Token) {
  const cliente = crearClienteNavegador();
  
  // En entorno no-nativo, no hacer nada
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    const { Device } = await import("@capacitor/device");
    const [{ data: sesion }, info] = await Promise.all([cliente.auth.getSession(), Device.getInfo()]);
    if (!sesion.session) return;
    await registrarDispositivoPush(cliente, {
      deviceId: await uuidLocal(),
      tokenPush: token.value,
      plataforma: "android",
      modelo: info.model ?? null,
      versionApp: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
      versionSo: info.osVersion ?? null
    });
  } catch (error) {
    void recordOperationalEvent("push_not_registered", { errorCode: error instanceof Error ? error.message : String(error) }, "error");
  }
}

function destinoDesdePush(notification: PushNotificationSchema | ActionPerformed["notification"]): string {
  const destino = notification.data?.destino;
  return typeof destino === "string" && destino.startsWith("/") ? destino : "/notificaciones";
}

export async function inicializarPush(onNavigate: (destino: string) => void) {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  
  const clienteSesion = crearClienteNavegador();

  async function asegurarRegistro() {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { data } = await clienteSesion.auth.getSession();
      if (!data.session) return;
      const estado = await PushNotifications.checkPermissions();
      const permiso = estado.receive === "prompt" ? await PushNotifications.requestPermissions() : estado;
      if (permiso.receive === "granted") {
        await PushNotifications.register();
        void sincronizarAperturasPushPendientes();
      }
    } catch (error) {
      void recordOperationalEvent("push_not_registered", { errorCode: error instanceof Error ? error.message : String(error) }, "error");
    }
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await Promise.all([
      PushNotifications.createChannel({ id: "ruum_operativa", name: "Operación urgente", importance: 5, visibility: 1, vibration: true }),
      PushNotifications.createChannel({ id: "ruum_general", name: "Avisos generales", importance: 3, visibility: 1 })
    ]);

    const handles = await Promise.all([
      PushNotifications.addListener("registration", registrarToken),
      PushNotifications.addListener("registrationError", (error: unknown) => {
        console.error("FCM registration", error);
        void recordOperationalEvent("push_not_registered", { errorCode: error instanceof Error ? error.message : String(error) }, "error");
      }),
      PushNotifications.addListener("pushNotificationReceived", () => window.dispatchEvent(new Event("ruum:notificaciones-actualizar"))),
      PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }: { notification: PushNotificationSchema }) => {
        // H13: Desacoplar navegación inmediata para que un fallo en la RPC de apertura no impida abrir el destino
        const destino = destinoDesdePush(notification);
        try {
          onNavigate(destino);
        } catch (navErr) {
          console.error("[push] Error al navegar a destino desde push:", navErr);
        }

        const notificacionId = notification.data?.notificacion_id;
        if (typeof notificacionId === "string") {
          void registrarAperturaPushSegura(notificacionId);
        }
      })
    ]);
    const { data: authListener } = clienteSesion.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void asegurarRegistro();
    });
    await asegurarRegistro();
    return () => {
      authListener.subscription.unsubscribe();
      handles.forEach((handle) => void handle.remove());
    };
  } catch (error) {
    void recordOperationalEvent("push_not_registered", { errorCode: error instanceof Error ? error.message : String(error) }, "error");
    // Si los módulos no están disponibles, devolver una función vacía
    return () => undefined;
  }
}

export async function desactivarPushDelDispositivo() {
  if (!Capacitor.isNativePlatform()) return;
  
  const deviceId = await obtenerDeviceIdPush();
  if (!deviceId) return;
  const cliente = crearClienteNavegador();
  await desactivarDispositivoPush(cliente, deviceId);
  
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    void recordOperationalEvent("push_not_registered", { errorCode: error instanceof Error ? error.message : String(error) }, "error");
    // Ignorar errores si el módulo no está disponible
  }
}
