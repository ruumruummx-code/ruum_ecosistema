const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../../..');
const { execFileSync } = require('node:child_process');
const postSession = process.argv.includes('--post-session');
const dirs = ['auditorias/RUUM-UX-001-SD/remediacion-SD-REM-004','auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007'];
const manifestName = postSession ? 'manifiesto-post-sesion.json' : 'manifiesto-sha256.json';
const manifestPath = __dirname+'/'+manifestName, sealPath = manifestPath.replace(/\.json$/, '.sha256');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const excluded = new Set(['manifiesto-sha256.json','manifiesto-sha256.sha256','manifiesto-post-sesion.json','manifiesto-post-sesion.sha256'].map(p=>__dirname+'/'+p).map(p=>path.resolve(p).toLowerCase()));
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files = dirs.flatMap(dir=>walk(root+'/'+dir)).filter(f=>!excluded.has(path.resolve(f).toLowerCase())).map(file=>({path:path.relative(root,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(fs.readFileSync(file))})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
const sourcePaths = ['packages/ui/src/components/Controls.tsx','packages/ui/src/components/Controls.test.tsx','packages/ui/src/components/composition-contract.test.ts','packages/ui/src/components/MobileRow.tsx','packages/ui/src/components/NextOperationalAction.tsx','packages/ui/src/components/disabled-links.test.tsx','packages/ui/src/styles/tokens.css','apps/app-conductor/src/app/cuenta/preferencias/page.tsx','apps/app-conductor/src/app/viajes/[id]/ContactoYVehiculo.tsx','apps/app-conductor/src/app/viajes/[id]/ContactoRecepcionVehiculo.tsx','apps/app-conductor/test/sd-rem-007-razon-bloqueo.test.tsx','auditorias/RUUM-UX-001-SD/showcase.css','auditorias/RUUM-UX-001-SD/CO-REVISION.md'];
const sources = sourcePaths.map(p=>({path:p,sha256:hash(fs.readFileSync(root+'/'+p))}));
// Canonical directory digest: UTF-8 sorted lines "<file hash>  <relative path>\n".
const digest = entries => hash(entries.map(f=>`${f.sha256}  ${f.path}\n`).join(''));
const preservation = JSON.parse(fs.readFileSync(__dirname+'/sellos-pre-sesion/registro-preservacion.json','utf8'));
for (const entry of [preservation.manifiestoOriginal,preservation.manifiestoAntiguo004]) assert.equal(hash(fs.readFileSync(__dirname+'/'+entry.ruta)),entry.sha256,'Cambió un manifiesto preservado');
assert.equal(hash(fs.readFileSync(__dirname+'/sellos-pre-sesion/manifiesto-original.sha256')),preservation.manifiestoOriginal.selloOriginalSha256,'Cambió el sello preservado');
const gate = JSON.parse(fs.readFileSync(__dirname+'/estado-gate.json','utf8'));
if (postSession) {
 const session = JSON.parse(fs.readFileSync(__dirname+'/SESION-AT.json','utf8'));
 assert.equal(session.estado,'REALIZADA');
 assert.ok(session.operadorNominal?.trim() && session.transcriptorNominal?.trim());
 assert.notEqual(session.operadorNominal.trim().toLowerCase(),session.transcriptorNominal.trim().toLowerCase(),'Operador y transcriptor deben ser distintos');
 for (const key of ['lector','versionLector','navegadorSesion','versionNavegadorSesion','transcripcionLiteral','intentosActivacionAT','tabShiftTabAT','rehabilitacionAT']) assert.ok(session[key],key+' pendiente');
 assert.ok(session.respaldo?.ruta && session.respaldo?.sha256,'Falta respaldo');
 assert.equal(hash(fs.readFileSync(path.resolve(root,session.respaldo.ruta))),session.respaldo.sha256);
 for (const signature of [gate.frontendPlataforma,gate.accesibilidad,gate.disenoSistemas]) assert.ok(signature.estado === 'FIRMADO' && signature.nombre?.trim() && signature.fecha && signature.evidencia,'Falta firma/co-revisión nominal');
 // Crear sello posterior solo cuando la sesión y aceptaciones ya existen. No mutar el pre-sesión.
 if (!process.argv.includes('--check')) assert.ok(!fs.existsSync(manifestPath),'Ya existe sello posterior: no se sobrescribe');
}
const sourceState = {baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTreeDirty:Boolean(execFileSync('git',['status','--porcelain','--',...sourcePaths],{cwd:root,encoding:'utf8'}).trim()),sourcesSha256:digest(sources),note:'Commit base; los hashes sources identifican el código de workspace probado. No se afirma que HEAD contenga los cambios sin commit.'};
const manifest = {algorithm:'SHA-256',schema:2,phase:postSession?'post-session':'pre-session',approval:'APROBADOS CON CONDICIONES; P2-1 NO CERRADA',sourceState,scope:dirs,excludes:['remediacion-SD-REM-007/manifiesto-sha256.json','remediacion-SD-REM-007/manifiesto-sha256.sha256','remediacion-SD-REM-007/manifiesto-post-sesion.json','remediacion-SD-REM-007/manifiesto-post-sesion.sha256'],directoryHashDefinition:'SHA-256 de líneas UTF-8 ordenadas por ruta (ordinal), formato <sha256> dos espacios <ruta relativa raíz> LF; excluye manifiesto y sello para evitar autorreferencia',directories:dirs.map(dir=>({path:dir,sha256:digest(files.filter(f=>f.path.startsWith(dir+'/')))})),jointDirectorySha256:digest(files),files,sources};
if(process.argv.includes('--check')) {
 const existing=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 assert.deepEqual(existing,manifest,'Cambió un archivo de evidencia o código fuente');
 const manifestHash=hash(fs.readFileSync(manifestPath));
 assert.equal(fs.readFileSync(sealPath,'utf8'),`${manifestHash}  ${manifestName}\n`,'El sello del manifiesto no coincide');
 console.log('PASS: evidencia, fuentes, hash de ambos directorios y sello del manifiesto íntegros.');
} else {
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(sealPath,`${hash(fs.readFileSync(manifestPath))}  ${manifestName}\n`);
 console.log(JSON.stringify({directories:manifest.directories,jointDirectorySha256:manifest.jointDirectorySha256,manifestSha256:hash(fs.readFileSync(manifestPath)),files:files.length},null,2));
}

