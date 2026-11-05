import { beforeEach, expect, it, vi } from "vitest";
import { semaforoPdfGlobal } from "@/lib/pdf-concurrency-semaphore";

const m = vi.hoisted(() => ({
  user: vi.fn(),
  perfil: vi.fn(),
  datos: vi.fn(),
  pdf: vi.fn(),
  inspecciones: vi.fn(),
  historial: vi.fn(),
  custodia: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: async () => ({
    auth: { getUser: m.user },
    rpc: m.rpc,
  }),
}));
vi.mock("@ruum/api/identity", () => ({ obtenerUsuarioIdPorAuth: m.perfil }));
vi.mock("@ruum/api/drivers", () => ({ listarInspeccionesTraslado: m.inspecciones }));
vi.mock("@ruum/api/services", () => ({ listarHistorialTraslado: m.historial }));
vi.mock("@ruum/api/custody", () => ({ listarEventosCustodia: m.custodia }));
vi.mock("@/app/viajes/[id]/obtenerDatosTraslado", () => ({ obtenerDatos: m.datos }));
vi.mock("@/lib/pasaporte-pdf", () => ({ generarPasaportePdf: m.pdf }));

import { GET } from "./route";

const id = "12345678-1234-4234-8234-123456789abc";
const llamar = () => GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  semaforoPdfGlobal.resetParaPruebas(2);

  m.user.mockResolvedValue({ data: { user: { id: "auth" } } });
  m.perfil.mockResolvedValue("titular");
  m.datos.mockResolvedValue({ pasaporte: { usuario_id: "titular" } });
  m.rpc.mockResolvedValue({ data: true, error: null });
  m.inspecciones.mockResolvedValue([]);
  m.historial.mockResolvedValue([]);
  m.custodia.mockResolvedValue([]);
  m.pdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
});

it("exige sesión antes de consultar el expediente", async () => {
  m.user.mockResolvedValue({ data: { user: null } });
  expect((await llamar()).status).toBe(401);
  expect(m.datos).not.toHaveBeenCalled();
});

it("rechaza el expediente ajeno incluso si RLS devolviera una fila (anti-IDOR)", async () => {
  m.datos.mockResolvedValue({ pasaporte: { usuario_id: "otra-persona" } });
  expect((await llamar()).status).toBe(404);
  expect(m.pdf).not.toHaveBeenCalled();
  expect(m.inspecciones).not.toHaveBeenCalled();
});

it("descarga el PDF completo como adjunto privado", async () => {
  const res = await llamar();
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("application/pdf");
  expect(res.headers.get("Cache-Control")).toContain("no-store");
  expect(res.headers.get("Content-Disposition")).toContain(`pasaporte-${id}.pdf`);
  expect(m.pdf).toHaveBeenCalledWith(
    expect.anything(),
    { inspecciones: [], historial: [], custodia: [] },
    expect.any(Function),
    { puedeVerTarifa: true }
  );
});

it("no genera un pasaporte parcial si falla una lectura del expediente", async () => {
  m.inspecciones.mockRejectedValue(new Error("Lectura no disponible"));
  expect((await llamar()).status).toBe(503);
  expect(m.pdf).not.toHaveBeenCalled();
});

it("CA-6: bloquea SSRF sin tumbar la generación de PDF si la evidencia es externa", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  m.pdf.mockImplementation(async (_datos, _anexos, cargarFoto) => {
    // Intento SSRF hacia dominio externo
    const res = await cargarFoto("https://externo.example/evidencia.png");
    expect(res).toBeNull();
    return new Uint8Array([37, 80, 68, 70]);
  });

  const res = await llamar();
  expect(res.status).toBe(200);
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it("CA-4 / CA-11: rechaza con 503 y Retry-After cuando el semáforo global está saturado", async () => {
  // Ocupamos los 2 cupos del semáforo
  semaforoPdfGlobal.adquirir();
  semaforoPdfGlobal.adquirir();

  const res = await llamar();
  expect(res.status).toBe(503);
  expect(res.headers.get("Retry-After")).toBe("5");
  const data = await res.json();
  expect(data.error).toContain("El servidor está procesando el límite");
  expect(m.pdf).not.toHaveBeenCalled();
});

it("CA-11: ráfaga concurrente responde 503 con Retry-After al excedente y estabiliza la memoria sin OOM", async () => {
  let maxConcurrentPdfs = 0;
  let activePdfs = 0;
  m.pdf.mockImplementation(async () => {
    activePdfs++;
    maxConcurrentPdfs = Math.max(maxConcurrentPdfs, activePdfs);
    await new Promise((resolve) => setTimeout(resolve, 40));
    activePdfs--;
    return new Uint8Array([37, 80, 68, 70]);
  });

  const memoryBefore = process.memoryUsage();
  const promesas = Array.from({ length: 6 }, () => llamar());
  const respuestas = await Promise.all(promesas);
  const memoryAfter = process.memoryUsage();

  const exitosos = respuestas.filter((r) => r.status === 200);
  const saturados = respuestas.filter((r) => r.status === 503);

  expect(exitosos.length).toBe(2);
  expect(saturados.length).toBe(4);
  expect(maxConcurrentPdfs).toBe(2);

  for (const sat of saturados) {
    expect(sat.headers.get("Retry-After")).toBe("5");
    const body = await sat.json();
    expect(body.error).toContain("El servidor está procesando el límite de expedientes PDF simultáneos");
  }

  // Verificación de memoria sin fugas ni saturación
  const heapDeltaMb = (memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024);
  expect(heapDeltaMb).toBeLessThan(50);
});

it("CA-8: enmascara tarifa en fail-closed si la verificación de permisos falla", async () => {
  m.rpc.mockRejectedValue(new Error("Error de conexión con RPC"));

  const res = await llamar();
  expect(res.status).toBe(200);
  expect(m.pdf).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.any(Function),
    { puedeVerTarifa: false } // fail-closed
  );
});

it("entrega expedientes grandes por bloques sin truncar el adjunto", async () => {
  const bytes = new Uint8Array(5 * 1024 * 1024);
  bytes[0] = 37;
  bytes[bytes.length - 1] = 70;
  m.pdf.mockResolvedValue(bytes);

  const res = await llamar();
  const reader = res.body!.getReader();
  let total = 0;
  let bloques = 0;
  let ultimo = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    expect(value.byteLength).toBeLessThanOrEqual(64 * 1024);
    total += value.byteLength;
    bloques++;
    ultimo = value[value.length - 1];
  }

  expect(total).toBe(5 * 1024 * 1024);
  expect(bloques).toBeGreaterThan(50);
  expect(ultimo).toBe(70);
});
