"use client";
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, Input, Label, NativeSelect, Sheet, cn } from "@ruum/ui/base";
import {
  validarDatosUbicacion,
  type DatosUbicacion,
  type OperacionUbicacion,
} from "./libreta-ubicaciones";
import { nombreUbicacion } from "./UbicacionVisual";
import type { UbicacionUsuario } from "./ubicaciones-usuario";

function Campo({ etiqueta, completo, children }: { etiqueta: string; completo?: boolean; children: ReactNode }) {
  return (
    <Label className={cn("flex flex-col gap-1.5", completo && "sm:col-span-2")}>
      {etiqueta}
      {children}
    </Label>
  );
}

function ErrorFormulario({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-ui-danger-soft p-3 text-sm font-medium text-ui-danger">
      {children}
    </p>
  );
}
export function EditorUbicacion({
  ubicacion,
  cerrar,
  guardar,
}: {
  ubicacion?: UbicacionUsuario;
  cerrar: () => void;
  guardar: (op: OperacionUbicacion) => Promise<void>;
}) {
  const bloqueo = useRef(false);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const [id] = useState(() =>
    ubicacion?.guardada ? ubicacion.id : `guardada:${crypto.randomUUID()}`,
  );
  const [datos, setDatos] = useState({
    alias: ubicacion ? nombreUbicacion(ubicacion) : "",
    direccion: ubicacion?.direccion ?? "",
    ciudad: ubicacion?.ciudad ?? "",
    estado: ubicacion?.estado ?? "",
    codigoPostal: ubicacion?.codigoPostal ?? "",
    referencia: ubicacion?.referencia ?? "",
    tipo: ubicacion?.fuentes.includes("trabajo") ? "trabajo" : "otro",
    lat: ubicacion?.lat == null ? "" : String(ubicacion.lat),
    lng: ubicacion?.lng == null ? "" : String(ubicacion.lng),
  });
  const [favorita, setFavorita] = useState(Boolean(ubicacion?.favorita));
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  function cambiar(campo: keyof typeof datos, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }
  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (bloqueo.current) return;
    setError("");
    try {
      const validos = validarDatosUbicacion({
        ...datos,
        lat: datos.lat.trim() ? Number(datos.lat) : null,
        lng: datos.lng.trim() ? Number(datos.lng) : null,
      }) as DatosUbicacion;
      bloqueo.current = true;
      setOcupado(true);
      await guardar({
        tipo: "guardar",
        id,
        datos: validos,
        versionEsperada: ubicacion?.guardada
          ? (ubicacion.version ?? null)
          : null,
        reemplazarId:
          ubicacion && !ubicacion.guardada ? ubicacion.id : undefined,
        favorita,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos guardar la ubicación.",
      );
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }
  const titulo = ubicacion?.guardada ? "Editar ubicación" : ubicacion ? "Guardar dirección en mi libreta" : "Nueva ubicación";
  return (
    <Sheet open onClose={cerrarSeguro} titulo={titulo} etiquetaCerrar="Cerrar editor de ubicación" className="sm:max-w-xl">
      <form onSubmit={enviar} className="flex flex-col gap-4 pb-2">
        {ubicacion && !ubicacion.guardada && (
          <p className="rounded-md bg-ui-brand-soft p-3 text-sm text-ui-brand-soft-fg">
            Se guardará una copia editable en tu libreta. El perfil y los traslados anteriores conservarán sus datos.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Alias o nombre" completo>
            <Input required minLength={2} maxLength={80} value={datos.alias} onChange={(e) => cambiar("alias", e.target.value)} placeholder="Ej. Oficina corporativa" disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Dirección" completo>
            <Input required minLength={2} maxLength={300} value={datos.direccion} onChange={(e) => cambiar("direccion", e.target.value)} placeholder="Calle, número y colonia" disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Ciudad o municipio">
            <Input required minLength={2} maxLength={100} value={datos.ciudad} onChange={(e) => cambiar("ciudad", e.target.value)} disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Estado">
            <Input maxLength={100} value={datos.estado} onChange={(e) => cambiar("estado", e.target.value)} disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Código postal">
            <Input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={datos.codigoPostal} onChange={(e) => cambiar("codigoPostal", e.target.value)} disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Tipo de ubicación">
            <NativeSelect value={datos.tipo} onChange={(e) => cambiar("tipo", e.target.value)} disabled={ocupado}>
              <option value="otro">Otro</option>
              <option value="trabajo">Trabajo</option>
            </NativeSelect>
          </Campo>
          <Campo etiqueta="Referencia" completo>
            <Input maxLength={300} value={datos.referencia} onChange={(e) => cambiar("referencia", e.target.value)} placeholder="Opcional" disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Latitud (opcional)">
            <Input type="number" step="any" min={-90} max={90} value={datos.lat} onChange={(e) => cambiar("lat", e.target.value)} disabled={ocupado} />
          </Campo>
          <Campo etiqueta="Longitud (opcional)">
            <Input type="number" step="any" min={-180} max={180} value={datos.lng} onChange={(e) => cambiar("lng", e.target.value)} disabled={ocupado} />
          </Campo>
        </div>
        <Label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input type="checkbox" className="size-4 accent-ui-brand" checked={favorita} onChange={(e) => setFavorita(e.target.checked)} disabled={ocupado} />
          Marcar como frecuente
        </Label>
        {error && <ErrorFormulario>{error}</ErrorFormulario>}
        <div className="flex flex-col-reverse gap-2 border-t border-ui-line pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={ocupado} onClick={cerrarSeguro}>
            Cancelar
          </Button>
          <Button type="submit" disabled={ocupado}>
            {ocupado ? "Guardando…" : ubicacion?.guardada ? "Guardar cambios" : "Guardar ubicación"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
export function ConfirmarEliminarUbicacion({
  ubicacion,
  cerrar,
  eliminar,
}: {
  ubicacion: UbicacionUsuario;
  cerrar: () => void;
  eliminar: () => Promise<void>;
}) {
  const bloqueo = useRef(false);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  async function confirmar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      await eliminar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos eliminar la ubicación.",
      );
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }
  return (
    <Sheet open onClose={cerrarSeguro} titulo="Eliminar ubicación" etiquetaCerrar="Cerrar confirmación">
      <div className="flex flex-col gap-3 pb-2 text-sm">
        <strong className="text-base font-semibold">{nombreUbicacion(ubicacion)}</strong>
        <p className="text-ui-fg-muted">
          {ubicacion.guardada
            ? "Esta dirección se eliminará de tu libreta."
            : "Esta dirección se quitará de Mis ubicaciones. No se modificarán el perfil ni los traslados anteriores."}
        </p>
        {error && <ErrorFormulario>{error}</ErrorFormulario>}
        <div className="flex flex-col-reverse gap-2 border-t border-ui-line pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={ocupado} onClick={cerrarSeguro}>
            Conservar ubicación
          </Button>
          <Button variant="danger" disabled={ocupado} onClick={confirmar}>
            {ocupado ? "Eliminando…" : "Confirmar eliminación"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
