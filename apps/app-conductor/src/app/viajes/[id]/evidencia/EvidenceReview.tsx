"use client";
import { Aviso } from "@ruum/ui";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import { TEXTOS_CARGANDO, MENSAJE_EVIDENCIA_SINCRONIZANDO } from "@ruum/shared/constants";
import { BadgeSincronizacion } from "./EvidencePreview";
import { useEvidenceWizard } from "./EvidenceContext";
import { CAMPOS_INSPECCION, CAMPOS_INSPECCION_OBLIGATORIOS, totalCamposInspeccionCompletados } from "./evidence-requirements";

export function EvidenceReview() {
  const {
    requisitos: items,
    fotos,
    noAplica,
    resultado,
    registroCompleto,
    etiquetasFaltantes,
    pendientesSubida,
    sincronizando,
    inspeccion,
    enviando,
    onBackToMissing,
    onConfirm
  } = useEvidenceWizard();

  const blocked = !registroCompleto || pendientesSubida > 0;
  const inspeccionCompletada = totalCamposInspeccionCompletados(inspeccion);

  return (
    <section className="mt-5 rounded-lg border border-ui-line/28 bg-ui-card p-6 text-ui-fg shadow-ui-md">
      <p className="font-body text-sm font-semibold text-ui-brand">Revisión final</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-ui-fg">Confirma el registro completo</h2>
      <div className="mt-4">
        <EvidenceSyncStatusInline pendientesSubida={pendientesSubida} sincronizando={sincronizando} missing={etiquetasFaltantes} complete={registroCompleto} />
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => {
          const foto = fotos.find((candidate) => candidate.angulo === item.angulo);
          const omitted = noAplica.has(item.angulo);
          return (
            <div key={item.angulo} className="flex items-center justify-between gap-3 rounded-xl border border-ui-line/24 bg-ui-muted px-3 py-3">
              <div>
                <p className="font-body text-sm font-semibold text-ui-fg">{item.titulo}</p>
                <p className="font-body text-xs text-ui-fg-muted">{item.obligatorio ? "Obligatoria" : "Opcional"}</p>
              </div>
              {foto ? <BadgeSincronizacion sincronizada={Boolean(foto.sincronizada)} /> : <span className="font-body text-xs text-ui-fg-muted">{omitted ? "No aplica" : "Falta"}</span>}
            </div>
          );
        })}
      </div>
      <section className="mt-5 rounded-xl border border-ui-line/24 bg-ui-muted p-4" aria-labelledby="revision-inspeccion-titulo">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="revision-inspeccion-titulo" className="font-body text-sm font-semibold text-ui-fg">Datos de inspección</h3>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">
              {inspeccionCompletada} de {CAMPOS_INSPECCION_OBLIGATORIOS.length} obligatorios
            </p>
          </div>
        </div>
        <dl className="mt-3 grid gap-2 border-t border-ui-line/18 pt-3 font-body text-sm sm:grid-cols-2">
          {CAMPOS_INSPECCION.map(({ campo, etiqueta, obligatorio }) => (
            <div key={campo}>
              <dt className="text-ui-fg-muted">{etiqueta} {obligatorio ? "*" : "(opcional)"}</dt>
              <dd className="text-ui-fg">{inspeccion[campo] || (obligatorio ? "Sin capturar" : "Sin notas")}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={onBackToMissing}>
          Revisar faltantes
        </Button>
        <Button onClick={onConfirm} disabled={blocked} loading={enviando === "confirmar"}>
          {enviando === "confirmar" ? TEXTOS_CARGANDO.confirmando : "Enviar registro"}
        </Button>
      </div>
    </section>
  );
}

function EvidenceSyncStatusInline({
  pendientesSubida,
  sincronizando,
  missing,
  complete
}: {
  pendientesSubida: number;
  sincronizando: boolean;
  missing: string[];
  complete: boolean;
}) {
  if (pendientesSubida > 0) {
    return (
      <Aviso tono="atencion">
        {pendientesSubida} foto{pendientesSubida === 1 ? "" : "s"} pendiente{pendientesSubida === 1 ? "" : "s"} de subir.
        {sincronizando ? ` ${MENSAJE_EVIDENCIA_SINCRONIZANDO}.` : " Puedes completar el flujo offline; el envío se habilita al sincronizar."}
      </Aviso>
    );
  }
  if (!complete) {
    return <Aviso tono="atencion">Falta: {missing.join(", ")}.</Aviso>;
  }
  return <Aviso tono="info">Registro completo y sincronizado. Revisa antes de enviar.</Aviso>;
}
