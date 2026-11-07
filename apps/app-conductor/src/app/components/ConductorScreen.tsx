"use client";

import type { ReactNode, Ref } from "react";
import Link from "next/link";
import styles from "./conductor-screen.module.css";

export type ConductorScreenVariant = "access" | "overview" | "operation" | "form" | "detail" | "list" | "state";

/** El marco reserva navegación y teclado; solo el cuerpo puede desplazarse. */
export function ConductorScreen({ variant, label, header, footer, children, className = "", frameRef, bodyRef, flowRef, headerRef, detailsKind, contained = false }: {
  variant: ConductorScreenVariant; label: string; header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string;
  frameRef?: Ref<HTMLDivElement>; bodyRef?: Ref<HTMLDivElement>; flowRef?: Ref<HTMLDivElement>; headerRef?: Ref<HTMLDivElement>;
  detailsKind?: "profile" | "documents" | "certification" | "bank"; contained?: boolean;
}) {
  return <div ref={frameRef} className={`${styles.frame} ${className}`} data-conductor-screen={variant} data-driver-details={detailsKind} data-contained-view={contained || undefined}>
    {header && <div ref={headerRef} className={styles.header} data-contained-return={contained || undefined}>{header}</div>}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Región desplazable también mediante teclado. */}
    <div ref={bodyRef} className={styles.body} role="region" aria-label={label} tabIndex={0} data-screen-body data-contained-scroll={contained || undefined}>
      <div ref={flowRef} className={styles.flow}>{children}</div>
    </div>
    {footer && <div className={styles.footer} data-screen-action>{footer}</div>}
  </div>;
}

export function ConductorPageHeader({ title, backHref = "/cuenta", backLabel = "Volver a Cuenta", description }: {
  title: string; backHref?: string; backLabel?: string; description?: string;
}) {
  return <header className={styles.pageHeader}>
    <Link href={backHref} aria-label={backLabel} prefetch={false}><span aria-hidden>←</span> {backLabel}</Link>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
  </header>;
}
