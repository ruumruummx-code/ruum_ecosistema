const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const req = createRequire(path.resolve('apps/app-usuario/package.json'));
const { chromium } = req('@playwright/test');
(async () => {
  const browser = await chromium.launch({headless:true});
  const results=[];
  for(const width of [390,1440]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    for(const route of ['/login','/registro','/legal/privacidad','/viajes/nuevo']) {
      const errors=[];
      const handler=e=>errors.push(e.message);
      page.on('pageerror',handler);
      const start=Date.now();
      try {
        const response=await page.goto('https://www.usuario.ruumruum-moviliax.online'+route,{waitUntil:'networkidle',timeout:45000});
        const info=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,inputs:[...document.querySelectorAll('input')].map(e=>({type:e.type,name:e.name,id:e.id}))}));
        results.push({width,route,status:response.status(),finalUrl:page.url(),elapsedMs:Date.now()-start,...info,errors});
        if(route==='/login') await page.screenshot({path:path.join(__dirname,`login-${width}.png`),fullPage:true});
      } catch(e) {results.push({width,route,error:e.message,errors});}
      page.off('pageerror',handler);
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname,'smoke-publico.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
