"use client";

import { InicioMobile, type InicioMobileProps } from "./InicioMobile";

export type InicioUsuarioProps = InicioMobileProps;
export { InicioMobile } from "./InicioMobile";
export { InicioDesktop } from "./InicioDesktop";

export function InicioUsuario(props: InicioUsuarioProps) {
  return <InicioMobile {...props} />;
}
