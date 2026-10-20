import Link from "next/link";
import { enmascararUltimos } from "../cuenta/datos-sensibles";
import { formatoTelefonoNacional } from "./registration-validation";
import { TIPOS_DOCUMENTO, type DocumentoKey } from "./registration-types";
import { ReviewSummary } from "./ReviewSummary";
import styles from "./registration.module.css";

export function ReviewStep({ telefono, email, nombreCompleto, curp, calle, numero, colonia, ciudad, estado, codigoPostal, numeroLicencia, tipoLicencia, vigenciaLicencia, documentos, documentosRemotos, aceptaTerminos, onAceptarTerminos, onEditar }: {
  telefono: string; email: string; nombreCompleto: string; curp: string;
  calle: string; numero: string; colonia: string; ciudad: string; estado: string; codigoPostal: string;
  numeroLicencia: string; tipoLicencia: string; vigenciaLicencia: string;
  documentos: Record<DocumentoKey, File | null>; documentosRemotos: Set<string>;
  aceptaTerminos: boolean; onAceptarTerminos: (acepta: boolean) => void; onEditar: (paso: number) => void;
}) {
  const docs = [
    ["Licencia de conducir", Boolean(documentos.licenciaFrente || documentosRemotos.has(TIPOS_DOCUMENTO.licenciaFrente))],
    ["Reverso de licencia", Boolean(documentos.licenciaReverso || documentosRemotos.has(TIPOS_DOCUMENTO.licenciaReverso))],
    ["Identificación oficial", Boolean(documentos.identificacionOficial || documentosRemotos.has(TIPOS_DOCUMENTO.identificacionOficial))]
  ] as const;

  return <fieldset className={styles.reviewStep}>
    <legend className="sr-only">Revisa y confirma tu información</legend>
    <div className={styles.stepIntro}>
      <h1 id="titulo-registro-conductor">Revisa y confirma</h1>
      <p>Verifica que toda tu información sea correcta antes de crear tu cuenta.</p>
    </div>
    <div className={styles.reviewRows}>
      <ReviewSummary titulo="Datos personales" icono="person" valores={[nombreCompleto, email.trim().toLowerCase(), formatoTelefonoNacional(telefono)]} onEditar={() => onEditar(1)} />
      <ReviewSummary titulo="Identidad" icono="identity" valores={[`CURP: ${enmascararUltimos(curp.trim().toUpperCase())}`, `${calle} ${numero}, ${colonia}`, `${ciudad}, ${estado} ${codigoPostal}`]} onEditar={() => onEditar(1)} />
      <ReviewSummary titulo="Licencia" icono="license" valores={[numeroLicencia, tipoLicencia, `Vigencia: ${vigenciaLicencia}`]} onEditar={() => onEditar(2)} />
      <section className={styles.reviewRow} aria-label="Documentos">
        <span className={styles.reviewIcon} aria-hidden="true">▤</span>
        <div className={styles.reviewRowMain}>
          <strong>Documentos</strong>
          <div className={styles.documentChecks}>{docs.map(([label, ready]) => <span key={label} data-ready={ready}><b aria-hidden="true">{ready ? "✓" : "!"}</b>{label}</span>)}</div>
        </div>
        <button type="button" className={styles.reviewEdit} onClick={() => onEditar(3)} aria-label="Editar documentos">Editar</button>
      </section>
    </div>
    <label className={styles.reviewConsent}>
      <input type="checkbox" checked={aceptaTerminos} onChange={(event) => onAceptarTerminos(event.target.checked)} />
      <span>Confirmo que toda la información es correcta y acepto los <Link href="/legal/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</Link>.</span>
    </label>
  </fieldset>;
}
