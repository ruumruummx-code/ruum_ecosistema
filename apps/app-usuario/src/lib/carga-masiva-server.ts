import "server-only";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validarFila, type FilaValidada } from "./carga-masiva";
import { clasificarVehiculoMasivo } from "@ruum/api/services";

function rutaCatalogoCP(prefijo: string): string {
  const cwd = process.cwd();
  const candidatas = [
    path.join(cwd, "public/data/codigos-postales", `${prefijo}.json`),
    path.join(cwd, "apps/app-usuario/public/data/codigos-postales", `${prefijo}.json`),
    path.join(cwd, "..", "app-usuario/public/data/codigos-postales", `${prefijo}.json`),
  ];
  return candidatas.find(r => existsSync(r)) ?? candidatas[0]!;
}

export function clienteMasivoServicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("El cobro masivo no está configurado en este entorno.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
/** Las rutas comprueban la sesión antes de entrar. El catálogo es de lectura
 * administrativa: un cliente de usuario devolvería cero filas por RLS. */
export async function validarFilasServidor(entradas: Record<string, string>[]): Promise<FilaValidada[]> {
  const catalogoServidor = clienteMasivoServicio();
  const archivos = new Map<string, Promise<Record<string, unknown>>>();
  return Promise.all(entradas.map(async (entrada, indice) => {
    const fila = validarFila(entrada, indice);
    for (const campo of ["origenCodigoPostal", "destinoCodigoPostal"]) {
      const cp = entrada[campo] ?? "";
      if (!/^\d{5}$/.test(cp)) continue;
      const prefijo = cp.slice(0, 2);
      if (!archivos.has(prefijo)) archivos.set(prefijo, readFile(rutaCatalogoCP(prefijo), "utf8").then(JSON.parse).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return {}; throw error; }));
      const catalogo = await archivos.get(prefijo)!;
      if (!catalogo[cp]) fila.errores[campo] = "Código postal fuera del catálogo vigente";
    }
    if (entrada.marca && entrada.modelo) {
      const clasificacion = await clasificarVehiculoMasivo(catalogoServidor, entrada.marca, entrada.modelo);
      if (!clasificacion?.categoria_tarifa || !clasificacion.gama) fila.errores.modelo = "La combinación marca/modelo no está en catálogo";
    }
    fila.estado = Object.keys(fila.errores).length ? "error" : "correcto";
    return fila;
  }));
}

/** Stripe REST evita agregar otro SDK al bundle de la aplicación. */
export async function stripeMasivo(endpoint: string, parametros?: URLSearchParams, idempotencia?: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("El cobro masivo no está configurado en este entorno.");
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: parametros ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(parametros ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotencia ? { "Idempotency-Key": idempotencia } : {}) },
    body: parametros, signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error("No se pudo iniciar o consultar el pago seguro.");
  return data as { id: string; client_secret: string; status: string; amount: number; amount_received: number; currency: string };
}
