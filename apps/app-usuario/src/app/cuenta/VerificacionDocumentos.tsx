"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { listarDocumentosCuentaUsuario, type DocumentoCuenta, type TipoDocumentoCuenta } from "@ruum/api/services";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { logStructuredError } from "../../lib/logger";
import { FacturacionCuentaForm, type DatosFiscalesGuardados } from "./FacturacionCuentaForm";
import { DocumentoCuentaTarjeta } from "./DocumentoCuentaTarjeta";
import { HojaTareaCuenta } from "./HojaTareaCuenta";
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
type Tarea = TipoDocumentoCuenta | "ine" | "fiscal";
export interface VerificacionDocumentosProps { usuario: Usuario; empresa?: Empresa | null; fotoUrl?: string | null; }
const TAREAS_DOCUMENTOS = [
  { id: "ine", titulo: "Identificación Oficial (INE)", descripcion: "Incluye anverso y reverso en un solo archivo.", icono: "M3 5h18v14H3V5Z M7 9h3v3H7z M13 9h5 M13 13h5" },
  { id: "licencia", titulo: "Licencia de Conducir", descripcion: "Incluye frente y reverso de tu licencia vigente en un solo archivo.", icono: "M3 5h18v14H3V5Z M7 9h3 M7 13h3 M14 9h4v4h-4z" },
  { id: "comprobante", titulo: "Comprobante de Domicilio", descripcion: "Carga un comprobante legible con tu domicilio actual.", icono: "M3 10 12 3l9 7 M5 9v12h14V9 M9 21v-8h6v8" },
  { id: "constancia", titulo: "Constancia de Situación Fiscal", descripcion: "Adjunta tu constancia vigente para respaldar los datos fiscales.", icono: "M14 2H4v20h16V8l-6-6Z M14 2v6h6 M8 12h8 M8 16h8" },
] as const;

const TAREAS_FISCAL = [
  { id: "fiscal", titulo: "Datos de Facturación", descripcion: "Configura tus datos fiscales para emisión de CFDI.", icono: "M4 3h16v18l-3-2-3 2-3-2-3 2-4-2V3Z M8 8h8 M8 12h8" },
] as const;

const TODAS_LAS_TAREAS = [...TAREAS_DOCUMENTOS, ...TAREAS_FISCAL];

function estadoDocumento(documento: Omit<DocumentoCuenta, "tipo"> | undefined, pendiente: boolean, error: boolean) {
  if (pendiente) return { texto: "Consultando…", tono: "neutral" };
  if (error) return { texto: "No disponible", tono: "neutral" };
  if (!documento) return { texto: "Sin cargar", tono: "neutral" };
  if (documento.estado === "verificado") return { texto: "Verificado", tono: "success" };
  if (documento.estado === "rechazado") return { texto: "Rechazado", tono: "error" };
  return { texto: "En revisión", tono: "pending" };
}
export function VerificacionDocumentos({ usuario, empresa = null }: VerificacionDocumentosProps) {
  const [documentos, setDocumentos] = useState<DocumentoCuenta[]>([]);
  const [ine, setIne] = useState<Omit<DocumentoCuenta, "tipo"> | undefined>(() => usuario.doc_identidad_url ? { ruta: usuario.doc_identidad_url, subido_en: usuario.doc_identidad_subido_en ?? "", estado: usuario.estado_verificacion === "verificado" ? "verificado" : usuario.estado_verificacion === "rechazado" ? "rechazado" : "en_revision" } : undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [ocupada, setOcupada] = useState(false);
  const ocupadaRef = useRef(false);
  const [aviso, setAviso] = useState("");
  const [fiscales, setFiscales] = useState<DatosFiscalesGuardados | null>(null);
  const [fiscalConfigurado, setFiscalConfigurado] = useState(["rfc", "razon_social", "regimen_fiscal", "codigo_postal_fiscal", "uso_cfdi"].every(campo => Boolean((empresa?.[campo as keyof Empresa] ?? usuario[campo as keyof Usuario])?.toString().trim())));
  const cambiarOcupada = useCallback((valor: boolean) => { ocupadaRef.current = valor; setOcupada(valor); }, []);
  const cerrar = useCallback(() => { if (!ocupadaRef.current) setTarea(null); }, []);
  useEffect(() => {
    let activo = true;
    setCargando(true); setError(null);
    void (async () => {
      try { const datos = await listarDocumentosCuentaUsuario(crearClienteNavegador()); if (activo) setDocumentos(datos); }
      catch (err) {
        logStructuredError("cuenta/VerificacionDocumentos", "listar_documentos_fallido", err);
        if (activo) setError("No pudimos consultar tus documentos.");
      }
      finally { if (activo) setCargando(false); }
    })();
    return () => { activo = false; };
  }, [intento]);
  const seleccion = TODAS_LAS_TAREAS.find(item => item.id === tarea);
  const documento = tarea === "ine" ? ine : documentos.find(item => item.tipo === tarea);
  return <div className="user-verification-view">
    <header className="user-profile-appbar"><Link href="/cuenta?seccion=perfil" aria-label="Volver a mi cuenta" className="user-profile-back">‹ Atrás</Link><h1>Verificación y facturación</h1><span aria-hidden="true" /></header>
    <nav aria-label="Tareas de verificación y facturación" className="space-y-6">
      <section className="user-verification-section" aria-labelledby="seccion-docs-identidad">
        <h2 id="seccion-docs-identidad" className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--user-color-muted)]">
          Documentos de identidad y conducción
        </h2>
        <div className="user-verification-tasks">
          {TAREAS_DOCUMENTOS.map(item => {
            const estado = estadoDocumento(item.id === "ine" ? ine : documentos.find(d => d.tipo === item.id), item.id !== "ine" && cargando, item.id !== "ine" && Boolean(error));
            return <button key={item.id} type="button" aria-haspopup="dialog" aria-label={`${item.titulo} ${estado.texto}`} disabled={item.id !== "ine" && (cargando || Boolean(error))} onClick={() => setTarea(item.id)} className="user-verification-task"><Icono d={item.icono} className="size-5 shrink-0" /><span title={item.titulo}>{item.titulo}</span><span className={`user-task-badge is-${estado.tono}`}>{estado.texto}</span></button>;
          })}
        </div>
      </section>

      <section className="user-verification-section" aria-labelledby="seccion-datos-fiscales">
        <h2 id="seccion-datos-fiscales" className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--user-color-muted)]">
          Datos fiscales y facturación CFDI
        </h2>
        <div className="user-verification-tasks">
          {TAREAS_FISCAL.map(item => {
            const estado = { texto: fiscalConfigurado ? "Configurado" : "Sin configurar", tono: fiscalConfigurado ? "success" : "neutral" };
            return <button key={item.id} type="button" aria-haspopup="dialog" aria-label={`${item.titulo} ${estado.texto}`} onClick={() => setTarea(item.id)} className="user-verification-task"><Icono d={item.icono} className="size-5 shrink-0" /><span title={item.titulo}>{item.titulo}</span><span className={`user-task-badge is-${estado.tono}`}>{estado.texto}</span></button>;
          })}
        </div>
      </section>
    </nav>
    <div className="user-verification-feedback">{error && <p role="alert">{error} <button type="button" onClick={() => setIntento(v => v + 1)}>Reintentar</button></p>}<p role="status" aria-live="polite">{aviso}</p></div>
    {seleccion && <HojaTareaCuenta titulo={seleccion.titulo} extendida={tarea === "fiscal"} ocupada={ocupada} cerrar={cerrar}>
      {tarea === "fiscal" ? <FacturacionCuentaForm compacto usuario={{ ...usuario, ...fiscales }} empresa={empresa ? { ...empresa, ...fiscales } : null} onOcupada={cambiarOcupada} onActualizado={datos => { setFiscales(datos); setFiscalConfigurado(true); setTarea(null); setAviso("Datos fiscales guardados."); }} /> : <DocumentoCuentaTarjeta tipo={tarea as TipoDocumentoCuenta | "ine"} titulo={seleccion.titulo} descripcion={seleccion.descripcion} documento={documento} onOcupada={cambiarOcupada} actualizado={dato => {
        if (tarea === "ine") setIne(dato);
        else setDocumentos(prev => [...prev.filter(d => d.tipo !== tarea), { ...dato, tipo: tarea as TipoDocumentoCuenta }]);
        setTarea(null); setAviso(`${seleccion.titulo}: ${estadoDocumento(dato, false, false).texto}.`);
      }} />}
    </HojaTareaCuenta>}
  </div>;
}
