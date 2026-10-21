import React from "react";

export type ConductorIconName =
  | "check"
  | "alert"
  | "warning"
  | "user"
  | "gps"
  | "wifi"
  | "bell"
  | "home"
  | "car"
  | "truck"
  | "chart"
  | "bank"
  | "clock"
  | "document"
  | "card"
  | "shield"
  | "phone"
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "pin"
  | "support"
  | "logout"
  | "menu"
  | "sort"
  | "left"
  | "right"
  | "close"
  | "search";

export interface ConductorIconProps {
  name: ConductorIconName;
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
}

export function ConductorIcon({
  name,
  className = "size-5",
  size,
  strokeWidth = 2
}: ConductorIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {name === "check" && <polyline points="20 6 9 17 4 12" strokeWidth={Math.max(Number(strokeWidth), 2.5)} />}
      {name === "alert" && (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
      {name === "warning" && (
        <>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      )}
      {name === "user" && (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4 19c0-3.5 3.2-6 8-6s8 2.5 8 6" />
        </>
      )}
      {name === "gps" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      )}
      {name === "wifi" && (
        <>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "bell" && (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </>
      )}
      {name === "home" && (
        <>
          <path d="m3 10 9-7 9 7v11H3Z" />
          <path d="M9 21v-8h6v8" />
        </>
      )}
      {(name === "car" || name === "truck") && (
        <>
          <rect x="2" y="5" width="12" height="12" rx="2" />
          <path d="M14 9h4l4 4v4h-8M17 9v5h5" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </>
      )}
      {name === "chart" && <path strokeWidth="3" d="M5 16v4M12 10v10M19 4v16" />}
      {name === "bank" && (
        <>
          <path d="m3 8 9-5 9 5H3Z" />
          <path d="M3 21h18M5 18h14M6 11v7M12 11v7M18 11v7" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </>
      )}
      {name === "document" && (
        <>
          <path d="M5 2h9l5 5v15H5Z" />
          <path d="M14 2v6h5M8 12h8M8 16h8" />
        </>
      )}
      {name === "card" && (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 9h20M6 15h4" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
      {name === "phone" && <path d="m7 3 3 5-2 2a14 14 0 0 0 6 6l2-2 5 3-1 4C10 22 2 14 3 4Z" />}
      {name === "mail" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </>
      )}
      {name === "eye" && (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "eye-off" && (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path d="m3 3 18 18" />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2" />
        </>
      )}
      {name === "support" && (
        <>
          <path d="M4 14V10a8 8 0 0 1 16 0v4M20 16v2a3 3 0 0 1-3 3h-2" />
          <rect x="2" y="10" width="4" height="8" rx="2" />
          <rect x="18" y="10" width="4" height="8" rx="2" />
        </>
      )}
      {name === "logout" && <path d="M13 3H4v18h9M10 12h12m-4-4 4 4-4 4" />}
      {name === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === "sort" && <path d="M7 3v18m-4-14 4-4 4 4M17 21V3m-4 14 4 4 4-4" />}
      {name === "left" && <path d="m15 5-7 7 7 7" />}
      {name === "right" && <path d="m9 5 7 7-7 7" />}
      {name === "close" && <path d="m5 5 14 14M5 19 19 5" />}
      {name === "search" && (
        <>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </>
      )}
    </svg>
  );
}
