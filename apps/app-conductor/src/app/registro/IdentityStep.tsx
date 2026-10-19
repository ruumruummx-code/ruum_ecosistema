import { useEffect, useRef, useState } from "react";
import { validarCampoRegistroConductor, type CampoRegistroConductor } from "@ruum/shared/validacion";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { DenseField } from "./DenseField";
import { SelectField } from "./SelectField";
import { RegistrationSheet } from "./RegistrationSheet";
import { RegistrationIcon } from "./RegistrationIcon";
import { formatoCurpMask, formatoTelefonoNacional, soloDigitos } from "./registration-validation";
import styles from "./registration.module.css";

type TextKey = "nombre" | "apellidos" | "curp" | "codigoPostal" | "estado" | "ciudad" | "colonia" | "calle" | "numero" | "referencias" | "contactoEmergenciaNombre" | "contactoEmergenciaTelefono";
type IdentityProps = Record<TextKey, string> & { [K in TextKey as `set${Capitalize<K>}`]: (value: string) => void } & {
  ciudades: string[]; setCiudades: (value: string[]) => void;
  colonias: string[]; setColonias: (value: string[]) => void;
  consultandoCp: boolean; erroresCampos: Record<string, string>;
  limpiarErrorCampo: (key: string) => void;
  validarCampo: (key: CampoRegistroConductor, value: string) => boolean;
  validarCurp: () => boolean;
  validarTelefono: (key: "telefono" | "contactoEmergenciaTelefono", value: string, setter: (value: string) => void) => boolean;
  buscarCodigoPostal: (cp: string) => void;
};
type AddressKey = "codigoPostal" | "estado" | "ciudad" | "colonia" | "calle" | "numero" | "referencias";
const ADDRESS_KEYS: AddressKey[] = ["codigoPostal", "estado", "ciudad", "colonia", "calle", "numero", "referencias"];

export function IdentityStep(p: IdentityProps) {
  const [sheet, setSheet] = useState<"address" | "contact" | null>(null);
  const [address, setAddress] = useState<Pick<IdentityProps, AddressKey>>({ codigoPostal: "", estado: "", ciudad: "", colonia: "", calle: "", numero: "", referencias: "" });
  const [cities, setCities] = useState<string[]>([]);
  const [colonies, setColonies] = useState<string[]>([]);
  const [contact, setContact] = useState({ contactoEmergenciaNombre: "", contactoEmergenciaTelefono: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lookupMessage, setLookupMessage] = useState("");
  const [loadingCp, setLoadingCp] = useState(false);
  const lookupRef = useRef(0);
  useEffect(() => () => { lookupRef.current++; }, []);
  const completeAddress = ADDRESS_KEYS.every((key) => !validarCampoRegistroConductor(key, p[key]));
  const completeContact = !validarCampoRegistroConductor("contactoEmergenciaNombre", p.contactoEmergenciaNombre) && !validarCampoRegistroConductor("contactoEmergenciaTelefono", p.contactoEmergenciaTelefono);

  function close() {
    lookupRef.current++;
    setSheet(null);
    setLoadingCp(false);
  }
  function open(kind: "address" | "contact") {
    setErrors({}); setLookupMessage("");
    if (kind === "address") {
      setAddress({ codigoPostal: p.codigoPostal, estado: p.estado, ciudad: p.ciudad, colonia: p.colonia, calle: p.calle, numero: p.numero, referencias: p.referencias });
      setCities(p.ciudades); setColonies(p.colonias);
    } else setContact({ contactoEmergenciaNombre: p.contactoEmergenciaNombre, contactoEmergenciaTelefono: p.contactoEmergenciaTelefono });
    setSheet(kind);
  }
  function changeAddress(key: AddressKey, value: string) {
    setAddress((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  }
  async function changePostalCode(value: string) {
    const cp = soloDigitos(value, 5);
    const request = ++lookupRef.current;
    setAddress((previous) => ({ ...previous, codigoPostal: cp, estado: "", ciudad: "", colonia: "" }));
    setCities([]); setColonies([]); setErrors({}); setLookupMessage(""); setLoadingCp(cp.length === 5);
    if (cp.length !== 5) return;
    try {
      const data = await consultarCodigoPostalMx(cp);
      if (request !== lookupRef.current) return;
      if (!data) throw new Error("cp_not_found");
      setAddress((previous) => ({ ...previous, estado: data.estado, ciudad: data.ciudades[0] ?? "", colonia: data.colonias[0] ?? "" }));
      setCities(data.ciudades); setColonies(data.colonias);
    } catch {
      if (request === lookupRef.current) setLookupMessage("No encontramos el CP. Verifícalo o captura el domicilio manualmente.");
    } finally {
      if (request === lookupRef.current) setLoadingCp(false);
    }
  }
  function saveAddress() {
    const nextErrors = Object.fromEntries(ADDRESS_KEYS.map((key) => [key, validarCampoRegistroConductor(key, address[key])]));
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return false;
    p.setCodigoPostal(address.codigoPostal); p.setEstado(address.estado); p.setCiudad(address.ciudad);
    p.setColonia(address.colonia); p.setCalle(address.calle); p.setNumero(address.numero); p.setReferencias(address.referencias);
    p.setCiudades(cities); p.setColonias(colonies);
    ADDRESS_KEYS.forEach(p.limpiarErrorCampo); return true;
  }
  function saveContact() {
    const nextErrors = {
      contactoEmergenciaNombre: validarCampoRegistroConductor("contactoEmergenciaNombre", contact.contactoEmergenciaNombre),
      contactoEmergenciaTelefono: validarCampoRegistroConductor("contactoEmergenciaTelefono", contact.contactoEmergenciaTelefono)
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return false;
    p.setContactoEmergenciaNombre(contact.contactoEmergenciaNombre);
    p.setContactoEmergenciaTelefono(contact.contactoEmergenciaTelefono);
    p.limpiarErrorCampo("contactoEmergenciaNombre"); p.limpiarErrorCampo("contactoEmergenciaTelefono"); return true;
  }
  return (
    <fieldset className={`${styles.fields} ${styles.identityFields}`}>
      <legend className="sr-only">Identidad y domicilio</legend>
      <div className={styles.row}>
        <DenseField etiqueta="Nombre" value={p.nombre} onChange={(e) => { p.setNombre(e.target.value); p.limpiarErrorCampo("nombre"); }} onBlur={() => p.validarCampo("nombre", p.nombre)} error={p.erroresCampos.nombre} required autoComplete="given-name" />
        <DenseField etiqueta="Apellido" value={p.apellidos} onChange={(e) => { p.setApellidos(e.target.value); p.limpiarErrorCampo("apellidos"); }} onBlur={() => p.validarCampo("apellidos", p.apellidos)} error={p.erroresCampos.apellidos} required autoComplete="family-name" />
      </div>
      <DenseField etiqueta="CURP" placeholder="Ej. ABCD123456HDFEFG01" value={p.curp} onChange={(e) => { p.setCurp(formatoCurpMask(e.target.value)); p.limpiarErrorCampo("curp"); }} onBlur={() => p.validarCurp()} error={p.erroresCampos.curp} required maxLength={18} autoComplete="off" autoCapitalize="characters" />
      <div className={styles.summaries}>
        <button type="button" className={styles.summary} onClick={(event) => { event.currentTarget.focus(); open("address"); }} aria-haspopup="dialog" data-complete={completeAddress}>
          <RegistrationIcon name="pin" />
          <strong>Domicilio</strong>
          <span className={styles.identityAction}>{completeAddress ? "Editar" : "Agregar"}</span>
          <RegistrationIcon name="chevron" />
          {completeAddress && <span className="sr-only">{`${p.calle} ${p.numero}, ${p.colonia}. ${p.ciudad}, ${p.estado}, CP ${p.codigoPostal}`}</span>}
        </button>
        <button type="button" className={styles.summary} onClick={(event) => { event.currentTarget.focus(); open("contact"); }} aria-haspopup="dialog" data-complete={completeContact}>
          <RegistrationIcon name="phone" />
          <strong>Contacto de emergencia</strong>
          <span className={styles.identityAction}>{completeContact ? "Editar" : "Agregar"}</span>
          <RegistrationIcon name="chevron" />
          {completeContact && <span className="sr-only">{`${p.contactoEmergenciaNombre} · ${formatoTelefonoNacional(p.contactoEmergenciaTelefono)}`}</span>}
        </button>
      </div>
      {sheet === "address" && <RegistrationSheet title="Domicilio" kind="address" onClose={close} onSave={saveAddress} saving={loadingCp}>
        <DenseField etiqueta="Código postal" inputMode="numeric" autoComplete="postal-code" value={address.codigoPostal} onChange={(e) => void changePostalCode(e.target.value)} maxLength={5} error={errors.codigoPostal} />
        <div className={styles.row}>
          <DenseField etiqueta="Estado" autoComplete="address-level1" value={address.estado} onChange={(e) => changeAddress("estado", e.target.value)} error={errors.estado} />
          {cities.length ? <SelectField dense etiqueta="Ciudad o municipio" value={address.ciudad} onChange={(v) => changeAddress("ciudad", v)} opciones={cities} placeholder="Selecciona" error={errors.ciudad} /> : <DenseField etiqueta="Ciudad o municipio" autoComplete="address-level2" value={address.ciudad} onChange={(e) => changeAddress("ciudad", e.target.value)} error={errors.ciudad} />}
        </div>
        {colonies.length ? <SelectField dense etiqueta="Colonia" value={address.colonia} onChange={(v) => changeAddress("colonia", v)} opciones={colonies} placeholder="Selecciona" error={errors.colonia} /> : <DenseField etiqueta="Colonia" value={address.colonia} onChange={(e) => changeAddress("colonia", e.target.value)} error={errors.colonia} />}
        <div className={styles.row}>
          <DenseField etiqueta="Calle" autoComplete="address-line1" value={address.calle} onChange={(e) => changeAddress("calle", e.target.value)} error={errors.calle} />
          <DenseField etiqueta="Número" value={address.numero} onChange={(e) => changeAddress("numero", e.target.value)} error={errors.numero} />
        </div>
        <DenseField etiqueta="Referencias" value={address.referencias} onChange={(e) => changeAddress("referencias", e.target.value)} error={errors.referencias} />
        <p className={styles.sheetError} role="status">{loadingCp ? "Buscando domicilio…" : Object.values(errors).find(Boolean) || lookupMessage}</p>
      </RegistrationSheet>}
      {sheet === "contact" && <RegistrationSheet title="Contacto de emergencia" kind="contact" onClose={close} onSave={saveContact}>
        <DenseField etiqueta="Nombre del contacto" value={contact.contactoEmergenciaNombre} onChange={(e) => setContact((previous) => ({ ...previous, contactoEmergenciaNombre: e.target.value }))} error={errors.contactoEmergenciaNombre} autoComplete="off" />
        <DenseField etiqueta="Teléfono del contacto" type="tel" inputMode="tel" value={formatoTelefonoNacional(contact.contactoEmergenciaTelefono)} onChange={(e) => setContact((previous) => ({ ...previous, contactoEmergenciaTelefono: soloDigitos(e.target.value) }))} error={errors.contactoEmergenciaTelefono} autoComplete="off" />
        <p className={styles.sheetError} role="status">{Object.values(errors).find(Boolean)}</p>
      </RegistrationSheet>}
    </fieldset>
  );
}
