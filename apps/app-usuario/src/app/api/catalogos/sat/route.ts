import { NextRequest, NextResponse } from "next/server";
import { CATALOGO_FISCAL_SAT, consultarCatalogosSat, type TipoPersonaFiscal } from "@ruum/shared/catalogos";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const regimen = params.get("regimen") ?? undefined;
  const persona = params.get("persona") ?? undefined;
  if ((regimen && !CATALOGO_FISCAL_SAT.regimenes.some(o => o.clave === regimen)) ||
      (persona && persona !== "fisica" && persona !== "moral")) {
    return NextResponse.json({ error: "Régimen o tipo de persona inválido." }, { status: 400 });
  }
  return NextResponse.json(consultarCatalogosSat({ regimen, persona: persona as TipoPersonaFiscal | undefined, busqueda: params.get("q") ?? "" }), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
