import type { ReactNode } from "react";
import { TripOperationalFrame } from "./TripOperationalFrame";

export default function TripLayout({ children }: { children: ReactNode }) {
  return <TripOperationalFrame>{children}</TripOperationalFrame>;
}
