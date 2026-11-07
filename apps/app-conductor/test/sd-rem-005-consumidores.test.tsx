// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriverProfileView, type ProfileTab } from '../src/app/cuenta/perfil/DriverProfileView';
import { EarningsTabs } from '../src/app/ganancias/EarningsTabs';
vi.mock('../src/app/cuenta/DriverDetailsShell',()=>({DriverDetailsShell:({children}:{children:React.ReactNode})=><main>{children}</main>,DetailIcon:()=>null}));
afterEach(cleanup);
describe('SD-REM-005 · consumidores conductor',()=>{
 it('perfil: flecha enfoca sin activar y click cambia el panel nombrado',()=>{
  function Profile(){const [tab,onTab]=useState<ProfileTab>('identidad');return <DriverProfileView initials="PR" photo={null} rating={null} photoBusy={false} photoEnabled tab={tab} onTab={onTab} onPhoto={()=>{}} busy={false} saveDisabled={false} onSave={()=>{}}><p>{tab}</p></DriverProfileView>}
  render(<Profile/>);fireEvent.keyDown(screen.getByRole('tab',{name:'Identidad'}),{key:'ArrowRight'});
  const next=screen.getByRole('tab',{name:'Documentación'});expect(document.activeElement).toBe(next);expect(next.getAttribute('aria-selected')).toBe('false');
  fireEvent.click(next);expect(screen.getByRole('tabpanel',{name:'Documentación'})).toBeTruthy();expect(screen.queryByRole('tabpanel',{name:'Identidad'})).toBeNull();
 });
 it('periodo de ganancias: filtro con estado pulsado, no pestañas sin panel',()=>{
  const changed=vi.fn();render(<EarningsTabs periodoActivo="semana" onCambiarPeriodo={changed}/>);
  expect(screen.queryByRole('tablist')).toBeNull();expect(screen.getByRole('button',{name:'Semana'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Mes'}));expect(changed).toHaveBeenCalledWith('mes');
 });
});
