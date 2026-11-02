"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { obtenerHeadersCsrfAsync } from "../../../lib/csrf";
import { HojaTareaCuenta } from "../HojaTareaCuenta";
type Tarjeta = { id: string; marca: string; ultimos4: string; mes: number; anio: number; predeterminada: boolean };
const boton = "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50";
export function MetodosPago() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [eliminar, setEliminar] = useState<Tarjeta | null>(null);
  const consultar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true); setError(null);
    try {
      const respuesta = await fetch("/api/cuenta/metodos-pago", { cache: "no-store", signal });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No pudimos consultar tus tarjetas.");
      setTarjetas(datos.tarjetas);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "No pudimos consultar tus tarjetas.");
    } finally { if (!signal?.aborted) setCargando(false); }
  }, []);
  useEffect(() => {
    const controlador = new AbortController();
    void consultar(controlador.signal);
    return () => controlador.abort();
  }, [consultar]);
  async function operar(accion: "agregar" | "eliminar" | "predeterminar", id?: string) {
    if (bloqueo.current) return;
    bloqueo.current = true; setOcupado(true); setError(null); setAviso("");
    try {
      const respuesta = await fetch("/api/cuenta/metodos-pago", {
        method: "POST", headers: await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" }),
        body: JSON.stringify(accion === "agregar" ? { accion, clave: crypto.randomUUID() } : { accion, id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No pudimos guardar el cambio.");
      if (accion === "agregar") {
        const destino = new URL(datos.url);
        if (destino.protocol !== "https:" || destino.hostname !== "checkout.stripe.com") throw new Error("No pudimos abrir el registro seguro.");
        window.location.assign(destino.href); return;
      }
      setEliminar(null);
      setAviso(accion === "eliminar" ? "Tarjeta eliminada." : "Tarjeta predeterminada actualizada.");
      await consultar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar la operación.");
    } finally { bloqueo.current = false; setOcupado(false); }
  }
  return <section className="user-v2-scope mx-auto w-full max-w-2xl space-y-5 p-5" aria-busy={ocupado || cargando}>
    <Link href="/cuenta?seccion=perfil" className="text-sm underline">Volver a mi cuenta</Link>
    <h1 className="text-2xl font-bold">Métodos de pago</h1>
    <p>Administra tus tarjetas antes de solicitar un traslado. La predeterminada se mostrará primero al pagar.</p>
    <p className="text-sm">Al agregar una tarjeta autorizas guardarla en Stripe para próximos pagos. No se cobrará ningún traslado en este paso.</p>
    {error && !eliminar && <div role="alert" className="space-y-2 text-red-600"><p>{error}</p><button className={boton} disabled={ocupado || cargando} onClick={() => void consultar()}>Actualizar lista</button></div>}
    <p role="status" aria-live="polite">{aviso}</p>
    {cargando ? <p>Cargando tarjetas…</p> : !error && tarjetas.length === 0 ? <p>No tienes tarjetas guardadas.</p> : !error && <ul className="space-y-3">
      {tarjetas.map(t => <li key={t.id} className="space-y-3 rounded-2xl border border-slate-300 p-4">
        <h2 className="font-bold">{t.marca.toUpperCase()} •••• {t.ultimos4}</h2><p>Vence {String(t.mes).padStart(2, "0")}/{t.anio}</p>
        {t.predeterminada && <p className="font-semibold">Predeterminada</p>}
        <div className="flex flex-wrap gap-2">
          {!t.predeterminada && <button className={boton} disabled={ocupado} aria-label={`Predeterminar tarjeta terminada en ${t.ultimos4}`} onClick={() => void operar("predeterminar", t.id)}>Usar como predeterminada</button>}
          <button className={boton} disabled={ocupado} aria-label={`Eliminar tarjeta terminada en ${t.ultimos4}`} onClick={() => setEliminar(t)}>Eliminar</button>
        </div>
      </li>)}
    </ul>}
    <button className={`${boton} bg-blue-700 text-white`} disabled={ocupado || cargando || Boolean(error)} onClick={() => void operar("agregar")}>{ocupado ? "Procesando…" : "Agregar tarjeta en Stripe"}</button>
    <p><Link className="text-sm underline" href="/cuenta/facturacion">Configurar datos fiscales y CFDI</Link></p>
    {eliminar && <HojaTareaCuenta titulo="Eliminar tarjeta" ocupada={ocupado} cerrar={() => { if (!bloqueo.current) setEliminar(null); }}>
      {error && <p role="alert">{error}</p>}
      <p>¿Eliminar la tarjeta terminada en {eliminar.ultimos4}? Para volver a utilizarla tendrás que registrarla de nuevo.</p>
      <button className={boton} disabled={ocupado} onClick={() => setEliminar(null)}>Cancelar</button>
      <button className={boton} disabled={ocupado} onClick={() => void operar("eliminar", eliminar.id)}>Confirmar eliminación</button>
    </HojaTareaCuenta>}
  </section>;
}
