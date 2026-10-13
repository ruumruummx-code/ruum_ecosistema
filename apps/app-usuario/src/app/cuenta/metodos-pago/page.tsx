import type { Metadata } from "next";
import Link from "next/link";
import {
  MobileShell,
  MobileHeader,
  MobileCard,
  MobileBadge,
  MobileButton,
} from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export const metadata: Metadata = {
  title: "Métodos de pago — Ruum Ruum",
  robots: { index: false, follow: false },
};

function MetodosPagoCliente({ usuario }: { usuario: Usuario }) {
  const tieneTarjeta = Boolean(usuario.metodo_pago_registrado);

  return (
    <MobileShell variant="compact">
      <div className="flex flex-col gap-4 pb-8">
        <MobileHeader
          titulo="Métodos de pago"
          subtitulo="Pagos electrónicos seguros y comprobantes"
          enlaceAtras="/cuenta"
          etiquetaAtras="Volver a mi cuenta"
        />

        {/* Tarjeta de crédito / débito */}
        <MobileCard elevated className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                <svg className="size-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </span>
              <div>
                <h2 className="text-[16px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                  Tarjeta bancaria
                </h2>
                <p className="text-[12.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
                  Crédito o débito (Visa, Mastercard, AMEX)
                </p>
              </div>
            </div>
            <MobileBadge
              variante={tieneTarjeta ? "exito" : "pendiente"}
              texto={tieneTarjeta ? "Activa" : "Por registrar"}
              size="sm"
            />
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            {tieneTarjeta
              ? "Tu tarjeta está registrada de forma segura con Stripe para cobros automáticos al confirmar traslados."
              : "Tu tarjeta se registra automáticamente al realizar tu primer pago en la plataforma."}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f8fafd] p-3 text-[12px] font-medium text-[#4e5f80] dark:bg-[#061529] dark:text-[#a8b5cc]">
            <svg className="size-4 shrink-0 text-[#08705f] dark:text-[#4dd9a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Procesado por Stripe con cifrado bancario de extremo a extremo (PCI-DSS Nivel 1).</span>
          </div>
        </MobileCard>

        {/* Transferencia SPEI */}
        <MobileCard elevated className="p-5">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
              <svg className="size-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                  Transferencia SPEI
                </h2>
                <MobileBadge variante="exito" texto="Disponible" size="sm" />
              </div>
              <p className="text-[12.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
                Disponible para solicitudes corporativas y cotizaciones especiales
              </p>
            </div>
          </div>
        </MobileCard>

        <Link href="/viajes/nuevo" className="mt-2 block">
          <MobileButton className="w-full">
            Solicitar nuevo traslado
          </MobileButton>
        </Link>
      </div>
    </MobileShell>
  );
}

export default async function PaginaMetodosPago() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen py-4 sm:py-6">
        <MetodosPagoCliente usuario={cuenta.usuario} />
      </main>
    </>
  ));
}
