import { ConductorIcon, type ConductorIconName } from "@/components/icons";

export function RegistrationIcon({ name }: { name: "mail" | "lock" | "phone" | "eye" | "eye-off" | "arrow" | "pin" | "chevron" }) {
  if (name === "arrow") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </svg>
    );
  }
  const iconName = name === "chevron" ? "right" : name;
  return <ConductorIcon name={iconName as ConductorIconName} size={22} strokeWidth={1.8} />;
}
