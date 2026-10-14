"use client";
import { useRef, useState } from "react";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { subirDocumentoCuentaUsuario, subirDocumentoIdentidad, type DocumentoCuenta, type TipoDocumentoCuenta } from "@ruum/api/services";

export function DocumentoCuentaTarjeta({ tipo, titulo, descripcion, documento, cargando = false, errorConsulta = false, actualizado }: {
  tipo: TipoDocumentoCuenta | "ine"; titulo: string; descripcion: string;
  documento?: Omit<DocumentoCuenta, "tipo">; cargando?: boolean; errorConsulta?: boolean;
  actualizado: (documento: Omit<DocumentoCuenta, "tipo">) => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const estado = cargando ? "Consultando…" : errorConsulta ? "Estado no disponible" : !documento ? "Sin cargar" : documento.estado === "verificado" ? "Verificado" : documento.estado === "rechazado" ? "Requiere actualización" : "En revisión";
  const estadoClases = cargando || errorConsulta
    ? "bg-[#f0f5fe] text-[#4e5f80] dark:bg-[#152a42] dark:text-[#a8b5cc]"
    : !documento
      ? "bg-[#f0f5fe] text-[#4e5f80] dark:bg-[#152a42] dark:text-[#a8b5cc]"
      : documento.estado === "verificado"
        ? "bg-[#e9f3ee] text-[#1f6b4a] dark:bg-[#0e3a24] dark:text-[#52d294]"
        : documento.estado === "rechazado"
          ? "bg-[#fdeaea] text-[#9a2637] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]"
          : "bg-[#edf4fe] text-[#2e5a88] dark:bg-[#0f2d52] dark:text-[#6ba8ff]";

  async function guardar() {
    if (!archivo || bloqueo.current) return;
    bloqueo.current = true; setGuardando(true); setError(null); setExito(false);
    try {
      const cliente = crearClienteNavegador();
      if (tipo === "ine") {
        const resultado = await subirDocumentoIdentidad(cliente, archivo);
        actualizado({ ruta: resultado.ruta, estado: resultado.estado, subido_en: resultado.subidoEn });
      } else {
        actualizado(await subirDocumentoCuentaUsuario(cliente, tipo, archivo));
      }
      setArchivo(null); if (input.current) input.current.value = ""; setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu documento.");
    } finally { bloqueo.current = false; setGuardando(false); }
  }
  return <article className="rounded-[20px] border border-[#e6edf6] bg-white p-5 shadow-[0_2px_10px_rgba(10,35,66,0.04)] dark:border-[#1a3a5c] dark:bg-[#0a2342]" aria-labelledby={`titulo-${tipo}`}>
    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
      <h3 id={`titulo-${tipo}`} className="text-[15px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">{titulo}</h3>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClases}`}>{estado}</span>
    </div>
    <p className="mb-3 text-xs leading-relaxed text-[#6b7c94] dark:text-[#a8b5cc]">{descripcion}</p>
    {documento?.subido_en && <p className="mb-3 text-xs text-[#6b7c94] dark:text-[#a8b5cc]">Última carga: {new Date(documento.subido_en).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</p>}
    <label htmlFor={`archivo-${tipo}`} className="mb-2 block text-xs font-semibold text-[#0a2342] dark:text-[#f6f8fb]">{documento ? "Seleccionar archivo actualizado" : "Seleccionar archivo"} · {titulo}</label>
    <input ref={input} id={`archivo-${tipo}`} type="file" accept="image/jpeg,image/png,application/pdf" disabled={guardando || cargando || errorConsulta} className="block w-full text-xs text-[#4e5f80] dark:text-[#a8b5cc] file:mr-3 file:rounded-xl file:border-0 file:bg-[#edf4fe] file:px-3 file:py-2.5 file:font-semibold file:text-[#2e5a88] dark:file:bg-[#0f2d52] dark:file:text-[#6ba8ff]" onChange={event => {
      setError(null); setExito(false);
      const seleccionado = event.target.files?.[0] ?? null;
      if (seleccionado && (seleccionado.size > 10 * 1024 * 1024 || seleccionado.size === 0 || !["image/jpeg", "image/png", "application/pdf"].includes(seleccionado.type))) {
        setError("Selecciona un PDF, JPG o PNG de hasta 10 MB."); setArchivo(null); event.target.value = ""; return;
      }
      setArchivo(seleccionado);
    }} />
    {archivo && <button type="button" disabled={guardando} onClick={() => void guardar()} className="mt-3 w-full rounded-xl bg-[#0b1e33] p-3 text-sm font-bold text-[#fff] transition-colors hover:bg-[#143560] disabled:opacity-50 dark:bg-[#1d4576] dark:hover:bg-[#255894]">{guardando ? "Guardando…" : documento ? `Actualizar ${titulo}` : `Guardar ${titulo}`}</button>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
    {exito && <p role="status" className="mt-3 text-sm text-green-700 dark:text-emerald-400">Documento guardado. En revisión.</p>}
  </article>;
}
