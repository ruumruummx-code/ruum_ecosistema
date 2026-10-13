import Link from "next/link";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";

const DESCRIPCION_ESTANDAR =
  "Revisa el enlace o el folio. Si recién lo creaste, puede tardar unos segundos en sincronizarse con la plataforma.";

function BotonMisViajes() {
  return (
    <Link
      href="/mis-viajes"
      className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#0a2342] px-6 py-3 font-display text-sm font-bold text-white shadow-xs transition hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529]"
    >
      Ver mis traslados
    </Link>
  );
}

function BotonInicio() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[#d7e1ee] bg-white px-6 py-3 font-display text-sm font-bold text-[#0a2342] transition hover:bg-[#f6f8fb] active:scale-[0.98] dark:border-[#2d4f73] dark:bg-[#0a2342] dark:text-[#f6f8fb]"
    >
      Inicio
    </Link>
  );
}

/**
 * Estado vacío del Pasaporte Digital. Unifica los 5 bloques JSX casi
 * idénticos que vivían en `viajes/[id]/page.tsx` (sin sesión, IDOR, fallo de
 * verificación, no encontrado e incompleto).
 */
export function TrasladoNoEncontrado({
  variante = "estandar",
  conInicio = false,
}: {
  variante?: "estandar" | "sesion" | "incompleto";
  conInicio?: boolean;
}) {
  const kicker = variante === "incompleto" ? "Traslado incompleto" : "Traslado no encontrado";
  const titulo =
    variante === "incompleto" ? "No pudimos cargar el estado del traslado" : "No encontramos ese traslado";
  const descripcion =
    variante === "sesion"
      ? "No pudimos verificar tu sesión. Intenta iniciar sesión de nuevo."
      : variante === "incompleto"
        ? "Vuelve a intentarlo. Si el problema continúa, contacta a nuestro equipo de soporte."
        : DESCRIPCION_ESTANDAR;
  const conAcciones = variante !== "sesion";

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="compact" navInferiorVisible={true} as="main">
        <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-[#765100] dark:text-[#ffc933]">
            {kicker}
          </p>
          <h1 className="mt-3 font-display text-2xl font-black text-[#0a2342] dark:text-[#f6f8fb]">{titulo}</h1>
          <p className="mt-3 max-w-sm mx-auto font-body text-sm leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            {descripcion}
          </p>
          {conAcciones && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <BotonMisViajes />
              {conInicio && <BotonInicio />}
            </div>
          )}
        </div>
      </MobileShell>
    </>
  );
}
