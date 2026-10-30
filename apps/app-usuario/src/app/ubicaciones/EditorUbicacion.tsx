"use client";
import { useCallback, useRef, useState } from "react";
import { useDialogAccesible } from "@ruum/ui";
import {
  validarDatosUbicacion,
  type DatosUbicacion,
  type OperacionUbicacion,
} from "./libreta-ubicaciones";
import { nombreUbicacion, IconoUbicacion as Icon } from "./UbicacionVisual";
import type { UbicacionUsuario } from "./ubicaciones-usuario";
import s from "./ubicaciones-desktop.module.css";
export function EditorUbicacion({
  ubicacion,
  cerrar,
  guardar,
}: {
  ubicacion?: UbicacionUsuario;
  cerrar: () => void;
  guardar: (op: OperacionUbicacion) => Promise<void>;
}) {
  const bloqueo = useRef(false),
    foco = useRef<HTMLButtonElement>(null);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const dialog = useDialogAccesible({
    focoInicial: foco,
    alCancelar: cerrarSeguro,
  });
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
  async function enviar(event: React.FormEvent) {
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
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="titulo-editor-ubicacion"
    >
      <header>
        <h2 id="titulo-editor-ubicacion">
          {ubicacion?.guardada
            ? "Editar ubicación"
            : ubicacion
              ? "Guardar dirección en mi libreta"
              : "Nueva ubicación"}
        </h2>
        <button
          ref={foco}
          disabled={ocupado}
          aria-label="Cerrar editor de ubicación"
          onClick={cerrarSeguro}
        >
          <Icon name="close" />
        </button>
      </header>
      {ubicacion && !ubicacion.guardada && (
        <p className={s.formHint}>
          Se guardará una copia editable en tu libreta. El perfil y los
          traslados anteriores conservarán sus datos.
        </p>
      )}
      <form onSubmit={enviar}>
        <div className={s.formGrid}>
          <label className={s.full}>
            Alias o nombre
            <input
              required
              minLength={2}
              maxLength={80}
              value={datos.alias}
              onChange={(e) => cambiar("alias", e.target.value)}
              placeholder="Ej. Oficina corporativa"
              disabled={ocupado}
            />
          </label>
          <label className={s.full}>
            Dirección
            <input
              required
              minLength={2}
              maxLength={300}
              value={datos.direccion}
              onChange={(e) => cambiar("direccion", e.target.value)}
              placeholder="Calle, número y colonia"
              disabled={ocupado}
            />
          </label>
          <label>
            Ciudad o municipio
            <input
              required
              minLength={2}
              maxLength={100}
              value={datos.ciudad}
              onChange={(e) => cambiar("ciudad", e.target.value)}
              disabled={ocupado}
            />
          </label>
          <label>
            Estado
            <input
              maxLength={100}
              value={datos.estado}
              onChange={(e) => cambiar("estado", e.target.value)}
              disabled={ocupado}
            />
          </label>
          <label>
            Código postal
            <input
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              value={datos.codigoPostal}
              onChange={(e) => cambiar("codigoPostal", e.target.value)}
              disabled={ocupado}
            />
          </label>
          <label>
            Tipo de ubicación
            <select
              value={datos.tipo}
              onChange={(e) => cambiar("tipo", e.target.value)}
              disabled={ocupado}
            >
              <option value="otro">Otro</option>
              <option value="trabajo">Trabajo</option>
            </select>
          </label>
          <label className={s.full}>
            Referencia
            <input
              maxLength={300}
              value={datos.referencia}
              onChange={(e) => cambiar("referencia", e.target.value)}
              placeholder="Opcional"
              disabled={ocupado}
            />
          </label>
          <label>
            Latitud (opcional)
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={datos.lat}
              onChange={(e) => cambiar("lat", e.target.value)}
              disabled={ocupado}
            />
          </label>
          <label>
            Longitud (opcional)
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={datos.lng}
              onChange={(e) => cambiar("lng", e.target.value)}
              disabled={ocupado}
            />
          </label>
        </div>
        <label className={s.checkbox}>
          <input
            type="checkbox"
            checked={favorita}
            onChange={(e) => setFavorita(e.target.checked)}
            disabled={ocupado}
          />
          Marcar como frecuente
        </label>
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            className={s.outline}
            disabled={ocupado}
            onClick={cerrarSeguro}
          >
            Cancelar
          </button>
          <button className={s.primary} disabled={ocupado} type="submit">
            {ocupado
              ? "Guardando…"
              : ubicacion?.guardada
                ? "Guardar cambios"
                : "Guardar ubicación"}
          </button>
        </footer>
      </form>
    </dialog>
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
  const foco = useRef<HTMLButtonElement>(null),
    bloqueo = useRef(false);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const dialog = useDialogAccesible({
    focoInicial: foco,
    alCancelar: cerrarSeguro,
  });
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
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="titulo-eliminar-ubicacion"
    >
      <header>
        <h2 id="titulo-eliminar-ubicacion">Eliminar ubicación</h2>
        <button
          ref={foco}
          aria-label="Cerrar confirmación"
          disabled={ocupado}
          onClick={cerrarSeguro}
        >
          <Icon name="close" />
        </button>
      </header>
      <strong>{nombreUbicacion(ubicacion)}</strong>
      <p>
        {ubicacion.guardada
          ? "Esta dirección se eliminará de tu libreta."
          : "Esta dirección se quitará de Mis ubicaciones. No se modificarán el perfil ni los traslados anteriores."}
      </p>
      {error && (
        <p role="alert" className={s.formError}>
          {error}
        </p>
      )}
      <div className={s.confirmActions}>
        <button className={s.outline} disabled={ocupado} onClick={cerrarSeguro}>
          Conservar ubicación
        </button>
        <button
          className={s.dangerButton}
          disabled={ocupado}
          onClick={confirmar}
        >
          {ocupado ? "Eliminando…" : "Confirmar eliminación"}
        </button>
      </div>
    </dialog>
  );
}
