import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");

describe("F2-001 — fallo parcial Auth → perfil", () => {
  it("deja el fallo en reconciliacion_requerida y repara con sin_rol", () => {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations/20261104000003_registro_saga_reconciliacion.sql"), "utf8");
    expect(sql).toContain("exception when others");
    expect(sql).toContain("estado = 'reconciliacion_requerida'");
    expect(sql).toContain("ultimo_error = left(sqlerrm, 500)");
    expect(sql).toContain("'sin_rol'::public.rol_usuario");
    expect(sql).not.toMatch(/'conductor'::public\.rol_usuario/);
  });

  it("define un consumidor service-role cada cinco minutos", () => {
    const script = fs.readFileSync(path.join(root, "apps/app-usuario/scripts/reconciliar-registro-saga.mjs"), "utf8");
    expect(script).toContain("reconciliar_registro_saga_auth");
    expect(script).toContain("p_limite: 50");
    expect(script).toContain("frecuencia: \"cada_5_minutos\"");
  });
});
