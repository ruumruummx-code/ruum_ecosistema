"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { ConductorDialog } from "../components/ConductorDialog";
export function DraftRecoveryModal({isOpen,guardadoEn,onRestore,onDiscard}:{isOpen:boolean;guardadoEn?:string;onRestore:()=>void;onDiscard:()=>void}) {
 if(!isOpen)return null;
 return <ConductorDialog open title="Registro sin terminar" labelledBy="modal-borrador-titulo" onClose={onRestore} closeLabel="Continuar con borrador y cerrar" footer={<div className="grid gap-2"><BaseButton variant="ghost" type="button" className="min-h-12 rounded-xl border border-ui-line p-3" onClick={onDiscard}>Empezar de cero</BaseButton><BaseButton variant="ghost" type="button" className="min-h-12 rounded-xl bg-ui-brand p-3 text-ui-on-brand" onClick={onRestore}>Continuar borrador</BaseButton></div>}>
 <p>Encontramos un borrador de tu registro{guardadoEn ? ` del ${new Date(guardadoEn).toLocaleString("es-MX")}` : ""}. Puedes recuperarlo o empezar de cero. Cerrar este aviso conserva y recupera el borrador.</p></ConductorDialog>;
}
