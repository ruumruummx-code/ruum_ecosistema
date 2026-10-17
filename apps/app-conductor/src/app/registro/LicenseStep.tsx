import { DIAS_ADVERTENCIA_VIGENCIA_LICENCIA, diasParaVencerLicencia, type CampoRegistroConductor } from "@ruum/shared/validacion";
import { DenseField } from "./DenseField";
import { SelectField } from "./SelectField";
import { formatoLicenciaMask } from "./registration-validation";
import { OPCIONES_LICENCIA_SELECT } from "./registration-types";
import styles from "./registration.module.css";

export function LicenseStep({ numeroLicencia, setNumeroLicencia, tipoLicencia, setTipoLicencia, vigenciaLicencia, setVigenciaLicencia, erroresCampos, limpiarErrorCampo, validarVigenciaLicencia }: {
  numeroLicencia: string; setNumeroLicencia: (value: string) => void;
  tipoLicencia: string; setTipoLicencia: (value: string) => void;
  vigenciaLicencia: string; setVigenciaLicencia: (value: string) => void;
  erroresCampos: Record<string, string>; limpiarErrorCampo: (key: string) => void;
  validarCampo: (key: CampoRegistroConductor, value: string) => boolean;
  validarVigenciaLicencia: () => boolean;
}) {
  const dias = vigenciaLicencia && !erroresCampos.vigenciaLicencia ? diasParaVencerLicencia(vigenciaLicencia) : null;
  const date = new Date();
  const hoy = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return (
    <fieldset className={styles.fields}>
      <legend className="sr-only">Datos de licencia</legend>
      <DenseField etiqueta="Número de licencia" value={formatoLicenciaMask(numeroLicencia)} onChange={(e) => { setNumeroLicencia(formatoLicenciaMask(e.target.value)); limpiarErrorCampo("numeroLicencia"); }} error={erroresCampos.numeroLicencia} required autoComplete="off" autoCapitalize="characters" />
      <div className={styles.row}>
        <SelectField dense etiqueta="Tipo de Licencia" value={tipoLicencia} onChange={(value) => { setTipoLicencia(value); limpiarErrorCampo("tipoLicencia"); }} error={erroresCampos.tipoLicencia} opciones={OPCIONES_LICENCIA_SELECT} placeholder="Selecciona" required />
        <DenseField etiqueta="Vigencia" type="date" value={vigenciaLicencia} min={hoy} onChange={(e) => { setVigenciaLicencia(e.target.value); limpiarErrorCampo("vigenciaLicencia"); }} onBlur={() => validarVigenciaLicencia()} error={erroresCampos.vigenciaLicencia} required />
      </div>
      {dias !== null && dias >= 0 && dias <= DIAS_ADVERTENCIA_VIGENCIA_LICENCIA && <p className={styles.microcopy} role="status">Tu licencia vence en {dias} días. Recuerda renovarla.</p>}
    </fieldset>
  );
}
