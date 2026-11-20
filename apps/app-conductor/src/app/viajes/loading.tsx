export default function CargandoTraslados() {
  return (
    <output className="conductor-content" aria-label="Cargando Traslados" aria-busy="true">
      {/* Skeleton pestañas */}
      <div className="flex gap-2 border-b border-ui-line pb-0">
        {["w-[100px]", "w-[110px]"].map((widthClass) => (
          <div key={widthClass} className={`h-10 animate-pulse rounded-t bg-ui-muted ${widthClass}`} />
        ))}
      </div>
      {/* Skeleton cards de viaje */}
      <div className="mt-5 grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card border border-ui-line p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-ui-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-ui-muted" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-ui-muted" />
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-ui-muted" />
          </div>
        ))}
      </div>
    </output>
  );
}
