"use client";

import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@ruum/ui/base";
import Link from "next/link";
import type { PasaporteRow } from "./panel-utils";
import type { Disponibilidad } from "./usePanelData";

interface PanelOpportunitiesCardProps {
  disponibilidad: Disponibilidad;
  TrasladosDisponibles: PasaporteRow[];
  ultimaActualizacion?: Date | null;
  refrescando?: boolean;
  onRecargar?: () => void;
  onActivar?: () => void;
}

export function PanelOpportunitiesCard({
  disponibilidad,
  TrasladosDisponibles,
  refrescando = false,
  onRecargar,
  onActivar,
}: PanelOpportunitiesCardProps) {
  const disponible = disponibilidad === "disponible";
  const cantidad = TrasladosDisponibles.length;
  const primerViaje = TrasladosDisponibles[0];

  const titulo = !disponible
    ? "Activa tu disponibilidad"
    : cantidad > 0
      ? `${cantidad} traslado${cantidad > 1 ? "s" : ""} disponible${cantidad > 1 ? "s" : ""}`
      : "Sin traslados por ahora";

  const descripcionMovil = !disponible
    ? "Recibe solicitudes cercanas."
    : cantidad > 0
      ? `${primerViaje?.origen_ciudad || "Origen"} → ${primerViaje?.destino_ciudad || "Destino"}`
      : "Te avisaremos si hay traslados.";

  const buscar = () => {
    onRecargar?.();
  };

  return <Card asChild>
    <section aria-labelledby="titulo-oportunidades">
      <CardHeader className="space-y-2">
        <Badge tone="info" className="w-fit">Traslados</Badge>
        <CardTitle id="titulo-oportunidades">{titulo}</CardTitle>
        <CardDescription className="leading-6">{descripcionMovil}</CardDescription>
      </CardHeader>
      <CardContent>
        {!disponible ? <Button variant="outline" className="min-h-12 w-full" onClick={onActivar}>Activarme ahora</Button> :
          <Button asChild className="min-h-12 w-full"><Link href="/viajes" onClick={buscar}>{refrescando ? "Buscando traslados…" : "Buscar traslados ahora"}</Link></Button>}
      </CardContent>
    </section>
  </Card>;
}
