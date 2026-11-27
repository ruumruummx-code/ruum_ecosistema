import { destinoSeguro } from "@ruum/shared/utils";
import { LoginCliente } from "./LoginCliente";

interface PaginaLoginProps {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    contrasena?: string;
    error?: string;
    causa?: string;
  }>;
}

function resolverErrorEnlace(error?: string, causa?: string): string | null {
  if (error !== "enlace_invalido") return null;
  if (causa === "expirado") {
    return "El enlace de confirmación expiró. Solicita un nuevo código para activar tu cuenta.";
  }
  if (causa === "reutilizado") {
    return "Este enlace de confirmación ya fue utilizado. Si ya activaste tu cuenta, inicia sesión.";
  }
  if (causa === "otro_dispositivo") {
    return "El enlace se abrió en otro navegador o dispositivo. Ingresa el código de 6 dígitos en la pantalla de confirmación.";
  }
  return "El enlace de confirmación no es válido o expiró. Puedes solicitar un nuevo código.";
}

export default async function PaginaLogin({ searchParams }: PaginaLoginProps) {
  const params = await searchParams;

  return (
    <LoginCliente
      motivo={params.reason ?? null}
      siguiente={destinoSeguro(params.next)}
      /* F-4 (auditoría): tras restablecer la contraseña se cierra la sesión y se
         vuelve aquí, para que el usuario no piense que sigue conectado. */
      aviso={
        params.contrasena === "actualizada"
          ? "Tu contraseña fue actualizada. Inicia sesión con tu nueva contraseña."
          : null
      }
      errorEnlace={resolverErrorEnlace(params.error, params.causa)}
    />
  );
}