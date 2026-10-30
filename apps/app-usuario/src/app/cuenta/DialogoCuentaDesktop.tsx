"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useDialogAccesible } from "@ruum/ui";
import {
  crearClienteNavegador,
  tieneSupabaseConfigurado,
} from "../../lib/supabase-browser";
import { CuentaIcon as Icon } from "./CuentaVisual";
import s from "./cuenta-desktop.module.css";
export type ModalCuenta =
  | "consejos"
  | "seguridad"
  | "mfa"
  | "sesiones"
  | "pagos"
  | "legal"
  | "soporte";
const titulos: Record<ModalCuenta, string> = {
  consejos: "Consejos de seguridad",
  seguridad: "Seguridad de la cuenta",
  mfa: "Verificación en dos pasos",
  sesiones: "Dispositivos y sesiones",
  pagos: "Métodos de pago",
  legal: "Legal y cuenta",
  soporte: "Ayuda de tu cuenta",
};
export function DialogoCuentaDesktop({
  modo,
  cerrar,
  cambiar,
  metodoPago,
  correo,
  cerrarSesion,
  cerrandoSesion,
  errorSesion,
}: {
  modo: ModalCuenta;
  cerrar: () => void;
  cambiar: (modo: ModalCuenta) => void;
  metodoPago: boolean;
  correo: string;
  cerrarSesion: () => Promise<void>;
  cerrandoSesion: boolean;
  errorSesion?: string | null;
}) {
  const foco = useRef<HTMLButtonElement>(null);
  const bloqueo = useRef(false);
  const cerrarSeguro = useCallback(() => {
    if (!bloqueo.current) cerrar();
  }, [cerrar]);
  const dialog = useDialogAccesible({
    focoInicial: foco,
    alCancelar: cerrarSeguro,
  });
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<{
    error: boolean;
    texto: string;
  } | null>(null);
  async function cerrarOtras() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setResultado(null);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("sesion_no_disponible");
      const { error } = await crearClienteNavegador().auth.signOut({
        scope: "others",
      });
      if (error) throw error;
      setResultado({
        error: false,
        texto: "Se cerraron las otras sesiones. Esta sesión permanece activa.",
      });
      setConfirmando(false);
    } catch {
      setResultado({
        error: true,
        texto: "No pudimos cerrar las otras sesiones. Inténtalo de nuevo.",
      });
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="titulo-dialogo-cuenta"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrarSeguro();
      }}
    >
      <header>
        <h2 id="titulo-dialogo-cuenta">{titulos[modo]}</h2>
        <button
          ref={foco}
          aria-label="Cerrar diálogo de cuenta"
          disabled={ocupado}
          onClick={cerrarSeguro}
        >
          <Icon name="close" />
        </button>
      </header>
      {errorSesion && (
        <p role="alert" className={s.operationResult} data-error="true">
          {errorSesion}
        </p>
      )}
      {modo === "consejos" ? (
        <>
          <ol className={s.tips}>
            <li>
              <Icon name="shield" />
              <div>
                <strong>Conductores certificados</strong>
                <p>
                  Consulta la identificación de tu conductor en el Pasaporte
                  Digital antes de entregar tu vehículo.
                </p>
              </div>
            </li>
            <li>
              <Icon name="car" />
              <div>
                <strong>Evidencia fotográfica</strong>
                <p>
                  Revisa las fotografías de recolección y entrega para comprobar
                  el estado de tu vehículo.
                </p>
              </div>
            </li>
            <li>
              <Icon name="pin" />
              <div>
                <strong>Seguimiento del traslado</strong>
                <p>
                  Consulta las actualizaciones de ubicación y contacta a soporte
                  desde el detalle del servicio.
                </p>
              </div>
            </li>
          </ol>
          <button className={s.primary} onClick={cerrar}>
            Entendido
          </button>
        </>
      ) : modo === "sesiones" ? (
        <>
          <section className={s.sessionInfo}>
            <Icon name="device" />
            <div>
              <strong>Sesión actual</strong>
              <p>{correo}</p>
              <small>Este navegador · sesión iniciada</small>
            </div>
          </section>
          <p>
            Puedes cerrar las sesiones de otros dispositivos y conservar tu
            acceso en este navegador. No se dispone de un listado de
            dispositivos para mostrar un conteo verificado.
          </p>
          {resultado && (
            <p
              role={resultado.error ? "alert" : "status"}
              data-error={resultado.error}
              className={s.operationResult}
            >
              {resultado.texto}
            </p>
          )}
          {confirmando ? (
            <div className={s.confirmation}>
              <strong>¿Cerrar las otras sesiones?</strong>
              <p>
                Se revocará su renovación. Los accesos ya emitidos caducan al
                vencer su vigencia.
              </p>
              <div>
                <button
                  className={s.secondary}
                  disabled={ocupado}
                  onClick={() => setConfirmando(false)}
                >
                  Volver
                </button>
                <button
                  className={s.primary}
                  disabled={ocupado}
                  onClick={cerrarOtras}
                >
                  {ocupado ? "Cerrando…" : "Confirmar cierre"}
                </button>
              </div>
            </div>
          ) : (
            <button className={s.primary} onClick={() => setConfirmando(true)}>
              Cerrar otras sesiones
            </button>
          )}
          <button
            className={s.textButton}
            disabled={cerrandoSesion || ocupado}
            onClick={() => void cerrarSesion()}
          >
            <Icon name="logout" />
            {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </>
      ) : modo === "mfa" ? (
        <>
          <div className={s.notice}>
            <Icon name="shield" />
            <p>
              La activación de la verificación en dos pasos todavía no está
              disponible en el acceso actual de la plataforma.
            </p>
          </div>
          <p>
            Puedes consultar con soporte las opciones de protección de tu
            cuenta. Mientras tanto, utiliza una contraseña única y mantén
            actualizados tus datos de contacto.
          </p>
          <Link
            className={s.primary}
            href="/soporte?tema=verificacion-dos-pasos"
          >
            Contactar soporte
            <Icon name="arrow" />
          </Link>
        </>
      ) : modo === "seguridad" ? (
        <div className={s.modalLinks}>
          <Link href="/cuenta/cambiar-contrasena">
            <Icon name="lock" />
            <div>
              <strong>Cambiar contraseña</strong>
              <small>Actualiza tu clave de acceso.</small>
            </div>
            <Icon name="chevron" />
          </Link>
          <button onClick={() => cambiar("mfa")}>
            <Icon name="shield" />
            <div>
              <strong>Verificación en dos pasos</strong>
              <small>Consulta las opciones disponibles.</small>
            </div>
            <Icon name="chevron" />
          </button>
          <button onClick={() => cambiar("sesiones")}>
            <Icon name="device" />
            <div>
              <strong>Administrar sesiones</strong>
              <small>Cierra el acceso desde otros dispositivos.</small>
            </div>
            <Icon name="chevron" />
          </button>
        </div>
      ) : modo === "pagos" ? (
        <>
          <div className={s.notice}>
            <Icon name="card" />
            <p>
              {metodoPago
                ? "Tu cuenta tiene un método de pago registrado."
                : "Tu cuenta no tiene un método de pago registrado."}
            </p>
          </div>
          <p>
            Consulta los pagos de tus traslados desde el detalle de cada
            servicio. Gestiona tus datos fiscales en Facturación.
          </p>
          <div className={s.modalLinks}>
            <Link href="/mis-viajes">
              <Icon name="car" />
              <strong>Consultar mis traslados</strong>
              <Icon name="chevron" />
            </Link>
            <Link href="/cuenta/facturacion">
              <Icon name="file" />
              <strong>Datos de facturación</strong>
              <Icon name="chevron" />
            </Link>
          </div>
        </>
      ) : modo === "legal" ? (
        <div className={s.modalLinks}>
          <Link href="/legal/terminos">
            <Icon name="file" />
            <strong>Términos y condiciones</strong>
            <Icon name="chevron" />
          </Link>
          <Link href="/legal/privacidad">
            <Icon name="shield" />
            <strong>Aviso de privacidad</strong>
            <Icon name="chevron" />
          </Link>
          <Link href="/soporte">
            <Icon name="mail" />
            <strong>Ayuda con mi cuenta</strong>
            <Icon name="chevron" />
          </Link>
        </div>
      ) : (
        <div className={s.modalLinks}>
          <Link href="/soporte">
            <Icon name="mail" />
            <strong>Contactar soporte</strong>
            <Icon name="chevron" />
          </Link>
          <Link href="/preguntas-frecuentes">
            <Icon name="file" />
            <strong>Centro de ayuda</strong>
            <Icon name="chevron" />
          </Link>
        </div>
      )}
    </dialog>
  );
}
