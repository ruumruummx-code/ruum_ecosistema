import type { SVGProps } from "react";

const paths = {
  plus: "M12 4v16M4 12h16",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  car: "m4 10 2-6h12l2 6M3 10h18v9H3Zm2 9v2m14-2v2M6 14h2m8 0h2",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  route: "M6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM18 15a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM6 9v6a3 3 0 0 0 3 3h6M18 15V9a3 3 0 0 0-3-3h-2",
  file: "M14 2H5v20h14V7Zm0 0v6h5M8 12h8M8 16h6",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 22v-3c0-7 18-7 18 0v3Z",
  phone: "m7 3 3 5-3 3a16 16 0 0 0 6 6l3-3 5 3c-1 9-16 1-18-10-1-3 1-4 4-4Z",
  chat: "M3 3h18v14H9l-6 4Zm4 6h.01M12 9h.01M17 9h.01",
  whatsapp: "M21 11a9 9 0 0 1-13 8l-5 2 1-5A9 9 0 1 1 21 11ZM8 7c0 5 3 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3Z",
  check: "m5 12 4 4L19 6",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-5 10 3 3 7-7",
  star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z",
  support: "M3 14v-2a9 9 0 0 1 18 0v2M3 12h4v8H3Zm14 0h4v8h-4ZM19 20v2h-6",
  refresh: "M20 8a9 9 0 0 0-15-3L2 8m0-6v6h6m-4 8a9 9 0 0 0 15 3l3-3m0 6v-6h-6",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  bulb: "M8 17c0-3-3-3-3-8a7 7 0 1 1 14 0c0 5-3 5-3 8ZM8 20h8m-6 3h4",
  more: "M4 12h.01M12 12h.01M20 12h.01",
} as const;

export type DashboardIconName = keyof typeof paths;
export function DashboardIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: DashboardIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
