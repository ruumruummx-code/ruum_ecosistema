"use client";

import Link from "next/link";
import type { PasaporteRow } from "./panel-utils";
import type { Disponibilidad } from "./usePanelData";

interface PanelOpportunitiesCardProps {
  disponibilidad: Disponibilidad;
  TrasladosDisponibles: PasaporteRow[];
  ultimaActualizacion?: Date | null;
  refrescando?: boolean;
  onRecargar?: () => void;
  onActivar?: () => void;
}

function DesktopBannerIllustration() {
  return (
    <div className="pointer-events-none relative hidden h-[170px] w-[320px] shrink-0 select-none items-center justify-end md:flex lg:w-[360px]" aria-hidden="true">
      <svg viewBox="0 0 360 180" className="h-full w-full overflow-visible" fill="none">
        {/* Silueta de ciudad al fondo */}
        <rect x="10" y="72" width="32" height="88" rx="3" fill="#C4D7F2" opacity="0.55" />
        <rect x="48" y="46" width="42" height="114" rx="4" fill="#C4D7F2" opacity="0.65" />
        <rect x="96" y="84" width="28" height="76" rx="3" fill="#C4D7F2" opacity="0.45" />
        <rect x="276" y="54" width="38" height="106" rx="4" fill="#C4D7F2" opacity="0.6" />
        <rect x="320" y="78" width="28" height="82" rx="3" fill="#C4D7F2" opacity="0.45" />
        <line x1="0" y1="160" x2="360" y2="160" stroke="#B6CDF0" strokeWidth="2" />

        {/* Mapa plegado en perspectiva */}
        <g transform="translate(115, 42)">
          <polygon points="0,88 22,18 66,30 46,102" fill="#F4F8FE" stroke="#B8CFF0" strokeWidth="1.5" />
          <polygon points="66,30 110,14 94,88 46,102" fill="#E3EEFC" stroke="#B8CFF0" strokeWidth="1.5" />
          <polygon points="110,14 152,28 134,100 94,88" fill="#F8FBFF" stroke="#B8CFF0" strokeWidth="1.5" />
          {/* Trazos de calles en el mapa */}
          <path d="M16 58 L56 68 L100 52 L140 64" stroke="#BFD5F5" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M34 32 L20 86" stroke="#D0E1F9" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 26 L72 90" stroke="#C6DBF7" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Pin de ubicación azul principal */}
        <g transform="translate(192, 10)">
          <path
            d="M28 0C12.54 0 0 12.54 0 28c0 18.2 24.4 40.6 25.44 41.54a3.8 3.8 0 0 0 5.12 0C31.6 68.6 56 46.2 56 28 56 12.54 43.46 0 28 0Z"
            fill="#0066FF"
          />
          <circle cx="28" cy="27" r="11" fill="#FFFFFF" />
        </g>

        {/* Sombra bajo el vehículo */}
        <ellipse cx="222" cy="158" rx="68" ry="8" fill="#9BB8E3" opacity="0.55" />

        {/* Vehículo SUV blanco moderno */}
        <g transform="translate(152, 92)">
          {/* Carrocería base */}
          <path
            d="M12 44 L22 16 C25 9 32 5 42 5 L92 5 C102 5 110 10 116 20 L132 32 C137 35 140 40 140 46 L140 56 C140 60 136 63 131 63 L12 63 C7 63 4 59 4 54 L4 48 C4 45 7 44 12 44 Z"
            fill="#FFFFFF"
            stroke="#DCE7F7"
            strokeWidth="1.5"
          />
          {/* Cristales / parabrisas navy oscuro */}
          <path d="M28 19 C30 12 35 10 43 10 L68 10 L68 30 L23 30 Z" fill="#0A2342" />
          <path d="M73 10 L93 10 C100 10 106 14 111 23 L114 30 L73 30 Z" fill="#0A2342" />
          {/* Parrilla frontal y faros */}
          <rect x="118" y="38" width="18" height="10" rx="3" fill="#0A2342" />
          <rect x="104" y="36" width="11" height="6" rx="2.5" fill="#DCE8FC" />
          <path d="M114 54 L136 54 L134 59 L112 59 Z" fill="#0A2342" />
          {/* Detalle lateral */}
          <path d="M22 48 L92 48" stroke="#D5E3F7" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ruedas */}
          <circle cx="34" cy="60" r="12" fill="#0A2342" />
          <circle cx="34" cy="60" r="6" fill="#DCE8FC" />
          <circle cx="102" cy="60" r="12" fill="#0A2342" />
          <circle cx="102" cy="60" r="6" fill="#DCE8FC" />
        </g>
      </svg>
    </div>
  );
}

export function PanelOpportunitiesCard({
  disponibilidad,
  TrasladosDisponibles,
  refrescando = false,
  onRecargar,
  onActivar,
}: PanelOpportunitiesCardProps) {
  const disponible = disponibilidad === "disponible";
  const cantidad = TrasladosDisponibles.length;
  const primerViaje = TrasladosDisponibles[0];

  const titulo = !disponible
    ? "Activa tu disponibilidad"
    : cantidad > 0
      ? `${cantidad} traslado${cantidad > 1 ? "s" : ""} disponible${cantidad > 1 ? "s" : ""}`
      : "Sin traslados por ahora";

  const descripcionMovil = !disponible
    ? "Activa tu estado para recibir solicitudes cercanas."
    : cantidad > 0
      ? `${primerViaje?.origen_ciudad || "Origen"} → ${primerViaje?.destino_ciudad || "Destino"}`
      : "Te avisaremos con sonido cuando haya traslados.";

  const descripcionDesktop = !disponible
    ? "Activa tu estado para recibir solicitudes cercanas."
    : cantidad > 0
      ? `${primerViaje?.origen_ciudad || "Origen"} → ${primerViaje?.destino_ciudad || "Destino"}`
      : "Te avisaremos con sonido cuando haya solicitudes.";

  const buscar = () => {
    onRecargar?.();
  };

  return (
    <section
      className="driver-opportunity-card relative overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white p-4 shadow-[0_5px_20px_rgba(13,43,94,0.05)] md:border-[#D5E4FA] md:bg-gradient-to-r md:from-[#DCE8FA] md:via-[#E3EEFD] md:to-[#D5E4FA] md:p-7 md:shadow-none lg:p-8"
      aria-labelledby="titulo-oportunidades"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="min-w-0 flex-1 md:max-w-[360px]">
          <div className="flex items-center gap-3.5 md:block">
            <span
              className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8F1FE] text-[#0066FF] md:hidden"
              aria-hidden="true"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
                <path d="M9 3v15m6-12v15" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="titulo-oportunidades"
                className="font-display text-lg font-black leading-tight text-[#0A2342] md:text-[30px] md:leading-[1.12] lg:text-[32px]"
              >
                {titulo}
              </h2>
              <p className="mt-1 font-body text-sm leading-5 text-[#566889] md:hidden">
                {descripcionMovil}
              </p>
              <p className="mt-2.5 hidden font-body text-[15px] leading-relaxed text-[#4A607A] md:block">
                {descripcionDesktop}
              </p>
            </div>
          </div>

          {!disponible ? (
            <button
              type="button"
              onClick={onActivar}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-[#0066FF] px-5 font-display text-[15px] font-bold text-white shadow-md shadow-[#0066FF]/20 transition hover:bg-[#0052CC] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] md:mt-5 md:w-auto md:rounded-full md:px-7"
            >
              <span>Activarme ahora</span>
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </button>
          ) : (
            <Link
              href="/viajes"
              onClick={buscar}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#0066FF] px-5 font-display text-[15px] font-bold text-white shadow-md shadow-[#0066FF]/20 transition hover:bg-[#0052CC] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] md:mt-5 md:w-auto md:rounded-full md:px-7"
            >
              <span>{refrescando ? "Buscando traslados…" : "Buscar traslados ahora"}</span>
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </Link>
          )}
        </div>

        <DesktopBannerIllustration />
      </div>
    </section>
  );
}
