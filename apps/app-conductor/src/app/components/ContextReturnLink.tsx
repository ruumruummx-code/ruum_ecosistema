"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountReturnLabel, accountReturnTarget } from "./context-return";

export function ContextReturnLink({ fallback = "/cuenta", className, compact = false }: { fallback?: string; className?: string; compact?: boolean }) {
  const pathname = usePathname();
  const [target, setTarget] = useState(fallback);
  useLayoutEffect(() => {
    setTarget(accountReturnTarget(new URLSearchParams(window.location.search).get("volver"), fallback, pathname));
  }, [fallback, pathname]);
  const label = accountReturnLabel(target);
  return <Link href={target} prefetch={false} className={className} aria-label={label}>{compact ? "‹ Atrás" : `← ${label}`}</Link>;
}
