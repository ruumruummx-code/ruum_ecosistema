import { destinoSeguro } from "@ruum/shared/utils";
import { LoginCliente } from "./LoginCliente";

interface PaginaLoginProps {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    contrasena?: string;
  }>;
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
    />
  );
}