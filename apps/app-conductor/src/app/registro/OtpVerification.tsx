import { useEffect, useRef, type FormEvent } from "react";
import { soloDigitos } from "./registration-validation";
import { RegistrationAccessHeader } from "./RegistrationAccessHeader";
import { RegistrationIcon } from "./RegistrationIcon";
import styles from "./registration.module.css";

export function OtpVerification({
  email,
  codigoOtp,
  setCodigoOtp,
  errorOtp,
  clearErrorOtp,
  verificandoOtp,
  reenviandoOtp,
  esperaReenvioOtp,
  codigoLongitud,
  intentosFallidos = 0,
  maxIntentos = 5,
  onSubmit,
  onResend,
  onAlreadyConfirmed,
  onBack
}: {
  email: string;
  codigoOtp: string;
  setCodigoOtp: (valor: string) => void;
  errorOtp: string | null;
  clearErrorOtp: () => void;
  verificandoOtp: boolean;
  reenviandoOtp: boolean;
  esperaReenvioOtp: number;
  codigoLongitud: number;
  intentosFallidos?: number;
  maxIntentos?: number;
  onSubmit: (event: FormEvent) => void;
  onResend: () => void;
  onAlreadyConfirmed: () => void;
  onBack: () => void;
}) {
  const bloqueado = intentosFallidos >= maxIntentos;
  const restantes = Math.max(0, maxIntentos - intentosFallidos);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!bloqueado && !verificandoOtp) inputRef.current?.focus({ preventScroll: true });
  }, [bloqueado, verificandoOtp]);

  function actualizarCodigo(valor: string) {
    setCodigoOtp(soloDigitos(valor, codigoLongitud));
    if (errorOtp) clearErrorOtp();
  }

  return (
    <>
      <RegistrationAccessHeader step={2} onBack={onBack} />
      <form className={`${styles.form} ${styles.otpForm}`} onSubmit={(event) => {
        if (verificandoOtp || reenviandoOtp || bloqueado || !new RegExp(`^\\d{${codigoLongitud}}$`).test(codigoOtp)) { event.preventDefault(); return; }
        onSubmit(event);
      }}>
        <div className={`${styles.accountIntro} ${styles.otpIntro}`}>
          <h1 id="titulo-registro-conductor">Confirma tu correo</h1>
          <p>Enviamos un código de {codigoLongitud} dígitos a <strong>{email.trim().toLowerCase()}</strong></p>
          <p>Escríbelo aquí para activar tu cuenta y subir tus documentos sin salir de la app.</p>
        </div>

        <div className={styles.otpEntry}>
          <label htmlFor="codigo-verificacion">Código de verificación <span aria-hidden="true">*</span></label>
          <div className={styles.otpCode} data-invalid={Boolean(errorOtp)}>
            <div className={styles.otpSlots} aria-hidden="true">
              {Array.from({ length: codigoLongitud }, (_, index) => <span key={index}>{codigoOtp[index] || "_"}</span>)}
            </div>
            <input id="codigo-verificacion" name="codigo-verificacion" ref={inputRef}
              type="text" inputMode="numeric" pattern={`[0-9]{${codigoLongitud}}`} autoComplete="one-time-code"
              autoCapitalize="none" spellCheck={false} maxLength={codigoLongitud} value={codigoOtp}
              onChange={(event) => actualizarCodigo(event.target.value)}
              onPaste={(event) => { event.preventDefault(); actualizarCodigo(event.clipboardData.getData("text")); }}
              required disabled={bloqueado || verificandoOtp}
              aria-invalid={Boolean(errorOtp)} aria-describedby={`ayuda-codigo${errorOtp || bloqueado ? " error-codigo" : ""}`} />
          </div>
          <p id="ayuda-codigo" className={styles.otpHelp}>Revisa también tu carpeta de spam o promociones.</p>
          {(errorOtp || bloqueado) && <p id="error-codigo" className={styles.otpError} role="alert">
            {errorOtp || `Has agotado los ${maxIntentos} intentos. Solicita un nuevo código.`}
          </p>}
          {!errorOtp && intentosFallidos > 0 && !bloqueado && <p className={styles.otpHelp}>Te quedan {restantes} intentos.</p>}
        </div>

        <div className={styles.otpResend}>
          <button
            type="button"
            onClick={onResend}
            disabled={esperaReenvioOtp > 0 || reenviandoOtp || verificandoOtp}
          >
            {reenviandoOtp
              ? "Reenviando…"
              : esperaReenvioOtp > 0
                ? `Reenviar código (${esperaReenvioOtp}s)`
                : "Reenviar código"}
          </button>
        </div>
        <footer className={styles.actionFooter}>
          <button type="submit" className={styles.primary} aria-busy={verificandoOtp} disabled={verificandoOtp || reenviandoOtp || codigoOtp.length !== codigoLongitud || bloqueado}>
            {verificandoOtp ? "Verificando…" : "Confirmar y activar"}<RegistrationIcon name="arrow" />
          </button>
          <button
            type="button"
            onClick={onAlreadyConfirmed}
            disabled={verificandoOtp}
            className={styles.otpAlreadyConfirmed}
          >
            Ya confirmé desde el enlace del correo
          </button>
        </footer>
      </form>
    </>
  );
}
