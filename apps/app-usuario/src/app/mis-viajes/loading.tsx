import { Skeleton, MarcoPantalla } from "@ruum/ui/base";
import { NavegacionUsuario } from "../NavegacionUsuario";

export default function Loading() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MarcoPantalla variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
        <div className="flex flex-col gap-4 px-4 pt-4 sm:px-6 sm:pt-6" role="status" aria-busy="true" aria-label="Cargando traslados">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-9 w-72 rounded-full" />
          <Skeleton className="h-11" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </MarcoPantalla>
    </>
  );
}
