import { afterEach, describe, expect, it, vi } from "vitest";
import UiV2Preview, { metadata } from "./page";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
afterEach(() => vi.unstubAllEnvs());

describe("preview de diseño", () => {
  it("bloquea los datos demo en producción antes de renderizar", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(UiV2Preview({ searchParams: Promise.resolve({ screen: "inicio" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
