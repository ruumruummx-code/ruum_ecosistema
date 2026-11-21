import { Skeleton } from "@ruum/ui/base";
import { ConductorScreen, ConductorPageHeader } from "../../components/ConductorScreen";

/**
 * Carga propia del historial: sin ella se heredaba la del resumen de
 * /ganancias, que tiene otro diseño y provocaba un salto visual.
 */
export default function CargandoHistorialGanancias() {
  return (
    <ConductorScreen
      variant="list"
      label="Historial de ganancias y pagos"
      header={<ConductorPageHeader title="Mis ganancias y pagos" backHref="/ganancias" backLabel="Volver a Mis ganancias" />}
    >
      <div className="mt-6 space-y-3" role="status" aria-busy="true" aria-label="Cargando tus ganancias">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </ConductorScreen>
  );
}
