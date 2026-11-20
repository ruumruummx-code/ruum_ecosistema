import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge, Button, Card, buttonVariants, ChipGroup, EmptyState, Input, Tabs, TabsList, TabsTrigger, cn } from "./index";

const clases = (html: string) => (html.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);

describe("cn", () => {
  it("resuelve conflictos: la última clase gana", () => {
    expect(cn("px-4 h-11", "px-0")).toBe("h-11 px-0");
  });
});

describe("Button", () => {
  it("es type=button por defecto y primario", () => {
    const html = renderToStaticMarkup(<Button>Guardar</Button>);
    expect(html).toContain('type="button"');
    expect(clases(html)).toContain("bg-ui-brand");
  });

  it("la variante link no hereda altura ni relleno del tamaño", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const c = buttonVariants({ variant: "link", size }).split(/\s+/);
      const resueltas = cn(c).split(/\s+/);
      expect(resueltas).toContain("h-auto");
      expect(resueltas).toContain("px-0");
      expect(resueltas.some((k) => /^h-(9|11|12)$/.test(k) || /^px-[345]$/.test(k))).toBe(false);
    }
  });

  it("los tamaños de 36 px amplían su área táctil a 44 px", () => {
    for (const size of ["sm", "icon-sm"] as const) {
      const c = buttonVariants({ size }).split(/\s+/);
      expect(c).toEqual(expect.arrayContaining(["relative", "before:absolute", "before:-inset-1"]));
    }
  });

  it("asChild no añade type al hijo", () => {
    const html = renderToStaticMarkup(
      <Button asChild>
        <a href="/x">Ir</a>
      </Button>,
    );
    expect(html.startsWith("<a")).toBe(true);
    expect(html).not.toContain("type=");
  });
});

describe("Badge", () => {
  it("aplica el tono", () => {
    expect(clases(renderToStaticMarkup(<Badge tone="danger">Cancelado</Badge>))).toContain("bg-ui-danger-soft");
  });
});

describe("Input", () => {
  it("usa 16 px (evita zoom en iOS) y borde de campo", () => {
    const c = clases(renderToStaticMarkup(<Input aria-label="Nombre" />));
    expect(c).toEqual(expect.arrayContaining(["text-base", "border-ui-field"]));
  });
});

describe("ChipGroup", () => {
  it("marca el activo con aria-pressed y foco itinerante, con área táctil ampliada", () => {
    const html = renderToStaticMarkup(
      <ChipGroup
        etiqueta="Filtro"
        valor="b"
        onCambio={() => {}}
        opciones={[
          { id: "a", etiqueta: "A" },
          { id: "b", etiqueta: "B", conteo: 3 },
        ]}
      />,
    );
    expect(html).toContain('role="group"');
    expect(html).toMatch(/data-chip="b"[^>]*aria-pressed="true"[^>]*tabindex="0"/);
    expect(html).toMatch(/data-chip="a"[^>]*aria-pressed="false"[^>]*tabindex="-1"/);
    expect(html).toContain("before:-inset-y-1");
  });
});

describe("TabsTrigger", () => {
  it("amplía el área táctil a 44 px", () => {
    const html = renderToStaticMarkup(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(html).toContain("before:-inset-y-1.5");
  });
});

describe("EmptyState", () => {
  it("oculta el icono decorativo al lector de pantalla", () => {
    const html = renderToStaticMarkup(<EmptyState titulo="Sin traslados" icono={<svg />} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<h2");
  });
});

describe("tokens ui-*", () => {
  const css = readFileSync(path.resolve(__dirname, "../styles/base.css"), "utf8");
  it("el borde de campo oscuro usa border-input (≥ 3:1 sobre la tarjeta)", () => {
    const oscuro = css.slice(css.indexOf('[data-theme="dark"]'));
    expect(oscuro).toMatch(/--ui-field:\s*var\(--ruum-border-input\)/);
  });
});


describe("Card", () => {
  it("asChild conserva la semántica y los atributos de la tarjeta sin añadir un contenedor", () => {
    const html = renderToStaticMarkup(<Card asChild><article aria-label="Oferta de traslado">Oferta</article></Card>);
    expect(html.startsWith("<article")).toBe(true);
    expect(html).toContain('aria-label="Oferta de traslado"');
    expect(html).not.toContain("<div");
    expect(clases(html)).toContain("bg-ui-card");
  });
});
