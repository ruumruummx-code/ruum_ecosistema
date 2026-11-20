import Link from "next/link";
import { PageHeader } from "@ruum/ui/base";

export function CuentaHeader({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return <div className="space-y-3">
    <nav aria-label="Ubicación en la aplicación" className="flex gap-2 text-sm text-ui-fg-muted">
      <Link href="/panel" className="underline-offset-4 hover:underline">Inicio</Link>
      <span aria-hidden="true">/</span>
      <Link href="/cuenta" className="underline-offset-4 hover:underline">Cuenta</Link>
    </nav>
    <PageHeader titulo={titulo} descripcion={descripcion} className="[&_h1]:text-2xl [&_p]:block" />
  </div>;
}
