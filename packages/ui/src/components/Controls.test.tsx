import { createElement as h, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input, Select, Textarea } from "./Controls";

describe("SD-REM-004", () => {
  const controls: ComponentType<{ etiqueta: string; id?: string; name?: string; ayuda?: ReactNode; error?: string; "aria-describedby"?: string; children: ReactNode }>[] = [Input, Select, Textarea];
  for (const Control of controls) {
    it(`${Control.displayName ?? "Control"}: IDs únicos y descripciones completas`, () => {
      const html = renderToStaticMarkup(h("form", { children: [
        h(Control, { key: 1, etiqueta: "Explícito", id: "explicit", name: "same", ayuda: "Ayuda", error: "Error", "aria-describedby": "external", children: undefined }),
        h(Control, { key: 2, etiqueta: "Automático", name: "same", children: undefined }),
        h(Control, { key: 3, etiqueta: "Sin nombre", children: undefined }),
        h(Control, { key: 4, etiqueta: "ID vacío", id: "", children: undefined }),
      ] }));
      const ids = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
      expect(ids).toHaveLength(4);
      expect(new Set(ids).size).toBe(4);
      expect(ids[0]).toBe("explicit");
      for (const id of ids) expect(html).toContain(`for="${id}"`);
      expect(html).toContain('aria-describedby="external explicit-help explicit-error"');
      expect(html).toContain('id="explicit-help"');
      expect(html).toContain('id="explicit-error"');
    });
  }
});

