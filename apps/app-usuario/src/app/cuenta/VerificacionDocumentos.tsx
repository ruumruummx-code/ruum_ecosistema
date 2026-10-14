"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { listarDocumentosCuentaUsuario, type DocumentoCuenta, type TipoDocumentoCuenta } from "@ruum/api/services";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { FacturacionCuentaForm } from "./FacturacionCuentaForm";
import { DocumentoCuentaTarjeta } from "./DocumentoCuentaTarjeta";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export interface VerificacionDocumentosProps { usuario: Usuario; empresa?: Empresa | null; fotoUrl?: string | null; }

export function VerificacionDocumentos({ usuario, empresa = null }: VerificacionDocumentosProps) {
  const [documentos, setDocumentos] = useState<DocumentoCuenta[]>([]);
  const [ine, setIne] = useState<Omit<DocumentoCuenta, "tipo"> | undefined>(() => usuario.doc_identidad_url ? {
    ruta: usuario.doc_identidad_url, subido_en: usuario.doc_identidad_subido_en ?? "",
    estado: usuario.estado_verificacion === "verificado" ? "verificado" : usuario.estado_verificacion === "rechazado" ? "rechazado" : "en_revision",
  } : undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let activo = true;
    setCargando(true); setError(null);
    async function cargar() {
      try {
        const datos = await listarDocumentosCuentaUsuario(crearClienteNavegador());
        if (activo) setDocumentos(datos);
      } catch {
        if (activo) setError("No pudimos consultar tus documentos. Inténtalo nuevamente.");
      } finally { if (activo) setCargando(false); }
    }
    void cargar();
    return () => { activo = false; };
  }, [intento]);
  const [fiscalConfigurado, setFiscalConfigurado] = useState(Boolean((empresa?.rfc ?? usuario.rfc)?.trim()));
  const identidad = ine?.estado === "verificado" ? "Identidad verificada" : ine?.estado === "rechazado" ? "Identificación requiere actualización" : ine ? "Identidad en revisión" : "Identificación pendiente";
  function tarjeta(tipo: TipoDocumentoCuenta, titulo: string, descripcion: string) {
    return <DocumentoCuentaTarjeta tipo={tipo} titulo={titulo} descripcion={descripcion} documento={documentos.find(d => d.tipo === tipo)} cargando={cargando} errorConsulta={Boolean(error)} actualizado={dato => setDocumentos(prev => [...prev.filter(d => d.tipo !== tipo), { ...dato, tipo }])} />;
  }
  return <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 text-[#0a2342] dark:text-[#f6f8fb]">
    <header className="flex items-center gap-3 border-b border-[#e6edf6] pb-4">
      <Link href="/cuenta" aria-label="Volver a mi cuenta" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342]">←</Link>
      <div><h1 className="text-xl font-extrabold tracking-tight">Verificación y facturación</h1><p className="mt-1 text-xs text-[#6b7c94]">Tus documentos y datos fiscales en un solo lugar</p></div>
    </header>
    <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-[#edf4fe] px-3 py-2 text-[#2e5a88]">{identidad}</span><span className="rounded-full bg-[#f0f5fe] px-3 py-2 text-[#3d5470]">{fiscalConfigurado ? "RFC registrado" : "Facturación sin configurar"}</span></div>
    <section aria-labelledby="identidad-titulo" className="flex flex-col gap-3">
      <h2 id="identidad-titulo" className="text-base font-bold">Identidad y domicilio</h2>
      <p className="text-xs leading-relaxed text-[#6b7c94]">Carga documentos legibles en PDF, JPG o PNG de hasta 10 MB. Puedes reemplazarlos cuando necesites actualizarlos.</p>
      <DocumentoCuentaTarjeta tipo="ine" titulo="Identificación oficial (INE)" descripcion="Incluye anverso y reverso en un solo archivo." documento={ine} actualizado={setIne} />
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" onClick={() => setIntento(v => v + 1)} className="ml-2 font-bold underline">Reintentar</button></div>}
      {tarjeta("licencia", "Licencia de conducir", "Incluye frente y reverso de tu licencia vigente en un solo archivo. Usa Actualizar para reemplazarla al renovarla.")}
      {tarjeta("comprobante", "Comprobante de domicilio", "Carga un comprobante legible con tu domicilio actual.")}
    </section>
    <section id="facturacion" aria-labelledby="fiscal-titulo" className="scroll-mt-5 rounded-[20px] border border-[#e6edf6] bg-white p-5 dark:border-[#1a3a5c] dark:bg-[#0a2342]">
      <h2 id="fiscal-titulo" className="text-base font-bold">Datos de facturación</h2>
      <p className="mb-4 mt-2 text-xs leading-relaxed text-[#6b7c94]">Completa estos datos solo si necesitas factura. Tu correo de facturación puede ser diferente al correo de tu cuenta.</p>
      <details open={fiscalConfigurado}>
        <summary className="cursor-pointer py-2 text-sm font-bold">{fiscalConfigurado ? "Consultar o actualizar datos fiscales" : "Necesito factura"}</summary>
        <div className="mt-4 flex flex-col gap-5"><FacturacionCuentaForm usuario={usuario} empresa={empresa} onActualizado={() => setFiscalConfigurado(true)} />
          {tarjeta("constancia", "Constancia de Situación Fiscal", "Adjunta tu constancia para respaldar los datos de facturación.")}
        </div>
      </details>
    </section>
  </div>;
}
