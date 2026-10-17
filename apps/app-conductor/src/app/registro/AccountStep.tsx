import { DenseField } from "./DenseField";
import styles from "./registration.module.css";
import type { fortalezaPassword } from "@ruum/shared/utils";
import { formatoTelefonoNacional, soloDigitos, calcularCursorTelefono } from "./registration-validation";
import { useRef } from "react";

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
  const requisitosPassword = [
    { label: "8 caracteres", cumplido: password.length >= 8 },
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
        value={formatoTelefonoNacional(telefono)} onChange={manejarCambioTelefono}
        onBlur={() => validarTelefono("telefono", telefono, setTelefono)}
        error={erroresCampos.telefono} required autoComplete="tel-national" ref={telefonoInputRef} enterKeyHint="next" />
      <DenseField etiqueta="Correo" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        value={email} onChange={(e) => { setEmail(e.target.value); limpiarErrorCampo("email"); }}
        onBlur={() => validarCampo("email", email)} error={erroresCampos.email}
        required autoComplete="email" readOnly={sesionAutenticada} enterKeyHint="next" />
      {!sesionAutenticada && <>
        <DenseField etiqueta="Contraseña" type="password" value={password}
          onChange={(e) => { const valor = e.target.value; setPassword(valor); limpiarErrorCampo("password"); if (confirmacionPassword) validarConfirmacion(confirmacionPassword, valor); }}
          onBlur={() => validarPassword()} error={erroresCampos.password} required minLength={8} autoComplete="new-password" enterKeyHint="next" />
        <DenseField etiqueta="Confirmar contraseña" type="password" value={confirmacionPassword}
          onChange={(e) => { setConfirmacionPassword(e.target.value); validarConfirmacion(e.target.value, password); }}
          error={erroresCampos.confirmacionPassword} required minLength={8} autoComplete="new-password" enterKeyHint="go" />
        <ul className={styles.rules} aria-label="Requisitos de contraseña">
          {requisitosPassword.map((req) => <li key={req.label} data-met={req.cumplido}>
            <span aria-hidden="true">{req.cumplido ? "✓" : "○"}</span>{req.label}<span className="sr-only">{req.cumplido ? ": cumplido" : ": pendiente"}</span>
          </li>)}
        </ul>
      </>}
    </fieldset>
  );
}
