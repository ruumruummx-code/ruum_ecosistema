import type { SVGProps } from "react";

type IconoProps = SVGProps<SVGSVGElement> & { className?: string };

function base(className = "size-5") {
  return {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function IconoInicio({ className }: IconoProps) {
  return (
    <svg {...base(className)} data-icon="inicio">
      <path d="m3 9.5 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function IconoTraslados({ className }: IconoProps) {
  return <svg {...base(className)}><path d="m4 10 2-6a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 6M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8H3Zm1 8v2h3v-2m10 0v2h3v-2" /><circle cx="7" cy="14" r="1" /><circle cx="17" cy="14" r="1" /></svg>;
}

export function IconoVehiculos({ className }: IconoProps) {
  return <IconoTraslados className={className} />;
}

export function IconoUbicaciones({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconoCargaMasiva({ className }: IconoProps) {
  return <svg {...base(className)}><path d="M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9Zm0 0v7h7M7 13h10M7 17h7" /></svg>;
}

export function IconoCuenta({ className }: IconoProps) {
  return <IconoPerfil className={className} />;
}

export function IconoPerfil({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21H4v-2c0-6 16-6 16 0Z" />
    </svg>
  );
}

export function IconoPreferencias({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconoAyuda({ className }: IconoProps) {
  return <svg {...base(className)}><circle cx="12" cy="12" r="10" /><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1" /></svg>;
}

export function IconoBuscar({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconoCampana({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconoPanelLateral({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9 4v16" />
      <path d="m14 9 3 3-3 3" />
    </svg>
  );
}

export function IconoCerrarSesion({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconoSol({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function IconoLuna({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function IconoFlechaDerecha({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconoChevron({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconoVolver({ className }: IconoProps) {
  return (
    <svg {...base(className)}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}
