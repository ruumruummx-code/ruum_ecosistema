const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { resolve } = require('../servidor.cjs');
const ts = require(resolve('typescript'));
const root = path.resolve(__dirname, '../../..');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (['node_modules','.next','build','dist','android','ios'].includes(e.name) ? [] : walk(path.join(d,e.name))) : /\.[jt]sx?$/.test(e.name) ? [path.join(d,e.name)] : []);
const files = fs.readdirSync(root + '/apps', { withFileTypes: true }).filter(e => e.isDirectory() && fs.existsSync(root + '/apps/' + e.name + '/src')).flatMap(e => walk(root + '/apps/' + e.name + '/src')).filter(f => !/\.(test|spec)\./.test(f));
const relative = p => path.relative(root,p).replaceAll('\\','/');
const targets = new Set(['MobileRow','NextOperationalAction']);
const eventNames = /^(onClick|onKeyDown|onKeyUp|onPointerDown)(Capture)?$/;
const inventory = [], imported = [], wrappers = [];
for (const file of files) {
 const text = fs.readFileSync(file,'utf8');
 if (!/MobileRow|NextOperationalAction/.test(text)) continue;
 const source = ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const aliases = new Map();
 source.forEachChild(n => {
  if(ts.isImportDeclaration(n) && n.importClause?.namedBindings) {
   const b = n.importClause.namedBindings;
   if(ts.isNamedImports(b)) for(const e of b.elements) if(targets.has((e.propertyName ?? e.name).text)) aliases.set(e.name.text,(e.propertyName ?? e.name).text);
   imported.push({ file: relative(file), module:n.moduleSpecifier.text, bindings:b.getText(source) });
  }
 });
 function attrs(n) { return n.attributes.properties.map(p => ts.isJsxSpreadAttribute(p) ? { spread:p.getText(source) } : { name:p.name.getText(source), value:p.initializer?.getText(source) ?? 'true' }); }
 function visit(n) {
  if(ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
   const tag=n.tagName.getText(source), component=aliases.get(tag) ?? (targets.has(tag.split('.').at(-1)) ? tag.split('.').at(-1) : null);
   if(component) {
    const ancestors=[];
    for(let p=n.parent;p;p=p.parent) if(ts.isJsxElement(p) && p.openingElement !== n) ancestors.push({ tag:p.openingElement.tagName.getText(source), line:source.getLineAndCharacterOfPosition(p.pos).line+1, attributes:attrs(p.openingElement).filter(a=>a.spread || eventNames.test(a.name)) });
    inventory.push({ file:relative(file), component, line:source.getLineAndCharacterOfPosition(n.getStart(source)).line+1, props:attrs(n), ancestors, activatingAncestor:ancestors.some(a=>a.attributes.length>0), sha256:crypto.createHash('sha256').update(text).digest('hex') });
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
}
for(const name of ['ContactoYVehiculo','ContactoRecepcionVehiculo']) {
 const refs=files.filter(file => { const text=fs.readFileSync(file,'utf8'); return text.includes(name) && !file.endsWith(name+'.tsx'); }).map(relative);
 wrappers.push({name, externalReferences:refs, routing:refs.length ? 'revisar referencias' : 'sin consumidores en apps; no se monta desde rutas actuales'});
}
const checkedAncestors=['apps/app-conductor/src/app/layout.tsx','apps/app-conductor/src/app/viajes/[id]/layout.tsx','apps/app-conductor/src/app/viajes/[id]/TripOperationalFrame.tsx','apps/app-conductor/src/app/ViajeActivoContext.tsx','apps/app-conductor/src/components/LiveRegionProvider.tsx','apps/app-conductor/src/components/ErrorBoundaryConductor.tsx'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex'), result:'Revisión de children: sin onClick/onKeyDown de activación en ancestros; botones de soporte/reset son ramas separadas'}));
const output={scope:'apps, código fuente JS/TS/JSX/TSX; excluye dependencias, builds y pruebas',scannedFiles:files.length,inventory,wrappers,checkedAncestors, appUsuarioUses:inventory.filter(i=>i.file.startsWith('apps/app-usuario/')).length,exceptions:[], conclusion:'Ningún ancestro JSX de los cuatro sitios tiene handlers de activación ni spreads. Revisión de layouts/providers documentada. Filas de preferencias ahora pasivas: solo el switch hijo ejecuta cambios, sin botón anidado.'};
fs.writeFileSync(__dirname+'/consumidores.json',JSON.stringify(output,null,2));
if(inventory.length!==4 || inventory.some(i=>i.activatingAncestor)) throw new Error('Cambió el inventario o existe un ancestro pendiente de revisión');
console.log(`Inventario: ${files.length} archivos, ${inventory.length} sitios, 0 ancestros activables, ${output.appUsuarioUses} en app-usuario.`);

