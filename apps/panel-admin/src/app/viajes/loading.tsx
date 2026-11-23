export default function CargandoTraslados() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 sm:py-10" aria-label="Cargando traslados">
      <div className="h-7 w-24 animate-pulse rounded bg-ui-muted" />
      <div className="mt-6 flex gap-1 border-b border-ui-line">
        {[80, 90, 72, 90, 86].map((w, i) => (
          <div key={i} className="h-9 animate-pulse rounded-t bg-ui-muted mx-1" style={{ width: `${w}px` }} />
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-ui-line">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-ui-line px-4 py-3 last:border-0">
            <div className="h-3 w-20 animate-pulse rounded bg-ui-muted font-mono-ruum" />
            <div className="h-3 flex-1 animate-pulse rounded bg-ui-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-ui-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-ui-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
