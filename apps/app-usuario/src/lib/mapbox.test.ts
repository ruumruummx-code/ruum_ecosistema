import { afterEach, describe, expect, it, vi } from "vitest";

describe("cliente Mapbox usuario", () => {
  it("resuelve el punto del mapa conservando calle, número y coordenadas", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({ features: [{ properties: { full_address: "Reforma 120, Juárez, CDMX", context: { address: { address_number: "120", street_name: "Reforma" }, neighborhood: { name: "Juárez" }, place: { name: "CDMX" }, region: { name: "Ciudad de México" }, postcode: { name: "06600" } } } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { resolverDireccionEnMapa } = await import("./mapbox");
    await expect(resolverDireccionEnMapa(19.4, -99.1)).resolves.toMatchObject({ direccion: "Reforma", numero: "120", codigoPostal: "06600", lat: 19.4, lng: -99.1 });
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/search/geocode/v6/reverse");
    expect(url.searchParams.get("longitude")).toBe("-99.1");
    expect(url.searchParams.get("latitude")).toBe("19.4");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("calcula la ruta con cookie CSRF usando el mismo validador que el servidor", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    const token = "a".repeat(64);
    vi.stubGlobal("document", { cookie: `ruum_csrf_token=${token}` });
    const { NextRequest } = await import("next/server");
    const { validarCsrfRequest } = await import("./csrf");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set("cookie", `ruum_csrf_token=${token}`);
      const request = new NextRequest("https://usuario.example.com/api/ruta", {
        method: init?.method, body: init?.body, headers,
      });
      if (!validarCsrfRequest(request).valido) {
        return Response.json({ error: "Token CSRF inválido o ausente.", code: "CSRF_INVALID" }, { status: 403 });
      }
      return Response.json({ distanciaKm: 885.81, tiempoEstimadoHoras: 13.33 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { calcularRutaMapbox } = await import("./mapbox");

    await expect(calcularRutaMapbox(
      { lat: 16.75, lng: -93.12 }, { lat: 19.28, lng: -99.51 }
    )).resolves.toEqual({ distanciaKm: 885.81, tiempoEstimadoHoras: 13.33 });
    expect(fetchMock).toHaveBeenCalledWith("/api/ruta", expect.objectContaining({
      headers: { "Content-Type": "application/json", "x-csrf-token": token },
    }));
  });

  it("expone error claro cuando Geocoding rechaza el token", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 })));

    const { geocodificarDireccion, mensajeErrorMapbox } = await import("./mapbox");

    await expect(geocodificarDireccion("Paseo de la Reforma 222, CDMX")).rejects.toMatchObject({ status: 403 });

    try {
      await geocodificarDireccion("Paseo de la Reforma 222, CDMX");
    } catch (error) {
      // Sec2: mensaje genérico, nunca exponer env var
      expect(mensajeErrorMapbox(error)).toContain("Servicio de mapas no disponible");
    }
  }, 15_000);

  it("expone error claro cuando Directions rechaza el token", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 })));

    const { calcularRutaMapbox, esErrorConfiguracionMapbox } = await import("./mapbox");

    await expect(calcularRutaMapbox({ lat: 19.4326, lng: -99.1332 }, { lat: 19.427, lng: -99.1677 })).rejects.toMatchObject({ status: 403 });

    try {
      await calcularRutaMapbox({ lat: 19.4326, lng: -99.1332 }, { lat: 19.427, lng: -99.1677 });
    } catch (error) {
      expect(esErrorConfiguracionMapbox(error)).toBe(true);
    }
  }, 15_000);

  it("aísla un timeout de Directions como error recuperable", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      })
    ));

    const { calcularRutaMapbox, esErrorConfiguracionMapbox, mensajeErrorMapbox } = await import("./mapbox");

    const resultado = calcularRutaMapbox(
      { lat: 19.4326, lng: -99.1332 },
      { lat: 19.427, lng: -99.1677 }
    ).catch((value: unknown) => value);
    await vi.runAllTimersAsync();
    const error = await resultado;

    expect(error).toMatchObject({ status: 504 });
    expect(esErrorConfiguracionMapbox(error)).toBe(true);
    expect(mensajeErrorMapbox(error)).toContain("tardó demasiado");
  });

  it("reintenta Geocoding ante un error transitorio y conserva el resultado", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "upstream" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ geometry: { coordinates: [-99.13, 19.43] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { geocodificarDireccion } = await import("./mapbox");
    const resultado = geocodificarDireccion("Paseo de la Reforma 222, CDMX");
    await vi.runAllTimersAsync();

    await expect(resultado).resolves.toEqual({ lat: 19.43, lng: -99.13 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("no reintenta cuando el caller cancela la consulta", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.token-valido-formato");
    const controller = new AbortController();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { geocodificarDireccion } = await import("./mapbox");
    const resultado = geocodificarDireccion("Paseo de la Reforma 222, CDMX", controller.signal);
    await Promise.resolve();
    controller.abort();

    await expect(resultado).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
