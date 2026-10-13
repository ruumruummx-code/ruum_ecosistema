import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import {
  MobileBadge,
  MobileCard,
  MobileRow,
  MobileListGroup,
  MobileHeader,
  MobileButton,
  MobileShell,
} from "./index";

describe("mobile ui components — MobileBadge", () => {
  it("renderiza variantes semánticas y punto accesible", () => {
    const exito = renderToStaticMarkup(
      h(MobileBadge, { variante: "exito", texto: "Verificado", punto: true })
    );
    expect(exito).toContain("Verificado");
    expect(exito).toContain("bg-[#e9f3ee]");

    const pendiente = renderToStaticMarkup(
      h(MobileBadge, { variante: "pendiente", texto: "Por revisar" })
    );
    expect(pendiente).toContain("Por revisar");
    expect(pendiente).toContain("text-[#765100]");

    const enRuta = renderToStaticMarkup(
      h(MobileBadge, { variante: "en_ruta", texto: "En camino" })
    );
    expect(enRuta).toContain("En camino");
    expect(enRuta).toContain("text-[#104ca0]");
  });
});

describe("mobile ui components — MobileCard & MobileShell", () => {
  it("MobileCard renderiza hijos con padding y elevación", () => {
    const card = renderToStaticMarkup(
      h(MobileCard, { elevated: true, children: "Contenido de tarjeta" })
    );
    expect(card).toContain("Contenido de tarjeta");
    expect(card).toContain("rounded-2xl");
  });

  it("MobileShell respeta variantes compact y wide", () => {
    const compact = renderToStaticMarkup(
      h(MobileShell, { variant: "compact", children: "Flujo móvil" })
    );
    expect(compact).toContain("max-w-[480px]");

    const wide = renderToStaticMarkup(
      h(MobileShell, { variant: "wide", children: "Carga masiva" })
    );
    expect(wide).toContain("max-w-5xl");
  });
});

describe("mobile ui components — MobileRow & MobileListGroup", () => {
  it("MobileRow como enlace genera etiqueta <a> con chevron accesible", () => {
    const row = renderToStaticMarkup(
      h(MobileRow, {
        titulo: "Datos personales",
        subtitulo: "Editar nombre y teléfono",
        href: "/cuenta/datos-personales",
      })
    );
    expect(row).toContain("<a");
    expect(row).toContain('href="/cuenta/datos-personales"');
    expect(row).toContain("Datos personales");
    expect(row).toContain("Editar nombre y teléfono");
    expect(row).toContain("<svg");
  });

  it("MobileListGroup agrupa filas con título de sección semibold", () => {
    const group = renderToStaticMarkup(
      h(MobileListGroup, {
        tituloSeccion: "Seguridad y acceso",
        children: h(MobileRow, { titulo: "Cambiar contraseña" }),
      })
    );
    expect(group).toContain("Seguridad y acceso");
    expect(group).toContain("Cambiar contraseña");
  });
});

describe("mobile ui components — MobileHeader & MobileButton", () => {
  it("MobileHeader genera botón atrás accesible con aria-label", () => {
    const header = renderToStaticMarkup(
      h(MobileHeader, {
        titulo: "Mi cuenta",
        subtitulo: "Gestiona tus preferencias",
        enlaceAtras: "/inicio",
        etiquetaAtras: "Volver a inicio",
      })
    );
    expect(header).toContain("Mi cuenta");
    expect(header).toContain("Gestiona tus preferencias");
    expect(header).toContain('aria-label="Volver a inicio"');
    expect(header).toContain('href="/inicio"');
  });

  it("MobileButton renderiza variantes y spinner cuando está cargando", () => {
    const cta = renderToStaticMarkup(
      h(MobileButton, {
        variant: "primary",
        children: "Confirmar traslado",
      })
    );
    expect(cta).toContain("Confirmar traslado");
    expect(cta).toContain("min-h-[52px]");

    const loading = renderToStaticMarkup(
      h(MobileButton, {
        loading: true,
        children: "Guardando...",
      })
    );
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("disabled");
    expect(loading).toContain("animate-spin");
  });
});
