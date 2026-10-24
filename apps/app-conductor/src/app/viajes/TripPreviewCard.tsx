"use client";

import type { ComponentProps } from "react";
import { OfferPreviewCard } from "./OfferPreviewCard";

/** Ofertas y aceptados comparten la misma composición y reglas de tamaño. */
export function TripPreviewCard(props: ComponentProps<typeof OfferPreviewCard>) {
  return <OfferPreviewCard {...props} />;
}
