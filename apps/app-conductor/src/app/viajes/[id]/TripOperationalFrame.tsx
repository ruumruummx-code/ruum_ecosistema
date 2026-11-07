"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { EmergencyPanel } from "./EmergencyPanel";
import { TripSupportDialog } from "./TripSupportDialog";

const DockContext = createContext<{ primary: HTMLElement | null; quick: HTMLElement | null; setReturnPath: (path: string | null) => void } | undefined>(undefined);

export function useTripReturnPath(path: string) {
  const setReturnPath = useContext(DockContext)?.setReturnPath;
  useLayoutEffect(() => {
    setReturnPath?.(path);
    return () => setReturnPath?.(null);
  }, [path, setReturnPath]);
}

export function TripOperationalFrame({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [primary, setPrimary] = useState<HTMLDivElement | null>(null);
  const [quick, setQuick] = useState<HTMLDivElement | null>(null);
  const [support, setSupport] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);

  useLayoutEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [pathname]);

  return <DockContext.Provider value={{ primary, quick, setReturnPath }}>
    <div data-trip-frame>
      <div data-trip-safety-bar>
        <Link href={returnPath ?? (pathname === `/viajes/${id}` ? "/viajes" : `/viajes/${id}`)} aria-label={pathname === `/viajes/${id}` ? "Volver a Traslados" : "Volver al traslado"}>← Volver</Link>
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
