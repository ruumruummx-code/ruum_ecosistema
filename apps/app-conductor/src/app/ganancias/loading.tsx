"use client";

import { DriverEarningsView } from "./DriverEarningsView";

export default function CargandoGanancias() {
  return <DriverEarningsView data={null} summary={null} period="semana" onPeriod={() => {}} loading error={null} />;
}
