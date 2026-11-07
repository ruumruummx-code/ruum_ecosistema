const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');const ts=require(path.join(root,'node_modules/typescript'));
const dir=path.join(root,'packages/ui/src/components');const components=[],utilities=[],sources=[];
for(const name of fs.readdirSync(dir).filter(f=>/\.(tsx?|css)$/.test(f)&&!/(test|stories)\./.test(f))){const file=path.join(dir,name),text=fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);const declarations=sf.statements.filter(n=>ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)).map(n=>n.getText(sf)).join('\n\n');sources.push({file:path.relative(root,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(text).digest('hex')});
for(const n of sf.statements){if(!n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;let exportName,signature;
if(ts.isFunctionDeclaration(n)&&n.name){exportName=n.name.text;signature=n.getText(sf).slice(0,n.body?n.body.pos-n.pos:undefined).trim();}
if(ts.isVariableStatement(n))for(const d of n.declarationList.declarations){if(d.name.getText(sf)==='Field'){exportName='Field';signature='forwardRef<HTMLInputElement, FieldProps>';}}
if(exportName){const record={name:exportName,file:path.relative(root,file).replaceAll('\\','/'),line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,signature,declarations};(exportName[0]===exportName[0].toUpperCase()?components:utilities).push(record);}}
}
const tokenFile=path.join(root,'packages/ui/src/styles/tokens.css'),css=fs.readFileSync(tokenFile,'utf8');const tokens=[...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(m=>({name:m[1],value:m[2].trim(),line:css.slice(0,m.index).split('\n').length}));
fs.writeFileSync(path.join(__dirname,'inventario.json'),JSON.stringify({generatedAt:new Date().toISOString(),revision:require('child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,components,utilities,sources,tokens},null,2));console.log({components:components.map(c=>c.name),utilities:utilities.map(c=>c.name),tokens:new Set(tokens.map(t=>t.name)).size});
