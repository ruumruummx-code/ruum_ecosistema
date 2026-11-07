import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ACTIVATION = /^on(?:Click|DoubleClick|KeyDown|KeyUp|PointerDown|PointerUp)(?:Capture)?$/;
const root = resolve(import.meta.dirname, "../../../..");
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (e.name === "node_modules" ? [] : walk(join(dir, e.name))) : /\.tsx$/.test(e.name) && !/\.(test|spec)\./.test(e.name) ? [join(dir, e.name)] : []);
const parse = (text: string, file = "fixture.tsx") => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function inspect(source: ts.SourceFile, protectedNames: Set<string>, children = false) {
  const names = new Set(protectedNames);
  source.forEachChild(n => {
    if (ts.isImportDeclaration(n) && n.importClause?.namedBindings && ts.isNamedImports(n.importClause.namedBindings)) {
      for (const item of n.importClause.namedBindings.elements) if (names.has((item.propertyName ?? item.name).text)) names.add(item.name.text);
    }
  });
  const violations: string[] = [], owners = new Set<string>(), wrappers = new Set<string>();
  const visit = (n: ts.Node) => {
    const target = (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && names.has(n.tagName.getText(source).split(".").at(-1)!);
    const childSlot = children && ts.isJsxExpression(n) && n.expression && ["children", "this.props.children", "props.children"].includes(n.expression.getText(source));
    if (target || childSlot) {
      for (let p = n.parent; p; p = p.parent) {
        if ((ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p)) && p.name) owners.add(p.name.text);
        if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) owners.add(p.name.text);
        if (ts.isJsxElement(p) && p.openingElement !== n) {
          const opening = p.openingElement, tag = opening.tagName.getText(source);
          if (/^[A-Z]/.test(tag)) wrappers.add(tag);
          for (const attr of opening.attributes.properties) {
            if (ts.isJsxSpreadAttribute(attr) || ACTIVATION.test(attr.name.getText(source))) {
              violations.push(`${source.fileName}:${source.getLineAndCharacterOfPosition(opening.getStart(source)).line + 1} <${tag}> ${attr.getText(source)}`);
            }
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(source);
  return { violations, owners, wrappers };
}

describe("SD-REM-007 · contrato de composición", () => {
  it("rechaza activación en ancestros, captura y spreads, incluso con alias", () => {
    for (const handler of ["onClick", "onKeyDown", "onKeyUpCapture", "onClickCapture", "onPointerDown"]) {
      const source = parse(`import { MobileRow as Row } from '@ruum/ui'; const Page=()=> <div ${handler}={activate}><Row titulo="Pagar" href="/pay" disabled /></div>;`);
      expect(inspect(source, new Set(["MobileRow"])).violations).toHaveLength(1);
    }
    expect(inspect(parse('<div {...props}><NextOperationalAction /></div>'), new Set(["NextOperationalAction"])).violations).toHaveLength(1);
    expect(inspect(parse('<div onClick={activate}>{children}</div>'), new Set(), true).violations).toHaveLength(1);
  });
  it("permite handlers propios y hermanos, sin tratar un hermano como ancestro", () => {
    expect(inspect(parse('<main><button onClick={activate}>Otro</button><MobileRow onClick={activate} /></main>'), new Set(["MobileRow"])).violations).toEqual([]);
  });
  it("protege consumidores, wrappers transitivos, layouts de ruta y sus providers", { timeout: 60000 }, () => {
    const appDirs = readdirSync(join(root, "apps"), { withFileTypes: true }).filter(e => e.isDirectory() && existsSync(join(root, "apps", e.name, "src")));
    const sources = appDirs.flatMap(e => walk(join(root, "apps", e.name, "src"))).map(file => parse(readFileSync(file, "utf8"), file));
    const localRoles: string[] = [];
    for (const source of sources) {
      const visit = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const attrs = node.attributes.properties;
          for (const attr of attrs) if (ts.isJsxAttribute(attr) && attr.name.getText(source) === "role") {
            const value = attr.initializer && ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : attr.initializer;
            if (value && ts.isStringLiteralLike(value) && ["tablist", "tab"].includes(value.text)) localRoles.push(relative(root, source.fileName));
          }
          if (node.tagName.getText(source) === "button") {
            const click = attrs.find(attr => ts.isJsxAttribute(attr) && attr.name.getText(source) === "onClick");
            const describedSelection = attrs.some(attr => ts.isJsxAttribute(attr) && ["aria-pressed", "aria-haspopup"].includes(attr.name.getText(source)));
            if (click && /set(?:Tab(?:Activa)?|Pestana|Pestaña(?:Activa)?)\(/.test(click.getText(source)) && !describedSelection) localRoles.push(relative(root, source.fileName) + ": selector de pestaña local sin contrato compartido");
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(localRoles, "Las pestañas usan Tabs; filtros aria-pressed y acciones de diálogo se distinguen").toEqual([]);
    const names = new Set(["MobileRow", "NextOperationalAction", "Tabs", "AdminTabs"]), guarded = new Set<string>(), wrappers = new Set<string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const source of sources) {
        const result = inspect(source, names);
        if (!result.owners.size) continue;
        guarded.add(source.fileName);
        expect(result.violations, relative(root, source.fileName)).toEqual([]);
        for (const owner of result.owners) if (!names.has(owner)) { names.add(owner); changed = true; }
        for (const wrapper of result.wrappers) wrappers.add(wrapper);
      }
    }
    const layouts = new Set<string>();
    for (const file of guarded) {
      let dir = dirname(resolve(file));
      while (dir.startsWith(join(root, "apps"))) {
        const layout = join(dir, "layout.tsx"); if (existsSync(layout)) layouts.add(layout);
        dir = dirname(dir);
      }
    }
    for (const file of layouts) {
      const result = inspect(parse(readFileSync(file, "utf8"), file), names, true);
      expect(result.violations, relative(root, file)).toEqual([]);
      for (const wrapper of result.wrappers) wrappers.add(wrapper);
    }
    const checked = new Set<string>();
    changed = true;
    while (changed) {
      changed = false;
      for (const source of sources) {
        if (checked.has(source.fileName)) continue;
        // Match provider/class/function declarations, including wrappers from route layouts.
        const declaresWrapper = [...wrappers].some(name => new RegExp(`(?:function|class|const)\\s+${name}\\b`).test(source.text));
        if (!declaresWrapper) continue;
        checked.add(source.fileName);
        const result = inspect(source, names, true);
        expect(result.violations, relative(root, source.fileName)).toEqual([]);
        for (const wrapper of result.wrappers) if (!wrappers.has(wrapper)) { wrappers.add(wrapper); changed = true; }
      }
    }
    expect(guarded.size).toBeGreaterThanOrEqual(3);
    expect(layouts.size).toBeGreaterThan(0);
  }, 20000);
});

