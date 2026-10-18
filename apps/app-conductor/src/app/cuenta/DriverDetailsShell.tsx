"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AccountIcon } from "./AccountIcon";
import styles from "./details.module.css";

export function DriverDetailsShell({ kind, children }: { kind: "profile" | "documents" | "bank" | "certification"; children: ReactNode }) {
  const step = kind === "bank" ? 4 : kind === "documents" ? 3 : null;
  const screen = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      screen.current?.style.setProperty("--details-height", `${viewport.height}px`);
      screen.current?.style.setProperty("--details-top", `${viewport.offsetTop}px`);
    };
    update(); viewport.addEventListener("resize", update); viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, []);
  return <div ref={screen} className={styles.screen} data-driver-details={kind}>
    <div className={styles.body}>
      <header className={styles.header}>
        <Link href="/cuenta" prefetch={false}>‹ Atrás</Link>
        <div className={styles.brand}><Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={160} height={35} priority />{kind === "profile" && <span>DRIVEAWAY SERVICE</span>}</div>
        {step && <div className={styles.progress} role="progressbar" aria-label="Progreso del expediente" aria-valuemin={0} aria-valuemax={5} aria-valuenow={step} aria-valuetext={`${step} de 5`}><span>{step} de 5</span><div aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} data-active={index < step} />)}</div></div>}
      </header>
      {children}
    </div>
    {kind === "profile" && <nav className={styles.bottomNav} aria-label="Navegación principal">
      {([{ href: "/panel", title: "Inicio", icon: "home" }, { href: "/viajes", title: "Traslados", icon: "car" }, { href: "/ganancias", title: "Ganancias", icon: "wallet" }, { href: "/cuenta", title: "Cuenta", icon: "user" }] as const).map(item => <Link key={item.href} href={item.href} prefetch={false} aria-current={item.href === "/cuenta" ? "page" : undefined}><AccountIcon name={item.icon} /><span>{item.title}</span></Link>)}
    </nav>}
  </div>;
}

export type DetailIconName = "user" | "mail" | "phone" | "id" | "pin" | "camera" | "document" | "passport";
export function DetailIcon({ name }: { name: DetailIconName }) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "user" && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 6 0 0 1 16 0v2Z" /></>}
    {name === "mail" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    {name === "phone" && <path d="m4 3 4-1 3 6-3 2c2 3 3 4 6 6l2-3 6 3-1 4c-1 4-7 1-12-4S1 4 4 3Z" />}
    {name === "id" && <><rect x="2" y="4" width="20" height="16" rx="2" /><circle cx="8" cy="10" r="2" /><path d="M5 16a3 3 0 0 1 6 0ZM14 9h4M14 13h4" /></>}
    {name === "pin" && <><path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0Z" /><circle cx="12" cy="9" r="2" /></>}
    {name === "camera" && <><path d="M3 6h4l2-3h6l2 3h4v15H3Z" /><circle cx="12" cy="13" r="4" /></>}
    {name === "document" && <><path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h6" /></>}
    {name === "passport" && <><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="10" r="5" /><path d="M7 10h10M12 5a10 10 0 0 1 0 10 10 10 0 0 1 0-10M9 19h6" /></>}
  </svg>;
}
