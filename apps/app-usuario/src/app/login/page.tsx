import { destinoSeguro } from "@ruum/shared/utils";
import { LoginCliente } from "./LoginCliente";

interface PaginaLoginProps {
  searchParams: Promise<{
    next?: string;
    reason?: string;
  }>;
}

export default async function PaginaLogin({ searchParams }: PaginaLoginProps) {
  const params = await searchParams;

  return (
    <LoginCliente
      motivo={params.reason ?? null}
      siguiente={destinoSeguro(params.next)}
    />
  );
}
