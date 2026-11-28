"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useId, useState } from "react";
import Link from "next/link";

export type TipoDatoSensible = "curp" | "licencia" | "cuenta_bancaria" | "contacto_emergencia" | "documentos";

const TEXTOS: Record<TipoDatoSensible, { titulo: string; finalidad: string; acceso: string; proteccion: string }> = {
  curp: {
    titulo: "CURP",
    finalidad: "La usamos para validar tu identidad y evitar registros duplicados.",
    acceso: "Solo operación y administradores autorizados durante la revisión de tu expediente.",
    proteccion: "Se guarda en Supabase con permisos por sesión y no se conserva en el borrador local."
  },
  licencia: {
    titulo: "Licencia",
    finalidad: "Confirma que puedes operar traslados y que tu licencia sigue vigente.",
    acceso: "La revisa operación y, cuando aplica, el equipo de cumplimiento.",
    proteccion: "Los archivos se guardan en un bucket privado y el frontend solo muestra estado y datos enmascarados."
  },
  cuenta_bancaria: {
    titulo: "Cuenta bancaria",
    finalidad: "Permite programar depósitos por tus traslados confirmados.",
    acceso: "Solo operación financiera y sistemas de pago autorizados.",
    proteccion: "Los cambios requieren confirmar tu sesión y vuelven a revisión antes de usarse."
  },
  contacto_emergencia: {
    titulo: "Contacto de emergencia",
    finalidad: "Lo usamos únicamente si ocurre una eventualidad durante un traslado.",
    acceso: "Solo soporte y operación cuando existe un problema operativo o emergencia.",
    proteccion: "Se muestra enmascarado fuera de edición y se protege con las reglas de acceso de tu cuenta."
  },
  documentos: {
    titulo: "Documentos",
    finalidad: "Ayudan a validar tu identidad, licencia y requisitos operativos.",
    acceso: "Solo operación y revisores autorizados.",
    proteccion: "Se almacenan de forma privada; la app no expone nombres completos ni rutas de archivo."
  }
};

export function enmascararUltimos(valor: string | null | undefined, visibles = 4) {
  const limpio = valor?.trim() ?? "";
  if (!limpio) return "";
  if (limpio.length <= visibles) return "••••";
  return `${"•".repeat(Math.min(8, limpio.length - visibles))}${limpio.slice(-visibles)}`;
}

export function DatosSensiblesInfo({ tipo, compacto = false }: { tipo: TipoDatoSensible; compacto?: boolean }) {
  const texto = TEXTOS[tipo];
  return (
    <div className={`rounded-xl border border-ui-line/22 bg-ui-card ${compacto ? "px-3 py-3" : "px-4 py-4"}`}>
      <p className="font-body text-sm font-semibold text-ui-fg">{texto.titulo}</p>
      <dl className="mt-2 grid gap-2 font-body text-sm leading-6 text-ui-fg-muted/80">
        <div><dt className="font-semibold text-ui-fg"> qué lo pedimos?</dt><dd>{texto.finalidad}</dd></div>
        <div><dt className="font-semibold text-ui-fg">¿Quién puede verlo?</dt><dd>{texto.acceso}</dd></div>
        <div><dt className="font-semibold text-ui-fg">¿Cómo se protege?</dt><dd>{texto.proteccion}</dd></div>
      </dl>
      <Link href="/legal/privacidad" target="_blank" className="mt-3 inline-flex font-body text-sm font-semibold text-ui-brand underline-offset-4 hover:underline">
        Ver aviso de privacidad
      </Link>
    </div>
  );
}

export function DatosSensiblesTooltip({
  tipo,
  align = "start"
}: {
  tipo: TipoDatoSensible;
  align?: "start" | "end";
}) {
  const texto = TEXTOS[tipo];
  const popoverId = useId();
  const [abierto, setAbierto] = useState(false);

  return (
    <span className="relative inline-flex">
      <BaseButton variant="ghost"
        type="button"
        aria-label={`Información sensible: ${texto.titulo}`}
        aria-expanded={abierto}
        aria-describedby={abierto ? popoverId : undefined}
        onClick={() => setAbierto((valor) => !valor)}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") setAbierto(false);
        }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ui-brand/40 bg-ui-muted font-body text-sm font-bold text-ui-brand shadow-sm transition hover:border-ui-brand hover:bg-ui-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
      >
        i
      </BaseButton>

      {abierto && (
        <span
          id={popoverId}
          role="tooltip"
           className={[
             "fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 max-h-[70vh] overflow-auto rounded-xl border border-ui-line/28 bg-ui-card p-4 text-left font-body text-sm leading-6 text-ui-fg-muted/80 shadow-ui-md",
            "sm:absolute sm:bottom-auto sm:inset-x-auto sm:top-full sm:mt-2 sm:w-80",
            align === "end" ? "sm:right-0" : "sm:left-0"
          ].join(" ")}
        >
          <span className="block font-semibold text-ui-fg">{texto.titulo}</span>
          <span className="mt-2 block">
            <span className="font-semibold text-ui-fg">¿Por qué lo pedimos?</span>
            <span className="block">{texto.finalidad}</span>
          </span>
          <span className="mt-2 block">
            <span className="font-semibold text-ui-fg">¿Quién puede verlo?</span>
            <span className="block">{texto.acceso}</span>
          </span>
          <span className="mt-2 block">
            <span className="font-semibold text-ui-fg">¿Cómo se protege?</span>
            <span className="block">{texto.proteccion}</span>
          </span>
          <Link
            href="/legal/privacidad"
            target="_blank"
            className="mt-3 inline-flex font-body text-sm font-semibold text-ui-brand underline-offset-4 hover:underline"
          >
            Ver aviso de privacidad
          </Link>
        </span>
      )}
    </span>
  );
}
