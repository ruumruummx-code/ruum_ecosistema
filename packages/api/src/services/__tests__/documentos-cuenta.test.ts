import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { crearClienteFake } from "./supabase-fake";
import { listarDocumentosCuentaUsuario, subirDocumentoCuentaUsuario } from "../usuarios";

it.each(["licencia", "constancia"] as const)("envía el archivo %s al servidor sin aceptar un usuario de destino", async (tipo) => {
  const cliente = crearClienteFake({ functionsResult: { data: { tipo, ruta: `auth/${tipo}/1.pdf`, estado: "en_revision", subido_en: "2026-10-14T12:00:00Z" } } });
  const archivo = new File(["contenido"], "licencia.pdf", { type: "application/pdf" });
  await subirDocumentoCuentaUsuario(cliente as unknown as SupabaseClient<Database>, tipo, archivo);
  const [nombre, opciones] = cliente.functions.invoke.mock.calls[0]!;
  expect(nombre).toBe("documentos-cuenta-usuario");
  const body = (opciones as { body: FormData }).body;
  expect(body.get("tipo")).toBe(tipo);
  expect(body.get("archivo")).toBeInstanceOf(File);
  expect(body.has("usuario_id")).toBe(false);
});

it("rechaza una respuesta de carga que no confirma persistencia", async () => {
  const cliente = crearClienteFake({ functionsResult: { data: { tipo: "licencia" } } });
  await expect(subirDocumentoCuentaUsuario(cliente as unknown as SupabaseClient<Database>, "licencia", new File(["a"], "licencia.pdf"))).rejects.toThrow("El servidor no confirmó");
});

it("no convierte errores de consulta en una lista vacía", async () => {
  const cliente = crearClienteFake({ functionsResult: { error: new Error("offline") } });
  await expect(listarDocumentosCuentaUsuario(cliente as unknown as SupabaseClient<Database>)).rejects.toThrow("offline");
});
