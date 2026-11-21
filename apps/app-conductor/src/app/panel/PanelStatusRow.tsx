"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Sheet } from "@ruum/ui/base";
import { ConductorIcon, type ConductorIconName } from "@/components/icons";

interface PanelOperationalHealthProps {
  gpsActivo: boolean | null; gpsUltimaSenal?: Date | null; estaOnline: boolean;
  documentoBloqueante: boolean; documentoPorVencer: boolean; conductorEstado?: string | null;
}

export function PanelStatusRow({ gpsActivo, gpsUltimaSenal, estaOnline, documentoBloqueante, documentoPorVencer, conductorEstado }: PanelOperationalHealthProps) {
  const [open, setOpen] = useState(false);
  // Sin estado conocido no afirmamos que el perfil esté completo.
  const perfilDesconocido = !conductorEstado;
  const perfilOk = conductorEstado === "activo" || conductorEstado === "modo_prueba_supervisada";
  const items: { label: string; value: string; icon: ConductorIconName; tone: "success" | "danger" | "warning" | "neutral"; href: string | null }[] = [
    { label: "Documentos", value: documentoBloqueante ? "Pendientes" : documentoPorVencer ? "Por vencer" : "En orden", icon: "document", tone: documentoBloqueante ? "danger" : documentoPorVencer ? "warning" : "success", href: "/cuenta/documentos" },
    { label: "Perfil", value: perfilDesconocido ? "Sin confirmar" : perfilOk ? "Completo" : "En validación", icon: "user", tone: perfilDesconocido ? "neutral" : perfilOk ? "success" : "warning", href: "/cuenta/perfil" },
    { label: "GPS", value: gpsActivo === null ? "Comprobando" : gpsActivo ? "Activo" : "Inactivo", icon: "gps", tone: gpsActivo === null ? "neutral" : gpsActivo ? "success" : "warning", href: null },
    { label: "Conexión", value: estaOnline ? "En línea" : "Sin conexión", icon: "wifi", tone: estaOnline ? "success" : "danger", href: null },
  ];
  // El título resume el estado real: solo dice "Listo" cuando nada bloquea la operación.
  const titulo = !estaOnline ? "Sin conexión"
    : documentoBloqueante ? "Revisa tus documentos"
    : !perfilDesconocido && !perfilOk ? "Tu perfil está en validación"
    : gpsActivo === false ? "Activa tu GPS para operar"
    : gpsActivo === null || perfilDesconocido ? "Comprobando tu estado"
    : "Listo para conducir";
  return <section aria-labelledby="estado-operativo" className="space-y-3">
    <h2 id="estado-operativo" className="text-base font-semibold text-ui-fg">{titulo}</h2>
    <Card className="grid grid-cols-2 gap-2 p-2">
      {items.map(item => <Button key={item.label} variant="ghost" className="h-auto min-h-20 flex-col items-start gap-2 whitespace-normal p-3 text-left" aria-label={`${item.label}: ${item.value}. Ver estado operativo`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="flex items-center gap-2 text-sm text-ui-fg"><ConductorIcon name={item.icon} size={16} />{item.label}</span>
        <Badge tone={item.tone} dot>{item.value}</Badge>
      </Button>)}
    </Card>
    <Sheet open={open} onClose={() => setOpen(false)} titulo="Estado operativo" descripcion="Revisa lo necesario para recibir y realizar traslados.">
      <ul className="divide-y divide-ui-line">
        {items.map(item => <li key={item.label} className="flex items-center justify-between gap-3 py-3">
          <div className="space-y-1"><p className="text-sm font-semibold text-ui-fg">{item.label}</p><Badge tone={item.tone}>{item.value}</Badge>
            {item.label === "GPS" && gpsUltimaSenal && <p className="text-xs text-ui-fg-muted">Última señal: {gpsUltimaSenal.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>}
          </div>
          {item.href && <Button asChild variant="outline" className="min-h-12"><Link href={item.href} onClick={() => setOpen(false)}>Revisar {item.label.toLowerCase()}</Link></Button>}
        </li>)}
      </ul>
    </Sheet>
  </section>;
}
