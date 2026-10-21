import { Alert } from "@ruum/ui";
import { MENSAJE_EVIDENCIA_SINCRONIZANDO } from "@ruum/shared/constants";
import { useEvidenceWizard } from "./EvidenceContext";

export function EvidenceSyncStatus() {
  const { pendientesSubida, sincronizando, etiquetasFaltantes: missing, registroCompleto: complete } = useEvidenceWizard();

  if (pendientesSubida > 0) {
    return (
      <Alert tono="warning">
        {pendientesSubida} foto{pendientesSubida === 1 ? "" : "s"} pendiente{pendientesSubida === 1 ? "" : "s"} de subir.
        {sincronizando ? ` ${MENSAJE_EVIDENCIA_SINCRONIZANDO}.` : " Puedes completar el flujo offline; el envío se habilita al sincronizar."}
      </Alert>
    );
  }

  if (!complete) {
    return <Alert tono="warning">Falta: {missing.join(", ")}.</Alert>;
  }

  return <Alert tono="success">Registro completo y sincronizado. Revisa antes de enviar.</Alert>;
}
