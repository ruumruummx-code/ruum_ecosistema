import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as U from '../../packages/ui/src/components';
const noop=()=>{};
const text='Información del traslado para revisión del sistema de diseño.';
const long='Información importante del traslado con una descripción extensa que debe permanecer legible y operable al ampliar el texto y reducir el ancho de la pantalla.';
const registry: {id:string;component:string;state:string;render:()=>React.ReactNode;example:string}[]=[];
function add(component:string,state:string,render:()=>React.ReactNode,example=''){registry.push({id:component+'--'+state,component,state,render,example:example||render.toString()});}
function Buttons(){return null;}
for(const variant of ['primary','secondary','quiet','danger','emergency'] as const)for(const state of ['default','disabled','loading'])add('Button',variant+'-'+state,()=> <U.Button variant={variant} disabled={state==='disabled'} loading={state==='loading'}>Continuar con el traslado</U.Button>);
for(const name of ['ButtonPrimary','ButtonSecondary','ButtonText','MobileButton'] as const){const C=U[name];for(const state of ['default','disabled','loading'])add(name,state,()=> <C disabled={state==='disabled'} loading={state==='loading'}>Continuar con el traslado</C>);}
for(const variant of ['secondary','quiet','danger'] as const)add('MobileButton',variant,()=> <U.MobileButton variant={variant}>Continuar con el traslado</U.MobileButton>);
for(const name of ['Input','Field','Textarea','Select'] as const){for(const state of ['default','disabled','error','help','long-label']){const C:any=U[name];add(name,state,()=> <C etiqueta={state==='long-label'?long:'Nombre del contacto'} disabled={state==='disabled'} error={state==='error'?'Revisa la información del campo':undefined} {...(state==='help'&&name!=='Textarea'&&name!=='Select'?{ayuda:'Escribe el nombre completo'}:{})}>{name==='Select'?<><option value="uno">Primera opción</option><option value="dos">Segunda opción</option></>:undefined}</C>);}}
add('Field','password',()=> <U.Field etiqueta="Contraseña" type="password" defaultValue="Ejemplo123" ayuda="Al menos ocho caracteres"/>);
for(const name of ['Input','Select','Textarea'] as const){const C:any=U[name];add(name,'multiple-without-id',()=> <><C etiqueta="Primer campo">{name==='Select'?<option>Primero</option>:undefined}</C><C etiqueta="Segundo campo">{name==='Select'?<option>Segundo</option>:undefined}</C></>);}
for(const name of ['Checkbox','Radio'] as const){const C=U[name];for(const state of ['default','checked','disabled'])add(name,state,()=> <C etiqueta="Acepto la información del traslado" name={name} defaultChecked={state==='checked'} disabled={state==='disabled'}/>);}
function SwitchSample({disabled=false}){const [checked,set]=useState(false);return <U.Toggle etiqueta="Notificaciones de traslado" checked={checked} disabled={disabled} onCheckedChange={set}/>;}
add('Toggle','default',()=> <SwitchSample/>);add('Toggle','checked',()=> <U.Toggle etiqueta="Notificaciones de traslado" checked onCheckedChange={noop}/>);add('Toggle','disabled',()=> <SwitchSample disabled/>);
for(const name of ['Alert','Toast','Aviso'] as const){const C:any=U[name];for(const tono of (name==='Aviso'?['info','success','atencion','warning','danger','error']:['info','success','warning','error']))add(name,tono,()=> <C tono={tono} titulo="Estado del traslado">{text}</C>);}
for(const name of ['Card','OperationalCard','TripCard','FinancialCard','AlertCard','PassportCard','MobileCard'] as const){const C:any=U[name];add(name,'default',()=> <C><h2>Resumen del traslado</h2><p>{text}</p><U.Button variant="secondary">Ver detalle</U.Button></C>);add(name,'long-content',()=> <C {...(name==='TripCard'||name==='PassportCard'?{folio:'RUUM-12345678'}:{})}><h2>{long}</h2><p>{long}</p><U.Button variant="secondary">Consultar información del traslado</U.Button></C>);}
const statuses=['solicitado','cotizacion-confirmada','pendiente-conductor','conductor-asignado','evidencia-inicial-completa','en-ruta','entrega-confirmada','cerrado','evidencia-pendiente','incidente-abierto','cancelado','pago-detenido'] as const;
for(const estado of statuses)add('StatusChip',estado,()=> <U.StatusChip estado={estado}/>);
for(const estado of ['solicitud_creada','conductor_asignado','traslado_en_curso','servicio_cerrado','servicio_cancelado','pago_pendiente'] as const)add('EstadoBadge',estado,()=> <U.EstadoBadge estado={estado}/>);
add('EstadoBadge','without-text',()=> <U.EstadoBadge estado="conductor_asignado" conTexto={false}/>);
for(const variante of ['exito','en_ruta','pendiente','error','neutro'] as const)add('MobileBadge',variante,()=> <U.MobileBadge variante={variante} texto="Estado de traslado" punto/>);
for(const status of ['sin_calcular','estimado','en_validacion','confirmado','programado','pagado','retenido','rechazado'] as const){for(const name of ['FinancialAmount','DriverEarning'] as const){const C=U[name];add(name,status,()=> <C status={status} amount={status==='sin_calcular'?null:12345}/>);}add('EstatusBadgeEconomico',status,()=> <U.EstatusBadgeEconomico estatus={status}/>);}
for(const name of ['MobileProgress','DesktopStateStepper','EstadoStepper'] as const){const C=U[name];for(const estado of ['solicitud_creada','traslado_en_curso','servicio_cancelado','servicio_cerrado'] as const)add(name,estado,()=> <C estado={estado}/>);}
const navItems=[{id:'inicio',etiqueta:'Inicio',href:'#inicio',activo:true,icono:U.ICONOS_NAV.inicio},{id:'viajes',etiqueta:'Traslados',href:'#traslados',icono:U.ICONOS_NAV.traslados},{id:'ayuda',etiqueta:'Ayuda',href:'#ayuda',icono:U.ICONOS_NAV.ayuda},{id:'cuenta',etiqueta:'Cuenta',href:'#cuenta',icono:U.ICONOS_NAV.cuenta}];
add('BottomNav','default',()=> <U.BottomNav items={navItems}/>);
add('Sidebar','default',()=> <U.Sidebar grupos={[{titulo:'Cuenta',items:navItems.map(i=>({...i,contador:3}))}]}/>);
function TabSample(){const [active,set]=useState('uno');return <U.Tabs tabs={[{id:'uno',etiqueta:'Próximos',conteo:4,activo:active==='uno'},{id:'dos',etiqueta:'Completados',conteo:12,activo:active==='dos'}]} onSeleccion={set}/>;}
add('Tabs','default',()=> <TabSample/>);
add('Avatar','default',()=> <U.Avatar nombre="María González" conEstado="activo"/>);
add('Avatar','rounded',()=> <U.Avatar nombre="María González" forma="rounded" tamano={64}/>);
add('EmptyState','default',()=> <U.EmptyState titulo="Sin traslados" descripcion="Aquí aparecerán tus próximos traslados."/>);
for(const tipo of ['text','card','list'] as const)add('Skeleton',tipo,()=> <U.Skeleton tipo={tipo}/>);
add('MobileHeader','default',()=> <U.MobileHeader titulo="Mis traslados" onAtras={noop}/>);add('MobileHeader','long-label',()=> <U.MobileHeader titulo={long} subtitulo={long} onAtras={noop}/>);
add('RuumHeader','default',()=> <U.RuumHeader rol="usuario" notificacionesCount={3} onNotificaciones={noop} onSoporte={noop}/>);
for(const state of ['default','disabled','link','disabled-link','destructivo'])add('MobileRow',state,()=> <U.MobileRow titulo="Consultar traslado" subtitulo={text} {...(state.includes('link')?{href:'#traslado'}:{onClick:noop})} disabled={state.startsWith('disabled')} destructivo={state==='destructivo'}/>);
add('MobileListGroup','default',()=> <U.MobileListGroup as="nav" tituloSeccion="Mi cuenta"><U.MobileRow titulo="Preferencias" href="#preferencias"/><U.MobileRow titulo="Soporte" href="#soporte"/></U.MobileListGroup>);
add('MobileShell','default',()=> <U.MobileShell navInferiorVisible><h2>Contenido móvil</h2><p>{long}</p><U.Button>Continuar</U.Button></U.MobileShell>);
for(const state of ['default','loading','error','disabled-link'])add('NextOperationalAction',state,()=> <U.NextOperationalAction title="Siguiente acción" instruction={long} primaryCta={{label:'Continuar',...(state==='disabled-link'?{href:'#siguiente',disabled:true}:{onClick:noop})}} secondaryCta={{label:'Consultar información',onClick:noop}} loading={state==='loading'} error={state==='error'?'No se pudo completar. Reintenta.':undefined}/>);
const msgs=[{id:'uno',remitente:'usuario' as const,contenido:'Hola, necesito información del traslado.',enviado_en:'2026-11-06T12:00:00Z'},{id:'dos',remitente:'conductor' as const,contenido:'El traslado sigue su ruta programada.',enviado_en:'2026-11-06T12:01:00Z'}];
for(const state of ['default','empty','disabled','pending','long-message'])add('Chat',state,()=> <U.Chat propio="usuario" mensajes={state==='empty'?[]:state==='long-message'?[{...msgs[0],contenido:long}]:state==='pending'?[{...msgs[0],pendiente:true}]:msgs} deshabilitado={state==='disabled'} mensajeDeshabilitado="Chat no disponible para este traslado" onEnviar={async()=>{await new Promise(r=>setTimeout(r,150))}}/>);
function ModalSample({state}:{state:string}){const [open,set]=useState(false);const close=useCallback(()=>set(false),[]);return <><button type="button" data-open onClick={()=>set(true)}>Abrir diálogo</button><U.Modal abierto={open} onCerrar={close} titulo="Confirmar operación" estado={state==='loading'?'loading':state==='error'?'error':'default'}><p>{long}</p>{state==='long-content'&&Array.from({length:20},(_,i)=><p key={i}>{long}</p>)}<U.Button onClick={close}>Aceptar</U.Button><U.Button variant="secondary" onClick={close}>Mantener</U.Button></U.Modal><button type="button" data-outside>Acción fuera del diálogo</button></>;}
for(const state of ['default','loading','error','long-content'])add('Modal',state,()=> <ModalSample state={state}/>);
add('BannerDemo','default',()=> <U.BannerDemo/>);
for(const variante of ['horizontal','vertical','simbolo','avatar','sello','version-navy'] as const)add('LogoMarca',variante,()=> <U.LogoMarca variante={variante}/>);
add('SimboloVectorial','default',()=> <U.SimboloVectorial tamano={72}/>);add('Icono','default',()=> <U.Icono nombre="palomita"/>);
for(const state of ['default','compacto'])add('SelloConductor',state,()=> <U.SelloConductor compacto={state==='compacto'} lema="Certificación vigente"/>);
add('CredencialConductor','default',()=> <U.CredencialConductor nombreConductor="María González" folioInterno="COND-123" vigencia="31/12/2026" telefonoOperativo="Contacto de prueba"/>);
add('ReporteTraslado','default',()=> <U.ReporteTraslado folio="TR-123" cliente="Cliente de prueba" servicio="Traslado" vehiculo="Vehículo de prueba" ruta="Ciudad de México a Puebla" conductor="María González" nivel="Certificado" estado="en-ruta"/>);
add('ActaEntrega','default',()=> <U.ActaEntrega folio="TR-123" vehiculo="Vehículo de prueba" origen="Ciudad de México" destino="Puebla"/>);
add('EstadoPagoConductor','default',()=> <U.EstadoPagoConductor folio="TR-123" base="$1,000" reembolsables="$200" fechaEstimada="8/11/2026" estatus="Programado" causa="Validación operativa"/>);
add('MapaEstatico','default',()=> <U.MapaEstatico src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120'%3E%3Crect width='240' height='120' fill='%23e8eef4'/%3E%3C/svg%3E" alt="Mapa del traslado de prueba" width={240} height={120}/>);
add('StreetContainer','default',()=> <U.StreetContainer activo><p>{long}</p><U.Button>Continuar traslado</U.Button></U.StreetContainer>);
add('SafetyButton','default',()=> <U.SafetyButton onActivar={noop}/>);
add('TextInputUppercaseBridge','default',()=> <><U.TextInputUppercaseBridge/><U.Field etiqueta="Nombre completo"/><U.Field etiqueta="Correo" type="email"/></>);
function UtilityDialog(){const [open,set]=useState(false);const close=useCallback(()=>set(false),[]);return <><button data-open onClick={()=>set(true)}>Abrir diálogo nativo</button>{open&&<NativeDialog close={close}/>}<button data-outside>Acción exterior</button></>;}
function NativeDialog({close}:{close:()=>void}){const ref=U.useDialogAccesible({alCancelar:close});return <dialog ref={ref} aria-label="Diálogo nativo de prueba"><button onClick={close}>Cerrar</button><button>Continuar</button></dialog>;}
add('useDialogAccesible','default',()=> <UtilityDialog/>);
function ThemeSample(){const {tema,modo,fijarModo}=U.useRuumTheme();return <><p data-mode>{modo}: {tema}</p><button onClick={()=>fijarModo('light')}>Claro</button><button onClick={()=>fijarModo('dark')}>Oscuro</button><button onClick={()=>fijarModo('auto')}>Automático</button></>;}
add('useRuumTheme','default',()=> <ThemeSample/>);
function StreetSample(){const [on,set]=useState(false);const state=U.useStreetMode(on);return <><p>{JSON.stringify(state)}</p><button onClick={()=>set(!on)}>Cambiar modo calle</button></>;}
add('useStreetMode','default',()=> <StreetSample/>);
const root=createRoot(document.getElementById('root')!);
(window as any).auditRegistry=registry.map(({render,...r})=>r);
(window as any).auditSelect=(id:string)=>{const sample=registry.find(r=>r.id===id)!;root.render(<React.Fragment key={id}><header id="audit-heading"><h1>{sample.component} · {sample.state}</h1></header><main id="sample" data-audit-id={sample.id}>{sample.render()}</main><footer id="audit-footer">Auditoría de @ruum/ui · sin overrides de componente</footer></React.Fragment>);};
(window as any).auditSelect(registry[0].id);
