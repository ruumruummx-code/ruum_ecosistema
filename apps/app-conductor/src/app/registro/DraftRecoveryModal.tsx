"use client";
import { ConductorDialog } from "../components/ConductorDialog";
export function DraftRecoveryModal({isOpen,guardadoEn,onRestore,onDiscard}:{isOpen:boolean;guardadoEn?:string;onRestore:()=>void;onDiscard:()=>void}) {
 if(!isOpen)return null;
 return <ConductorDialog open title="Registro sin terminar" labelledBy="modal-borrador-titulo" onClose={onRestore} closeLabel="Continuar con borrador y cerrar" footer={<div className="grid gap-2"><button type="button" className="min-h-12 rounded-xl border border-border p-3" onClick={onDiscard}>Empezar de cero</button><button type="button" className="min-h-12 rounded-xl bg-route-action p-3 text-white" onClick={onRestore}>Continuar borrador</button></div>}>
 <p>Encontramos un borrador de tu registro{guardadoEn ? ` del ${new Date(guardadoEn).toLocaleString("es-MX")}` : ""}. Puedes recuperarlo o empezar de cero. Cerrar este aviso conserva y recupera el borrador.</p></ConductorDialog>;
}
