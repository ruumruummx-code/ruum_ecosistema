/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { generales, notificaciones } = vi.hoisted(() => ({ generales: vi.fn(), notificaciones: vi.fn() }));
vi.mock('@ruum/api/services', () => ({ actualizarPreferenciasGeneralesUsuario: generales, actualizarPreferenciasNotificaciones: notificaciones }));
import { aplicarIdiomaDisponible, normalizarIdiomaLocal, normalizarIdiomaPreferencias } from './idioma-aplicacion';
import { guardarPendientes, leerPendientes } from './preferencias-pendientes';
import { aplicarEfectosReales, guardarPreferenciasLocales, obtenerPreferenciasIniciales, PREFERENCIAS_POR_DEFECTO, sincronizarPreferenciasRemotas, type PreferenciasUsuarioContrato, type UsuarioRow } from './preferencias-contrato';
const user = (id: string, idioma = 'en') => ({ id, preferencias: { idioma } } as unknown as UsuarioRow);
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); generales.mockResolvedValue(undefined); notificaciones.mockResolvedValue(undefined); document.documentElement.lang = 'en'; });
describe('RUUM-UX-006: solo español disponible', () => {
 it('declara el idioma real sin simular una traducción', () => {
  aplicarIdiomaDisponible(); expect(document.documentElement.lang).toBe('es-MX');
  aplicarEfectosReales({ idioma: 'en' } as unknown as PreferenciasUsuarioContrato); expect(document.documentElement.lang).toBe('es-MX');
 });
 it('normaliza servidor, local y pendientes, manteniendo las otras preferencias', () => {
  localStorage.setItem('ruum:pref:usuario:a', JSON.stringify({ idioma: 'en', unidades: 'Imperial' }));
  localStorage.setItem('ruum:pref:idioma:a', '"en"');
  localStorage.setItem('ruum:preferencias-pendientes:a', JSON.stringify({ general: { idioma: 'en', tema: 'Oscuro' }, notificacion: { notificaciones_push: false } }));
  const p = obtenerPreferenciasIniciales(user('a'));
  expect(p).toMatchObject({ idioma: 'es', unidades: 'Imperial', tema: 'Oscuro', notifPagosPush: false });
  expect(JSON.parse(localStorage.getItem('ruum:pref:usuario:a')!)).toMatchObject({ idioma: 'es', unidades: 'Imperial' });
  expect(localStorage.getItem('ruum:pref:idioma:a')).toBe('"es"');
  expect(leerPendientes('a')).toEqual({ general: { idioma: 'es', tema: 'Oscuro' }, notificacion: { notificaciones_push: false } });
  expect(generales).not.toHaveBeenCalled();
 });
 it('preserva el aislamiento al recargar y cambiar de cuenta', () => {
  localStorage.setItem('ruum:pref:usuario:a', JSON.stringify({ idioma: 'en', unidades: 'Imperial' }));
  localStorage.setItem('ruum:pref:usuario:b', JSON.stringify({ idioma: 'en', unidades: 'Métrico' }));
  expect(obtenerPreferenciasIniciales(user('a'))).toMatchObject({ idioma: 'es', unidades: 'Imperial' });
  expect(JSON.parse(localStorage.getItem('ruum:pref:usuario:b')!).idioma).toBe('en');
  expect(obtenerPreferenciasIniciales(user('b'))).toMatchObject({ idioma: 'es', unidades: 'Métrico' });
  expect(obtenerPreferenciasIniciales(user('a'))).toMatchObject({ idioma: 'es', unidades: 'Imperial' });
 });
 it('sanea la preferencia histórica sin borrar sus demás campos', () => {
  localStorage.setItem('ruum-usuario-preferencias', JSON.stringify({ idioma: 'en', zonaHoraria: 'zona guardada' }));
  localStorage.setItem('ruum:pref:idioma', '"en"');
  normalizarIdiomaLocal('a');
  expect(JSON.parse(localStorage.getItem('ruum-usuario-preferencias')!)).toEqual({ idioma: 'es', zonaHoraria: 'zona guardada' });
  expect(localStorage.getItem('ruum:pref:idioma')).toBe('"es"');
 });
 it('no añade idioma a un parche que no lo modifica', () => {
  const cambios = { unidades: 'Imperial' };
  expect(normalizarIdiomaPreferencias(cambios)).toBe(cambios);
  guardarPendientes('a', { general: cambios, notificacion: {} });
  expect(leerPendientes('a').general).toEqual(cambios);
 });
 it('nunca vuelve a escribir EN aunque reciba un objeto heredado en tiempo de ejecución', async () => {
  const legacy = { ...PREFERENCIAS_POR_DEFECTO, idioma: 'en' } as unknown as PreferenciasUsuarioContrato;
  guardarPreferenciasLocales('a', legacy);
  expect(JSON.parse(localStorage.getItem('ruum:pref:usuario:a')!).idioma).toBe('es');
  const r = await sincronizarPreferenciasRemotas({}, user('a'), legacy);
  expect(r.exito).toBe(true);
  expect(generales).toHaveBeenCalledWith({}, expect.objectContaining({ idioma: 'es' }));
  expect(legacy.idioma).toBe('en');
 });
 it('un 503 conserva pendientes normalizados y el reintento confirma solo tras éxito', async () => {
  generales.mockRejectedValueOnce(Object.assign(new Error('Service Unavailable'), { status: 503 }));
  const r = await sincronizarPreferenciasRemotas({}, user('a'), PREFERENCIAS_POR_DEFECTO);
  expect(r).toMatchObject({ exito: false, es503: true });
  expect(leerPendientes('a').general.idioma).toBe('es');
  expect(await sincronizarPreferenciasRemotas({}, user('a'), PREFERENCIAS_POR_DEFECTO)).toEqual({ exito: true });
  expect(leerPendientes('a')).toEqual({ general: {}, notificacion: {} });
 });
});
