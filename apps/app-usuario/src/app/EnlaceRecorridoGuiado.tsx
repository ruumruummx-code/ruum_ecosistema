"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leerItemConTtl } from "./onboarding/page";

export function EnlaceRecorridoGuiado() {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const visto = leerItemConTtl("ruum-onboarding-visto");
    if (visto === "1" || visto === "true") {
      setOculto(true);
    }
  }, []);

  if (oculto) return null;

  return (
    <Link
      href="/onboarding"
      className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-lg px-5 py-3 font-display text-sm font-semibold text-[#8B98AD] transition hover:text-white"
    >
      Ver recorrido guiado →
    </Link>
  );
}
