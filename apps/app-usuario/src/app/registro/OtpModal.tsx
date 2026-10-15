import type { RefObject } from "react";
import { soloDigitos } from "../../lib/registro-usuario";

/**
 * FIX A1 (ticket arquitectura Fase 4): modal de verificación SMS extraído de
 * `registro/page.tsx` (god-component de ~1000 líneas). Componente puramente
 * presentacional: todo el estado y las llamadas (`enviarOtpSms`,
 * `confirmarCodigoOtp`) siguen en la página; aquí solo render + callbacks.
 */
export interface OtpModalProps {
  telefono: string;
  codigoOtp: string;
  alCambiarCodigo: (codigo: string) => void;
  errorOtp: string | null;
  verificandoOtp: boolean;
  enviandoOtp: boolean;
  segundosReenvio: number;
  alCerrar: () => void;
  alConfirmar: (e: React.FormEvent) => void;
  alReenviar: () => void;
  otpRef: RefObject<HTMLInputElement | null>;
}

export function OtpModal({
  telefono,
  codigoOtp,
  alCambiarCodigo,
  errorOtp,
  verificandoOtp,
  enviandoOtp,
  segundosReenvio,
  alCerrar,
  alConfirmar,
  alReenviar,
  otpRef
}: OtpModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sms-titulo"
      aria-describedby="modal-sms-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl border border-slate-100">
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar modal de verificación"
          className="absolute right-4.5 top-4.5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          ✕
        </button>

        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
          </svg>
        </div>

        <h2 id="modal-sms-titulo" className="text-center text-[20px] font-extrabold tracking-tight text-[#0a2342]">
          Verifica tu número celular
        </h2>
        <p id="modal-sms-desc" className="mt-1 text-center text-[13px] font-medium text-[#4e5f80] leading-relaxed">
          Enviamos un código de 6 dígitos por SMS al número{" "}
          <strong className="font-bold text-[#0a2342]">
            +52 {telefono.length === 10 ? `${telefono.slice(0, 2)} ${telefono.slice(2, 6)} ${telefono.slice(6, 10)}` : telefono}
          </strong>.
        </p>

        <div className="text-center mt-1">
          <button
            type="button"
            onClick={alCerrar}
            className="text-[12px] font-bold text-[#2e5a88] hover:underline cursor-pointer"
          >
            Editar número de teléfono
          </button>
        </div>

        <form onSubmit={alConfirmar} className="mt-5 flex flex-col gap-3.5" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="codigo-sms" className="text-center text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
              Código de verificación SMS
            </label>
            <input
              id="codigo-sms"
              ref={otpRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigoOtp}
              onChange={(e) => alCambiarCodigo(soloDigitos(e.target.value, 6))}
              placeholder="123456"
              className="w-full text-center tracking-[0.35em] font-mono text-2xl font-bold py-3.5 px-4 rounded-2xl border border-slate-300 bg-slate-50 text-[#0a2342] placeholder:text-slate-400 focus:border-[#0a2342] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0a2342]/10 transition"
              required
            />
          </div>

          {errorOtp && (
            <div role="alert" className="rounded-xl bg-red-50 p-3 border border-red-200 text-center">
              <p className="text-xs text-red-700 font-bold">{errorOtp}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={codigoOtp.length !== 6 || verificandoOtp}
            className="w-full rounded-2xl bg-[#0a2342] py-3.5 px-4 text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {verificandoOtp ? "Verificando código…" : "Verificar y continuar"}
          </button>

          <div className="flex flex-col items-center gap-1 pt-1 text-center">
            {segundosReenvio > 0 ? (
              <p className="text-[12px] font-medium text-[#4e5f80]">
                Reenviar código en <span className="font-bold text-[#0a2342]">{segundosReenvio}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={alReenviar}
                disabled={enviandoOtp}
                className="text-[12px] font-bold text-[#2e5a88] hover:underline cursor-pointer disabled:opacity-50"
              >
                {enviandoOtp ? "Enviando código…" : "¿No recibiste el código? Reenviar SMS"}
              </button>
            )}
            <span className="text-[11px] font-medium text-[#4e5f80]">
              El código tiene una vigencia de 10 minutos.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
