"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerConfiguracionConductor, subirDocumentoConductor, validarArchivoDocumentoConductor, type TipoDocumentoConductor } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { cargarConductorCuenta, type ConductorCuenta } from "../cuenta-utils";
import { DriverDocumentsView } from "./DriverDocumentsView";
import { buildDocumentChecklist, type DriverDocument } from "./document-checklist";

export default function PaginaDocumentosCuenta() {
  const router = useRouter();
  const [driver, setDriver] = useState<ConductorCuenta | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<TipoDocumentoConductor | null>(null);
  async function load() {
    setLoading(true);
    try {
      const current = await cargarConductorCuenta();
      if (!current) throw new Error("No se encontró la cuenta del conductor.");
      const config = await obtenerConfiguracionConductor(crearClienteNavegador(), current.id);
      setDriver(current); setDocuments(config.documentos); setError(null);
    } catch { setError("No se pudieron cargar los documentos. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  async function upload(type: TipoDocumentoConductor, file: File, previousId?: string) {
    if (!driver || uploading) return;
    setMessage(null);
    try { validarArchivoDocumentoConductor(file); } catch (cause) { setMessage((cause as Error).message); return; }
    setUploading(type);
    try {
      await subirDocumentoConductor(crearClienteNavegador(), driver.id, type, file, previousId);
      setMessage("Documento cargado y enviado a revisión.");
      await load();
    } catch (cause) { setMessage(traducirErrorOperativo(cause, "No pudimos registrar el documento.")); }
    finally { setUploading(null); }
  }
  const items = buildDocumentChecklist(documents, driver);
  const canContinue = !!driver && !loading && !error && !uploading && items.every(item => item.complete);
  return <DriverDocumentsView items={items} loading={loading} error={error} message={message} uploading={uploading} enabled={!!driver} onUpload={(...args) => { void upload(...args); }} onRetry={() => { void load(); }} onContinue={() => { if (canContinue) router.push("/cuenta/certificacion"); }} />;
}
