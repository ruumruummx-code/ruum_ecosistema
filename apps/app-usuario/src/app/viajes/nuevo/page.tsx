import React from "react";
import { NuevoTrasladoForm } from "./NuevoTrasladoForm";

export default async function PaginaNuevoTraslado({ searchParams }: { searchParams?: Promise<{ buscar_origen?: string; buscar_destino?: string; vehiculo?: string }> }) {
  const params = await searchParams;
  const limitar = (valor: unknown) => typeof valor === "string" ? valor.trim().slice(0, 1000) : "";
  return <NuevoTrasladoForm busquedaOrigenInicial={limitar(params?.buscar_origen)} busquedaDestinoInicial={limitar(params?.buscar_destino)} vehiculoIdInicial={limitar(params?.vehiculo).slice(0, 100)} />;
}
