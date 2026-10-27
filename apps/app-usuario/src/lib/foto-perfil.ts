export const FOTO_PERFIL_ACTUALIZADA = "ruum:foto-perfil-actualizada";

export type FotoPerfilActualizada = { usuarioId: string; url: string };

export function versionarFotoPerfil(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

export function notificarFotoPerfilActualizada(usuarioId: string, url: string) {
  window.dispatchEvent(new CustomEvent<FotoPerfilActualizada>(FOTO_PERFIL_ACTUALIZADA, {
    detail: { usuarioId, url },
  }));
}
