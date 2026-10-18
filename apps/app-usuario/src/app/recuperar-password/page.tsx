import { FormularioRecuperarPassword } from "./FormularioRecuperarPassword";

interface PaginaRecuperarPasswordProps {
  searchParams: Promise<{
    error?: string;
    causa?: string;
  }>;
}

function resolverMensajeError(error?: string, causa?: string): string | null {
  if (error !== "enlace_invalido") return null;
  if (causa === "expirado") {
    return "El enlace para restablecer tu contraseña ha expirado (su vigencia es de 60 minutos). Por favor, solicita uno nuevo.";
  }
  if (causa === "reutilizado") {
    return "Este enlace de recuperación ya fue utilizado anteriormente. Por seguridad, los enlaces son de un solo uso. Solicita uno nuevo para continuar.";
  }
  if (causa === "otro_dispositivo") {
    return "El enlace no pudo validarse en este navegador o fue solicitado desde otro dispositivo. Por seguridad, solicita un nuevo enlace desde este mismo navegador.";
  }
  return "El enlace para restablecer tu contraseña no es válido o ya ha expirado. Por favor, solicita uno nuevo.";
}

/* Patrón del resto de la app (login, verificacion, soporte): el parámetro se
   resuelve en el Server Component y viaja como prop, en lugar de leer
   window.location.search desde el cliente. */
export default async function PaginaRecuperarPassword({
  searchParams,
}: PaginaRecuperarPasswordProps) {
  const { error, causa } = await searchParams;

  return (
    <FormularioRecuperarPassword
      errorInicial={resolverMensajeError(error, causa)}
    />
  );
}
