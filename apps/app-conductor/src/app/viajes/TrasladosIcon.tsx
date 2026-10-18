export function TrasladosIcon({ name }: { name: "menu" | "bell" | "home" | "truck" | "user" | "sort" | "left" | "right" | "close" }) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
    {name === "bell" && <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>}
    {name === "home" && <><path d="m3 10 9-7 9 7v11H3ZM9 21v-8h6v8" /></>}
    {name === "truck" && <><rect x="2" y="5" width="12" height="12" rx="2" /><path d="M14 9h4l4 4v4h-8M17 9v5h5" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>}
    {name === "user" && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 6 0 0 1 16 0v2Z" /></>}
    {name === "sort" && <path d="M7 3v18m-4-14 4-4 4 4M17 21V3m-4 14 4 4 4-4" />}
    {name === "left" && <path d="m15 5-7 7 7 7" />}
    {name === "right" && <path d="m9 5 7 7-7 7" />}
    {name === "close" && <path d="m5 5 14 14M5 19 19 5" />}
  </svg>;
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
