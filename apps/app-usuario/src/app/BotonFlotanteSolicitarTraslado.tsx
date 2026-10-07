"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type BotonFlotanteSolicitarTrasladoProps = {
  mostrar: boolean;
};

export function BotonFlotanteSolicitarTraslado({ mostrar }: BotonFlotanteSolicitarTrasladoProps) {
  const [scrollSuficiente, setScrollSuficiente] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mostrar) {
      const timer = setTimeout(() => setScrollSuficiente(false), 0);
      return () => clearTimeout(timer);
    }

    const revisarScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrollSuficiente(window.scrollY > 200);
      });
    };

    revisarScroll();
    window.addEventListener("scroll", revisarScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", revisarScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mostrar]);

  if (!mostrar || !scrollSuficiente) {
    return null;
  }

  return (
    <Link
      href="/viajes/nuevo"
      aria-label="Solicitar traslado (acceso rápido)"
      className="user-v2-primary-button fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-[52px] items-center justify-center rounded-full px-5 py-3 font-body text-sm motion-safe:transition motion-safe:hover:-translate-y-0.5 sm:right-8 lg:hidden"
    >
      Solicitar traslado
    </Link>
  );
}
