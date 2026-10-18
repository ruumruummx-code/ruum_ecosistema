export function ServiceIcon({ name }: { name: "bank" | "card" | "shield" | "warning" | "graduation" | "chart" | "document" }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "bank" && <><path d="m2 8 10-6 10 6ZM3 21h18M5 18V9m7 9V9m7 9V9M3 18h18" /></>}
    {name === "card" && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 15h4"/></>}
    {name === "shield" && <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/></>}
    {name === "warning" && <><path d="M10 3a2 2 0 0 1 4 0l8 16a2 2 0 0 1-2 3H4a2 2 0 0 1-2-3Z"/><path d="M12 8v6m0 3h.01"/></>}
    {name === "graduation" && <><path d="m2 8 10-5 10 5-10 5ZM6 10v7c4 3 8 3 12 0v-7m4-2v8"/></>}
    {name === "chart" && <><path d="M4 20v-5h3v5ZM11 20V9h3v11ZM18 20V3h3v17Z"/></>}
    {name === "document" && <><path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h5"/></>}
  </svg>;
}
