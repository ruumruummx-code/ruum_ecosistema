"use client";
import Link from "next/link";
import { CompartirPasaporte } from "./CompartirPasaporte";
import { IconoSosAccion } from "./iconos-pasaporte";

export function AccionesPasaporte({ soporteHref, folioCorto }: { soporteHref: string; folioCorto: string }) {
  return (
      <div className="user-passport-dock flex items-center gap-2.5 rounded-2xl border border-[var(--user-color-border)] bg-white/95 p-3 shadow-[0_8px_24px_rgba(10,35,66,0.12)] backdrop-blur  dark:bg-[var(--user-color-primary)]/95">
        <Link
          href={soporteHref}
          className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[var(--user-color-border)] bg-[var(--user-color-surface-soft)] px-3 font-body text-[12.5px] font-bold text-[var(--user-color-primary)] transition-transform active:scale-95 hover:bg-[var(--user-color-surface-soft)] dark:border-[var(--user-color-border)]"
        >
          <IconoSosAccion className="text-amber-600 dark:text-amber-400" />
          <span>Asistencia 24/7</span>
        </Link>
        <div className="flex-1 [&>*]:w-full [&_button]:min-h-[48px]">
          <CompartirPasaporte folio={folioCorto} />
        </div>
      </div>
  );
}
