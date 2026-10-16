import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";

function SkeletonCard() {
  return <div className="animate-pulse rounded-xl border border-border bg-surface p-4" aria-hidden="true"><div className="h-4 w-28 rounded bg-surface-elevated" /><div className="mt-3 h-5 w-48 rounded bg-surface-elevated" /><div className="mt-2 h-3 w-32 rounded bg-surface-elevated/60" /><div className="mt-4 grid grid-cols-4 gap-3"><div className="h-10 rounded bg-surface-elevated/60" /><div className="h-10 rounded bg-surface-elevated/60" /><div className="h-10 rounded bg-surface-elevated/60" /><div className="h-10 rounded bg-surface-elevated/60" /></div></div>;
}
export default function Loading() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="compact" navInferiorVisible className="user-v2-scope user-transfers-shell" contentClassName="user-transfers-content">
        <div className="user-transfers-view" role="status" aria-busy="true" aria-label="Cargando traslados">
          <div className="h-12 rounded-full bg-surface-elevated animate-pulse" />
          <div className="h-8 rounded-xl bg-surface-elevated animate-pulse" />
          <div className="h-11 rounded-xl bg-surface-elevated animate-pulse" />
          <div className="user-transfers-list" aria-hidden="true"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        </div>
      </MobileShell>
    </>
  );
}
