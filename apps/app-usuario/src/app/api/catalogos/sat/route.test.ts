import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

it("expone los catálogos completos y filtra por régimen y persona", async () => {
  const completos = await GET(new NextRequest("http://localhost/api/catalogos/sat")).json();
  expect(completos.regimenes).toHaveLength(19);
  expect(completos.usos).toHaveLength(24);
  const filtrados = await GET(new NextRequest("http://localhost/api/catalogos/sat?regimen=605&persona=fisica&q=nomina")).json();
  expect(filtrados.usos.map((o: { clave: string }) => o.clave)).toEqual(["CN01"]);
  expect(GET(new NextRequest("http://localhost/api/catalogos/sat?regimen=999")).status).toBe(400);
  expect(GET(new NextRequest("http://localhost/api/catalogos/sat?persona=otra")).status).toBe(400);
});
