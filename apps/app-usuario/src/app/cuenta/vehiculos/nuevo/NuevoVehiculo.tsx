"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarVehiculoUsuario } from "@ruum/api/vehicles";
import { esquemaVehiculoPerfil } from "@ruum/shared/validacion";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import { MARCAS_CATALOGO, modelosPorMarca } from "../../../../lib/catalogo-vehiculos";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../../../lib/supabase-browser";
const control = "mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 disabled:opacity-60";
export function NuevoVehiculo() {
  const router = useRouter();
  const [datos, setDatos] = useState({ alias: "", marca: "", modelo: "", anio: String(new Date().getFullYear()), tipo: "sedan", color: "", placas: "", vin: "", transmision: "automatica", tiene_tarjeta_circulacion: false, tiene_verificacion: false, puede_circular_rodando: false });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bloqueo = useRef(false);
  const solicitud = useRef<{ contenido: string; id: string } | null>(null);
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueo.current) return;
    setError(null);
    const resultado = esquemaVehiculoPerfil.safeParse(datos);
    if (!resultado.success) { setError(resultado.error.issues[0]?.message ?? "Revisa los datos del vehículo."); return; }
    bloqueo.current = true; setGuardando(true);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("El registro no está disponible temporalmente.");
      const contenido = JSON.stringify(resultado.data);
      if (solicitud.current?.contenido !== contenido) solicitud.current = { contenido, id: crypto.randomUUID() };
      const id = await registrarVehiculoUsuario(crearClienteNavegador(), solicitud.current.id, resultado.data);
      router.replace(`/cuenta/vehiculos/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "No se confirmó el registro. Conservamos tus datos para reintentar."); }
    finally { bloqueo.current = false; setGuardando(false); }
  }
  return <section className="user-v2-scope mx-auto w-full max-w-2xl space-y-5 p-5">
    <Link href="/cuenta/vehiculos" className="text-sm underline">Volver a mis vehículos</Link>
    <h1 className="text-2xl font-bold">Registrar nuevo vehículo</h1>
    <p>Guarda los datos de tu vehículo en tu flota. Podrás seleccionarlo cuando necesites un traslado.</p>
    <form onSubmit={guardar} aria-busy={guardando} className="grid gap-4 sm:grid-cols-2">
      <fieldset disabled={guardando} className="contents">
        <label>Alias (opcional)<input className={control} value={datos.alias} maxLength={60} onChange={e => setDatos({ ...datos, alias: e.target.value })} /></label>
        <label>Marca<input className={control} required list="marcas-registro" value={datos.marca} maxLength={80} onChange={e => setDatos({ ...datos, marca: e.target.value, modelo: "" })} /><datalist id="marcas-registro">{MARCAS_CATALOGO.map(m => <option key={m} value={m} />)}</datalist></label>
        <label>Modelo<input className={control} required list="modelos-registro" value={datos.modelo} maxLength={80} onChange={e => setDatos({ ...datos, modelo: e.target.value })} /><datalist id="modelos-registro">{modelosPorMarca(datos.marca).map(m => <option key={m} value={m} />)}</datalist></label>
        <label>Año<input className={control} required type="number" min={1980} max={new Date().getFullYear() + 1} value={datos.anio} onChange={e => setDatos({ ...datos, anio: e.target.value })} /></label>
        <label>Tipo de vehículo<select className={control} value={datos.tipo} onChange={e => setDatos({ ...datos, tipo: e.target.value })}>{Object.entries(ETIQUETA_TIPO_VEHICULO).map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}</select></label>
        <label>Color<input className={control} required maxLength={40} value={datos.color} onChange={e => setDatos({ ...datos, color: e.target.value })} /></label>
        <label>Placas<input className={control} value={datos.placas} maxLength={20} autoCapitalize="characters" onChange={e => setDatos({ ...datos, placas: e.target.value })} /></label>
        <label>VIN<input className={control} value={datos.vin} maxLength={17} autoCapitalize="characters" onChange={e => setDatos({ ...datos, vin: e.target.value })} /></label>
        <p className="text-sm sm:col-span-2">Indica placas o VIN para identificar el vehículo.</p>
        <label>Transmisión<select className={control} value={datos.transmision} onChange={e => setDatos({ ...datos, transmision: e.target.value })}><option value="manual">Manual</option><option value="automatica">Automática</option><option value="electrica">Eléctrica</option></select></label>
        <div className="grid gap-3 sm:col-span-2">
          {([['tiene_tarjeta_circulacion', 'Cuenta con tarjeta de circulación'], ['tiene_verificacion', 'Cuenta con verificación'], ['puede_circular_rodando', 'Puede circular rodando']] as const).map(([campo, texto]) => <label key={campo} className="flex gap-2"><input type="checkbox" checked={datos[campo]} onChange={e => setDatos({ ...datos, [campo]: e.target.checked })} />{texto}</label>)}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-red-600 sm:col-span-2">{error}</p>}
      <button type="submit" disabled={guardando} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2">{guardando ? "Guardando…" : "Guardar vehículo"}</button>
    </form>
  </section>;
}
