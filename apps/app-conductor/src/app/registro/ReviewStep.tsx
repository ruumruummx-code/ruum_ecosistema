import { enmascararUltimos } from "../cuenta/datos-sensibles";
import { formatoTelefonoNacional } from "./registration-validation";
import { TIPOS_DOCUMENTO, type DocumentoKey } from "./registration-types";
import { ReviewSummary } from "./ReviewSummary";
import styles from "./registration.module.css";

export function ReviewStep({ telefono, email, nombreCompleto, curp, calle, numero, colonia, ciudad, estado, codigoPostal, referencias, contactoEmergenciaTelefono, numeroLicencia, tipoLicencia, vigenciaLicencia, autorizaVerificacion, declaraSinSuspensiones, documentos, documentosRemotos, onEditar }: {
  telefono: string; email: string; nombreCompleto: string; curp: string;
  calle: string; numero: string; colonia: string; ciudad: string; estado: string; codigoPostal: string;
  referencias: string; contactoEmergenciaTelefono: string; numeroLicencia: string; tipoLicencia: string;
  vigenciaLicencia: string; autorizaVerificacion: boolean; declaraSinSuspensiones: boolean;
  documentos: Record<DocumentoKey, File | null>; documentosRemotos: Set<string>; onEditar: (paso: number) => void;
}) {
  const docs = [
    ["Licencia", Boolean(documentos.licenciaFrente || documentosRemotos.has(TIPOS_DOCUMENTO.licenciaFrente))],
    ["Reverso", Boolean(documentos.licenciaReverso || documentosRemotos.has(TIPOS_DOCUMENTO.licenciaReverso))],
    ["Identificación", Boolean(documentos.identificacionOficial || documentosRemotos.has(TIPOS_DOCUMENTO.identificacionOficial))]
  ] as const;

  return <fieldset className={styles.reviewStep}>
    <div className={styles.reviewRows}>
      <ReviewSummary titulo="Cuenta" valores={[`${nombreCompleto} · ${email.trim().toLowerCase()} · ${formatoTelefonoNacional(telefono)}`]} onEditar={() => onEditar(0)} />
      <ReviewSummary titulo="Identidad" valores={[`CURP ${enmascararUltimos(curp.trim().toUpperCase())} · ${calle} ${numero}, ${colonia}, ${ciudad} · ${estado} ${codigoPostal} · Emergencia ${enmascararUltimos(contactoEmergenciaTelefono)}${referencias ? ` · ${referencias}` : ""}`]} onEditar={() => onEditar(1)} />
      <ReviewSummary titulo="Licencia" valores={[`${enmascararUltimos(numeroLicencia)} · ${tipoLicencia} · Vigencia ${vigenciaLicencia} · ${autorizaVerificacion ? "Verificación autorizada" : "Verificación pendiente"} · ${declaraSinSuspensiones ? "Declaración completa" : "Declaración pendiente"}`]} onEditar={() => onEditar(2)} />
      <div className={styles.reviewRow}>
        <div className={styles.reviewRowMain}>
          <strong>Documentos</strong>
          <div className={styles.reviewBadges}>{docs.map(([label, ready]) => <span key={label} data-ready={ready}>{ready ? "✓" : "!"} {label}</span>)}</div>
        </div>
        <button type="button" className={styles.reviewEdit} onClick={() => onEditar(3)} aria-label="Editar documentos">✎</button>
      </div>
    </div>
  </fieldset>;
}
