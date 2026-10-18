export type AccountIconName = "bell" | "support" | "user" | "document" | "medal" | "card" | "logout" | "home" | "car" | "wallet" | "check" | "right";

export function AccountIcon({ name }: { name: AccountIconName }) {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "bell" && <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>}
    {name === "support" && <><path d="M4 14V10a8 8 0 0 1 16 0v4M20 16v2a3 3 0 0 1-3 3h-2" /><rect x="2" y="10" width="4" height="8" rx="2" fill="currentColor" /><rect x="18" y="10" width="4" height="8" rx="2" fill="currentColor" /></>}
    {name === "user" && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 6 0 0 1 16 0v2Z" /></>}
    {name === "document" && <><path d="M5 2h9l5 5v15H5Z" fill="currentColor" stroke="none" /><path d="M14 2v6h5M8 12h8M8 16h8" stroke="#fff" strokeWidth="1.4" /></>}
    {name === "medal" && <><path d="M6 2h4v9L6 8Z" fill="#0066ff" stroke="none" /><path d="M11 2h3v10h-3Z" fill="#ff593f" stroke="none" /><path d="M15 2h3v6l-3 3Z" fill="#0066ff" stroke="none" /><circle cx="12" cy="16" r="6" fill="#ffad00" stroke="#f49800" /><path d="m12 12 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 14.3l2-.3Z" fill="#ffd16b" stroke="none" /></>}
    {name === "card" && <><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" stroke="none" /><path d="M2 9h20M6 15h6" stroke="white" strokeWidth="2" /></>}
    {name === "logout" && <><path d="M13 3H4v18h9M10 12h12m-4-4 4 4-4 4" /></>}
    {name === "home" && <><path d="m3 10 9-7 9 7v11H3ZM9 21v-8h6v8" /></>}
    {name === "car" && <><path d="m4 10 2-6h12l2 6M3 17V10h18v7H3ZM5 17v3M19 17v3M6 13h2M16 13h2" /></>}
    {name === "wallet" && <><path d="M20 8V5H4a2 2 0 0 1 0-4h13v4M4 5H2v17h19V8Z" /><path d="M21 12h-6v5h6" /><circle cx="17" cy="14.5" r=".6" /></>}
    {name === "check" && <path d="m4 12 5 5L20 6" />}
    {name === "right" && <path d="m9 5 7 7-7 7" />}
  </svg>;
}
