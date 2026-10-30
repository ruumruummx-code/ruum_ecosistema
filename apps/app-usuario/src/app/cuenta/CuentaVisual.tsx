"use client";
import { useId, useState, type SVGProps } from "react";
import Image from "next/image";
import s from "./cuenta-desktop.module.css";
const paths = {
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 22v-3c0-7 18-7 18 0v3Z",
  car: "m4 10 2-6h12l2 6M3 10h18v9H3Zm2 9v2m14-2v2M6 14h2m8 0h2",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-5 10 3 3 7-7",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  calendar: "M4 5h16v16H4Zm0 5h16M8 2v6m8-6v6",
  edit: "m15 3 6 6-12 12H3v-6Zm-2 2 6 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  lock: "M5 10h14v12H5Zm3 0V6a4 4 0 0 1 8 0v4m-4 5v3",
  card: "M3 4h18v16H3Zm0 5h18M6 15h5",
  bell: "M5 17h14l-2-4V8A5 5 0 0 0 7 8v5Zm5 4h4M12 1v2",
  mail: "M3 5h18v14H3Zm0 1 9 7 9-7",
  phone: "m7 3 3 5-3 3a16 16 0 0 0 6 6l3-3 5 3c-1 9-16 1-18-10-1-3 1-4 4-4Z",
  globe:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c-6 7-6 13 0 20 6-7 6-13 0-20",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  home: "m2 11 10-9 10 9M5 9v13h5v-7h4v7h5V9",
  file: "M14 2H5v20h14V7Zm0 0v6h5M8 12h8M8 16h6",
  device: "M3 3h18v13H3Zm9 13v5m-5 1h10",
  check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-14 0 3 3 7-7",
  close: "m5 5 14 14M19 5 5 19",
  logout: "M9 3H3v18h6M9 12h13m-5-5 5 5-5 5",
  refresh: "M20 8a9 9 0 0 0-15-3L2 8m0-6v6h6m-4 8a9 9 0 0 0 15 3l3-3m0 6v-6h-6",
} as const;
export type CuentaIconName = keyof typeof paths;
export function CuentaIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: CuentaIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function AvatarCuenta({
  url,
  nombre,
  iniciales,
}: {
  url: string | null;
  nombre: string;
  iniciales: string;
}) {
  const [error, setError] = useState(false);
  return (
    <span className={s.avatar}>
      {url && !error ? (
        <Image
          src={url}
          width={192}
          height={192}
          alt={`Foto de ${nombre}`}
          unoptimized
          onError={() => setError(true)}
        />
      ) : (
        <span aria-label={`Iniciales de ${nombre}`}>{iniciales}</span>
      )}
    </span>
  );
}
export function EscudoCuenta({ verificado }: { verificado: boolean }) {
  const id = useId();
  return (
    <svg
      className={s.shieldArt}
      viewBox="0 0 120 140"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          x1="25"
          y1="14"
          x2="100"
          y2="125"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8ec8ff" />
          <stop offset="1" stopColor="#2486ff" />
        </linearGradient>
      </defs>
      <path
        d="m60 8 44 17c0 53-20 87-44 106C35 112 16 77 16 25Z"
        fill={`url(#${id})`}
        stroke="#badcff"
        strokeWidth="2.5"
      />
      <path
        d="m60 17 35 14c0 43-15 73-35 91-21-18-35-48-35-91Z"
        fill="#5bafff"
        fillOpacity=".6"
        stroke="#b4ddff"
        strokeOpacity=".5"
        strokeWidth="2"
      />
      {verificado ? (
        <path
          d="m43 72 13 13 26-31"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M60 48v29m0 15v1"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
export function CabeceraCuentaArte() {
  return (
    <div className={s.headerArt} aria-hidden="true">
      <svg viewBox="0 0 400 85" fill="none">
        <g fill="#dceaff">
          <path d="M3 44h23v37H3zM30 31h22v50H30zM57 40h10v41H57zM72 27h24v54H72zM101 43h22v38h-22zM128 34h23v47h-23zM156 42h13v39h-13zM174 30h23v51h-23z" />
        </g>
        <g transform="translate(229 40)">
          <path d="m5 14 9-13h28l12 13" fill="#0062e4" />
          <rect x="0" y="12" width="61" height="14" rx="5" fill="#0750b7" />
          <path d="M17 4h10v8H12Zm13 0h10l7 8H30Z" fill="#d2e5ff" />
          <circle cx="13" cy="27" r="6" fill="#0b2247" />
          <circle cx="48" cy="27" r="6" fill="#0b2247" />
          <circle cx="13" cy="27" r="2.5" fill="#d9e9ff" />
          <circle cx="48" cy="27" r="2.5" fill="#d9e9ff" />
        </g>
        <g transform="translate(305 34)" stroke="#b9d2ff" strokeWidth="1.5">
          <rect width="54" height="32" rx="3" fill="white" />
          <path d="M18 0v32m18-32v32M54 7h18l10 12v13H54Z" fill="#eff5ff" />
          <path d="M60 11h9l7 9H60Z" fill="#c6dcff" />
          <circle cx="13" cy="33" r="5" fill="#183964" />
          <circle cx="43" cy="33" r="5" fill="#183964" />
          <circle cx="70" cy="33" r="5" fill="#183964" />
        </g>
      </svg>
      <p>
        Traslado vehicular con conductores certificados,{" "}
        <strong>evidencia y seguimiento.</strong>
      </p>
    </div>
  );
}
