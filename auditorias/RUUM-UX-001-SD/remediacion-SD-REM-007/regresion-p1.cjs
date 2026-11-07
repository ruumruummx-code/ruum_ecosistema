const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { resolve, start } = require('../servidor.cjs');
(async () => {
 const { server, url } = await start();
 const browser = await require(resolve('playwright')).chromium.launch();
 const reports = [];
 try {
 const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
 const rules = ['color-contrast','label','link-name','button-name','aria-allowed-attr','aria-prohibited-attr','nested-interactive'];
 for (const ticket of ['004', '007']) {
  await page.goto(url + `/remediacion-SD-REM-${ticket}/formulario.html`);
  await page.addStyleTag({ path: __dirname + '/formulario.css' });
  await page.addScriptTag({ path: resolve('axe-core/axe.min.js') });
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  if(ticket === '004') {
   await page.locator('input').first().waitFor();
   await page.locator('input, textarea').evaluateAll(es => es.forEach(e => { e.value = 'Texto de contraste'; }));
  } else await page.locator('#before').waitFor();
  for (const theme of ['light','dark']) {
   await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
   for (let state=0; state<(ticket === '004' ? 4 : 2); state++) {
    const axe = await page.evaluate(async rules => window.axe.run(document.querySelector('main'), { runOnly: { type:'rule', values:rules } }), rules);
    const focus = [];
    if(ticket === '004') {
     for (const [role,name] of [['textbox','Input 1'],['combobox','Select 1'],['textbox','Textarea 1']]) {
      const control=page.getByRole(role,{name,exact:true}); await control.focus();
      const data=await control.evaluate(e=>{const s=getComputedStyle(e);return {active:document.activeElement===e,outline:s.outline,shadow:s.boxShadow,id:e.id,name:[...e.labels].map(l=>l.textContent).join(' ')};});
      assert.ok(data.active && data.shadow !== 'none' && !data.shadow.endsWith('0px 0px 0px 0px'), JSON.stringify(data));
      focus.push(data);
     }
    } else if(state===1) {
     await page.locator('#before').focus(); await page.keyboard.press('Tab');
     const link=page.getByRole('link',{name:'Cancelar traslado',exact:true});
     const data=await link.evaluate(e=>{const s=getComputedStyle(e);return {active:document.activeElement===e,outline:s.outline,name:e.textContent};});
     assert.ok(data.active); focus.push(data);
     const cta=page.getByRole('link',{name:'Confirmar pago',exact:true}); await cta.focus();
     focus.push(await cta.evaluate(e=>{const s=getComputedStyle(e);return {active:document.activeElement===e,outline:s.outline,color:s.color,background:s.backgroundImage,name:e.textContent};}));
    }
    let gradientContrast;
    if(ticket === '007' && state===1) {
     gradientContrast = await page.getByRole('link',{name:'Confirmar pago',exact:true}).evaluate(e => {
      const s=getComputedStyle(e), values=s.backgroundImage.match(/rgb\([^)]+\)/g).map(c=>c.match(/[\d.]+/g).map(Number));
      const fg=s.color.match(/[\d.]+/g).map(Number);
      const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      const samples=Array.from({length:101},(_,i)=>contrast(fg,values[0].map((v,j)=>v+(values[1][j]-v)*i/100)));
      return {foreground:s.color,background:s.backgroundImage,minRatio:Math.min(...samples),samples:101,required:4.5};
     });
     assert.ok(gradientContrast.minRatio>=4.5,JSON.stringify(gradientContrast));
    }
    reports.push({ticket,theme,state,axe,focus,gradientContrast});
    if(state === (ticket==='004'?3:1)) await page.screenshot({ path:__dirname+`/regresion-${ticket}-${theme}.png`,fullPage:true });
    await page.getByRole('button',{name:ticket==='004'?'Cambiar estado':'Alternar disponibilidad',exact:true}).click();
   }
  }
 }
 const violations=reports.flatMap(r=>r.axe.violations.map(v=>({ticket:r.ticket,theme:r.theme,state:r.state,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
 fs.writeFileSync(__dirname+'/regresion-p1.json',JSON.stringify({rules,reports,violations,note:'Contraste de controles inactivos exento en WCAG. Incompletos axe permanecen explícitos. Foco y nombre verificados además por DOM; no equivale a sesión AT.'},null,2));
 console.log(JSON.stringify({checks:reports.length,violations},null,2));
 assert.equal(violations.length,0,'Regresión P1: revisar reporte');
 } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
