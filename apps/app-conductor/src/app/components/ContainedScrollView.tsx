"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./contained-scroll.module.css";

/** Un único scroll por vista larga; el retorno y el shell conservan su sitio. */
export function ContainedScrollView({ header, children, label, className, detailsKind }: {
  header: ReactNode; children: ReactNode; label: string; className?: string; detailsKind?: "documents" | "certification" | "bank";
}) {
  const frame = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const restoring = useRef<number | null>(null);
  const storageKey = useRef("");

  useLayoutEffect(() => {
    storageKey.current = `conductor:scroll:${pathname}${window.location.search}`;
    try {
      const saved = sessionStorage.getItem(storageKey.current);
      const value = Number(saved);
      restoring.current = saved !== null && Number.isFinite(value) && value > 0 ? value : null;
    } catch { restoring.current = null; }
    if (scroll.current) scroll.current.scrollTop = restoring.current ?? 0;
    const measure = () => {
      frame.current?.style.setProperty("--contained-header-height", `${Math.ceil(heading.current?.getBoundingClientRect().height ?? 60)}px`);
      if (scroll.current && restoring.current !== null) scroll.current.scrollTop = restoring.current;
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (heading.current) observer?.observe(heading.current, { box: "border-box" });
    if (content.current) observer?.observe(content.current, { box: "border-box" });
    window.addEventListener("resize", measure);
    const node = scroll.current;
    const key = storageKey.current;
    const save = () => {
      try { sessionStorage.setItem(key, String(restoring.current ?? node?.scrollTop ?? 0)); } catch { /* El scroll funciona también sin almacenamiento. */ }
    };
    const userScroll = () => { restoring.current = null; };
    const saveScroll = () => { if (restoring.current === null) save(); };
    node?.addEventListener("wheel", userScroll, { passive: true });
    node?.addEventListener("pointerdown", userScroll);
    node?.addEventListener("keydown", userScroll);
    node?.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pagehide", save);
      node?.removeEventListener("wheel", userScroll);
      node?.removeEventListener("pointerdown", userScroll);
      node?.removeEventListener("keydown", userScroll);
      node?.removeEventListener("scroll", saveScroll);
      save();
    };
  }, [pathname]);

  return <div ref={frame} className={`${styles.frame} ${className ?? ""}`} data-contained-view data-driver-details={detailsKind}>
    <div className={styles.layout}>
      <div ref={heading} className={styles.header} data-contained-return>{header}</div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Región desplazable mediante teclado, además de rueda y táctil. */}
      <div ref={scroll} className={styles.content} data-contained-scroll role="region" aria-label={label} tabIndex={0}>
        <div ref={content} className={styles.flow}>{children}</div>
      </div>
    </div>
  </div>;
}
