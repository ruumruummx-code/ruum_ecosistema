import { SimboloVectorial } from "./LogoMarca";

export type SelloTema = "certificado" | "oscuro" | "claro" | "dorado";
export type SelloTamano = "sm" | "md" | "lg";

export interface SelloConductorProps {
  /**
   * Tema visual (Libro de marca 05-sello-conductor-certificado.png):
   * "certificado" = anillo navy + símbolo RR + swoosh teal sobre claro (vigente).
   * "oscuro" = anillo blanco sobre navy. "claro" = alias de certificado.
   * "dorado" solo compatibilidad (no usar en piezas nuevas: amarillo es semántico).
   */
  tema?: SelloTema;
  tamano?: SelloTamano | number;
  compacto?: boolean;
  lema?: string;
  className?: string;
}

const TAMANOS: Record<SelloTamano, number> = {
  sm: 72,
  md: 96,
  lg: 128,
};

/**
 * Sello de Conductor Certificado (Libro de marca cap. 12 + 05-sello):
 * anillo CONDUCTOR CERTIFICADO · RUUM RUUM + símbolo RR oficial.
 * Mínimo 72px / 24mm. Solo certificación vigente; nivel en chip separado.
 */
export function SelloConductor({
  tema = "certificado",
  tamano = "md",
  compacto = false,
  lema = "",
  className = "",
}: SelloConductorProps) {
  const dimension = Math.max(typeof tamano === "number" ? tamano : TAMANOS[tamano], 72);
  const esDorado = tema === "dorado";
  const enOscuro = tema === "oscuro";

  if (compacto) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 rounded-[12px] border px-3 py-1.5 ${
          enOscuro
            ? "border-[var(--ruum-border)] bg-[var(--ruum-surface)] text-[var(--ruum-text-primary)]"
            : "border-[var(--ruum-teal-deep)]/40 bg-white text-[var(--ruum-navy)]"
        } ${className}`}
        role="img"
        aria-label="Conductor certificado Ruum Ruum"
      >
        <SimboloVectorial tamano={28} tema={enOscuro ? "oscuro" : "claro"} colorDestino={esDorado ? "#F5B400" : "#00D1D1"} />
        <div className="flex flex-col leading-tight">
          <span className="font-body text-xs font-bold uppercase tracking-wider text-[var(--ruum-teal-deep)]">
            Conductor certificado
          </span>
          <span className="font-body text-[10px] font-medium opacity-80">Ruum Ruum by MoviliaX</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`} role="img" aria-label="Sello conductor certificado Ruum Ruum">
      <img
        src="/imagenes/ruum-sello-conductor-certificado.png"
        alt="Sello conductor certificado Ruum Ruum"
        width={dimension}
        height={dimension}
        className={`block h-auto w-auto object-contain ${enOscuro ? "rounded-full bg-[#0A2342] p-1 ring-1 ring-white/20" : ""}`}
        style={{ height: `${dimension}px`, width: "auto" }}
        decoding="async"
      />
      {lema ? (
        <span className="mt-1.5 text-center font-body text-[10px] font-semibold uppercase tracking-wider text-[var(--ruum-muted)]">
          {lema}
        </span>
      ) : null}
    </div>
  );
}
