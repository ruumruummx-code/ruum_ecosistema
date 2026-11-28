import type { AnguloEvidencia, FotoEvidencia } from "@ruum/shared/types";

export type EvidenceRequirement = {
  angulo: AnguloEvidencia;
  titulo: string;
  instruccion: string;
  guia: string;
  obligatorio: boolean;
  permiteNoAplica: boolean;
};

export function fotoSrc(foto?: FotoEvidencia) {
  if (!foto) return null;
  if (foto.local_path) return foto.local_path;
  if (foto.url_visual) return foto.url_visual;
  if (foto.url?.startsWith("data:") || foto.url?.startsWith("blob:")) return foto.url;
  return null;
}
