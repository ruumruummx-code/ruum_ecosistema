import { forwardRef, useId, type ReactNode } from "react";
import { LogoMarca, type LogoVariante } from "@ruum/ui";

const fondoPublico = "bg-surface-elevated";
const fondoPublicoTransparente = "bg-surface";
const bordePublico = "border-border";
const campoPublico = "bg-surface";
const textoSecundarioPublico = "text-text-secondary";
const textoFuncionalPublico = "text-text-tertiary";
const focoPublico = "focus:border-[var(--ruum-teal-deep)] focus:ring-[var(--ruum-teal)]/25";
const focoAcentoPublico = "focus-visible:ring-focus focus-visible:ring-offset-surface";

export function PantallaPublica({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`user-v2-scope user-v2-page user-v2-secondary-screen ruum-auth-shell ruum-public-shell min-h-screen ${fondoPublico} px-4 text-text-primary sm:px-6 ${className}`}>
      <div className={`ruum-public-shell__content relative mx-auto min-h-screen w-full max-w-md overflow-hidden ${fondoPublicoTransparente} shadow-[var(--ruum-shadow-4)]`}>
        <div
          aria-hidden
          className="ruum-public-shell__overlay pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="relative z-10">{children}</div>
      </div>
    </main>
  );
}

export function LogoRuum({
  variante = "vertical",
  className = ""
}: {
  variante?: LogoVariante;
  className?: string;
}) {
  return (
    <LogoMarca
      variante={variante}
      tema="auto"
      className={className}
      mostrarDescriptor
      mostrarRespaldo
    />
  );
}

export const campoOscuro =
  `w-full rounded-lg border ${bordePublico} ${campoPublico} px-3.5 py-2.5 font-body text-sm text-text-primary outline-none transition placeholder:text-text-tertiary ${focoPublico}`;

export const etiquetaOscura = `font-body text-xs font-medium ${textoSecundarioPublico}`;
export const botonAzul =
  `ruum-public-primary-button inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg px-5 py-3 font-display text-sm font-bold text-[var(--ruum-navy)] outline-none transition duration-200 hover:-translate-y-0.5 hover:brightness-95 focus-visible:ring-2 ${focoAcentoPublico} focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45`;
export const botonContorno =
  `inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-5 py-3 font-display text-sm font-bold text-text-primary outline-none transition hover:border-signal hover:bg-signal/10 focus-visible:ring-2 ${focoAcentoPublico} focus-visible:ring-offset-2`;

/**
 * Campo de texto de la experiencia pública.
 *
 * ACC-4 (auditoría): no aceptaba estado de error, lo que obligaba a los
 * formularios a pintar el error como Aviso global, sin association semántica
 * con el campo (WCAG 3.3.1 Error Identification). Ahora setea
 * `aria-invalid` y enlaza el mensaje con `aria-describedby`.
 *
 * ACC-18: el id se derivaba del texto de la etiqueta, lo que puede colisionar
 * si dos campos comparten etiqueta en la misma página. `useId` garantiza
 * unicidad; la etiqueta solo se usa para el `data-ruum-label` de los tests.
 */
export const CampoOscuro = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    etiqueta: string;
    ayuda?: ReactNode;
    error?: string | null;
  }
>(function CampoOscuro({ etiqueta, ayuda, error, id, ...props }, ref) {
  const idGenerado = useId();
  const inputId = id ?? `campo-${idGenerado}`;
  const ayudaId = ayuda ? `${inputId}-ayuda` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ariaDescribedBy =
    [props["aria-describedby"], ayudaId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={etiquetaOscura}>{etiqueta}</label>
      <input
        {...props}
        ref={ref}
        id={inputId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? true : props["aria-invalid"]}
        data-ruum-label={etiqueta}
        className={`${campoOscuro} ${error ? "border-[var(--ruum-signal)]" : ""} ${props.className ?? ""}`}
      />
      {ayuda ? <span id={ayudaId} className={`font-body text-xs leading-5 ${textoFuncionalPublico}`}>{ayuda}</span> : null}
      {error ? (
        <p id={errorId} role="alert" className="font-body text-xs leading-5 text-[var(--ruum-signal)]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
