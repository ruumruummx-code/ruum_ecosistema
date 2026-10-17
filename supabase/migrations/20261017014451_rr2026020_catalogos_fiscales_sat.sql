-- RR-2026-020: catálogos oficiales CFDI 4.0 y validación en persistencia.
create table public.sat_regimenes_fiscales (
  clave text primary key, descripcion text not null,
  fisica boolean not null, moral boolean not null,
  vigente_desde date not null, vigente_hasta date
);
create table public.sat_usos_cfdi (
  clave text primary key, descripcion text not null,
  fisica boolean not null, moral boolean not null,
  vigente_desde date not null, vigente_hasta date, regimenes text[] not null
);
alter table public.sat_regimenes_fiscales enable row level security;
alter table public.sat_usos_cfdi enable row level security;
revoke all on public.sat_regimenes_fiscales, public.sat_usos_cfdi from anon, authenticated;
grant select on public.sat_regimenes_fiscales, public.sat_usos_cfdi to anon, authenticated;
create policy sat_regimenes_lectura on public.sat_regimenes_fiscales for select to anon, authenticated using (true);
create policy sat_usos_lectura on public.sat_usos_cfdi for select to anon, authenticated using (true);

-- Fuente SAT: http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/catCFDI_V_4_20261015.xls
-- SHA256: fde78b456d1e0d90366bfc68f8312f9edce5703ad5dc8ccebf09c462db13a079

insert into public.sat_regimenes_fiscales (clave, descripcion, fisica, moral, vigente_desde, vigente_hasta) values
('601','General de Ley Personas Morales',false,true,'2022-01-01',null),
('603','Personas Morales con Fines no Lucrativos',false,true,'2022-01-01',null),
('605','Sueldos y Salarios e Ingresos Asimilados a Salarios',true,false,'2022-01-01',null),
('606','Arrendamiento',true,false,'2022-01-01',null),
('607','Régimen de Enajenación o Adquisición de Bienes',true,false,'2022-01-01',null),
('608','Demás ingresos',true,false,'2022-01-01',null),
('610','Residentes en el Extranjero sin Establecimiento Permanente en México',true,true,'2022-01-01',null),
('611','Ingresos por Dividendos (socios y accionistas)',true,false,'2022-01-01',null),
('612','Personas Físicas con Actividades Empresariales y Profesionales',true,false,'2022-01-01',null),
('614','Ingresos por intereses',true,false,'2022-01-01',null),
('615','Régimen de los ingresos por obtención de premios',true,false,'2022-01-01',null),
('616','Sin obligaciones fiscales',true,false,'2022-01-01',null),
('620','Sociedades Cooperativas de Producción que optan por diferir sus ingresos',false,true,'2022-01-01',null),
('621','Incorporación Fiscal',true,false,'2022-01-01',null),
('622','Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',false,true,'2022-01-01',null),
('623','Opcional para Grupos de Sociedades',false,true,'2022-01-01',null),
('624','Coordinados',false,true,'2022-01-01',null),
('625','Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',true,false,'2022-01-01',null),
('626','Régimen Simplificado de Confianza',true,true,'2022-01-01',null)
on conflict (clave) do update set descripcion=excluded.descripcion, fisica=excluded.fisica, moral=excluded.moral, vigente_desde=excluded.vigente_desde, vigente_hasta=excluded.vigente_hasta;

update public.sat_regimenes_fiscales set vigente_hasta = least(coalesce(vigente_hasta, '2026-10-15'::date), '2026-10-15'::date - 1) where clave not in ('601','603','605','606','607','608','610','611','612','614','615','616','620','621','622','623','624','625','626');

insert into public.sat_usos_cfdi (clave, descripcion, fisica, moral, vigente_desde, vigente_hasta, regimenes) values
('G01','Adquisición de mercancías.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('G02','Devoluciones, descuentos o bonificaciones.',true,true,'2022-01-01',null,array['601','603','606','612','616','620','621','622','623','624','625','626']::text[]),
('G03','Gastos en general.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I01','Construcciones.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I02','Mobiliario y equipo de oficina por inversiones.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I03','Equipo de transporte.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I04','Equipo de computo y accesorios.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I05','Dados, troqueles, moldes, matrices y herramental.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I06','Comunicaciones telefónicas.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I07','Comunicaciones satelitales.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('I08','Otra maquinaria y equipo.',true,true,'2022-01-01',null,array['601','603','606','612','620','621','622','623','624','625','626']::text[]),
('D01','Honorarios médicos, dentales y gastos hospitalarios.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D02','Gastos médicos por incapacidad o discapacidad.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D03','Gastos funerales.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D04','Donativos.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D05','Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D06','Aportaciones voluntarias al SAR.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D07','Primas por seguros de gastos médicos.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D08','Gastos de transportación escolar obligatoria.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D09','Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('D10','Pagos por servicios educativos (colegiaturas).',true,false,'2022-01-01',null,array['605','606','608','611','612','614','607','615','625']::text[]),
('S01','Sin efectos fiscales.',true,true,'2022-01-01',null,array['601','603','605','606','608','610','611','612','614','616','620','621','622','623','624','607','615','625','626']::text[]),
('CP01','Pagos',true,true,'2022-01-01',null,array['601','603','605','606','608','610','611','612','614','616','620','621','622','623','624','607','615','625','626']::text[]),
('CN01','Nómina',true,false,'2022-01-01',null,array['605']::text[])
on conflict (clave) do update set descripcion=excluded.descripcion, fisica=excluded.fisica, moral=excluded.moral, vigente_desde=excluded.vigente_desde, vigente_hasta=excluded.vigente_hasta, regimenes=excluded.regimenes;

update public.sat_usos_cfdi set vigente_hasta = least(coalesce(vigente_hasta, '2026-10-15'::date), '2026-10-15'::date - 1) where clave not in ('G01','G02','G03','I01','I02','I03','I04','I05','I06','I07','I08','D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','S01','CP01','CN01');

-- Invoker: no añade privilegios a las escrituras existentes.
create function public.validar_claves_fiscales_sat() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- No obliga a completar la facturación al crear una cuenta.
  if new.regimen_fiscal is null and new.uso_cfdi is null then return new; end if;
  if not exists (
    select 1 from public.sat_regimenes_fiscales r
    join public.sat_usos_cfdi u on r.clave = any(u.regimenes)
    where r.clave = new.regimen_fiscal and u.clave = new.uso_cfdi
      and r.vigente_desde <= current_date and (r.vigente_hasta is null or r.vigente_hasta >= current_date)
      and u.vigente_desde <= current_date and (u.vigente_hasta is null or u.vigente_hasta >= current_date)
      and ((length(new.rfc) = 12 and r.moral and u.moral) or (length(new.rfc) = 13 and r.fisica and u.fisica))
  ) then
    raise exception 'Régimen fiscal o uso de CFDI incompatible con el RFC según el catálogo SAT.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validar_claves_fiscales_sat() from public;
-- Sólo valida cambios fiscales; las filas legadas no bloquean otras operaciones.
create trigger usuarios_validar_sat_insert before insert on public.usuarios
for each row execute function public.validar_claves_fiscales_sat();
create trigger usuarios_validar_sat_update before update of rfc, regimen_fiscal, uso_cfdi on public.usuarios
for each row when (old.rfc is distinct from new.rfc or old.regimen_fiscal is distinct from new.regimen_fiscal or old.uso_cfdi is distinct from new.uso_cfdi)
execute function public.validar_claves_fiscales_sat();
create trigger empresas_validar_sat_insert before insert on public.empresas
for each row execute function public.validar_claves_fiscales_sat();
create trigger empresas_validar_sat_update before update of rfc, regimen_fiscal, uso_cfdi on public.empresas
for each row when (old.rfc is distinct from new.rfc or old.regimen_fiscal is distinct from new.regimen_fiscal or old.uso_cfdi is distinct from new.uso_cfdi)
execute function public.validar_claves_fiscales_sat();
