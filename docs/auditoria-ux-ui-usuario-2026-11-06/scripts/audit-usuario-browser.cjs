const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('docs/auditoria-ux-ui-usuario-2026-11-06');
fs.mkdirSync(out, {recursive:true});
(async()=>{
 const browser = await chromium.launch(); const results=[];
 for(const width of [390,1440,320]) {
  const context=await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce'});
  const session={access_token:'mock_access_token_dashboard',refresh_token:'mock_refresh_token',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'00000000-0000-4000-8000-0000000000f1',aud:'authenticated',role:'authenticated',email:'usuario@ejemplo.com'}};
  for(const route of (width===320?['/login','/registro','/viajes/nuevo','/cuenta/preferencias']:['/login','/registro','/','/mis-viajes','/viajes/nuevo','/viajes/masivo','/cuenta','/cuenta/preferencias','/soporte','/ubicaciones','/pasaporte','/viajes/10000000-0000-4000-8000-000000000001'])) {
   await context.clearCookies();
   if(!['/login','/registro'].includes(route)) await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:'http://localhost:3012'}]);
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const id=width+'-'+(route.replaceAll('/','_')||'home');
   try{
    const res=await page.goto('http://localhost:3012'+route,{waitUntil:'domcontentloaded',timeout:90000}); await page.waitForTimeout(1800);
    const metrics=await page.evaluate(()=>({url:location.pathname,title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,text:document.body.innerText.slice(0,14000),smallTargets:[...document.querySelectorAll('button,a,input,select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<24}).map(e=>({text:(e.innerText||e.getAttribute('aria-label')||e.id).slice(0,70),height:e.getBoundingClientRect().height})).slice(0,30)}));
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    await page.screenshot({path:path.join(out,id+'.png'),fullPage:true});
    results.push({id,route,width,status:res.status(),...metrics,errors,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))}))});
   }catch(e){results.push({id,route,width,error:e.message,errors});}
   fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(id,results.at(-1).violations?.map(x=>x.id).join(','),results.at(-1).error||'');await page.close();
  }await context.close();
 } await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
