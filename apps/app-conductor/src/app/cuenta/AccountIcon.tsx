import { ConductorIcon, type ConductorIconName } from "@/components/icons";

export type AccountIconName = "bell" | "support" | "user" | "document" | "medal" | "card" | "logout" | "home" | "car" | "wallet" | "check" | "right";

export function AccountIcon({ name }: { name: AccountIconName }) {
  if (name === "medal") {
    return (
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2h4v9L6 8Z" fill="currentColor" stroke="none" />
        <path d="M11 2h3v10h-3Z" fill="currentColor" stroke="none" />
        <path d="M15 2h3v6l-3 3Z" fill="currentColor" stroke="none" />
        <circle cx="12" cy="16" r="6" fill="currentColor" stroke="currentColor" />
        <path d="m12 12 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 14.3l2-.3Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 8V5H4a2 2 0 0 1 0-4h13v4M4 5H2v17h19V8Z" />
        <path d="M21 12h-6v5h6" />
        <circle cx="17" cy="14.5" r=".6" />
      </svg>
    );
  }
  return <ConductorIcon name={name as ConductorIconName} size={25} strokeWidth={1.8} />;
}
