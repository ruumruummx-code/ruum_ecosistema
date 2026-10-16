import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
export default function CargandoCuenta() {
  return <><NavegacionUsuario variante="claro" /><MobileShell as="main" variant="compact" navInferiorVisible className="user-v2-scope user-account-shell" contentClassName="user-account-content">
    <div className="user-account-view" role="status" aria-label="Cargando cuenta" aria-busy="true">
      <div className="h-32 shrink-0 animate-pulse rounded-2xl bg-[var(--user-color-surface-soft)]" />
      <div className="overflow-hidden rounded-2xl" aria-hidden="true">{[1, 2, 3, 4].map(id => <div key={id} className="h-12 animate-pulse border-b border-[var(--user-color-border)] bg-[var(--user-color-surface-soft)]" />)}</div>
    </div>
  </MobileShell></>;
}
