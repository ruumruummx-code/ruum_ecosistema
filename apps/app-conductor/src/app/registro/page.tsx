"use client";

import Link from "next/link";
import { Button, Aviso } from "@ruum/ui";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import { AccountStep } from "./AccountStep";
import { DocumentsStep } from "./DocumentsStep";
import { DraftRecoveryModal } from "./DraftRecoveryModal";
import { DiditVerificationModal } from "./DiditVerificationModal";
import { IdentityStep } from "./IdentityStep";
import { LicenseStep } from "./LicenseStep";
import { OtpVerification } from "./OtpVerification";
import { RegistrationProgress } from "./RegistrationProgress";
import { RegistrationIcon } from "./RegistrationIcon";
import { RegistrationShell } from "./RegistrationShell";
import { RegistrationNotice } from "./RegistrationNotice";
import { LicenseConsentDetails } from "./LicenseConsentDetails";
import styles from "./registration.module.css";
import { ReviewStep } from "./ReviewStep";
import { PASOS_REGISTRO } from "./registration-types";
import { useRegistroConductorLogic } from "./useRegistroConductorLogic";
import { tieneSupabaseConfigurado } from "../../lib/supabase-browser";

export default function PaginaRegistroConductor() {
  const r = useRegistroConductorLogic();

  return (
    <RegistrationShell
      compact={r.registroCompacto}
      account={r.paso === 0 || r.pendienteOtp}
      identity={r.paso === 1 && !r.pendienteOtp}
      completion={r.paso === 3 || r.paso === 4}
    >
      {r.mostrarDetalleConsentimiento && (
        <LicenseConsentDetails onClose={() => r.setMostrarDetalleConsentimiento(false)} />
      )}
      {r.mostrarVerificacionDidit && (
        <DiditVerificationModal
          isOpen={r.mostrarVerificacionDidit}
          url={r.urlVerificacionDidit}
          cargando={r.iniciandoVerificacionDidit}
          error={r.errorVerificacionDidit}
          onCerrar={r.cerrarVerificacionDidit}
          onReintentar={r.reintentarVerificacionDidit}
          onFinalizar={r.finalizarVerificacionDidit}
        />
      )}
      {r.pendienteOtp ? (
        <OtpVerification
          email={r.email}
          codigoOtp={r.codigoOtp}
          setCodigoOtp={r.setCodigoOtp}
          errorOtp={r.errorOtp}
          clearErrorOtp={() => r.setErrorOtp(null)}
          verificandoOtp={r.verificandoOtp}
          reenviandoOtp={r.reenviandoOtp}
          esperaReenvioOtp={r.esperaReenvioOtp}
          codigoLongitud={r.CODIGO_OTP_LONGITUD}
          intentosFallidos={r.intentosFallidosOtp}
          maxIntentos={r.MAX_INTENTOS_OTP}
          onSubmit={r.confirmarCodigoOtp}
          onResend={() => void r.reenviarCodigoOtp()}
          onAlreadyConfirmed={() => r.router.push("/login")}
          onBack={() => {
            r.setPendienteOtp(false);
            r.setCodigoOtp("");
            r.setErrorOtp(null);
          }}
        />
      ) : r.enviado ? (
        <div className="py-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-control-soft font-display text-xl font-bold text-success" aria-hidden>
            ✓
          </div>
          <h1 id="titulo-registro-conductor" className="mt-5 font-display text-2xl font-bold text-text-primary">
            Solicitud en revisión
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-text-tertiary/80">
            Tu cuenta está pendiente de validación. Cuando la revisión esté completa, podrás consultar y aceptar Traslados.
          </p>

          <div className="mt-6 rounded-2xl border border-route-action/30 bg-surface p-5 text-left shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-route-soft text-lg text-route-action">
                🪪
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-text-primary">
                  Verificación de identidad automática
                </h3>
                <p className="mt-1 font-body text-xs leading-5 text-text-secondary">
                  Agiliza la validación de tu cuenta completando la prueba de vida y validación biométrica con Didit.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  r.setMostrarVerificacionDidit(true);
                  if (!r.urlVerificacionDidit) {
                    r.reintentarVerificacionDidit();
                  }
                }}
                disabled={r.iniciandoVerificacionDidit}
              >
                {r.iniciandoVerificacionDidit ? "Iniciando verificación…" : "Completar verificación de identidad"}
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => r.router.push(r.sesionActivaTrasRegistro ? "/panel" : "/login")}
              >
                {r.sesionActivaTrasRegistro ? "Ir al panel" : "Volver al acceso"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <DraftRecoveryModal
            isOpen={Boolean(r.borradorDisponible)}
            guardadoEn={r.borradorDisponible?.guardadoEn}
            onRestore={r.restaurarBorrador}
            onDiscard={r.descartarBorrador}
          />

          <RegistrationProgress
            paso={r.paso}
            onBack={() => r.paso === 0 ? r.router.push("/login") : r.volver()}
            borradorLocalGuardado={r.borradorLocalGuardado}
            sesionAutenticada={r.sesionAutenticada}
            estadoGuardadoRemoto={r.estadoGuardadoRemoto}
            detalleGuardadoRemoto={r.detalleGuardadoRemoto}
          />

          <form
            className={r.registroCompacto ? styles.form : "mt-6 grid gap-5"}
            noValidate
            inert={!r.registroListo}
            aria-busy={!r.registroListo || r.enviando}
            data-registration-ready={r.registroListo}
            onSubmit={(event) => {
              if (r.paso < PASOS_REGISTRO.length - 1) {
                event.preventDefault();
                void r.avanzar();
              } else {
                void r.crearCuenta(event);
              }
            }}
          >
            {r.paso === 0 && (
              <>
                <div className={styles.accountIntro}>
                  <h1 id="titulo-registro-conductor">Crea tu cuenta</h1>
                  <p>Comienza a conducir con nosotros</p>
                </div>
                <AccountStep
                  telefono={r.telefono}
                  setTelefono={r.setTelefono}
                  email={r.email}
                  setEmail={r.setEmail}
                  password={r.password}
                  setPassword={r.setPassword}
                  confirmacionPassword={r.confirmacionPassword}
                  setConfirmacionPassword={r.setConfirmacionPassword}
                  fuerzaPassword={r.fuerzaPassword}
                  sesionAutenticada={r.sesionAutenticada}
                  erroresCampos={r.erroresCampos}
                  limpiarErrorCampo={r.limpiarErrorCampo}
                  validarTelefono={r.validarTelefono}
                  validarCampo={r.validarCampo}
                  validarPassword={r.validarPassword}
                  validarConfirmacion={r.validarConfirmacion}
                />
                <label className={styles.accountLegal}>
                  <input
                    type="checkbox"
                    required
                    checked={r.aceptaTerminos && r.confirmaPrivacidad}
                    onChange={(event) => {
                      r.setAceptaTerminos(event.target.checked);
                      r.setConfirmaPrivacidad(event.target.checked);
                      r.limpiarErrorCampo("aceptaTerminos");
                      r.limpiarErrorCampo("confirmaPrivacidad");
                      if (event.target.checked) r.aceptadosEnRef.current = new Date().toISOString();
                    }}
                  />
                  <span>
                    Acepto los <a href="/legal/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a> y el <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a>.
                  </span>
                </label>
              </>
            )}

            {r.paso === 1 && (
              <div className={`${styles.accountIntro} ${styles.identityIntro}`}>
                <h1 id="titulo-registro-conductor">Identidad</h1>
                <p>Cuéntanos más sobre ti</p>
              </div>
            )}
            {r.paso === 1 && (
              <IdentityStep
                nombre={r.nombre}
                setNombre={r.setNombre}
                apellidos={r.apellidos}
                setApellidos={r.setApellidos}
                curp={r.curp}
                setCurp={r.setCurp}
                codigoPostal={r.codigoPostal}
                setCodigoPostal={r.setCodigoPostal}
                estado={r.estado}
                setEstado={r.setEstado}
                ciudad={r.ciudad}
                setCiudad={r.setCiudad}
                ciudades={r.ciudades}
                setCiudades={r.setCiudades}
                colonia={r.colonia}
                setColonia={r.setColonia}
                colonias={r.colonias}
                setColonias={r.setColonias}
                calle={r.calle}
                setCalle={r.setCalle}
                numero={r.numero}
                setNumero={r.setNumero}
                referencias={r.referencias}
                setReferencias={r.setReferencias}
                contactoEmergenciaNombre={r.contactoEmergenciaNombre}
                setContactoEmergenciaNombre={r.setContactoEmergenciaNombre}
                contactoEmergenciaTelefono={r.contactoEmergenciaTelefono}
                setContactoEmergenciaTelefono={r.setContactoEmergenciaTelefono}
                consultandoCp={r.consultandoCp}
                erroresCampos={r.erroresCampos}
                limpiarErrorCampo={r.limpiarErrorCampo}
                validarCampo={r.validarCampo}
                validarCurp={r.validarCurp}
                validarTelefono={r.validarTelefono}
                buscarCodigoPostal={(cp) => void r.buscarCodigoPostal(cp)}
              />
            )}

            {r.paso === 2 && (
              <LicenseStep
                numeroLicencia={r.numeroLicencia}
                setNumeroLicencia={r.setNumeroLicencia}
                tipoLicencia={r.tipoLicencia}
                setTipoLicencia={r.setTipoLicencia}
                vigenciaLicencia={r.vigenciaLicencia}
                setVigenciaLicencia={r.setVigenciaLicencia}
                erroresCampos={r.erroresCampos}
                limpiarErrorCampo={r.limpiarErrorCampo}
                validarCampo={r.validarCampo}
                validarVigenciaLicencia={r.validarVigenciaLicencia}
              />
            )}

            {r.paso === 3 && (
              <DocumentsStep
                sesionAutenticada={r.sesionAutenticada}
                documentos={r.documentos}
                estadoDocumentos={r.estadoDocumentos}
                erroresCampos={r.erroresCampos}
                cambiarDocumento={r.cambiarDocumento}
              />
            )}

            {r.paso === 4 && (
              <ReviewStep
                telefono={r.telefono}
                email={r.email}
                nombreCompleto={r.nombreCompleto}
                curp={r.curp}
                calle={r.calle}
                numero={r.numero}
                colonia={r.colonia}
                ciudad={r.ciudad}
                estado={r.estado}
                codigoPostal={r.codigoPostal}
                numeroLicencia={r.numeroLicencia}
                tipoLicencia={r.tipoLicencia}
                vigenciaLicencia={r.vigenciaLicencia}
                documentos={r.documentos}
                documentosRemotos={r.documentosRemotos}
                aceptaTerminos={r.aceptaTerminos && r.confirmaPrivacidad}
                onAceptarTerminos={(acepta) => {
                  r.setAceptaTerminos(acepta);
                  r.setConfirmaPrivacidad(acepta);
                  r.limpiarErrorCampo("aceptaTerminos");
                  r.limpiarErrorCampo("confirmaPrivacidad");
                  if (acepta) r.aceptadosEnRef.current = new Date().toISOString();
                }}
                onEditar={r.setPaso}
              />
            )}

            {r.registroCompacto ? (
              <RegistrationNotice
                message={
                  !tieneSupabaseConfigurado()
                    ? "Registro no disponible. Inténtalo más tarde."
                    : r.error ||
                      Object.values(r.erroresCampos).find(Boolean) ||
                      (r.estadoGuardadoRemoto === "error" ? r.detalleGuardadoRemoto : null)
                }
              />
            ) : (
              r.error && (
                <div className="space-y-4">
                  <Aviso tono="danger">{r.error}</Aviso>
                  {r.errorRecuperable && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={r.reintentarEnvio} loading={r.enviando} disabled={r.enviando} className="flex-1">
                        Reintentar envío
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          r.setError(null);
                          r.setErrorRecuperable(false);
                          r.router.push(r.sesionActivaTrasRegistro ? "/panel" : "/login");
                        }}
                        disabled={r.enviando}
                        className="flex-1"
                      >
                        {r.sesionActivaTrasRegistro ? "Ir al panel" : "Volver al acceso"}
                      </Button>
                    </div>
                  )}
                </div>
              )
            )}

            {r.paso === PASOS_REGISTRO.length - 1 && !r.puedeEnviar && (
              <Aviso tono="atencion">
                Para enviar tu registro aún te falta: {r.camposFaltantes().join(", ")}.
              </Aviso>
            )}

            {r.registroCompacto ? (
              <footer className={styles.actionFooter}>
                {r.paso === 2 && (
                  <p className={styles.microcopy}>
                    Al continuar, declaras que tu licencia es válida y autorizas la verificación de antecedentes y datos biométricos. <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer">Privacidad</a> · <a href="/legal/terminos" target="_blank" rel="noopener noreferrer">Términos</a>
                    <button type="button" className={styles.legalTrigger} onClick={() => r.setMostrarDetalleConsentimiento(true)}>Ver declaración</button>
                  </p>
                )}
                {r.paso === 3 && (
                  <button className={styles.secondaryAction} type="button" onClick={r.volver}>
                    Atrás
                  </button>
                )}
                <button
                  className={styles.primary}
                  data-final-action={r.paso === 4 || undefined}
                  type="submit"
                  aria-busy={r.enviando}
                  disabled={
                    !r.registroListo ||
                    r.enviando ||
                    !tieneSupabaseConfigurado() ||
                    (r.paso === 0 && !r.cuentaCompleta) ||
                    (r.paso === 1 && !r.domicilioYContactoCompletos) ||
                    (r.paso === 3 &&
                      !(
                        r.documentoDisponible("licenciaFrente") &&
                        r.documentoDisponible("licenciaReverso") &&
                        r.documentoDisponible("identificacionOficial")
                      ))
                  }
                >
                  {!r.registroListo
                    ? "Preparando…"
                    : r.enviando
                    ? "Guardando…"
                    : r.paso === 0 && !r.sesionAutenticada
                    ? "Crear cuenta y continuar"
                    : r.paso === 1
                    ? "Guardar y continuar"
                    : r.paso === 4
                    ? "Crear cuenta"
                    : "Continuar"}
                  {(r.paso < 2 || r.paso >= 3) && <RegistrationIcon name="arrow" />}
                </button>
                {r.paso === 0 && (
                  <p className={styles.accountLogin}>
                    ¿Ya tienes una cuenta? <Link href="/login">Entrar</Link>
                  </p>
                )}
              </footer>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {r.paso > 0 && (
                  <Button type="button" variant="secondary" onClick={r.volver}>
                    Atrás
                  </Button>
                )}
                {r.paso < PASOS_REGISTRO.length - 1 ? (
                  <Button
                    type="button"
                    className={[
                      "min-h-12 min-w-12 px-6 py-3.5 font-display text-base font-bold leading-6",
                      "shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                      "focus-visible:outline-route-action focus-visible:outline-[3px] focus-visible:outline-offset-2",
                      r.paso === 0 ? "sm:col-start-2 w-full" : "w-full",
                    ].join(" ")}
                    onClick={r.avanzar}
                    loading={r.enviando}
                    disabled={r.enviando}
                  >
                    {r.paso === 0 && !r.sesionAutenticada ? "Crear cuenta y continuar" : "Continuar"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!r.puedeEnviar || !tieneSupabaseConfigurado()}
                    loading={r.enviando}
                    className={[
                      "w-full min-h-12 px-6 py-3.5 font-display text-base font-bold leading-6",
                      "shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                      "focus-visible:outline-route-action focus-visible:outline-[3px] focus-visible:outline-offset-2",
                    ].join(" ")}
                  >
                    {r.enviando ? TEXTOS_CARGANDO.enviando : "Enviar registro"}
                  </Button>
                )}
              </div>
            )}
          </form>
        </>
      )}
    </RegistrationShell>
  );
}
