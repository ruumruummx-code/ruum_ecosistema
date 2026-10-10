import type { Metadata } from "next";

/**
 * M1: toda el área /cuenta (índice + 6 subrutas) es privada y no debe
 * indexarse. Antes solo /cuenta/page.tsx declaraba robots:noindex y las
 * subrutas (perfil, facturación, métodos-pago, preferencias, vehículos,
 * legal) quedaban indexables por inconsistencia. El middleware ya redirige
 * al anónimo a /login, pero la política canónica vive aquí, en un solo lugar.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LayoutCuentaRuta({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
