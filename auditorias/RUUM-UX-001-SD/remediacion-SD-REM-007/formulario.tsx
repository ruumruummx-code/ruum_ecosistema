import { createRoot } from 'react-dom/client';
import { useState, type ReactNode } from 'react';
import { MobileRow } from '../../../packages/ui/src/components/MobileRow';
import { NextOperationalAction } from '../../../packages/ui/src/components/NextOperationalAction';
function Adapter({ href, children }: { href: string; children: ReactNode }) {
 return <a href={href} onClick={() => { (window as any).adapterClicks++; }}>{children}</a>;
}
function App() {
 const [disabled, setDisabled] = useState(true);
 const record = () => { (window as any).actionClicks++; };
 return <main className="mx-auto max-w-xl space-y-4 p-4"><h1>SD-REM-007 · Navegación bloqueada</h1>
 <button id="before" onClick={() => setDisabled(!disabled)}>Alternar disponibilidad</button>
 <MobileRow titulo="Cancelar traslado" href="#cancelar" disabled={disabled} onClick={record} />
 <MobileRow titulo="Confirmar con adaptador" href="#confirmar" disabled={disabled} enlaceComponente={Adapter} />
 <MobileRow titulo="Pagar con alias" href="#pagar" disabled={disabled} linkComponent={Adapter} />
 <MobileRow titulo="Acción de fila" onClick={record} disabled={disabled} />
 <NextOperationalAction title="Siguiente acción" instruction="Comprueba la disponibilidad antes de continuar."
 primaryCta={{ label: 'Confirmar pago', href: '#pago', disabled }}
 secondaryCta={{ label: 'Cancelar operación', href: '#cancelar-operacion', disabled, external: true }} />
 <button id="after">Fin de recorrido</button><p>Los controles se habilitan con «Alternar disponibilidad».</p>
 </main>;
}
(window as any).actionClicks = 0;
(window as any).adapterClicks = 0;
createRoot(document.getElementById('root')!).render(<App />);
