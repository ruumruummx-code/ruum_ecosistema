import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chat, type MensajeChat } from '../../packages/ui/src/components/Chat';

function PruebaChatDoble() {
  const [mensajes1, setMensajes1] = useState<MensajeChat[]>([
    { id: '1', remitente: 'conductor', contenido: 'Hola, soy tu conductor asignado.', enviado_en: new Date().toISOString() }
  ]);
  const [mensajes2, setMensajes2] = useState<MensajeChat[]>([
    { id: '2', remitente: 'conductor', contenido: 'Hola, soporte central Ruum a tu servicio.', enviado_en: new Date().toISOString() }
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <h1 className="text-2xl font-bold text-[#0a2342] dark:text-[#f6f8fb]">
        SD-REM-008: Prueba de Reproducción y Verificación de Chat
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section id="contenedor-chat-1" className="space-y-2">
          <h2 className="text-lg font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
            Instancia 1: Chat con Conductor (Simula Falla de Envío)
          </h2>
          <Chat
            propio="usuario"
            mensajes={mensajes1}
            onEnviar={async (texto) => {
              // Simular rechazo de red deliberado
              await new Promise((_, reject) => setTimeout(() => reject(new Error('Falla de red simulada')), 100));
            }}
          />
        </section>

        <section id="contenedor-chat-2" className="space-y-2">
          <h2 className="text-lg font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
            Instancia 2: Chat con Soporte (Envío Exitoso)
          </h2>
          <Chat
            propio="usuario"
            mensajes={mensajes2}
            onEnviar={async (texto) => {
              await new Promise((r) => setTimeout(r, 100));
              setMensajes2((prev) => [
                ...prev,
                { id: String(Date.now()), remitente: 'usuario', contenido: texto, enviado_en: new Date().toISOString() }
              ]);
            }}
          />
        </section>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<PruebaChatDoble />);
}
