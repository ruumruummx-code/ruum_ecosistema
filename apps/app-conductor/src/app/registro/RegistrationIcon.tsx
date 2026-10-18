export function RegistrationIcon({ name }: { name: "mail" | "lock" | "phone" | "eye" | "eye-off" | "arrow" }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    {name === "lock" && <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>}
    {name === "phone" && <path d="m7 3 3 5-2 2a14 14 0 0 0 6 6l2-2 5 3-1 4C10 22 2 14 3 4Z" />}
    {(name === "eye" || name === "eye-off") && <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{name === "eye-off" && <path d="m3 3 18 18" />}</>}
    {name === "arrow" && <path d="M4 12h16m-6-6 6 6-6 6" />}
  </svg>;
}
