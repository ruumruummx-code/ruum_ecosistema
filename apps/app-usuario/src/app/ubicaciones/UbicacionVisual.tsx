import type { SVGProps } from "react";
import {
  ETIQUETAS_UBICACION,
  tipoUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import s from "./ubicaciones-desktop.module.css";
const paths = {
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  home: "m2 11 10-9 10 9M5 9v13h5v-7h4v7h5V9",
  work: "M3 7h18v14H3Zm5 0V3h8v4M3 12c5 4 13 4 18 0m-9 1v3",
  star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  refresh: "M20 8a9 9 0 0 0-15-3L2 8m0-6v6h6m-4 8a9 9 0 0 0 15 3l3-3m0 6v-6h-6",
  plus: "M12 4v16M4 12h16",
  filter: "M4 7h16M4 17h16M8 4v6m8 4v6",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  send: "m3 3 18 8-8 3-3 7Zm18 8L10 10",
  more: "M12 4v.01M12 12v.01M12 20v.01",
  copy: "M8 8h13v13H8ZM5 16H3V3h13v2",
  edit: "m15 3 6 6-12 12H3v-6Zm-2 2 6 6",
  trash: "M3 6h18M8 6V3h8v3M5 6l1 16h12l1-16M10 10v8m4-8v8",
  close: "m5 5 14 14M19 5 5 19",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  flag: "M4 22V3c6-4 10 4 16 0v11c-6 4-10-4-16 0",
  code: "M5 3h14v18H5Zm3 4h8M8 11h8M8 15h4",
  note: "M4 3h16v18H4Zm4 4h8M8 11h8M8 15h5",
  check: "m5 12 4 4L19 6",
} as const;
export type IconoUbicacionNombre = keyof typeof paths;
export function IconoUbicacion({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconoUbicacionNombre }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function EtiquetaUbicacion({
  ubicacion,
}: {
  ubicacion: UbicacionUsuario;
}) {
  const tipo = tipoUbicacion(ubicacion);
  return (
    <span className={s.tag} data-type={tipo}>
      {ETIQUETAS_UBICACION[tipo]}
    </span>
  );
}
export function iconoDeUbicacion(u: UbicacionUsuario): IconoUbicacionNombre {
  return u.fuentes.includes("perfil")
    ? "home"
    : u.fuentes.includes("trabajo")
      ? "work"
      : "pin";
}
export function nombreUbicacion(u: UbicacionUsuario): string {
  return u.alias?.trim() || u.direccion.split(",")[0] || "Ubicación";
}
