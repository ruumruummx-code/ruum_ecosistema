"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Button, Field } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarFacturacionUsuario } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

import { claveFiscal, consultarCatalogosSat, validarSeleccionFiscalSat } from "@ruum/shared/catalogos";
import { SelectorFiscalSat } from "./SelectorFiscalSat";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
type CampoFiscal = "rfc" | "razon_social" | "regimen_fiscal" | "codigo_postal_fiscal" | "uso_cfdi";

function limpiar(valor: string) {
  return valor.trim() || null;
}

function soloAlfanumericoFiscal(valor: string, maximo: number) {
  return valor.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "").slice(0, maximo);
}

function soloDigitos(valor: string, maximo: number) {
  return valor.replace(/\D/g, "").slice(0, maximo);
}

function datoFiscal(usuario: Usuario, empresa: Empresa | null, campo: CampoFiscal) {
  return empresa?.[campo] ?? usuario?.[campo] ?? "";
}

export type DatosFiscalesGuardados = { rfc: string; razon_social: string | null; regimen_fiscal: string | null; codigo_postal_fiscal: string; uso_cfdi: string | null; correo_facturacion: string | null };

const DRAFT_FISCAL_KEY = "ruum:draft:fiscal";

function leerDraftFiscal(): Partial<DatosFiscalesGuardados> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_FISCAL_KEY);
    return raw ? (JSON.parse(raw) as Partial<DatosFiscalesGuardados>) : null;
  } catch {
    return null;
  }
}

export function FacturacionCuentaForm({ usuario, empresa, onActualizado, compacto = false, onOcupada }: { usuario: Usuario; empresa: Empresa | null; onActualizado?: (datos: DatosFiscalesGuardados) => void; compacto?: boolean; onOcupada?: (valor: boolean) => void }) {
  const router = useRouter();
  const bloqueo = useRef(false);
  const draftInicial = useRef<Partial<DatosFiscalesGuardados> | null>(null);
  if (draftInicial.current === null && typeof window !== "undefined") {
    draftInicial.current = leerDraftFiscal();
  }

  const [rfc, setRfc] = useState(() => datoFiscal(usuario, empresa, "rfc") || (draftInicial.current?.rfc ?? ""));
  const [razonSocial, setRazonSocial] = useState(() => datoFiscal(usuario, empresa, "razon_social") || empresa?.nombre || (draftInicial.current?.razon_social ?? ""));
  const [regimenFiscal, setRegimenFiscal] = useState(() => claveFiscal(datoFiscal(usuario, empresa, "regimen_fiscal")) || (draftInicial.current?.regimen_fiscal ?? ""));
  const [codigoPostalFiscal, setCodigoPostalFiscal] = useState(() => datoFiscal(usuario, empresa, "codigo_postal_fiscal") || (draftInicial.current?.codigo_postal_fiscal ?? ""));
  const [usoCfdi, setUsoCfdi] = useState(() => claveFiscal(datoFiscal(usuario, empresa, "uso_cfdi")) || (draftInicial.current?.uso_cfdi ?? ""));
  const [correoFacturacion, setCorreoFacturacion] = useState(() => empresa?.correo_facturacion ?? usuario.correo_facturacion ?? (draftInicial.current?.correo_facturacion ?? ""));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);

  // Autosave del borrador fiscal local
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const hayDatos = Boolean(rfc || razonSocial || regimenFiscal || codigoPostalFiscal || usoCfdi || correoFacturacion);
          if (hayDatos) {
            window.localStorage.setItem(DRAFT_FISCAL_KEY, JSON.stringify({
              rfc,
              razon_social: razonSocial,
              regimen_fiscal: regimenFiscal,
              codigo_postal_fiscal: codigoPostalFiscal,
              uso_cfdi: usoCfdi,
              correo_facturacion: correoFacturacion,
            }));
          }
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rfc, razonSocial, regimenFiscal, codigoPostalFiscal, usoCfdi, correoFacturacion]);

  const persona = rfc.length === 12 ? "moral" : rfc.length === 13 ? "fisica" : undefined;
  function cambiarRfc(valor: string) {
    const nuevo = soloAlfanumericoFiscal(valor, 13);
    setRfc(nuevo);
    const tipo = nuevo.length === 12 ? "moral" : nuevo.length === 13 ? "fisica" : undefined;
    if (!tipo) return;
    const opciones = consultarCatalogosSat({ regimen: regimenFiscal, persona: tipo });
    if (!opciones.regimenes.some(o => o.clave === regimenFiscal)) {
      setRegimenFiscal("");
      setUsoCfdi("");
    } else if (!opciones.usos.some(o => o.clave === usoCfdi)) setUsoCfdi("");
  }
  function cambiarRegimen(clave: string) {
    setRegimenFiscal(clave);
    if (!consultarCatalogosSat({ regimen: clave, persona }).usos.some(o => o.clave === usoCfdi)) setUsoCfdi("");
  }
  const selectorRegimen = <SelectorFiscalSat tipo="regimenes" valor={regimenFiscal} onChange={cambiarRegimen} persona={persona} disabled={guardando} />;
  const selectorUso = <SelectorFiscalSat tipo="usos" valor={usoCfdi} onChange={setUsoCfdi} regimen={regimenFiscal} persona={persona} disabled={guardando || !regimenFiscal} />;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueo.current) return;
    setMensaje(null);

    if (!rfc || rfc.length < 12 || !razonSocial.trim() || !regimenFiscal.trim() || codigoPostalFiscal.length !== 5 || !usoCfdi.trim()) {
      setMensaje({ tono: "danger", texto: "Completa RFC, razón social, régimen fiscal, CP fiscal y uso de CFDI." });
      return;
    }

    const errorFiscal = validarSeleccionFiscalSat(regimenFiscal, usoCfdi, rfc);
    if (errorFiscal) { setMensaje({ tono: "danger", texto: errorFiscal }); return; }

    if (!tieneSupabaseConfigurado()) {
      setMensaje({ tono: "danger", texto: "Supabase no está configurado. No se pueden guardar cambios." });
      return;
    }

    bloqueo.current = true;
    setGuardando(true); onOcupada?.(true);
    try {
      const datos = {
        rfc,
        razon_social: limpiar(razonSocial),
        regimen_fiscal: limpiar(regimenFiscal),
        codigo_postal_fiscal: codigoPostalFiscal,
        uso_cfdi: limpiar(usoCfdi),
        correo_facturacion: limpiar(correoFacturacion)
      };
      const cliente = crearClienteNavegador();
      await actualizarFacturacionUsuario(cliente, datos);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(DRAFT_FISCAL_KEY);
        }
      } catch {}
      setMensaje({ tono: "info", texto: "Datos de facturación actualizados." });
      onActualizado?.(datos);
      router.refresh();
    } catch (err) {
      setMensaje({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos guardar los datos fiscales." });
    } finally {
      bloqueo.current = false;
      setGuardando(false); onOcupada?.(false);
    }
  }

  if (compacto) return (
    <form id="datos-fiscales-form" className="user-fiscal-form" onSubmit={guardar}>
      <div className="user-fiscal-fields user-profile-grid">
        <div className="user-profile-field"><label htmlFor="fiscal-rfc">RFC</label><input id="fiscal-rfc" value={rfc} onChange={e => cambiarRfc(e.target.value)} minLength={12} maxLength={13} required disabled={guardando} /></div>
        <div className="user-profile-field"><label htmlFor="fiscal-cp">Código postal fiscal</label><input id="fiscal-cp" value={codigoPostalFiscal} onChange={e => setCodigoPostalFiscal(soloDigitos(e.target.value, 5))} inputMode="numeric" maxLength={5} required disabled={guardando} /></div>
        {selectorRegimen}
        {selectorUso}
        <div className="user-profile-field is-wide"><label htmlFor="fiscal-razon">Razón social</label><input id="fiscal-razon" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} required disabled={guardando} /></div>
        <div className="user-profile-field is-wide"><label htmlFor="fiscal-email">Correo para facturación</label><input id="fiscal-email" type="email" value={correoFacturacion} onChange={e => setCorreoFacturacion(e.target.value)} disabled={guardando} /></div>
      </div>
      <footer className="user-fiscal-actions"><div aria-live="polite">{mensaje && <p role={mensaje.tono === "danger" ? "alert" : "status"}>{mensaje.texto}</p>}</div><button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar datos fiscales"}</button></footer>
    </form>
  );

  return (
    <form className="grid gap-4" onSubmit={guardar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field etiqueta="RFC" value={rfc} onChange={(e) => cambiarRfc(e.target.value)} minLength={12} maxLength={13} required />
        <Field etiqueta="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required />
        {selectorRegimen}
        <Field etiqueta="Código postal fiscal" value={codigoPostalFiscal} onChange={(e) => setCodigoPostalFiscal(soloDigitos(e.target.value, 5))} inputMode="numeric" maxLength={5} required />
        {selectorUso}
        <Field etiqueta="Correo para facturación" type="email" value={correoFacturacion} onChange={(e) => setCorreoFacturacion(e.target.value)} />
      </div>

      {mensaje && (
        <div role="status" aria-live="polite" aria-atomic="true">
          <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>
        </div>
      )}

      <div>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar datos fiscales"}
        </Button>
      </div>
    </form>
  );
}
