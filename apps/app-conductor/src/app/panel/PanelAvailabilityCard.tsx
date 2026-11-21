"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@ruum/ui/base";
import type { Disponibilidad } from "./usePanelData";

export function PanelAvailabilityCard({ disponibilidad, guardando, online, onCambiar }: {
  disponibilidad: Disponibilidad; guardando: boolean; online: boolean; onCambiar: () => void;
}) {
  const disponible = disponibilidad === "disponible";
  const enViaje = disponibilidad === "en_viaje";
  return <Card>
    <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
      <CardTitle>Disponibilidad</CardTitle>
      <Badge tone={enViaje ? "info" : disponible ? "success" : "neutral"} dot>{enViaje ? "En viaje" : disponible ? "Disponible" : "No disponible"}</Badge>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm leading-6 text-ui-fg-muted">{enViaje ? "Tienes un traslado en curso. Tu disponibilidad se actualizará al terminar." : disponible ? "Estás recibiendo solicitudes de traslado." : "Activa tu disponibilidad cuando estés listo para recibir solicitudes."}</p>
      {/* El texto visible es el nombre accesible: describe la acción; el estado lo dice la insignia. */}
      <Button variant={disponible ? "outline" : "primary"} className="min-h-12 w-full"
        disabled={enViaje || guardando || !online} onClick={onCambiar}>
        {guardando ? "Actualizando estado…" : enViaje ? "Traslado en curso" : disponible ? "Pausar solicitudes" : "Activar disponibilidad"}
      </Button>
      {!online && <p className="text-xs text-ui-fg-muted">Necesitas conexión para cambiar tu disponibilidad.</p>}
      {guardando && <p className="text-xs text-ui-fg-muted" role="status">Guardando disponibilidad…</p>}
    </CardContent>
  </Card>;
}
