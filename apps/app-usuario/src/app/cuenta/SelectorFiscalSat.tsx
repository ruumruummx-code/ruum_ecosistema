"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogAccesible } from "@ruum/ui";
import { CATALOGO_FISCAL_SAT, normalizarBusquedaFiscal, textoFiscal, type OpcionFiscalSat, type TipoPersonaFiscal } from "@ruum/shared/catalogos";
import { useAltoViewportCuenta } from "./useAltoViewportCuenta";
import styles from "./selector-fiscal-sat.module.css";

export function SelectorFiscalSat({ tipo, valor, onChange, regimen, persona, disabled = false }: {
  tipo: "regimenes" | "usos";
  valor: string;
  onChange: (clave: string) => void;
  regimen?: string;
  persona?: TipoPersonaFiscal;
  disabled?: boolean;
}) {
  const etiqueta = tipo === "regimenes" ? "Régimen fiscal" : "Uso de CFDI";
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [opciones, setOpciones] = useState<OpcionFiscalSat[] | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const foco = useRef<HTMLInputElement>(null);
  const cerrar = useCallback(() => setAbierto(false), []);
  const dialog = useDialogAccesible({ abierto, focoInicial: foco, alCancelar: cerrar });
  useAltoViewportCuenta(dialog);
  const seleccion = CATALOGO_FISCAL_SAT[tipo].find(o => o.clave === valor);

  useEffect(() => {
    if (!abierto) return;
    const controller = new AbortController();
    setOpciones(null);
    setError(false);
    const params = new URLSearchParams();
    if (tipo === "usos" && regimen) params.set("regimen", regimen);
    if (persona) params.set("persona", persona);
    void fetch(`/api/catalogos/sat?${params}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Catálogo no disponible");
        const datos = await response.json();
        if (!Array.isArray(datos[tipo])) throw new Error("Catálogo inválido");
        if (!controller.signal.aborted) setOpciones(datos[tipo]);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [abierto, tipo, regimen, persona, intento]);

  const q = normalizarBusquedaFiscal(busqueda);
  const visibles = opciones?.filter(o => normalizarBusquedaFiscal(`${textoFiscal(o)} ${o.clave === "626" ? "resico" : ""}`).includes(q));

  return <div className={`user-profile-field ${styles.container}`}>
    <label htmlFor={id}>{etiqueta}</label>
    <button id={id} className={styles.field} title={seleccion ? textoFiscal(seleccion) : undefined} type="button" aria-haspopup="dialog" aria-expanded={abierto} disabled={disabled} onClick={() => { setBusqueda(""); setAbierto(true); }}>
      <span>{seleccion ? textoFiscal(seleccion) : valor ? `${valor} - Selecciona una opción vigente` : "Seleccionar"}</span><span aria-hidden="true">›</span>
    </button>
    {abierto && createPortal(<dialog ref={dialog} className={`${styles.dialog} user-v2-scope`} aria-label={`Seleccionar ${etiqueta}`} aria-modal="true">
      <div className={styles.panel}>
        <header><h2>{etiqueta}</h2><button type="button" onClick={cerrar} aria-label={`Cerrar selector de ${etiqueta}`}>×</button></header>
        <input ref={foco} type="search" aria-label={`Buscar ${etiqueta}`} placeholder="Buscar clave o descripción" value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
        <div className={styles.list} aria-label={`Opciones de ${etiqueta}`} aria-busy={opciones === null && !error}>
          {error ? <p role="alert">No pudimos cargar el catálogo. <button type="button" onClick={() => setIntento(v => v + 1)}>Reintentar</button></p> : opciones === null ? <p role="status">Cargando catálogo…</p> : <>
            <p role="status">{visibles?.length} opciones</p>
            {visibles?.map(o => <button key={o.clave} type="button" aria-pressed={valor === o.clave} onClick={() => { onChange(o.clave); cerrar(); }}>{textoFiscal(o)}</button>)}
            {!visibles?.length && <p>Sin coincidencias. Prueba otra clave o descripción.</p>}
          </>}
        </div>
      </div>
    </dialog>, document.body)}
  </div>;
}
