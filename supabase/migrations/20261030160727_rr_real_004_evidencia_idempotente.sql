-- RR-REAL-004: el UUID de captura no permite sobrescribir otra foto.
alter table public.evidencia_fotos add column if not exists sha256 text;
alter table public.evidencia_fotos add column if not exists conflicto boolean not null default false;
alter table public.evidencia_fotos add column if not exists conflicto_detalle text;
alter table public.evidencia_fotos add column if not exists conflicto_detectado_en timestamptz;
-- Una captura usa objeto inmutable. Gastos/comprobantes conservan sus reglas existentes.
create policy capturas_no_sobrescribir on storage.objects as restrictive for update to authenticated
using(bucket_id<>'evidencia' or name !~ '/(inicial|final)/[0-9a-f-]{36}-')
with check(bucket_id<>'evidencia' or name !~ '/(inicial|final)/[0-9a-f-]{36}-');
create policy capturas_no_borrar on storage.objects as restrictive for delete to authenticated
using(bucket_id<>'evidencia' or name !~ '/(inicial|final)/[0-9a-f-]{36}-');
create function private.conservar_identidad_foto()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if (new.id,new.traslado_id,new.tipo,new.angulo,new.url) is distinct from (old.id,old.traslado_id,old.tipo,old.angulo,old.url)
    or (old.sha256 is not null and new.sha256 is distinct from old.sha256) then
    raise exception 'La captura original es inmutable. Registra una captura nueva o un conflicto.';
  end if;
  return new;
end $$;
revoke all on function private.conservar_identidad_foto() from public;
create trigger conservar_identidad_foto before update on public.evidencia_fotos for each row execute function private.conservar_identidad_foto();
create table public.evidencia_conflictos (
  captura_id uuid primary key, traslado_id uuid not null references public.traslados(id),
  ruta text not null, sha256_esperado text not null, sha256_observado text not null,
  creado_en timestamptz not null default now(), resuelto_en timestamptz
);
alter table public.evidencia_conflictos enable row level security;
revoke all on public.evidencia_conflictos from anon,authenticated;
grant select,insert on public.evidencia_conflictos to authenticated;
create policy conflicto_captura_visible on public.evidencia_conflictos for select to authenticated using (
  public.es_admin() or exists(select 1 from public.traslados t join public.conductores c on c.id=t.conductor_id where t.id=traslado_id and c.auth_user_id=auth.uid())
);
create policy conflicto_captura_reportado on public.evidencia_conflictos for insert to authenticated with check (
  exists(select 1 from public.traslados t join public.conductores c on c.id=t.conductor_id where t.id=traslado_id and c.auth_user_id=auth.uid())
);
create function public.registrar_foto_idempotente(p_foto jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_foto public.evidencia_fotos%rowtype; v_id uuid; v_insertada uuid;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Sesión requerida.'; end if;
  v_id := (p_foto->>'id')::uuid;
  if p_foto->>'sha256' is null or p_foto->>'sha256' !~ '^[0-9a-f]{64}$'
     or p_foto->>'url' not like auth.uid()::text || '/%' then
    raise exception 'Captura o hash inválidos.';
  end if;
  if not exists(select 1 from storage.objects where bucket_id='evidencia' and name=p_foto->>'url') then
    raise exception 'Falta el objeto de evidencia.';
  end if;
  insert into public.evidencia_fotos(id,traslado_id,tipo,angulo,url,local_path,capturada_en,lat,lng,sincronizada,sha256)
  values(v_id,(p_foto->>'traslado_id')::uuid,(p_foto->>'tipo')::public.tipo_evidencia,
    (p_foto->>'angulo')::public.angulo_evidencia,p_foto->>'url',null,(p_foto->>'capturada_en')::timestamptz,
    (p_foto->>'lat')::numeric,(p_foto->>'lng')::numeric,true,p_foto->>'sha256')
  on conflict(id) do nothing returning id into v_insertada;
  if v_insertada is not null then return jsonb_build_object('ok',true,'duplicada',false); end if;
  select * into strict v_foto from public.evidencia_fotos where id=v_id for update;
  if (v_foto.traslado_id::text,v_foto.tipo::text,v_foto.angulo::text,v_foto.url,v_foto.sha256) is distinct from
     (p_foto->>'traslado_id',p_foto->>'tipo',p_foto->>'angulo',p_foto->>'url',p_foto->>'sha256') then
    update public.evidencia_fotos set conflicto=true,conflicto_detalle='Reintento con contenido o identidad diferente',conflicto_detectado_en=now()
    where id=v_id;
    return jsonb_build_object('ok',false,'conflicto',true);
  end if;
  if coalesce(v_foto.conflicto,false) then return jsonb_build_object('ok',false,'conflicto',true); end if;
  return jsonb_build_object('ok',true,'duplicada',true);
end $$;
revoke all on function public.registrar_foto_idempotente(jsonb) from public,anon;
grant execute on function public.registrar_foto_idempotente(jsonb) to authenticated;

create function private.validar_fotos_antes_de_cerrar()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_tipo text;
begin
  if new.estado is not distinct from old.estado then return new; end if;
  if new.estado::text not in ('evidencia_inicial_completada','evidencia_final_completada','entrega_confirmada','servicio_cerrado') then return new; end if;
  if exists(select 1 from public.evidencia_fotos where traslado_id=new.id and conflicto=true) then
    raise exception 'Conflicto real en una fotografía. Requiere revisión antes de cerrar.';
  end if;
  if exists(select 1 from public.evidencia_conflictos where traslado_id=new.id and resuelto_en is null) then
    raise exception 'Conflicto de contenido en almacenamiento. Requiere revisión antes de cerrar.';
  end if;
  for v_tipo in select unnest(case when new.estado::text='evidencia_inicial_completada' then array['inicial'] else array['inicial','final'] end) loop
    if (select count(distinct f.angulo) from public.evidencia_fotos f where f.traslado_id=new.id and f.tipo::text=v_tipo
      and f.sincronizada=true and coalesce(f.conflicto,false)=false
      and f.angulo::text in ('frente','lado_piloto','lado_copiloto','trasera','tablero')
      and exists(select 1 from storage.objects o where o.bucket_id='evidencia' and o.name=f.url)) < 5 then
      raise exception 'Faltan fotografías obligatorias sincronizadas de tipo %.',v_tipo;
    end if;
  end loop;
  return new;
end $$;
revoke all on function private.validar_fotos_antes_de_cerrar() from public;
create trigger validar_fotos_antes_de_cerrar before update of estado on public.traslados
for each row execute function private.validar_fotos_antes_de_cerrar();
