"use client";
import { useRef, useState } from "react";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { subirDocumentoCuentaUsuario, subirDocumentoIdentidad, type DocumentoCuenta, type TipoDocumentoCuenta } from "@ruum/api/services";
export function DocumentoCuentaTarjeta({ tipo, titulo, descripcion, documento, cargando = false, errorConsulta = false, actualizado, onOcupada }: {
  tipo: TipoDocumentoCuenta | "ine"; titulo: string; descripcion: string;
  documento?: Omit<DocumentoCuenta, "tipo">; cargando?: boolean; errorConsulta?: boolean;
  actualizado: (documento: Omit<DocumentoCuenta, "tipo">) => void; onOcupada?: (valor: boolean) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function cargar(archivo: File | undefined) {
    if (!archivo || bloqueo.current) return;
    setError(null);
    if (archivo.size > 10 * 1024 * 1024 || archivo.size === 0 || !["image/jpeg", "image/png", "application/pdf"].includes(archivo.type)) {
      setError("Selecciona un PDF, JPG o PNG de hasta 10 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    bloqueo.current = true; setGuardando(true); onOcupada?.(true); setNombreArchivo(archivo.name);
    try {
      const cliente = crearClienteNavegador();
      if (tipo === "ine") {
        const resultado = await subirDocumentoIdentidad(cliente, archivo);
        actualizado({ ruta: resultado.ruta, estado: resultado.estado, subido_en: resultado.subidoEn });
      } else actualizado(await subirDocumentoCuentaUsuario(cliente, tipo, archivo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu documento.");
    } finally { bloqueo.current = false; setGuardando(false); onOcupada?.(false); if (input.current) input.current.value = ""; }
  }
  return <article className="user-document-upload" aria-label={titulo} aria-busy={guardando}>
    <p>{descripcion} PDF, JPG o PNG, máximo 10 MB.</p>
    {documento?.subido_en && <p>Última carga: {new Date(documento.subido_en).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</p>}
    <p className="user-document-name" title={nombreArchivo ?? documento?.ruta.split("/").at(-1)}>{nombreArchivo ?? documento?.ruta.split("/").at(-1) ?? "Sin archivo cargado"}</p>
    <input ref={input} id={`archivo-${tipo}`} type="file" accept="image/jpeg,image/png,application/pdf" hidden aria-label={`Seleccionar archivo · ${titulo}`} disabled={guardando || cargando || errorConsulta} onChange={event => void cargar(event.target.files?.[0])} />
    <button type="button" disabled={guardando || cargando || errorConsulta} onClick={() => input.current?.click()}>{guardando ? "Subiendo…" : "Seleccionar archivo"}</button>
    {error && <p role="alert">{error}</p>}
  </article>;
}
