import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { crearTicketSoporte } from "./tickets-soporte";
const datos = { id: "94800000-0000-4000-8000-000000000001", trasladoId: null, motivo: "Consulta general", descripcion: "Necesito ayuda con la plataforma." };
const upsert = vi.fn(), single = vi.fn();
const cliente = { from: () => ({ upsert, select: () => ({ eq: () => ({ single }) }) }) } as unknown as SupabaseClient<Database>;
beforeEach(() => { vi.clearAllMocks(); upsert.mockResolvedValue({ error: null }); single.mockResolvedValue({ data: { id: datos.id, traslado_id: null, motivo: datos.motivo, descripcion: datos.descripcion }, error: null }); });
it("reutiliza la clave de solicitud sin sobrescribir un ticket existente", async () => {
  expect(await crearTicketSoporte(cliente, datos)).toEqual({ id: datos.id });
  expect(upsert).toHaveBeenCalledWith({ id: datos.id, traslado_id: null, motivo: datos.motivo, descripcion: datos.descripcion }, { onConflict: "id", ignoreDuplicates: true });
});
it("rechaza una clave reutilizada para contenido distinto", async () => {
  single.mockResolvedValue({ data: { id: datos.id, traslado_id: null, motivo: "Otro", descripcion: "Otro contenido" }, error: null });
  await expect(crearTicketSoporte(cliente, datos)).rejects.toThrow("otros datos");
});
it("no confirma éxito si no puede verificar la fila guardada", async () => {
  single.mockResolvedValue({ data: null, error: new Error("sin acceso") });
  await expect(crearTicketSoporte(cliente, datos)).rejects.toThrow("sin acceso");
});
