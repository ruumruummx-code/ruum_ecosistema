import type { ImgHTMLAttributes, SVGProps } from "react";

export type LogoVariante = "horizontal" | "vertical" | "simbolo" | "avatar" | "sello" | "version-navy";
export type LogoTema = "oscuro" | "claro" | "monocromatico" | "auto";

export interface LogoMarcaProps {
  /**
   * Variante gráfica del logotipo (Libro de marca, `ruum-ruum-versiones-marca.png`):
   * - "horizontal": símbolo + Ruum Ruum + DRIVEAWAY SERVICE. B2B / contratos / web / encabezados.
   * - "vertical": símbolo arriba + nombre + firma. Portadas / carteles.
   * - "simbolo": solo monograma RR con swoosh turquesa + pin. Avatar / app-icon / favicon.
   * - "avatar": símbolo sobre superficie clara, radio ≈24%. WhatsApp / redes / perfiles.
   * - "sello": anillo CONDUCTOR CERTIFICADO RUUM RUUM + símbolo. Solo certificación vigente.
   * - "version-navy": lockup blanco sobre navy. Solo piezas institucionales sobre oscuro.
   *
   * Mínimos: símbolo 32px · horizontal sin firma 96px · con firma 160px ·
   * sello 72px · avatar 48px. Área de seguridad = x (altura R) por lado.
   */
  variante?: LogoVariante;
  /**
   * Contraste:
   * - "auto": adapta navy→blanco según `[data-theme]` (por defecto).
   * - "oscuro": fuerza versión clara (para fondos oscuros / navy).
   * - "claro": fuerza versión navy (para fondos claros).
   * - "monocromatico": un solo tono neutro.
   */
  tema?: LogoTema;
  /** Alto objetivo en px del lockup. La firma corta solo se muestra ≥160px. */
  tamano?: number;
  /** Respaldo 'by MoviliaX' (documentos formales). */
  mostrarRespaldo?: boolean;
  /** Firma corta oficial. Por defecto 'DRIVEAWAY SERVICE'. */
  mostrarDescriptor?: boolean;
  /** Texto personalizado para la firma (por defecto 'DRIVEAWAY SERVICE'). */
  descriptor?: string;
  /** Subtítulo o lema adicional. */
  subtitulo?: string;
  /** Color de apoyo para el pin (compatibilidad; por defecto teal gráfico). */
  color?: "signal" | "route" | "control";
  className?: string;
  /** Conservado por compatibilidad; el símbolo oficial no usa progreso. */
  progreso?: number;
}

const SRC = {
  horizontal: "/imagenes/ruum-logo-header.png",
  vertical: "/imagenes/ruum-logo-header.png",
  simbolo: "/imagenes/ruum-logo-simbolo.png",
  avatar: "/imagenes/ruum-logo-avatar.png",
  sello: "/imagenes/ruum-sello-conductor-certificado.png",
  "version-navy": "/imagenes/ruum-logo-version-navy.png",
} as const;

const ALT: Record<LogoVariante, string> = {
  horizontal: "Ruum Ruum — Driveaway Service",
  vertical: "Ruum Ruum — Driveaway Service",
  simbolo: "Símbolo oficial Ruum Ruum — RR entrelazado con ruta y pin de entrega",
  avatar: "Avatar oficial Ruum Ruum sobre superficie clara",
  sello: "Sello conductor certificado Ruum Ruum",
  "version-navy": "Ruum Ruum — versión blanca sobre navy",
};

function ImagenAdaptativa({
  variante,
  tamano,
  className,
  eager = false,
}: {
  variante: LogoVariante;
  tamano: number;
  className?: string;
  eager?: boolean;
}) {
  const base: ImgHTMLAttributes<HTMLImageElement> = {
    alt: ALT[variante],
    height: variante === "horizontal" ? Math.round(tamano * 0.326) : tamano,
    decoding: eager ? "sync" : "async",
  };
  // Lockups horizontal/vertical: PNG navy en claro, versión blanca en oscuro.
  if (variante === "horizontal" || variante === "vertical") {
    return (
      <span className={`inline-flex shrink-0 items-center ${className ?? ""}`}>
        <img
          {...base}
          src={SRC.horizontal}
          className="ruum-logo-light block h-auto w-auto object-contain"
          style={{ height: `${tamano}px`, width: "auto", maxWidth: "min(68vw, 320px)" }}
        />
        <img
          {...base}
          alt=""
          aria-hidden
          role="presentation"
          src={SRC["version-navy"]}
          className="ruum-logo-dark h-auto w-auto object-contain"
          style={{ height: `${tamano}px`, width: "auto", maxWidth: "min(68vw, 320px)" }}
        />
      </span>
    );
  }
  return (
    <img
      {...base}
      src={SRC[variante]}
      className={`block h-auto w-auto shrink-0 object-contain ${className ?? ""}`}
      style={{ height: `${tamano}px`, width: "auto" }}
    />
  );
}

/**
 * Monograma vectorial RR (respaldo sin PNG): RR bold inclinado + corte
 * carretera + swoosh turquesa 00D1D1 + pin. En `auto` usa
 * `--ruum-logo-rr` / `--ruum-logo-bg` (navy en claro, blanco en oscuro).
 */
export function SimboloVectorial({
  tamano = 36,
  tema = "auto",
  colorDestino = "#00D1D1",
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & {
  tamano?: number;
  tema?: LogoTema;
  colorDestino?: string;
  className?: string;
}) {
  const esClaro = tema === "claro";
  const esOscuro = tema === "oscuro";
  const esMono = tema === "monocromatico";

  const navy = "#0A2342";
  const teal = "#00D1D1";
  const white = "#FFFFFF";
  const colorFondo = esMono
    ? "none"
    : esClaro
      ? white
      : esOscuro
        ? navy
        : "var(--ruum-logo-bg, #FFFFFF)";
  const colorRR = esMono
    ? "currentColor"
    : esClaro
      ? navy
      : esOscuro
        ? white
        : "var(--ruum-logo-rr, #0A2342)";
  const colorSwoosh = esMono ? "currentColor" : teal;
  const colorPin = esMono ? "currentColor" : colorDestino;
  const showFondo = !esMono;

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Símbolo oficial Ruum Ruum — RR entrelazado con ruta y pin de entrega"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {showFondo && <circle cx="36" cy="36" r="34" fill={colorFondo} />}
      <g transform="skewX(-6)">
        <text
          x="12"
          y="47"
          fill={colorRR}
          fontFamily="Inter, Arial, sans-serif"
          fontSize="30"
          fontWeight="800"
          letterSpacing="-4"
        >
          RR
        </text>
      </g>
      <path d="M33 12 L39 12 L31 60 L25 60 Z" fill={showFondo ? colorFondo : white} opacity={esMono ? 0 : 1} aria-hidden />
      <path
        d="M31 8 C 33 22, 40 34, 52 44 C 56 47, 59 49, 61 50"
        fill="none"
        stroke={colorSwoosh}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <g transform="translate(57, 42)">
        <path
          d="M8 0 a8 8 0 1 0 0.01 0 M8 14.5 L3.5 8.2 a5.2 5.2 0 1 1 9 0 Z"
          fill={colorPin}
        />
        <circle cx="8" cy="8" r="2.6" fill={showFondo ? colorFondo : white} />
      </g>
    </svg>
  );
}

export function LogoMarca({
  variante = "horizontal",
  tema = "auto",
  tamano,
  mostrarRespaldo = false,
  mostrarDescriptor = true,
  descriptor = "DRIVEAWAY SERVICE",
  subtitulo,
  color = "signal",
  className = ""
}: LogoMarcaProps) {
  const colorDestino = color === "route" ? "#0066FF" : color === "control" ? "#16805A" : "#00D1D1";
  void colorDestino;

  // Sello oficial con anillo (mínimo 72px): usar PNG maestro del Libro de marca.
  if (variante === "sello") {
    const t = Math.max(tamano ?? 80, 72);
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        <ImagenAdaptativa variante="sello" tamano={t} eager />
        {subtitulo && (
          <span className="mt-1.5 text-center font-body text-[10px] font-semibold uppercase tracking-wider text-[var(--ruum-muted)]">
            {subtitulo}
          </span>
        )}
      </span>
    );
  }

  // Versión blanca sobre navy: solo piezas institucionales sobre oscuro.
  if (variante === "version-navy") {
    return (
      <span className={`inline-flex items-center rounded-[12px] bg-[#0A2342] px-3 py-2 ${className}`}>
        <ImagenAdaptativa variante="version-navy" tamano={tamano ?? 36} eager />
      </span>
    );
  }

  // Símbolo / avatar: PNG oficial (cap. 12: símbolo 50–60% ancho, radio ≈24%).
  if (variante === "simbolo" || variante === "avatar") {
    const tamanoSimbolo = tamano ?? (variante === "avatar" ? 48 : 32);
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <ImagenAdaptativa variante={variante} tamano={tamanoSimbolo} eager={variante === "avatar"} />
      </span>
    );
  }

  // Lockups horizontal / vertical con PNG theme-aware.
  const alto = tamano ?? (variante === "vertical" ? 48 : 36);
  // Firma corta solo ≥160px de ancho aprox. (≈48px de alto en horizontal).
  const conFirma = mostrarDescriptor && descriptor && alto >= 28;
  const vertical = variante === "vertical";

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${vertical ? "flex-col text-center" : ""} ${className}`}>
      <ImagenAdaptativa variante={variante} tamano={alto} eager />
      {conFirma && (
        <span
          aria-hidden
          className="shrink-0 font-body text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ruum-logo-descriptor,#008B8B)]"
        >
          {descriptor}
        </span>
      )}
      {subtitulo && (
        <span className="shrink-0 font-body text-[10px] font-medium text-[var(--ruum-text-secondary)]">
          {subtitulo}
        </span>
      )}
      {mostrarRespaldo && (
        <span className="shrink-0 font-body text-[10px] font-medium text-[var(--ruum-text-tertiary)]">
          by MoviliaX
        </span>
      )}
    </span>
  );
}
