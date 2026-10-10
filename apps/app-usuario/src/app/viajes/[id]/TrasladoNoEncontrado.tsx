import Link from "next/link";
import { NavegacionUsuario } from "../../NavegacionUsuario";

const DESCRIPCION_ESTANDAR =
  "Revisa el enlace o el folio. Si recién lo creaste, puede tardar unos segundos en sincronizarse con la plataforma.";

function BotonMisViajes() {
  return (
    <Link
      href="/mis-viajes"
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-[#0B111B] shadow-md transition hover:bg-[#e6b000]"
    >
      Ver mis traslados
    </Link>
  );
}

function BotonInicio() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1C2A3E] bg-[#0A1220] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-[#FFC400]/40 hover:text-white"
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
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">
          {kicker}
        </p>
        <h1 className="mt-3 font-display text-2xl font-black text-white">{titulo}</h1>
        <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">
          {descripcion}
        </p>
        {conAcciones && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonMisViajes />
            {conInicio && <BotonInicio />}
          </div>
        )}
      </div>
      </main>
    </>
  );
}
