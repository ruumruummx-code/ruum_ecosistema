const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const req=createRequire(path.resolve('apps/app-usuario/package.json'));
const {chromium}=req('@playwright/test');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:900}});
  const results=[];
  for(const route of ['/login','/registro','/legal/privacidad']){
    await page.goto('https://www.usuario.ruumruum-moviliax.online'+route,{waitUntil:'networkidle',timeout:45000});
    await page.addScriptTag({path:path.resolve('node_modules/.pnpm/axe-core@4.14.0/node_modules/axe-core/axe.min.js')});
    const result=await page.evaluate(async()=>{
      const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
      return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodeCount:v.nodes.length})),passes:r.passes.length};
    });
    results.push({route,...result});
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname,'accesibilidad-publica.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
