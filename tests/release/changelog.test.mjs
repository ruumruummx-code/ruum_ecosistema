import test from "node:test";
import assert from "node:assert/strict";
import { agrupar, bumpSugerido, parseCommit, renderSeccion } from "../../scripts/changelog.mjs";

test("parseCommit acepta tipo+scope+asunto y detecta breaking", () => {
  assert.deepEqual(parseCommit("abc1234", "feat(conductor): agrega modo calle"), {
    hash: "abc1234", tipo: "feat", scope: "conductor", breaking: false, asunto: "agrega modo calle",
  });
  assert.equal(parseCommit("abc1234", "fix(api)!: cambia contrato de pagos").breaking, true);
  assert.equal(parseCommit("abc1234", "mensaje libre sin formato"), null);
  assert.equal(parseCommit("abc1234", "refactor: x").asunto, "x");
});

test("bumpSugerido: breaking > feat > patch", () => {
  const c = (tipo, breaking = false) => ({ tipo, breaking });
  assert.equal(bumpSugerido([c("chore"), c("fix")]), "patch");
  assert.equal(bumpSugerido([c("fix"), c("feat")]), "minor");
  assert.equal(bumpSugerido([c("feat"), c("fix", true)]), "major");
});

test("agrupar ordena por sección y renderSeccion lista scopes", () => {
  const commits = [
    { hash: "1111111", tipo: "chore", scope: null, breaking: false, asunto: "limpia" },
    { hash: "2222222", tipo: "feat", scope: "admin", breaking: false, asunto: "nuevo reporte" },
  ];
  assert.deepEqual(agrupar(commits).map(([t]) => t), ["feat", "chore"]);
  const md = renderSeccion("v1.2.0", "2026-10-11", commits);
  assert.match(md, /## v1\.2\.0 — 2026-10-11/);
  assert.match(md, /\*\*admin\*\*: nuevo reporte \(2222222\)/);
});
