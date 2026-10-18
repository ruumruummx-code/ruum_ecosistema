import { DenseField } from "./DenseField";
import styles from "./registration.module.css";
import type { fortalezaPassword } from "@ruum/shared/utils";
import { formatoTelefonoNacional, soloDigitos, calcularCursorTelefono } from "./registration-validation";
import { useRef, useState } from "react";
import { RegistrationIcon } from "./RegistrationIcon";

type FortalezaPassword = ReturnType<typeof fortalezaPassword>;

export function AccountStep({
  telefono,
  setTelefono,
  email,
  setEmail,
  password,
  setPassword,
  confirmacionPassword,
  setConfirmacionPassword,
  sesionAutenticada,
  erroresCampos,
  limpiarErrorCampo,
  validarTelefono,
  validarCampo,
  validarPassword,
  validarConfirmacion
}: {
  telefono: string;
  setTelefono: (valor: string) => void;
  email: string;
  setEmail: (valor: string) => void;
  password: string;
  setPassword: (valor: string) => void;
  confirmacionPassword: string;
  setConfirmacionPassword: (valor: string) => void;
  fuerzaPassword: FortalezaPassword;
  sesionAutenticada: boolean;
  erroresCampos: Record<string, string>;
  limpiarErrorCampo: (campo: string) => void;
  validarTelefono: (campo: "telefono" | "contactoEmergenciaTelefono", valor: string, setter: (valor: string) => void) => boolean;
  validarCampo: (campo: "email", valor: string) => boolean;
  validarPassword: () => boolean;
  validarConfirmacion: (valor?: string, base?: string) => boolean;
}) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const requisitosPassword = [
    { label: "Mínimo 8 caracteres", cumplido: password.length >= 8 },
    { label: "Un número", cumplido: /[0-9]/.test(password) },
    { label: "Mayús. y minús.", cumplido: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "Coinciden", cumplido: Boolean(confirmacionPassword) && password === confirmacionPassword }
  ];

  const telefonoInputRef = useRef<HTMLInputElement>(null);
  const valorAnteriorRef = useRef("");

  // Manejar input del teléfono con máscara fluida y cursor inteligente
  const manejarCambioTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const valorNuevo = input.value;
    const cursorPos = input.selectionStart ?? 0;
    
    // Calcular nueva posición del cursor
    const nuevaPosicion = calcularCursorTelefono(valorAnteriorRef.current, valorNuevo, cursorPos);
    
    // Actualizar valor solo con dígitos
    const soloNumeros = soloDigitos(valorNuevo);
    setTelefono(soloNumeros);
    limpiarErrorCampo("telefono");
    
    // Guardar valor para próxima comparación
    valorAnteriorRef.current = valorNuevo;
    
    // Aplicar formato y restaurar cursor
    requestAnimationFrame(() => {
      if (telefonoInputRef.current) {
        telefonoInputRef.current.value = formatoTelefonoNacional(soloNumeros);
        telefonoInputRef.current.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }
    });
  };

  return (
    <fieldset className={[styles.fields, styles.account].join(" ")}>
      <legend className="sr-only">Datos de cuenta</legend>
      <DenseField etiqueta="Teléfono" type="tel" inputMode="tel" placeholder="10 dígitos"
        leading={<span className={styles.countryPicker}>
          <svg width="27" height="18" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="2" fill="#fff" /><path d="M2 0h8v20H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Z" fill="#006847" /><path d="M20 0h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-8Z" fill="#ce1126" /><path d="m13 8 3-2 1 4-2 2-2-2m-2 2q4 6 8 0" fill="#916e35" stroke="#497446" strokeWidth="1" /></svg>
          <span aria-hidden="true">⌄</span>
          <select className={styles.countryCode} aria-label="Código de país" defaultValue="+52"><option value="+52">México (+52)</option></select>
        </span>}
        trailing={<RegistrationIcon name="phone" />}
        value={formatoTelefonoNacional(telefono)} onChange={manejarCambioTelefono}
        onBlur={() => validarTelefono("telefono", telefono, setTelefono)}
        error={erroresCampos.telefono} required autoComplete="tel-national" ref={telefonoInputRef} enterKeyHint="next" />
      <DenseField etiqueta="Correo" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        placeholder="tu@correo.com" leading={<RegistrationIcon name="mail" />}
        value={email} onChange={(e) => { setEmail(e.target.value); limpiarErrorCampo("email"); }}
        onBlur={() => validarCampo("email", email)} error={erroresCampos.email}
        required autoComplete="email" readOnly={sesionAutenticada} enterKeyHint="next" />
      {!sesionAutenticada && <>
        <DenseField etiqueta="Contraseña" type={mostrarPassword ? "text" : "password"} value={password}
          aria-describedby="requisitos-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="Mínimo 8 caracteres" leading={<RegistrationIcon name="lock" />}
          trailing={<button type="button" className={styles.passwordToggle} aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrarPassword} onClick={() => setMostrarPassword((actual) => !actual)}><RegistrationIcon name={mostrarPassword ? "eye-off" : "eye"} /></button>}
          onChange={(e) => { const valor = e.target.value; setPassword(valor); limpiarErrorCampo("password"); if (confirmacionPassword) validarConfirmacion(confirmacionPassword, valor); }}
          onBlur={() => validarPassword()} error={erroresCampos.password} required minLength={8} autoComplete="new-password" enterKeyHint="next" />
        <DenseField etiqueta="Confirmar contraseña" type={mostrarConfirmacion ? "text" : "password"} value={confirmacionPassword}
          aria-describedby="requisitos-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="Repite tu contraseña" leading={<RegistrationIcon name="lock" />}
          trailing={<button type="button" className={styles.passwordToggle} aria-label={mostrarConfirmacion ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"} aria-pressed={mostrarConfirmacion} onClick={() => setMostrarConfirmacion((actual) => !actual)}><RegistrationIcon name={mostrarConfirmacion ? "eye-off" : "eye"} /></button>}
          onChange={(e) => { setConfirmacionPassword(e.target.value); validarConfirmacion(e.target.value, password); }}
          error={erroresCampos.confirmacionPassword} required minLength={8} autoComplete="new-password" enterKeyHint="go" />
        <div className={styles.passwordRequirements}>
        <p>Tu contraseña debe:</p>
        <ul id="requisitos-password" className={styles.rules} aria-label="Requisitos de contraseña">
          {requisitosPassword.map((req) => <li key={req.label} data-met={req.cumplido}>
            <span className={styles.ruleIndicator} aria-hidden="true">{req.cumplido ? "✓" : ""}</span>{req.label}<span className="sr-only">{req.cumplido ? ": cumplido" : ": pendiente"}</span>
          </li>)}
        </ul>
        </div>
      </>}
    </fieldset>
  );
}
