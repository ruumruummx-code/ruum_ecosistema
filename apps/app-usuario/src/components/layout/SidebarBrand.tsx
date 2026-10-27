import { useId } from "react";

/** Marca del sidebar en trazos vectoriales, independiente de las fuentes instaladas. */
export function SidebarBrand({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 108 66" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="60" x2="86" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#008bff" /><stop offset="1" stopColor="#43c5ff" />
        </linearGradient>
      </defs>
      <path d="M3 62 21 34h17L57 62H42L26 38 13 62Z" fill={`url(#${id})`} />
      <path d="M22 8h25c22 0 23 30 2 33l22 21H54L31 31h16c8 0 8-12 0-12H22c-9 0-10 12-2 13l-6 10C-6 35 0 8 22 8Z" fill={`url(#${id})`} />
      <path d="M51 8h18c24 0 27 29 7 34l10 12-7 8-25-30h15c10 0 10-13 0-13h-9Z" fill={`url(#${id})`} />
      <path d="M96 32c-7 0-12 5-12 12 0 8 12 19 12 19s12-11 12-19c0-7-5-12-12-12Zm0 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" fill="#00d9e7" />
    </svg>
  );
}
