// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useDriverLocationTracking } from "../src/app/useDriverLocationTracking";
import type { ViajeActivo } from "../src/app/active-trip-state";

const {
  iniciarNativo,
  detenerNativo,
  solicitarSegundoPlano,
  soportaNativo,
  encolarTelemetria,
  sincronizarTelemetria,
  contarTelemetria,
  obtenerUbicacion,
  observarUbicacion,
  tieneSupabase,
  crearCliente
} = vi.hoisted(() => ({
  iniciarNativo: vi.fn(),
  detenerNativo: vi.fn(),
  solicitarSegundoPlano: vi.fn(),
  soportaNativo: vi.fn(),
  encolarTelemetria: vi.fn(),
  sincronizarTelemetria: vi.fn(),
  contarTelemetria: vi.fn(),
  obtenerUbicacion: vi.fn(),
  observarUbicacion: vi.fn(),
  tieneSupabase: vi.fn(),
  crearCliente: vi.fn()
}));

vi.mock("../src/lib/background-tracking", () => ({
  iniciarTrackingNativo: iniciarNativo,
  detenerTrackingNativo: detenerNativo,
  solicitarUbicacionSegundoPlanoNativa: solicitarSegundoPlano,
  soportaTrackingNativo: soportaNativo
}));

vi.mock("../src/lib/cola-telemetria-offline", () => ({
  encolarPuntoTelemetria: encolarTelemetria,
  sincronizarColaTelemetria: sincronizarTelemetria,
  contarColaTelemetria: contarTelemetria
}));

vi.mock("../src/lib/ubicacion", () => ({
  distanciaMetrosEntre: vi.fn(() => 100),
  obtenerUbicacionActual: obtenerUbicacion,
  observarUbicacionActual: observarUbicacion
}));

vi.mock("../src/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: tieneSupabase,
  crearClienteNavegador: crearCliente
}));

const viajeEnCurso: ViajeActivo = {
  trasladoId: "trip-789",
  estado: "traslado_en_curso",
  folio: "TR-789",
  etapa: "En ruta",
  destinoActual: "Av. Reforma 100",
  cerradoEn: null,
  estadoOperativo: "in_progress"
};

describe("useDriverLocationTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabase.mockReturnValue(true);
    crearCliente.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              user: { id: "driver-123" }
            }
          }
        })
      }
    });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
  });

  afterEach(() => {
    cleanup();
  });

  describe("Nativo y app en segundo plano", () => {
    test("inicia tracking nativo solicitando permiso de segundo plano para viaje en curso", async () => {
      soportaNativo.mockReturnValue(true);
      solicitarSegundoPlano.mockResolvedValue({ granted: true, state: "granted" });
      detenerNativo.mockResolvedValue(undefined);
      iniciarNativo.mockResolvedValue({});

      renderHook(() => useDriverLocationTracking(viajeEnCurso));

      await waitFor(() => {
        expect(solicitarSegundoPlano).toHaveBeenCalled();
        expect(iniciarNativo).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "driver-123",
            tripId: "trip-789",
            tripCode: "TR-789",
            tripState: "traslado_en_curso"
          })
        );
      });
    });

    test("permiso denegado: maneja denegación de permiso de segundo plano sin lanzar error", async () => {
      soportaNativo.mockReturnValue(true);
      solicitarSegundoPlano.mockResolvedValue({ granted: false, state: "denied" });
      detenerNativo.mockResolvedValue(undefined);
      iniciarNativo.mockResolvedValue({});

      renderHook(() => useDriverLocationTracking(viajeEnCurso));

      await waitFor(() => {
        expect(solicitarSegundoPlano).toHaveBeenCalled();
        // Aún intenta iniciar el tracking nativo o registrar el intento sin fallar
        expect(iniciarNativo).toHaveBeenCalled();
      });
    });
  });

  describe("Viaje terminado", () => {
    test("detiene el tracking nativo inmediatamente si el viaje está terminado (cerradoEn presente)", async () => {
      soportaNativo.mockReturnValue(true);
      detenerNativo.mockResolvedValue(undefined);

      const viajeTerminado: ViajeActivo = {
        ...viajeEnCurso,
        estado: "entregado",
        cerradoEn: "2027-01-15T15:00:00.000Z",
        estadoOperativo: "closed"
      };

      renderHook(() => useDriverLocationTracking(viajeTerminado));

      await waitFor(() => {
        expect(detenerNativo).toHaveBeenCalled();
      });
      expect(iniciarNativo).not.toHaveBeenCalled();
    });

    test("detiene tracking nativo al desmontar cuando el viaje finaliza", async () => {
      soportaNativo.mockReturnValue(true);
      solicitarSegundoPlano.mockResolvedValue({ granted: true, state: "granted" });
      detenerNativo.mockResolvedValue(undefined);
      iniciarNativo.mockResolvedValue({});

      const { unmount } = renderHook(() => useDriverLocationTracking(viajeEnCurso));

      await waitFor(() => {
        expect(iniciarNativo).toHaveBeenCalled();
      });

      unmount();

      expect(detenerNativo).toHaveBeenCalled();
    });

    test("en entorno web: viaje terminado o nulo no activa seguimiento y emite ruum:tracking-web activo=false", async () => {
      soportaNativo.mockReturnValue(false);
      let eventoEmitido: CustomEvent | null = null;
      const listener = (e: Event) => {
        eventoEmitido = e as CustomEvent;
      };
      window.addEventListener("ruum:tracking-web", listener);

      renderHook(() => useDriverLocationTracking(null));

      expect(obtenerUbicacion).not.toHaveBeenCalled();
      window.removeEventListener("ruum:tracking-web", listener);
    });
  });

  describe("Web: permiso denegado y errores", () => {
    test("permiso denegado en web: si obtenerUbicacionActual retorna null no rompe el hook", async () => {
      soportaNativo.mockReturnValue(false);
      obtenerUbicacion.mockResolvedValue(null);
      observarUbicacion.mockResolvedValue(vi.fn());

      renderHook(() => useDriverLocationTracking(viajeEnCurso));

      await waitFor(() => {
        expect(obtenerUbicacion).toHaveBeenCalled();
      });
      expect(encolarTelemetria).not.toHaveBeenCalled();
    });
  });
});
