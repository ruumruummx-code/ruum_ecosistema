"use client";
import { useCallback, useRef, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Car,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  ShieldCheck,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { Button, Sheet, cn } from "@ruum/ui/base";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

export type ModalCuenta = "consejos" | "seguridad" | "mfa" | "sesiones" | "pagos" | "legal" | "soporte";

export const MODOS_CUENTA: readonly ModalCuenta[] = ["consejos", "seguridad", "mfa", "sesiones", "pagos", "legal", "soporte"];

const TITULOS: Record<ModalCuenta, string> = {
  consejos: "Consejos de seguridad",
  seguridad: "Seguridad de la cuenta",
  mfa: "Verificación en dos pasos",
  sesiones: "Dispositivos y sesiones",
  pagos: "Métodos de pago",
  legal: "Legal y cuenta",
  soporte: "Ayuda de tu cuenta",
};

type Icono = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

const FILA =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md border border-ui-line px-3 py-2.5 text-left text-sm text-ui-fg hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring";

function ContenidoFila({ icono: Icono, titulo, detalle, destructivo }: { icono: Icono; titulo: string; detalle?: string; destructivo?: boolean }) {
  return (
    <>
      <Icono aria-hidden="true" className={cn("size-5 shrink-0", destructivo ? "text-ui-danger" : "text-ui-fg-muted")} />
      <span className="min-w-0 flex-1">
        <strong className={cn("block font-semibold", destructivo && "text-ui-danger")}>{titulo}</strong>
        {detalle && <small className="block text-xs text-ui-fg-muted">{detalle}</small>}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
    </>
  );
}

/** Fila de navegación dentro de un diálogo de cuenta. */
function FilaEnlace({ href, ...fila }: { href: string; icono: Icono; titulo: string; detalle?: string; destructivo?: boolean }) {
  return (
    <Link href={href} className={FILA}>
      <ContenidoFila {...fila} />
    </Link>
  );
}

function FilaBoton({ onClick, ...fila }: { onClick: () => void; icono: Icono; titulo: string; detalle?: string }) {
  return (
    <button type="button" onClick={onClick} className={FILA}>
      <ContenidoFila {...fila} />
    </button>
  );
}

function Aviso({ icono: Icono, children }: { icono: Icono; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-ui-brand-soft p-3 text-sm text-ui-brand-soft-fg">
      <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function Resultado({ error, children }: { error: boolean; children: ReactNode }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn("rounded-md p-3 text-sm font-medium", error ? "bg-ui-danger-soft text-ui-danger" : "bg-ui-success-soft text-ui-success")}
    >
      {children}
    </p>
  );
}

/** Diálogos de la pantalla Mi cuenta: hoja inferior en móvil y diálogo centrado desde 640 px. */
export function DialogoCuenta({
  modo,
  cerrar,
  cambiar,
  metodoPago,
  correo,
  cerrarSesion,
  cerrarSesionGlobal,
  cerrandoSesion,
  errorSesion,
}: {
  modo: ModalCuenta;
  cerrar: () => void;
  cambiar: (modo: ModalCuenta) => void;
  metodoPago: boolean;
  correo: string;
  cerrarSesion: () => Promise<void>;
  cerrarSesionGlobal?: () => Promise<void>;
  cerrandoSesion: boolean;
  errorSesion?: string | null;
}) {
  const bloqueo = useRef(false);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<{ error: boolean; texto: string } | null>(null);

  async function cerrarOtras() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setResultado(null);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("sesion_no_disponible");
      const { error } = await crearClienteNavegador().auth.signOut({ scope: "others" });
      if (error) throw error;
      setResultado({ error: false, texto: "Se cerraron las otras sesiones. Esta sesión permanece activa." });
      setConfirmando(false);
    } catch {
      setResultado({ error: true, texto: "No pudimos cerrar las otras sesiones. Inténtalo de nuevo." });
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  return (
    <Sheet open onClose={cerrarSeguro} titulo={TITULOS[modo]} etiquetaCerrar="Cerrar diálogo de cuenta">
      <div className="flex flex-col gap-3 pb-2 text-sm">
        {errorSesion && <Resultado error>{errorSesion}</Resultado>}

        {modo === "consejos" && (
          <>
            <ol className="flex flex-col gap-3">
              {(
                [
                  [ShieldCheck, "Conductores certificados", "Consulta la identificación de tu conductor en el Pasaporte Digital antes de entregar tu vehículo."],
                  [Car, "Evidencia fotográfica", "Revisa las fotografías de recolección y entrega para comprobar el estado de tu vehículo."],
                  [MapPin, "Seguimiento del traslado", "Consulta las actualizaciones de ubicación y contacta a soporte desde el detalle del servicio."],
                ] as const
              ).map(([Icono, titulo, texto]) => (
                <li key={titulo} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg">
                    <Icono aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <strong className="block font-semibold">{titulo}</strong>
                    <p className="text-ui-fg-muted">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button className="self-end" onClick={cerrar}>
              Entendido
            </Button>
          </>
        )}

        {modo === "sesiones" && (
          <>
            <section aria-label="Sesión actual" className="flex items-start gap-3 rounded-md border border-ui-line p-3">
              <Monitor aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
              <div className="min-w-0">
                <strong className="block font-semibold">Sesión actual</strong>
                <p className="truncate">{correo}</p>
                <small className="text-xs text-ui-fg-muted">Este navegador · sesión iniciada</small>
              </div>
            </section>
            <p className="text-ui-fg-muted">
              Puedes cerrar las sesiones de otros dispositivos y conservar tu acceso en este navegador. No se dispone de un listado de dispositivos
              para mostrar un conteo verificado.
            </p>
            {resultado && <Resultado error={resultado.error}>{resultado.texto}</Resultado>}
            {confirmando ? (
              <div className="flex flex-col gap-2 rounded-md border border-ui-warning bg-ui-warning-soft p-3">
                <strong className="font-semibold text-ui-fg">¿Cerrar las otras sesiones?</strong>
                <p className="text-ui-fg-muted">Se revocará su renovación. Los accesos ya emitidos caducan al vencer su vigencia.</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={ocupado} onClick={() => setConfirmando(false)}>
                    Volver
                  </Button>
                  <Button size="sm" disabled={ocupado} onClick={cerrarOtras}>
                    {ocupado ? "Cerrando…" : "Confirmar cierre"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="self-start" onClick={() => setConfirmando(true)}>
                Cerrar otras sesiones
              </Button>
            )}
            <div className="flex flex-col items-start gap-1 border-t border-ui-line pt-2">
              <Button variant="ghost" size="sm" disabled={cerrandoSesion || ocupado} onClick={() => void cerrarSesion()}>
                <LogOut aria-hidden="true" />
                {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión en este dispositivo"}
              </Button>
              {cerrarSesionGlobal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ui-danger hover:text-ui-danger"
                  disabled={cerrandoSesion || ocupado}
                  onClick={() => void cerrarSesionGlobal()}
                >
                  <LogOut aria-hidden="true" />
                  {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión en todos los dispositivos"}
                </Button>
              )}
            </div>
          </>
        )}

        {modo === "mfa" && (
          <>
            <Aviso icono={ShieldCheck}>La activación de la verificación en dos pasos todavía no está disponible en el acceso actual de la plataforma.</Aviso>
            <p className="text-ui-fg-muted">
              Puedes consultar con soporte las opciones de protección de tu cuenta. Mientras tanto, utiliza una contraseña única y mantén
              actualizados tus datos de contacto.
            </p>
            <Button asChild className="self-start">
              <Link href="/soporte?tema=verificacion-dos-pasos">
                Contactar soporte
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        )}

        {modo === "seguridad" && (
          <div className="flex flex-col gap-2">
            <FilaEnlace href="/cuenta/cambiar-contrasena" icono={Lock} titulo="Cambiar contraseña" detalle="Actualiza tu clave de acceso." />
            <FilaBoton onClick={() => cambiar("mfa")} icono={ShieldCheck} titulo="Verificación en dos pasos" detalle="Consulta las opciones disponibles." />
            <FilaBoton onClick={() => cambiar("sesiones")} icono={Monitor} titulo="Administrar sesiones" detalle="Cierra el acceso desde otros dispositivos." />
          </div>
        )}

        {modo === "pagos" && (
          <>
            <Aviso icono={CreditCard}>
              {metodoPago ? "Tu cuenta tiene un método de pago registrado." : "Tu cuenta no tiene un método de pago registrado."}
            </Aviso>
            <p className="text-ui-fg-muted">Consulta los pagos de tus traslados desde el detalle de cada servicio. Gestiona tus datos fiscales en Facturación.</p>
            <div className="flex flex-col gap-2">
              <FilaEnlace href="/cuenta/metodos-pago" icono={CreditCard} titulo="Administrar tarjetas guardadas" />
              <FilaEnlace href="/mis-viajes" icono={Car} titulo="Consultar mis traslados" />
              <FilaEnlace href="/cuenta/facturacion" icono={FileText} titulo="Datos de facturación" />
            </div>
          </>
        )}

        {modo === "legal" && (
          <div className="flex flex-col gap-2">
            <FilaEnlace href="/legal/terminos" icono={FileText} titulo="Términos y condiciones" />
            <FilaEnlace href="/legal/privacidad" icono={ShieldCheck} titulo="Aviso de privacidad" />
            <FilaEnlace href="/soporte" icono={Mail} titulo="Ayuda con mi cuenta" />
            <FilaEnlace href="/soporte?motivo=eliminar_cuenta" icono={Trash2} titulo="Eliminar cuenta" destructivo />
          </div>
        )}

        {modo === "soporte" && (
          <div className="flex flex-col gap-2">
            <FilaEnlace href="/soporte" icono={LifeBuoy} titulo="Contactar soporte" />
            <FilaEnlace href="/preguntas-frecuentes" icono={CircleHelp} titulo="Centro de ayuda" detalle="Preguntas frecuentes" />
            <FilaEnlace href="/soporte?motivo=problema_traslado" icono={TriangleAlert} titulo="Reportar problema" />
            <FilaEnlace href="/soporte?motivo=ayuda_evidencia" icono={Camera} titulo="Ayuda con evidencia" />
          </div>
        )}
      </div>
    </Sheet>
  );
}
