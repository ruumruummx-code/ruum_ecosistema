const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const resolve=p=>require.resolve(p,{paths:[root+'/apps/app-usuario/node_modules',root+'/node_modules/.pnpm/node_modules']});
(async()=>{
 const esbuild=require(resolve('esbuild'));
 await esbuild.build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {CancelarTraslado} from './apps/app-usuario/src/app/viajes/[id]/CancelarTraslado'; createRoot(document.getElementById('root')).render(<CancelarTraslado trasladoId="fixture" estado="pendiente_de_conductor" precio={1000} fechaProgramada={null} conductorAsignado={true}/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'iife',jsx:'automatic',outfile:path.join(__dirname,'fixture.js'),nodePaths:[root+'/apps/app-usuario/node_modules',root+'/node_modules/.pnpm/node_modules'],tsconfig:root+'/apps/app-usuario/tsconfig.json',plugins:[{name:'dobles',setup(b){b.onResolve({filter:/^(next\/|@ruum\/api\/services$|@\/lib\/supabase-browser$)/},a=>({path:a.path,namespace:'doble'}));b.onLoad({filter:/.*/,namespace:'doble'},a=>({loader:'js',resolveDir:root,contents:a.path==='next/navigation'?`export const useRouter=()=>({refresh(){}});`:(a.path==='next/link'||a.path==='next/image')?`import React from 'react';export default function Link(p){return React.createElement('a',p)}`:a.path.includes('supabase-browser')?`export const tieneSupabaseConfigurado=()=>true;export const crearClienteNavegador=()=>({});`:`export const usuarioPuedeCancelar=()=>true;export async function cancelarTraslado(){window.llamadas=(window.llamadas||0)+1;await new Promise(r=>setTimeout(r,700));if(window.fallar)throw Error('Error de prueba');return {monto_cargo:200,porcentaje_cargo:20}}` }));}}]});
 const postcss=require(resolve('postcss')),tw=require(resolve('@tailwindcss/postcss'));
 const from=root+'/apps/app-usuario/src/app/globals.css';
 const result=await postcss([tw({base:root+'/apps/app-usuario'})]).process(fs.readFileSync(from,'utf8')+'\n@source "'+root.replaceAll('\\','/')+'/packages/ui/src";',{from});fs.writeFileSync(path.join(__dirname,'fixture.css'),result.css);
 fs.writeFileSync(path.join(__dirname,'fixture.html'),'<!doctype html><html lang="es-MX"><meta charset="utf-8"><title>UX-008 · Fixture del componente real</title><link rel="stylesheet" href="fixture.css"><body style="padding:24px;max-width:800px;margin:auto"><main><h1>Detalle del traslado · prueba aislada</h1><div id="root"></div></main><script src="fixture.js"></script></body></html>');
})();


