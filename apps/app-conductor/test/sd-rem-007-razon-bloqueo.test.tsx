// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactoYVehiculo } from '../src/app/viajes/[id]/ContactoYVehiculo';
import { ContactoRecepcionVehiculo } from '../src/app/viajes/[id]/ContactoRecepcionVehiculo';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../src/lib/supabase-browser', () => ({ crearClienteNavegador: vi.fn() }));
vi.mock('@ruum/api/services', () => ({ avanzarEstadoTraslado: vi.fn() }));
afterEach(cleanup);
const props = { trasladoId:'synthetic',primaryActionLabel:'Iniciar registro',contactoNombre:'Contacto de prueba',contactoTelefono:'5555555555',vehiculoMarca:null,vehiculoModelo:null,vehiculoAnio:null,vehiculoColor:null,vehiculoPlacas:null,vehiculoVin:null };
describe('SD-REM-007 · razón visible del bloqueo operativo', () => {
 it.each([
  [ContactoYVehiculo, 'Contacto encontrado', 'Vehículo localizado'],
  [ContactoRecepcionVehiculo, 'Contacto de recepción confirmado', 'Vehículo confirmado'],
 ] as const)('explica los dos requisitos antes de habilitar (%s)', (Component, contacto, vehiculo) => {
  render(<Component {...props} />);
  const action=screen.getByRole('button',{name:'Iniciar registro'});
  expect((action as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(text => text.startsWith('Para iniciar el registro') && text.includes(contacto) && text.includes(vehiculo))).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox',{name:contacto}));
  expect((action as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox',{name:vehiculo}));
  expect((action as HTMLButtonElement).disabled).toBe(false);
 });
});
