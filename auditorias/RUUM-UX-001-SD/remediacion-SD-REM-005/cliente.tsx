import { hydrateRoot } from 'react-dom/client';
import { Formulario } from './formulario';
hydrateRoot(document.getElementById('root')!,<Formulario />,{onRecoverableError:e=>console.error(e)});
