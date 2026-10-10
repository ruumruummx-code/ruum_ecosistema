import { FormularioRecuperarPassword } from "./FormularioRecuperarPassword";

interface PaginaRecuperarPasswordProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

/* Patrón del resto de la app (login, verificacion, soporte): el parámetro se
   resuelve en el Server Component y viaja como prop, en lugar de leer
   window.location.search desde el cliente. */
export default async function PaginaRecuperarPassword({
  searchParams,
}: PaginaRecuperarPasswordProps) {
  const { error } = await searchParams;

  return (
    <FormularioRecuperarPassword
      errorInicial={
        error === "enlace_invalido"
          ? "El enlace para restablecer tu contraseña no es válido o ya ha expirado. Por favor, solicita uno nuevo."
          : null
      }
    />
  );
}
