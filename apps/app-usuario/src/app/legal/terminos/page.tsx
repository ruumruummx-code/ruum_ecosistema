import Link from "next/link";
import { MobileShell } from "@ruum/ui";
export const metadata = { title: "Términos y condiciones — Ruum Ruum" };
export default function PaginaTerminos() {
return <MobileShell variant="compact" navInferiorVisible={false} className="user-v2-scope user-legal-shell" contentClassName="user-legal-content">
<div className="user-legal-view"><header className="user-legal-header"><div className="user-legal-appbar">
<Link href="/cuenta?seccion=legal" className="user-profile-back">‹ Atrás</Link><h1>Términos y condiciones</h1>
<a href="/docs-legales/terminos-y-condiciones-ruum-ruum.pdf" download aria-label="Descargar términos y condiciones en PDF"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" /></svg></a>
</div><p>Vigente: 3 Jul 2026 · Moviliax S.A. de C.V.</p></header>
<div className="user-legal-reader" role="region" aria-label="Texto de términos y condiciones" tabIndex={0}>          <div className="space-y-5 text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
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

</div></div></MobileShell>;
}
