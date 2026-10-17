"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso, SelloConductor } from "@ruum/ui";
import { useCerrarSesion } from "../../lib/use-cerrar-sesion";

type SeccionCuenta = {
  href: string;
  titulo: string;
  descripcion: string;
  icono: string;
};

type CategoriaCuenta = {
  clave: "operativa" | "ajustes" | "ayuda";
  etiqueta: string;
  secciones: SeccionCuenta[];
};

const CATEGORIAS_CUENTA: CategoriaCuenta[] = [
  {
    clave: "operativa",
    etiqueta: "Operativa",
    secciones: [
      { href: "/cuenta/perfil", titulo: "Perfil", descripcion: "Datos personales y contacto de emergencia.", icono: "👤" },
      { href: "/cuenta/documentos", titulo: "Documentos", descripcion: "Licencia, identificación y vigencia.", icono: "📄" },
      { href: "/cuenta/certificacion", titulo: "Certificación", descripcion: "Nivel, Didit, MCE y derechos.", icono: "🎖️" },
      { href: "/cuenta/datos-bancarios", titulo: "Datos bancarios", descripcion: "CLABE para depósitos.", icono: "💳" }
    ]
  },
  {
    clave: "ajustes",
    etiqueta: "Ajustes",
    secciones: [
      { href: "/cuenta/preferencias", titulo: "Preferencias", descripcion: "Notificaciones y modalidades.", icono: "⚙️" },
      { href: "/notificaciones", titulo: "Avisos y Alertas", descripcion: "Comunicados y alertas Ruum.", icono: "🔔" },
      { href: "/cuenta/seguridad", titulo: "Seguridad", descripcion: "Contraseña y sesión activa.", icono: "🛡️" }
    ]
  },
  {
    clave: "ayuda",
    etiqueta: "Ayuda",
    secciones: [
      { href: "/cuenta/soporte", titulo: "Soporte", descripcion: "WhatsApp 24/7 y ayuda en ruta.", icono: "🎧" },
      { href: "/cuenta/legal", titulo: "Marco Legal", descripcion: "Términos y aviso de privacidad.", icono: "📜" }
    ]
  }
];

function vibrar(ms = 12) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
}

function ListTileCuenta({ href, icono, titulo }: { href: string; icono: string; titulo: string }) {
  return (
    <Link
      href={href}
      onClick={() => vibrar(10)}
      className="flex w-full items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl border-transparent active:bg-surface-elevated transition-colors focus-visible:outline-none"
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-xs">{icono}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold text-text-primary leading-tight">{titulo}</span>
      </span>
      <span className="shrink-0 font-display text-sm font-bold text-text-tertiary">›</span>
    </Link>
  );
}

export default function PaginaCuenta() {
  const router = useRouter();
  const { cerrarSesion, cerrandoSesion } = useCerrarSesion();
  const [activa, setActiva] = useState<"operativa" | "ajustes" | "ayuda">("operativa");
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const contRef = useRef<HTMLDivElement>(null);
  const categoria = CATEGORIAS_CUENTA.find((c) => c.clave === activa)!;

  // Gesto: deslizar horizontal para volver
  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        if (dx > 72 && startX < 28) {
          vibrar(10);
          router.back();
        } else if (dx < -72) {
          vibrar(10);
          router.back();
        }
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  return (
    <div ref={contRef} className="mx-auto w-full max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
      {/* Header limpio: título "Cuenta" + insignia CONDUCTOR CERTIFICADO (sin logo redundante) */}
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          Cuenta
        </h1>
        <SelloConductor compacto tema="dorado" className="scale-90 origin-right" />
      </header>

      {/* Segmented Control — pestañas horizontales alternables */}
      <div className="mx-4 mt-4 flex items-center justify-center">
        <div className="inline-flex items-center rounded-xl border border-border/60 bg-surface/40 p-1">
          {CATEGORIAS_CUENTA.map((cat) => (
            <button
              key={cat.clave}
              type="button"
              onClick={() => setActiva(cat.clave)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activa === cat.clave
                  ? "bg-signal text-white shadow-sm"
                  : "text-text-tertiary hover:bg-surface/30"
              }`}
            >
              {cat.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* ListTiles compactos de la categoría activa */}
      <div className="mx-4 mt-4 space-y-1.5">
        {categoria.secciones.map((seccion) => (
          <ListTileCuenta key={seccion.href} href={seccion.href} icono={seccion.icono} titulo={seccion.titulo} />
        ))}
      </div>

      {/* Cerrar sesión — botón minimalista destructivo al final de la vista activa */}
      <button
        type="button"
        onClick={() => { vibrar(14); setSheetAbierto(true); }}
        className="mx-4 mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-transparent px-4 py-2.5 font-display text-xs font-bold text-red-500 transition hover:bg-red-500/5 active:bg-red-500/10 focus-visible:outline-none"
        aria-label="Cerrar sesión"
      >
        🚪 Cerrar sesión
      </button>

      {/* Bottom sheet confirmación — evita tap accidental cerca de bottom nav */}
      {sheetAbierto && (
        <dialog open className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0" aria-modal="true" aria-labelledby="titulo-cerrar-sesion-sheet">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setSheetAbierto(false)} aria-label="Cerrar diálogo" />
          <div className="relative w-full max-w-md rounded-t-[1.75rem] border-t border-border/40 bg-surface-elevated p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl animate-slideUp">
            <div className="mx-auto h-1 w-10 rounded-full bg-border/60 mb-4" aria-hidden />
            <h2 id="titulo-cerrar-sesion-sheet" className="font-display text-base font-black text-text-primary">¿Cerrar sesión?</h2>
            <p className="mt-1 font-body text-sm leading-6 text-text-secondary">Saldrás de tu cuenta de conductor en este dispositivo.</p>
            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                onClick={() => { vibrar(18); void cerrarSesion(); }}
                disabled={cerrandoSesion}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-500 px-5 py-3 font-display text-sm font-black text-white shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {cerrandoSesion ? "Cerrando sesión…" : "Sí, cerrar sesión"}
              </button>
              <button
                type="button"
                onClick={() => setSheetAbierto(false)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 font-display text-sm font-bold text-text-primary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
