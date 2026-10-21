import { ConductorIcon, type ConductorIconName } from "@/components/icons";

export function ServiceIcon({ name }: { name: "bank" | "card" | "shield" | "warning" | "graduation" | "chart" | "document" }) {
  if (name === "graduation") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m2 8 10-5 10 5-10 5ZM6 10v7c4 3 8 3 12 0v-7m4-2v8" />
      </svg>
    );
  }
  return <ConductorIcon name={name as ConductorIconName} size={24} strokeWidth={1.7} />;
}
