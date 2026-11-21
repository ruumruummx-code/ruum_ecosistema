import { EstadoError } from "./EstadoError";

export default function PaginaNoEncontradaConductor() {
  return (
    <EstadoError
      codigo="404"
      titulo="Página no encontrada"
      descripcion="La sección que buscas no existe. Revisa tus traslados o vuelve al panel."
      acciones={[
        { etiqueta: "Ver mis traslados", href: "/viajes", variant: "primary" },
        { etiqueta: "Volver al panel", href: "/panel", variant: "quiet" }
      ]}
    />
  );
}
