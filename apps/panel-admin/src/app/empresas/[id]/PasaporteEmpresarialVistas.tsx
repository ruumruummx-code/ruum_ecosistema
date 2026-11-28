import Link from "next/link";
import { AdminBadge } from "../../admin-components";
import {
  etiqueta,
  fecha,
  moneda,
  periodo,
  tonoDocumento,
  tonoVerificacion,
  ESTADOS_TERMINALES,
  type CambioSensible,
  type Conductor,
  type Documento,
  type Empresa,
  type Traslado,
  type Usuario,
  type Vehiculo,
  type VersionCondiciones,
  type VersionFiscal,
  type agruparLugares
} from "./PasaporteEmpresarialHelpers";
import { Dato } from "./PasaporteEmpresarialComponentes";

export function VistaControl({
  empresa,
  usuarios,
  alertas,
  cambios,
  versionesCondiciones
}: {
  empresa: Empresa;
  usuarios: Usuario[];
  alertas: string[];
  cambios: CambioSensible[];
  versionesCondiciones: VersionCondiciones[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        <h2 className="font-display text-lg font-semibold text-ui-fg">Autorizacion corporativa</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] font-body text-sm">
            <thead>
              <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
                <th className="py-3 pr-4">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Verificacion</th>
                <th className="px-4 py-3">Metodo pago</th>
                <th className="py-3 pl-4">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-ui-line">
                  <td className="py-3 pr-4 font-medium text-ui-fg">{usuario.nombre}</td>
                  <td className="px-4 py-3">{etiqueta(usuario.rol)}</td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={tonoVerificacion(usuario.estado_verificacion)}>
                      {etiqueta(usuario.estado_verificacion)}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3">{usuario.metodo_pago_registrado ? "Registrado" : "Pendiente"}</td>
                  <td className="py-3 pl-4 text-ui-fg-muted">
                    {usuario.correo_facturacion ?? usuario.telefono ?? "Sin contacto"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="border-t border-ui-line pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <h2 className="font-display text-lg font-semibold text-ui-fg">Riesgos y pendientes</h2>
        {alertas.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ui-fg-muted">Sin alertas operativas con los datos actuales.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alertas.map((alerta) => (
              <li
                key={alerta}
                className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft px-3 py-2 font-body text-sm text-ui-warning"
              >
                {alerta}
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-5 grid gap-3">
          <Dato etiqueta="Limite de credito" valor={moneda(empresa.limite_credito_mxn)} mono />
          <Dato etiqueta="Credito disponible" valor={moneda(empresa.credito_disponible_mxn)} mono />
          <Dato
            etiqueta="Version comercial vigente"
            valor={versionesCondiciones[0]?.version ? `v${versionesCondiciones[0].version}` : "Sin version"}
          />
          <Dato
            etiqueta="Cambios pendientes"
            valor={`${cambios.filter((cambio) => cambio.estado === "pendiente").length}`}
            mono
          />
        </dl>
      </section>
    </div>
  );
}

export function VistaFlota({ vehiculos, conductores }: { vehiculos: Vehiculo[]; conductores: Conductor[] }) {
  void conductores;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section>
        <h2 className="font-display text-lg font-semibold text-ui-fg">Vehiculos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] font-body text-sm">
            <thead>
              <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
                <th className="py-3 pr-4">Unidad</th>
                <th className="px-4 py-3">Placas / VIN</th>
                <th className="px-4 py-3">Condicion</th>
                <th className="px-4 py-3">Documentos</th>
                <th className="py-3 pl-4">Conductor</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo) => {
                return (
                  <tr key={vehiculo.id} className="border-b border-ui-line align-top">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ui-fg">
                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                      </p>
                      <p className="text-xs text-ui-fg-muted">
                        {etiqueta(vehiculo.tipo)} · {vehiculo.gama ? etiqueta(vehiculo.gama) : "Sin gama"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono-ruum text-xs">
                      {vehiculo.placas ?? "Sin placas"}
                      <br />
                      {vehiculo.vin ?? "Sin VIN"}
                    </td>
                    <td className="px-4 py-3">
                      {vehiculo.condicion ? etiqueta(vehiculo.condicion) : vehiculo.estado_general_declarado ?? "Sin declaracion"}
                    </td>
                    <td className="px-4 py-3">
                      <Checklist
                        items={[
                          ["Placas", vehiculo.tiene_placas],
                          ["Tarjeta", vehiculo.tiene_tarjeta_circulacion],
                          ["Verificacion", vehiculo.tiene_verificacion]
                        ]}
                      />
                    </td>
                    <td className="py-3 pl-4">Sin asignar</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="font-display text-lg font-semibold text-ui-fg">Conductores</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] font-body text-sm">
            <thead>
              <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
                <th className="py-3 pr-4">Conductor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Licencia</th>
                <th className="py-3 pl-4">Indicadores</th>
              </tr>
            </thead>
            <tbody>
              {conductores.map((conductor) => (
                <tr key={conductor.id} className="border-b border-ui-line align-top">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/conductores/activos/${conductor.id}`}
                      className="font-semibold text-ui-brand hover:underline"
                    >
                      {conductor.nombre}
                    </Link>
                    <p className="mt-1 text-xs text-ui-fg-muted">{conductor.telefono ?? "Sin telefono"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={conductor.estado === "activo" ? "success" : "warning"}>
                      {etiqueta(conductor.estado)}
                    </AdminBadge>
                    <p className="mt-1 text-xs text-ui-fg-muted">{etiqueta(conductor.estado_expediente)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{conductor.licencia_tipo ?? "Sin tipo"}</p>
                    <p className="text-xs text-ui-fg-muted">
                      {conductor.licencia_vigencia ? fecha(conductor.licencia_vigencia) : "Sin vigencia"}
                    </p>
                  </td>
                  <td className="py-3 pl-4">
                    <Checklist
                      items={[
                        ["Docs", conductor.documentos_vigentes],
                        ["Antecedentes", conductor.autoriza_verificacion_antecedentes],
                        ["Sin susp.", conductor.declara_sin_suspensiones]
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function VistaRutas({
  origenes,
  destinos
}: {
  origenes: ReturnType<typeof agruparLugares>;
  destinos: ReturnType<typeof agruparLugares>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <TablaLugares titulo="Origenes frecuentes" lugares={origenes} />
      <TablaLugares titulo="Destinos frecuentes" lugares={destinos} />
    </div>
  );
}

export function VistaTraslados({ traslados }: { traslados: Traslado[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ui-fg">Historial operativo</h2>
        <span className="font-body text-sm text-ui-fg-muted">{traslados.length.toLocaleString("es-MX")} traslados vinculados</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[960px] font-body text-sm">
          <thead>
            <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
              <th className="py-3 pr-4">Traslado</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Programado</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="py-3 pl-4">Incidencia</th>
            </tr>
          </thead>
          <tbody>
            {traslados.slice(0, 60).map((traslado) => (
              <tr key={traslado.id} className="border-b border-ui-line align-top">
                <td className="py-3 pr-4">
                  <Link
                    href={`/viajes/${traslado.id}`}
                    className="font-mono-ruum text-xs font-semibold text-ui-brand hover:underline"
                  >
                    {traslado.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="mt-1 text-xs text-ui-fg-muted">{fecha(traslado.creado_en)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ui-fg">
                    {traslado.origen_ciudad} {"->"} {traslado.destino_ciudad}
                  </p>
                  <p className="mt-1 text-xs text-ui-fg-muted">
                    {traslado.origen_direccion} / {traslado.destino_direccion}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <AdminBadge tone={ESTADOS_TERMINALES.has(traslado.estado) ? "neutral" : "info"}>
                    {etiqueta(traslado.estado)}
                  </AdminBadge>
                </td>
                <td className="px-4 py-3">{traslado.fecha_hora_programada ? fecha(traslado.fecha_hora_programada) : "Sin programar"}</td>
                <td className="px-4 py-3 text-right font-mono-ruum">
                  {moneda(traslado.precio_final ?? traslado.precio_cotizado ?? traslado.presupuesto_usuario)}
                </td>
                <td className="py-3 pl-4">
                  {traslado.tiene_incidencia_abierta ? (
                    <AdminBadge tone="danger">Abierta</AdminBadge>
                  ) : (
                    <AdminBadge>Sin incidencia</AdminBadge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function VistaExpediente({
  documentos,
  versionesFiscales,
  versionesCondiciones,
  cambios
}: {
  documentos: Documento[];
  versionesFiscales: VersionFiscal[];
  versionesCondiciones: VersionCondiciones[];
  cambios: CambioSensible[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section>
        <h2 className="font-display text-lg font-semibold text-ui-fg">Documentos empresariales</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] font-body text-sm">
            <thead>
              <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
                <th className="py-3 pr-4">Documento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="py-3 pl-4">Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => (
                <tr key={documento.id} className="border-b border-ui-line">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-ui-fg">{documento.nombre}</p>
                    <p className="text-xs text-ui-fg-muted">
                      {etiqueta(documento.tipo)} · {documento.folio ?? "Sin folio"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={tonoDocumento(documento.estado)}>{etiqueta(documento.estado)}</AdminBadge>
                  </td>
                  <td className="px-4 py-3">{periodo(documento.vigente_desde, documento.vigente_hasta)}</td>
                  <td className="py-3 pl-4">
                    {documento.url ? (
                      <a href={documento.url} target="_blank" rel="noreferrer" className="font-semibold text-ui-brand hover:underline">
                        Abrir archivo
                      </a>
                    ) : (
                      "Sin archivo"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-6">
        <ListaVersiones
          titulo="Datos fiscales"
          versiones={versionesFiscales.map((version) => ({
            id: version.id,
            version: version.version,
            vigenteHasta: version.vigente_hasta,
            fecha: version.creado_en,
            detalle: version.rfc ?? version.razon_social ?? "Sin RFC"
          }))}
        />
        <ListaVersiones
          titulo="Condiciones comerciales"
          versiones={versionesCondiciones.map((version) => ({
            id: version.id,
            version: version.version,
            vigenteHasta: version.vigente_hasta,
            fecha: version.creado_en,
            detalle: `${moneda(version.limite_credito_mxn)} · ${version.dias_credito ?? 0} dias`
          }))}
        />
        <section>
          <h3 className="font-display text-base font-semibold text-ui-fg">Cambios sensibles</h3>
          <ul className="mt-3 space-y-2">
            {cambios.slice(0, 8).map((cambio) => (
              <li key={cambio.id} className="border-b border-ui-line pb-2 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm font-medium text-ui-fg">{etiqueta(cambio.tipo)}</span>
                  <AdminBadge tone={cambio.estado === "pendiente" ? "warning" : "neutral"}>
                    {etiqueta(cambio.estado)}
                  </AdminBadge>
                </div>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">
                  {fecha(cambio.solicitado_en)} · {cambio.motivo ?? "Sin motivo"}
                </p>
              </li>
            ))}
            {cambios.length === 0 && <li className="font-body text-sm text-ui-fg-muted">Sin cambios sensibles registrados.</li>}
          </ul>
        </section>
      </section>
    </div>
  );
}

function TablaLugares({
  titulo,
  lugares
}: {
  titulo: string;
  lugares: ReturnType<typeof agruparLugares>;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ui-fg">{titulo}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] font-body text-sm">
          <thead>
            <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
              <th className="py-3 pr-4">Lugar</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-right">Traslados</th>
              <th className="px-4 py-3">Ultimo</th>
              <th className="py-3 pl-4">Coordenadas</th>
            </tr>
          </thead>
          <tbody>
            {lugares.map((lugar) => (
              <tr key={`${lugar.ciudad}-${lugar.direccion}-${lugar.referencias ?? ""}`} className="border-b border-ui-line align-top">
                <td className="py-3 pr-4">
                  <p className="font-medium text-ui-fg">{lugar.ciudad}</p>
                  <p className="mt-1 text-xs text-ui-fg-muted">{lugar.direccion}</p>
                  {lugar.referencias && <p className="mt-1 text-xs text-ui-fg-muted">{lugar.referencias}</p>}
                </td>
                <td className="px-4 py-3">
                  {lugar.contacto}
                  <br />
                  <span className="text-xs text-ui-fg-muted">{lugar.telefono}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono-ruum">{lugar.total}</td>
                <td className="px-4 py-3">{fecha(lugar.ultimo)}</td>
                <td className="py-3 pl-4 font-mono-ruum text-xs">
                  {lugar.lat !== null && lugar.lng !== null
                    ? `${lugar.lat.toFixed(5)}, ${lugar.lng.toFixed(5)}`
                    : "Sin coordenadas"}
                </td>
              </tr>
            ))}
            {lugares.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ui-fg-muted">
                  Sin lugares registrados en traslados de esta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Checklist({ items }: { items: Array<[string, boolean]> }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(([label, ok]) => (
        <li key={label}>
          <AdminBadge tone={ok ? "success" : "warning"}>{label}</AdminBadge>
        </li>
      ))}
    </ul>
  );
}

function ListaVersiones({
  titulo,
  versiones
}: {
  titulo: string;
  versiones: Array<{ id: string; version: number; vigenteHasta: string | null; fecha: string; detalle: string }>;
}) {
  return (
    <section>
      <h3 className="font-display text-base font-semibold text-ui-fg">{titulo}</h3>
      <ul className="mt-3 space-y-2">
        {versiones.slice(0, 5).map((version) => (
          <li key={version.id} className="border-b border-ui-line pb-2 last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-sm font-medium text-ui-fg">Version {version.version}</span>
              <AdminBadge tone={version.vigenteHasta ? "neutral" : "success"}>
                {version.vigenteHasta ? "Historica" : "Vigente"}
              </AdminBadge>
            </div>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">
              {version.detalle} · {fecha(version.fecha)}
            </p>
          </li>
        ))}
        {versiones.length === 0 && <li className="font-body text-sm text-ui-fg-muted">Sin versiones registradas.</li>}
      </ul>
    </section>
  );
}
