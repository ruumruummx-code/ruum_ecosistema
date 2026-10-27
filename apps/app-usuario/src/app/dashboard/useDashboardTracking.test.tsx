/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardTracking } from './useDashboardTracking';
const mocks = vi.hoisted(() => ({ gps: vi.fn(), state: vi.fn(), locationSubscribe: vi.fn(), stateSubscribe: vi.fn(), remove: vi.fn(), refresh: vi.fn() }));
const router = { refresh: mocks.refresh };
const client = { removeChannel: mocks.remove };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../lib/supabase-browser', () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => client }));
vi.mock('@ruum/api/tracking', () => ({ obtenerUltimaUbicacionTraslado: mocks.gps, obtenerEstadoTrasladoRealtime: mocks.state, suscribirUbicacionTraslado: mocks.locationSubscribe, suscribirEstadoTraslado: mocks.stateSubscribe }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.gps.mockResolvedValue({ lat: 19.27, lng: -99.52, registrado_en: new Date().toISOString() });
  mocks.state.mockResolvedValue({ estado: 'traslado_en_curso' });
  mocks.locationSubscribe.mockReturnValue('gps-channel');
  mocks.stateSubscribe.mockReturnValue('state-channel');
  mocks.remove.mockResolvedValue(undefined);
});
describe('Seguimiento del dashboard', () => {
  it('lee solo el traslado solicitado, recibe GPS y libera ambos canales al salir', async () => {
    const { result, unmount } = renderHook(() => useDashboardTracking('trip-1', 'traslado_en_curso'));
    await waitFor(() => expect(result.current.ubicacion?.lat).toBe(19.27));
    expect(mocks.gps).toHaveBeenCalledWith(client, 'trip-1');
    act(() => mocks.locationSubscribe.mock.calls[0][2]({ lat: 19.28, lng: -99.51, registrado_en: new Date().toISOString() }));
    expect(result.current.ubicacion?.lat).toBe(19.28);
    act(() => mocks.stateSubscribe.mock.calls[0][2]({ estado: 'llegada_a_destino' }));
    expect(mocks.refresh).toHaveBeenCalledOnce();
    unmount();
    expect(mocks.remove).toHaveBeenCalledWith('gps-channel');
    expect(mocks.remove).toHaveBeenCalledWith('state-channel');
  });
  it('expone un fallo recuperable y vuelve a consultar al reintentar', async () => {
    mocks.gps.mockRejectedValueOnce(new Error('Sin conexión'));
    const { result, unmount } = renderHook(() => useDashboardTracking('trip-2', 'traslado_en_curso'));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.ubicacion).toBeNull();
    act(() => result.current.refrescar());
    await waitFor(() => expect(result.current.error).toBe(false));
    expect(result.current.ubicacion).not.toBeNull();
    unmount();
  });
  it('no abre conexiones ni consulta GPS cuando el dashboard desktop está oculto', () => {
    const { unmount } = renderHook(() => useDashboardTracking('trip-1', 'traslado_en_curso', false));
    expect(mocks.gps).not.toHaveBeenCalled();
    expect(mocks.locationSubscribe).not.toHaveBeenCalled();
    unmount();
  });
});
