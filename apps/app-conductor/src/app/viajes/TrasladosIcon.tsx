import { ConductorIcon, type ConductorIconName } from "@/components/icons";

export function TrasladosIcon({ name }: { name: "menu" | "bell" | "home" | "truck" | "user" | "sort" | "left" | "right" | "close" }) {
  return <ConductorIcon name={name as ConductorIconName} size={23} strokeWidth={1.8} />;
}
