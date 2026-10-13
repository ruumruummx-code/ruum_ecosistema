import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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

type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

export const metadata: Metadata = {
  title: "Mis vehículos — Ruum Ruum",
  robots: { index: false, follow: false },
};

function VehiculosCliente({ vehiculos = [] }: { vehiculos: Vehiculo[] }) {
  return (
    <MobileShell variant="compact">
      <div className="flex flex-col gap-4 pb-8">
        <MobileHeader
          titulo="Mis vehículos"
          subtitulo="Autos frecuentes para solicitudes rápidas"
          enlaceAtras="/cuenta"
          etiquetaAtras="Volver a mi cuenta"
        />

        {vehiculos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {vehiculos.map((vehiculo) => {
              const nombre = [vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(" ") || "Vehículo";
              return (
                <MobileCard key={vehiculo.id} elevated className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
                        {vehiculo.alias || "Vehículo guardado"}
                      </span>
                      <h2 className="mt-0.5 text-[17px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                        {nombre}
                      </h2>
                    </div>
                    <MobileBadge
                      variante="neutro"
                      texto={vehiculo.tipo || "Particular"}
                      size="sm"
                    />
                  </div>

                  {vehiculo.fotos_urls && vehiculo.fotos_urls.length > 0 ? (
                    <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1">
                      {vehiculo.fotos_urls.slice(0, 3).map((foto) => (
                        <Image
                          key={foto}
                          src={foto}
                          alt={nombre}
                          width={140}
                          height={90}
                          className="h-[75px] w-[110px] shrink-0 rounded-xl object-cover"
                          unoptimized
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3.5 flex h-16 items-center justify-center rounded-xl border border-dashed border-[#c8dcf8] bg-[#f8fafd] text-[12.5px] font-medium text-[#4e5f80] dark:border-[#1d4576] dark:bg-[#0a2342]/40 dark:text-[#a8b5cc]">
                      Sin fotografías guardadas
                    </div>
                  )}

                  <dl className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-[#e6edf6] pt-3 text-[12.5px] dark:border-[#1a3a5c]">
                    <div>
                      <dt className="font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Placas</dt>
                      <dd className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                        {vehiculo.placas?.trim() || "Sin placas"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Color</dt>
                      <dd className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                        {vehiculo.color?.trim() || "No especificado"}
                      </dd>
                    </div>
                    {vehiculo.vin && (
                      <div className="col-span-2">
                        <dt className="font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">VIN</dt>
                        <dd className="font-mono text-[11.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                          {vehiculo.vin}
                        </dd>
                      </div>
                    )}
                  </dl>
                </MobileCard>
              );
            })}
          </div>
        ) : (
          <MobileCard elevated className="flex flex-col items-center py-10 text-center">
            <span aria-hidden="true" className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
              <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.2 10.5 6.7 6.8A2 2 0 0 1 8.55 5.5h6.9a2 2 0 0 1 1.85 1.3l1.5 3.7c1.05.32 1.7 1.28 1.7 2.38v4.37a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.75H6.9v.75a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-4.37c0-1.1.65-2.06 1.7-2.38Z" />
                <path d="M6.5 10.5h11" strokeLinecap="round" />
                <circle cx="7.2" cy="14.4" r="1.3" fill="currentColor" />
                <circle cx="16.8" cy="14.4" r="1.3" fill="currentColor" />
              </svg>
            </span>
            <h2 className="text-[18px] font-extrabold text-[#0a2342] dark:text-[#f6f8fb]">
              Sin vehículos registrados
            </h2>
            <p className="mt-1 max-w-[260px] text-[13px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
              Tus vehículos se guardan automáticamente al solicitar un traslado para agilizar futuras cotizaciones.
            </p>
          </MobileCard>
        )}

        <Link href="/viajes/nuevo" className="mt-2 block">
          <MobileButton className="w-full">
            + Solicitar traslado con nuevo vehículo
          </MobileButton>
        </Link>
      </div>
    </MobileShell>
  );
}

export default async function PaginaVehiculos() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen py-4 sm:py-6">
        <VehiculosCliente vehiculos={cuenta.vehiculos} />
      </main>
    </>
  ));
}
