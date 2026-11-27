"use client";
import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Calendar,
  Copy,
  Expand,
  Flag,
  Hash,
  House,
  MapPin,
  NotebookText,
  Pencil,
  Send,
  Star,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button, Card, Sheet, cn } from "@ruum/ui/base";
import {
  direccionCompleta,
  enlaceBuscarUbicacion,
  ETIQUETAS_UBICACION,
  ladoHabitual,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import { coordenadasValidas } from "./libreta-ubicaciones";
import { EtiquetaUbicacion, IconoUbicacion, nombreUbicacion } from "./UbicacionVisual";

const Mapa = dynamic(() => import("./MapaUbicacion").then((m) => m.MapaUbicacion), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-ui-muted text-sm text-ui-fg-muted" role="status">
      Cargando mapa…
    </div>
  ),
});

export interface DetalleUbicacionProps {
  ubicacion: UbicacionUsuario;
  cerrar: () => void;
  copiar: () => void;
  favorita: () => void;
  editar: () => void;
  eliminar: () => void;
  ocupado: boolean;
  /** `panel`: columna junto al listado (desde 1024 px). `hoja`: hoja inferior en pantallas angostas. */
  variante?: "panel" | "hoja";
}

function BotonFavorita({ u, favorita, ocupado }: { u: UbicacionUsuario; favorita: () => void; ocupado: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={Boolean(u.favorita)}
      aria-label={u.favorita ? "Quitar ubicación seleccionada de frecuentes" : "Marcar ubicación seleccionada como frecuente"}
      disabled={ocupado}
      onClick={favorita}
      className={cn(u.favorita && "text-ui-warning hover:text-ui-warning")}
    >
      <Star aria-hidden="true" className={cn(u.favorita && "fill-current")} />
    </Button>
  );
}

const fecha = (valor: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium" }).format(new Date(valor));

/** Detalle de una ubicación: panel junto al listado desde 1024 px y hoja inferior antes. */
export function DetalleUbicacion({ ubicacion: u, cerrar, copiar, favorita, editar, eliminar, ocupado, variante = "panel" }: DetalleUbicacionProps) {
  const [ampliado, setAmpliado] = useState(false);
  const abrirRef = useRef<HTMLButtonElement>(null);
  const cerrarMapa = useCallback(() => {
    setAmpliado(false);
    requestAnimationFrame(() => abrirRef.current?.focus({ preventScroll: true }));
  }, []);
  const nombre = nombreUbicacion(u);
  const lado = ladoHabitual(u);
  const lados = [lado, lado === "origen" ? "destino" : "origen"] as const;
  const campos: [LucideIcon, string, string][] = [
    [House, "Roles de la ubicación", u.fuentes.map((f) => ETIQUETAS_UBICACION[f]).join(", ")],
    [MapPin, "Ciudad", u.ciudad || "No registrada"],
    [Flag, "Estado", u.estado || "No registrado"],
    [Hash, "Código postal", u.codigoPostal || "No registrado"],
    [
      MapPin,
      "Punto en el mapa",
      coordenadasValidas(u.lat, u.lng) ? `${u.lat}, ${u.lng}` : "El mapa estima el punto por dirección. Confirma el pin al cotizar.",
    ],
    [NotebookText, "Referencia", u.referencia || "Sin referencia"],
    ...(u.ultimoUso ? [[Calendar, "Último traslado registrado", fecha(u.ultimoUso)] as [LucideIcon, string, string]] : []),
  ];
  const acciones = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3" role="group" aria-label="Acciones de la ubicación">
      {lados.map((campo) => (
        <Button key={campo} asChild variant={campo === lado ? "primary" : "outline"} size="sm" className="whitespace-normal">
          <Link href={enlaceBuscarUbicacion(u, campo)}>
            {campo === "origen" ? <Send aria-hidden="true" /> : <MapPin aria-hidden="true" />}
            Usar como {campo}
          </Link>
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={copiar}>
        <Copy aria-hidden="true" />
        Copiar dirección
      </Button>
      <Button variant="outline" size="sm" onClick={editar} disabled={ocupado}>
        <Pencil aria-hidden="true" />
        Editar
      </Button>
      <Button variant="danger" size="sm" onClick={eliminar} disabled={ocupado}>
        <Trash2 aria-hidden="true" />
        Eliminar
      </Button>
    </div>
  );
  const cuerpo = (
    <>
      <p className="text-sm text-ui-fg-muted">{direccionCompleta(u)}</p>
      <div className="relative h-40 shrink-0 overflow-hidden rounded-lg bg-ui-muted xl:h-48">
        <Mapa ubicacion={u} />
        <Button ref={abrirRef} variant="outline" size="sm" className="absolute right-2 bottom-2 z-20" onClick={() => setAmpliado(true)}>
          Abrir en mapa
          <Expand aria-hidden="true" />
        </Button>
      </div>
      {acciones}
      <dl className="flex flex-col divide-y divide-ui-line">
        {campos.map(([Icono, etiqueta, valor]) => (
          <div key={etiqueta} className="grid gap-x-3 gap-y-0.5 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <dt className="flex items-center gap-2 text-ui-fg-muted">
              <Icono aria-hidden="true" className="size-4 shrink-0" />
              {etiqueta}
            </dt>
            <dd className="break-words font-medium" title={valor}>
              {valor}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ui-fg-muted">Selecciona y confirma la dirección sugerida en el cotizador antes de continuar.</p>
      {ampliado && (
        <Sheet open onClose={cerrarMapa} titulo="Mapa ampliado" descripcion={direccionCompleta(u)} etiquetaCerrar="Cerrar mapa ampliado" className="sm:max-w-4xl">
          <div className="h-[60vh] min-h-60 overflow-hidden rounded-lg">
            <Mapa ubicacion={u} ampliado />
          </div>
        </Sheet>
      )}
    </>
  );

  if (variante === "hoja")
    return (
      <Sheet open onClose={cerrar} titulo={nombre} etiquetaCerrar="Cerrar detalle">
        <div className="flex flex-col gap-3 pb-2" aria-label={`Detalle de ${nombre}`} role="group">
          <div className="flex items-center justify-between gap-2">
            <EtiquetaUbicacion ubicacion={u} />
            <BotonFavorita u={u} favorita={favorita} ocupado={ocupado} />
          </div>
          {cuerpo}
        </div>
      </Sheet>
    );

  return (
    <Card asChild className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 xl:p-5">
      <aside aria-label={`Detalle de ${nombre}`}>
        <header className="flex items-start gap-3">
          <IconoUbicacion ubicacion={u} />
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-semibold">{nombre}</h2>
            <EtiquetaUbicacion ubicacion={u} className="mt-1" />
          </div>
          <BotonFavorita u={u} favorita={favorita} ocupado={ocupado} />
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar detalle" onClick={cerrar}>
            <X aria-hidden="true" />
          </Button>
        </header>
        {cuerpo}
      </aside>
    </Card>
  );
}
