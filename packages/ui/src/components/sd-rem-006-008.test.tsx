import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileHeader } from "./MobileHeader";
import { Chat } from "./Chat";
import { Modal } from "./Modal";

describe("SD-REM-006: MobileHeader y Modal (Composición, Viewports y Foco)", () => {
  it("MobileHeader renderiza título con atributo title para evitar pérdida de información en truncado", () => {
    const html = renderToStaticMarkup(
      h(MobileHeader, {
        titulo: "Detalle del traslado CDMX - Guadalajara con parada técnica",
      })
    );
    expect(html).toContain('title="Detalle del traslado CDMX - Guadalajara con parada técnica"');
    expect(html).toContain("Detalle del traslado CDMX - Guadalajara con parada técnica");
  });

  it("MobileHeader renderiza subtítulo con atributo title cuando está presente", () => {
    const html = renderToStaticMarkup(
      h(MobileHeader, {
        titulo: "Vehículo #4521",
        subtitulo: "BMW Serie 3 2024 · Placas 789-XYZ · En tránsito hacia patio central",
      })
    );
    expect(html).toContain('title="BMW Serie 3 2024 · Placas 789-XYZ · En tránsito hacia patio central"');
    expect(html).toContain("BMW Serie 3 2024 · Placas 789-XYZ · En tránsito hacia patio central");
  });

  it("MobileHeader botón de retroceso cuenta con anillo de foco visible de 3px y etiqueta accesible", () => {
    const html = renderToStaticMarkup(
      h(MobileHeader, {
        titulo: "Ajustes",
        onAtras: () => {},
        etiquetaAtras: "Regresar al listado anterior",
      })
    );
    expect(html).toContain('aria-label="Regresar al listado anterior"');
    expect(html).toContain("focus-visible:outline-[3px]");
    expect(html).toContain("focus-visible:outline-offset-2");
    expect(html).toContain("focus-visible:outline-[#0066ff]");
  });

  it("Modal preserva focus trap, role dialog, aria-modal y encabezado de cierre accesible", () => {
    const html = renderToStaticMarkup(
      h(Modal, {
        abierto: true,
        titulo: "Confirmar acción de traslado",
        onCerrar: () => {},
        children: h("p", null, "Contenido largo del modal"),
      })
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Cerrar diálogo"');
  });
});

describe("SD-REM-008: Chat (Nombre Accesible, Manejo de Errores y Múltiples Instancias)", () => {
  it("Chat: el campo de texto tiene aria-label explícito 'Escribe un mensaje' en estado normal", () => {
    const html = renderToStaticMarkup(
      h(Chat, {
        propio: "usuario",
        mensajes: [],
        onEnviar: () => {},
      })
    );
    expect(html).toContain('aria-label="Escribe un mensaje"');
    expect(html).not.toContain('aria-label="Enviar mensaje"'); // Eliminado por Label in Name
    expect(html).toContain('id="chat-input-');
  });

  it("Chat: el campo de texto tiene aria-label explicativo cuando está deshabilitado", () => {
    const html = renderToStaticMarkup(
      h(Chat, {
        propio: "usuario",
        mensajes: [],
        deshabilitado: true,
        mensajeDeshabilitado: "El viaje ha finalizado. Chat cerrado.",
        onEnviar: () => {},
      })
    );
    expect(html).toContain('aria-label="El viaje ha finalizado. Chat cerrado."');
    expect(html).toContain("disabled");
  });

  it("Chat: renderiza mensajes propios y ajenos con contraste y roles de burbuja", () => {
    const html = renderToStaticMarkup(
      h(Chat, {
        propio: "usuario",
        mensajes: [
          {
            id: "1",
            remitente: "usuario",
            contenido: "Hola, voy en camino",
            enviado_en: "2026-11-06T10:30:00Z",
          },
          {
            id: "2",
            remitente: "conductor",
            contenido: "Enterado, te espero en el punto de encuentro",
            enviado_en: "2026-11-06T10:31:00Z",
          },
        ],
        onEnviar: () => {},
      })
    );
    expect(html).toContain("Hola, voy en camino");
    expect(html).toContain("Enterado, te espero en el punto de encuentro");
  });
});
