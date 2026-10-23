export default function TripLoading() {
  return <output aria-busy="true" aria-label="Cargando traslado" className="block p-5 text-center">
    <h1 className="font-bold text-lg">Cargando traslado…</h1>
    <p className="mt-2 text-sm">Estamos recuperando el estado y el siguiente paso.</p>
  </output>;
}
