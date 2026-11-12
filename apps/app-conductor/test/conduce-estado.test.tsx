// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { PasaporteRow } from "../src/app/viajes/trips-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/supabase-browser", () => ({ crearClienteNavegador: vi.fn() }));
vi.mock("@ruum/api/services", () => ({}));
vi.mock("@/lib/ubicacion", () => ({}));
vi.mock("../src/app/viajes/[id]/TripStage", () => ({ TripStage: ({ title }: { title: string }) => <h1>{title}</h1> }));
import { ConduceADestinoDetails } from "../src/app/viajes/[id]/ConduceADestinoDetails";

afterEach(cleanup);
test("el efecto sincroniza estadoLocal al cambiar pasaporte.estado sin remontar", () => {
  const pasaporte = { traslado_id: "fixture", estado: "llegada_a_destino" } as PasaporteRow;
  const { rerender } = render(<ConduceADestinoDetails pasaporte={pasaporte} volver="/viajes" />);
  expect(screen.getByRole("heading").textContent).toBe("Registra la entrega");
  rerender(<ConduceADestinoDetails pasaporte={{ ...pasaporte, estado: "traslado_en_curso" }} volver="/viajes" />);
  expect(screen.getByRole("heading").textContent).toBe("Conduce al destino");
  rerender(<ConduceADestinoDetails pasaporte={{ ...pasaporte, estado: "evidencia_final_en_proceso" }} volver="/viajes" />);
  expect(screen.getByRole("heading").textContent).toBe("Registra la entrega");
});
