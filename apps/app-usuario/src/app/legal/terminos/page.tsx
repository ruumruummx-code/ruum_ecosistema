import { MobileCard, MobileHeader, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";

export const metadata = {
  title: "Términos y condiciones — Ruum Ruum",
};

export default function PaginaTerminos() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="compact" navInferiorVisible={true}>
        <MobileHeader
          titulo="Términos y condiciones"
          subtitulo="Vigentes desde el 3 de julio de 2026"
          enlaceAtras="/cuenta"
          etiquetaAtras="Volver a cuenta"
          conBorde={false}
          className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4 border-b border-[#e6edf6] dark:border-[#1a3a5c]"
        />

        <MobileCard radius="2xl" padding="lg" className="space-y-6 text-[#0a2342] dark:text-[#f6f8fb]">
          <header className="border-b border-[#e6edf6] dark:border-[#1a3a5c] pb-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
              Documento legal
            </p>
            <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-white">
              Términos y condiciones
            </h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
              Moviliax S.A. de C.V. (&quot;Ruum Ruum&quot;)
            </p>
          </header>

          <div className="space-y-5 text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            <p className="text-[#0a2342] dark:text-[#f6f8fb] font-medium">
              El presente documento establece los términos y condiciones bajo los cuales Moviliax
              S.A. de C.V. (&quot;Ruum Ruum&quot;) presta el servicio de traslado vehicular
              con conductor certificado a través de su plataforma digital.
            </p>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                1. Definiciones
              </h2>
              <p>
                <strong>Plataforma:</strong> La aplicación móvil y web de Ruum Ruum disponible
                para usuarios registrados.
              </p>
              <p className="mt-1">
                <strong>Usuario:</strong> Persona física o moral que solicita el servicio de
                traslado vehicular a través de la Plataforma.
              </p>
              <p className="mt-1">
                <strong>Conductor:</strong> Persona física certificada por Ruum Ruum para
                realizar traslados vehiculares.
              </p>
              <p className="mt-1">
                <strong>Pasaporte Digital de Traslado:</strong> Documento digital generado por la Plataforma
                que contiene la evidencia fotográfica, el estado del vehículo y la trazabilidad
                del traslado.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                2. Uso del servicio
              </h2>
              <p>
                El Usuario acepta utilizar la Plataforma únicamente para fines lícitos y
                conforme a las disposiciones establecidas en los presentes Términos. Queda
                prohibido el uso de la Plataforma para solicitar traslados de vehículos cuya
                propiedad o posesión no le corresponda al Usuario.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                3. Registro y verificación de identidad
              </h2>
              <p>
                Para acceder al servicio, el Usuario debe proporcionar información verídica y
                actualizada. Ruum Ruum se reserva el derecho de solicitar documentación
                adicional para verificar la identidad del Usuario antes de autorizar el primer
                traslado. La verificación de identidad no es requisito para crear una cuenta,
                pero sí para activar el servicio de traslado.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                4. Pagos y cancelaciones
              </h2>
              <p>
                Ruum Ruum no acepta pagos en efectivo. Todos los traslados se liquidan a través
                de los métodos de pago registrados en la Plataforma. Las cancelaciones
                realizadas después de que el conductor haya sido asignado pueden generar un
                cargo según la política de cancelación vigente.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                5. Evidencia y responsabilidad
              </h2>
              <p>
                El Pasaporte Digital constituye evidencia del estado del vehículo al inicio y
                al final de cada traslado. Cualquier reclamación por daños debe realizarse
                dentro de las 24 horas siguientes a la entrega del vehículo, con referencia al
                folio del traslado.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                6. Modificaciones
              </h2>
              <p>
                Ruum Ruum se reserva el derecho de modificar los presentes Términos. Las
                modificaciones serán notificadas a través de la Plataforma con al menos 15 días
                de anticipación. El uso continuado de la Plataforma constituye la aceptación de
                los nuevos Términos.
              </p>
            </section>
          </div>

          <div className="border-t border-[#e6edf6] dark:border-[#1a3a5c] pt-5">
            <a
              href="/docs-legales/terminos-y-condiciones-ruum-ruum.docx"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-[#d7e1ee] bg-[#edf4fe] px-4 py-2.5 text-[13px] font-bold text-[#0a2342] transition hover:bg-[#dfeaf8] dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:text-white dark:hover:bg-[#0f2d52]"
            >
              <span>Descargar documento oficial (.docx)</span>
            </a>
          </div>
        </MobileCard>
      </MobileShell>
    </>
  );
}
