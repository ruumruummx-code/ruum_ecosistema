import { ConductorIcon, type ConductorIconName } from "@/components/icons";

export function TrasladosIcon({ name }: { name: "menu" | "bell" | "home" | "truck" | "user" | "sort" | "left" | "right" | "close" }) {
  return <ConductorIcon name={name as ConductorIconName} size={23} strokeWidth={1.8} />;
}

export function TrasladosEmptyIllustration() {
  return <svg viewBox="0 0 220 112" width="180" height="92" aria-hidden="true">
    <path d="M10 101c-1-24 18-41 41-40C59 15 92 5 117 10c29 4 46 22 52 49 25 0 42 15 43 42Z" fill="#e2ebf8" />
    <circle cx="111" cy="60" r="42" fill="#fff" />
    <path d="M85 88h54" stroke="#e2eaf5" strokeWidth="3" strokeLinecap="round" />
    <rect x="87" y="45" width="27" height="30" rx="3" fill="#0953df" />
    <path d="M114 48h14l11 13v14h-25Z" fill="#3687ed" />
    <path d="M120 51h7l8 10h-15Z" fill="#afd5ff" />
    <path d="M124 62h15v10h-10Z" fill="#ff985d" />
    <circle cx="103" cy="77" r="6" fill="#09294e" /><circle cx="130" cy="77" r="6" fill="#09294e" />
    <circle cx="103" cy="77" r="2" fill="#b7d3ed" /><circle cx="130" cy="77" r="2" fill="#b7d3ed" />
  </svg>;
}
