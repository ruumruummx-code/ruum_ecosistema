import { MobileCard, MobileHeader, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";

export const metadata = {
  title: "Aviso de privacidad — Ruum Ruum",
};

export default function PaginaPrivacidad() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="compact" navInferiorVisible={true}>
        <MobileHeader
          titulo="Aviso de privacidad"
          subtitulo="Vigente desde el 3 de julio de 2026"
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
              Aviso de privacidad
            </h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
              Moviliax S.A. de C.V. (&quot;Ruum Ruum&quot;)
            </p>
          </header>

          <div className="space-y-5 text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            <p className="text-[#0a2342] dark:text-[#f6f8fb] font-medium">
              En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión
              de los Particulares (LFPDPPP), Moviliax S.A. de C.V. (&quot;Ruum Ruum&quot;)
              pone a su disposición el presente Aviso de Privacidad.
            </p>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                1. Responsable del tratamiento
              </h2>
              <p>
                Moviliax S.A. de C.V., con domicilio en la Ciudad de México, es la entidad
                responsable del tratamiento de sus datos personales.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                2. Datos personales recabados
              </h2>
              <p>
                Ruum Ruum recaba los siguientes datos personales: nombre completo, correo
                electrónico, número de teléfono celular, domicilio, datos del vehículo
                (marca, modelo, año, placas, número de serie), e imagen de identificación
                oficial para verificación de identidad.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                3. Finalidades del tratamiento
              </h2>
              <p>Sus datos se utilizan para:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                <li>Gestionar su cuenta y los traslados solicitados.</li>
                <li>Verificar su identidad y la del vehículo a trasladar.</li>
                <li>Generar el Pasaporte Digital con evidencia fotográfica.</li>
                <li>Procesar pagos y emitir comprobantes fiscales.</li>
                <li>Enviar notificaciones sobre el estado de su traslado.</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                4. Transferencia de datos
              </h2>
              <p>
                Ruum Ruum no comparte sus datos personales con terceros para fines comerciales.
                La información puede ser compartida con conductores certificados únicamente
                en la medida necesaria para ejecutar el traslado contratado.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-[15px] font-bold text-[#0a2342] dark:text-white">
                5. Derechos ARCO
              </h2>
              <p>
                Tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de
                sus datos personales. Para ejercer estos derechos, contacte a nuestro
                equipo de privacidad a través del Centro de soporte dentro de la Plataforma.
              </p>
            </section>
          </div>

          <div className="border-t border-[#e6edf6] dark:border-[#1a3a5c] pt-5">
            <a
              href="/docs-legales/aviso-de-privacidad-ruum-ruum.docx"
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
