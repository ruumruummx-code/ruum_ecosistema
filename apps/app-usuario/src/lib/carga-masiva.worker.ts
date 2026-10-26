/// <reference lib="webworker" />
import { parsearBufferPlantilla } from "./carga-masiva";

const ctx: Worker = self as unknown as Worker;

ctx.addEventListener("message", async (event: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const filas = await parsearBufferPlantilla(event.data.buffer);
    ctx.postMessage({ ok: true, filas });
  } catch (err) {
    ctx.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export {};
