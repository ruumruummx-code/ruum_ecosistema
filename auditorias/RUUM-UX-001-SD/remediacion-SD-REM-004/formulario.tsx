import { useState } from 'react';
import { Input, Select, Textarea } from '../../../packages/ui/src/components/Controls';
export function Formulario() {
 const [state, setState] = useState(0);
 const [conditional, setConditional] = useState(false);
 return <main><h1>SD-REM-004 · Controles accesibles</h1><button onClick={() => setState((state + 1) % 4)}>Cambiar estado</button><button onClick={() => setConditional(!conditional)}>Campo condicional</button><p id="external">Descripción externa</p><form aria-label="Verificación de controles">{[Input, Select, Textarea].map((Control, index) => <section key={index}>{[true, false, false].map((explicit, n) => <Control key={n} etiqueta={`${['Input', 'Select', 'Textarea'][index]} ${n + 1}`} id={explicit ? `explicit-${index}` : undefined} name={n === 2 ? undefined : "repetido"} ayuda={state & 1 ? 'Ayuda del campo' : undefined} error={state & 2 ? 'Error del campo' : undefined} aria-describedby="external">{index === 1 ? <option>Opción</option> : undefined}</Control>)}</section>)}{conditional && <Input etiqueta="Condicional" />}</form></main>;
}

