"use client";

import { useEffect, useState } from "react";
import { Aviso, Card } from "@ruum/ui";
import { obtenerConfiguracionConductor, subirDocumentoConductor, type TipoDocumentoConductor } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { CuentaHeader } from "../CuentaHeader";
import { cargarConductorCuenta, type ConductorCuenta } from "../cuenta-utils";
import { DatosSensiblesInfo } from "../datos-sensibles";
import { DriverDocumentChecklist } from "./DriverDocumentChecklist";

type Documento = Database["public"]["Tables"]["documentos_conductor"]["Row"];

export default function PaginaDocumentosCuenta() {
  const [conductor, setConductor] = useState<ConductorCuenta | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<TipoDocumentoConductor | null>(null);
  const [faqAbierto, setFaqAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      const actual = await cargarConductorCuenta();
      setConductor(actual);
      if (actual) {
        const cliente = crearClienteNavegador();
        const config = await obtenerConfiguracionConductor(cliente, actual.id);
        setDocumentos(config.documentos);
      }
      setErrorCarga(null);
    } catch {
      setErrorCarga("No se pudieron cargar los documentos. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargar();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function subirDocumento(tipoDocumento: TipoDocumentoConductor, archivo: File, documentoAnteriorId?: string) {
    if (!archivo || !conductor) return;
    setMensaje(null);
    setSubiendo(tipoDocumento);
    try {
      const cliente = crearClienteNavegador();
      await subirDocumentoConductor(cliente, conductor.id, tipoDocumento, archivo, documentoAnteriorId);
      setMensaje("Documento cargado y enviado a revisión.");
      await cargar();
    } catch (error) {
      setMensaje(traducirErrorOperativo(error, "No pudimos registrar el documento."));
    } finally {
      setSubiendo(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
      {/* Header limpio con ícono de ayuda para la sección educativa */}
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <CuentaHeader titulo="Expediente de Documentos" descripcion="Consulta y actualiza tu documentación operativa para mantener tu cuenta activa." />
        <button
          type="button"
          onClick={() => setFaqAbierto(!faqAbierto)}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface-elevated/40 text-text-tertiary hover:bg-surface-elevated focus-visible:outline-none"
          aria-label={faqAbierto ? "Ocultar ayuda" : "Mostrar ayuda"}
        >
          ℹ️
        </button>
      </header>

      {mensaje && (
        <div className="mt-4 px-4">
          <Aviso tono="info">{mensaje}</Aviso>
        </div>
      )}

      {errorCarga && (
        <div className="mt-4 px-4">
          <Aviso tono="danger">{errorCarga}</Aviso>
        </div>
      )}

      {/* Sección educativa colapsada por defecto */}
      {faqAbierto && (
        <Card className="mt-5 px-4">
          <div className="py-4">
            <p className="font-body text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Expediente digital del Conductor
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-text-primary">
              Documentos requeridos para operar
            </h2>
            <p className="mt-1 font-body text-sm leading-6 text-text-tertiary">
              Los documentos bloqueantes deben estar vigentes para recibir traslados.
            </p>
            <DatosSensiblesInfo tipo="documentos" />
          </div>
        </Card>
      )}

      <Card className={`mt-5 px-4 ${cargando || errorCarga ? "min-h-[200px] flex items-center justify-center" : ""}`}>
        {cargando ? (
          <div className="py-8 text-center font-body text-sm text-text-secondary">
            Cargando expediente documental...
          </div>
        ) : errorCarga ? (
          <div className="py-8 text-center">
            <Aviso tono="danger">{errorCarga}</Aviso>
          </div>
        ) : (
          <DriverDocumentChecklist
            conductor={conductor}
            documentos={documentos}
            subiendo={subiendo}
            onUpload={subirDocumento}
          />
        )}
      </Card>
    </div>
  );
}
