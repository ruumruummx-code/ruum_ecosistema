import { useState } from 'react';
import { Tabs } from '../../../packages/ui/src/components/Tabs';
import { Input,Select,Textarea } from '../../../packages/ui/src/components/Controls';
import { MobileRow } from '../../../packages/ui/src/components/MobileRow';
import { NextOperationalAction } from '../../../packages/ui/src/components/NextOperationalAction';
export function Formulario(){
 const [selected,setSelected]=useState('a');const [updates,setUpdates]=useState(0);const [disabled,setDisabled]=useState(false);const [state,setState]=useState(0);
 const tabs=[{id:'a',etiqueta:'Resumen',contenido:<><p>Panel resumen</p><input aria-label="Nota del resumen" defaultValue="Conservar" /></>},{id:'b',etiqueta:'Actividad',contenido:<p>Panel actividad</p>},{id:'x',etiqueta:'No disponible',disabled:true,motivoDeshabilitado:'Requiere validación',contenido:<p>Contenido bloqueado</p>},{id:'c',etiqueta:'Documentos',disabled,contenido:<p>Panel documentos</p>}];
 return <main className="mx-auto max-w-3xl space-y-6 p-6"><h1>SD-REM-005 · Pestañas manuales</h1>
 <button id="before">Antes de las pestañas</button>
 <Tabs etiqueta="Principal" tabs={tabs} value={selected} onSeleccion={id=>{setSelected(id);setUpdates(n=>n+1)}} mantenerMontados />
 <button id="after">Después de las pestañas</button><output id="updates">{updates}</output>
 <button onClick={()=>setState((state+1)%4)}>Actualizar descripciones</button><button onClick={()=>setDisabled(!disabled)}>Alternar Documentos</button>
 <Tabs etiqueta="Secundaria vertical" orientation="vertical" tabs={tabs} />
 <section aria-label="Regresión SD-REM-004"><h2>Formulario de regresión</h2><form aria-label="Campos"><Input etiqueta="Explícito" id="campo-explicito" name="explicito" ayuda={state&1?'Ayuda':undefined} error={state&2?'Error':undefined}/><Input etiqueta="Generado" ayuda={state&1?'Ayuda':undefined} error={state&2?'Error':undefined}/><Select etiqueta="Selección" ayuda={state&1?'Ayuda':undefined} error={state&2?'Error':undefined}><option>Opción</option></Select><Textarea etiqueta="Descripción" ayuda={state&1?'Ayuda':undefined} error={state&2?'Error':undefined}/></form></section>
 <section aria-label="Regresión SD-REM-007"><h2>Destinos bloqueados</h2><MobileRow titulo="Cancelar traslado" href="#prohibido" disabled /><NextOperationalAction title="Acción bloqueada" instruction="Completa la validación antes de pagar." primaryCta={{label:'Pagar',href:'#prohibido',disabled:true}} /></section>
 </main>;
}
