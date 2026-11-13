import "server-only";
import { timingSafeEqual } from "node:crypto";

export function autorizarCron(request: Request, secretoAnterior?: string): boolean {
  const secreto = process.env.CRON_SECRET?.trim() || secretoAnterior?.trim();
  const recibido = request.headers.get("authorization");
  if (!secreto || !recibido) return false;
  const esperado = Buffer.from(`Bearer ${secreto}`);
  const enviado = Buffer.from(recibido);
  return esperado.length === enviado.length && timingSafeEqual(esperado, enviado);
}
