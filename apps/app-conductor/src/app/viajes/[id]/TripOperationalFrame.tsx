"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { EmergencyPanel } from "./EmergencyPanel";
import { TripSupportDialog } from "./TripSupportDialog";

const DockContext = createContext<{ primary: HTMLElement | null; quick: HTMLElement | null } | undefined>(undefined);

export function TripOperationalFrame({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [primary, setPrimary] = useState<HTMLDivElement | null>(null);
  const [quick, setQuick] = useState<HTMLDivElement | null>(null);
  const [support, setSupport] = useState(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const fullHeight = Math.max(innerHeight, viewport?.height ?? 0);
    const measure = () => {
      const height = viewport?.height ?? innerHeight;
      const top = viewport?.offsetTop ?? 0;
      const editing = document.activeElement?.matches("input,textarea,select,[contenteditable='true']");
      const keyboard = !!editing && fullHeight - height > 100;
      root.dataset.tripKeyboard = String(keyboard);
      root.style.setProperty("--trip-visible-top", `${top}px`);
      root.style.setProperty("--trip-visible-height", `${height}px`);
      root.style.setProperty("--trip-keyboard-inset", `${Math.max(0, innerHeight - height - top)}px`);
      root.style.setProperty("--trip-nav-reserve", keyboard ? "0px" : "var(--conductor-shell-bottom-height, 0px)");
      if (editing) requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && scrollRef.current?.contains(active)) active.scrollIntoView({ block: "center", behavior: "instant" });
      });
    };
    measure();
    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    document.addEventListener("focusin", measure);
    document.addEventListener("focusout", measure);
    return () => {
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      document.removeEventListener("focusin", measure);
      document.removeEventListener("focusout", measure);
      for (const property of ["--trip-visible-top", "--trip-visible-height", "--trip-keyboard-inset", "--trip-nav-reserve"]) root.style.removeProperty(property);
      delete root.dataset.tripKeyboard;
    };
  }, []);

  useLayoutEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [pathname]);

  return <DockContext.Provider value={{ primary, quick }}>
    <div data-trip-frame>
      <div data-trip-safety-bar>
        <Link href={pathname === `/viajes/${id}` ? "/viajes" : `/viajes/${id}`} aria-label={pathname === `/viajes/${id}` ? "Volver a Traslados" : "Volver al traslado"}>← Volver</Link>
        <button type="button" onClick={() => setSupport(true)} aria-haspopup="dialog" aria-expanded={support}>Soporte</button>
        <EmergencyPanel trasladoId={id} compact />
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- El contenedor con scroll necesita foco para desplazarse con teclado. */}
      <div ref={scrollRef} data-trip-scroll tabIndex={0} role="region" aria-label="Contenido del traslado">{children}</div>
      <div data-trip-dock><div ref={setPrimary} /><div ref={setQuick} /></div>
    </div>
    {support && <TripSupportDialog onClose={() => setSupport(false)} />}
  </DockContext.Provider>;
}

export function TripDockPortal({ children, quick = false }: { children: ReactNode; quick?: boolean }) {
  const dock = useContext(DockContext);
  if (!dock) return children;
  const target = quick ? dock.quick : dock.primary;
  return target ? createPortal(children, target) : null;
}

export function TripActionDock({ children, status, error }: { children: ReactNode; status: string; error?: string | null }) {
  return <TripDockPortal><section data-trip-primary aria-label="Acción principal del traslado">
    <p role="status" className="text-xs font-bold text-text-secondary">{status}</p>
    {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    {children}
  </section></TripDockPortal>;
}
