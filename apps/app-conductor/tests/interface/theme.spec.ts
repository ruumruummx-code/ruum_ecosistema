import { test, expect, type Page } from "@playwright/test";
const trip=(i:number)=>`10000000-0000-4000-8000-${String(i).padStart(12,"0")}`;
test.beforeEach(async({page,context,request})=>{
 await request.get("http://127.0.0.1:54331/qa/reset");await page.emulateMedia({reducedMotion:"reduce"});
 await page.addInitScript(()=>localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto","1"));
 const id="00000000-0000-4000-8000-000000000001";const token=`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({sub:id,role:"authenticated",aud:"authenticated",exp:2100000000})).toString("base64url")}.e2e-signature`;
 await context.addCookies([{name:"sb-127-auth-token",value:`base64-${Buffer.from(JSON.stringify({access_token:token,refresh_token:"e2e-refresh-only",expires_at:2100000000,token_type:"bearer",user:{id,email:"conductor@example.test"}})).toString("base64url")}`,domain:"localhost",path:"/"}]);
});
async function theme(page:Page,value:string){await page.addInitScript(t=>{localStorage.setItem("ruum-tema",t);localStorage.setItem("ruum-theme",t);},value);}
/** Texto renderizado sobre fondos sólidos. Excluye imágenes y degradados:
 * estas superficies requieren revisión visual y sus pares semánticos propios. */
async function audit(page:Page){
 const result=await page.evaluate(()=>{
  const ctx=document.createElement("canvas").getContext("2d")!;
  const rgba=(c:string)=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);const d=ctx.getImageData(0,0,1,1).data;return [d[0],d[1],d[2],d[3]/255];};
  const over=(a:number[],b:number[])=>[a[0]*a[3]+b[0]*(1-a[3]),a[1]*a[3]+b[1]*(1-a[3]),a[2]*a[3]+b[2]*(1-a[3]),1];
  const lum=(c:number[])=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const failures:{text:string;ratio:number;fg:string;bg:number[]}[]=[];let measured=0;
  for(const n of document.querySelectorAll<HTMLElement>("main *,[data-conductor-mobile-nav] *,dialog *")){
   if(["OPTION","SCRIPT","STYLE","CANVAS"].includes(n.tagName)||n.closest("svg,[aria-hidden=true],.sr-only,dialog:not([open])"))continue;
   const text=[...n.childNodes].filter(c=>c.nodeType===Node.TEXT_NODE).map(c=>c.textContent).join("").trim();const r=n.getBoundingClientRect();
   if(!/[a-záéíóúñ0-9]/i.test(text)||!n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||!r.width||!r.height||r.bottom<0||r.top>innerHeight)continue;
   const stack:HTMLElement[]=[];let p:HTMLElement|null=n;while(p){stack.unshift(p);p=p.parentElement;}
   let bg=[255,255,255,1],opacity=1,image=false;
   for(const el of stack){const c=getComputedStyle(el);bg=over(rgba(c.backgroundColor),bg);opacity*=Number(c.opacity);if(c.backgroundImage!=="none")image=true;}
   if(image)continue;
   const c=getComputedStyle(n),ink=rgba(c.color);ink[3]*=opacity;
   const l=[lum(over(ink,bg)),lum(bg)].sort((a,b)=>b-a),ratio=(l[0]+.05)/(l[1]+.05),size=parseFloat(c.fontSize),large=size>=24||(size>=18.66&&Number(c.fontWeight)>=700);measured++;
   if(ratio+.01<(large?3:4.5))failures.push({text:text.slice(0,80),ratio:+ratio.toFixed(2),fg:c.color,bg});
  }return {measured,failures};
 });
 expect(result.measured).toBeGreaterThan(3);expect.soft(result.failures).toEqual([]);
 expect(await page.evaluate(()=>({horizontal:document.documentElement.scrollWidth>innerWidth+1,y:scrollY}))).toEqual({horizontal:false,y:0});
}
for(const mode of ["light","dark"]){
 for(const width of [320,390])test(`tema ${mode}: pantallas y contraste ${width}`,async({page},info)=>{
  test.setTimeout(180_000);await theme(page,mode);await page.setViewportSize({width,height:width===320?568:844});
  for(const path of ["/panel","/viajes","/cuenta","/ganancias","/notificaciones","/cuenta/perfil","/cuenta/documentos","/cuenta/datos-bancarios","/cuenta/certificacion","/cuenta/preferencias","/cuenta/soporte","/cuenta/seguridad","/cuenta/legal","/ganancias/historial","/legal/terminos","/legal/privacidad"]){await test.step(path,async()=>{
   await page.goto(path);await expect(page.locator("h1").first()).toBeVisible();await expect(page.locator("html")).toHaveAttribute("data-theme",mode);await audit(page);
   if(path==="/cuenta")for(const name of ["Perfil","Documentos","Certificación","Datos bancarios","Cerrar sesión"]){const control=page.getByRole(name==="Cerrar sesión"?"button":"link",{name,exact:true});await expect.poll(()=>control.evaluate(n=>{const r=n.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=48&&!!e&&n.contains(e);})).toBe(true);}
   if(path==="/ganancias"){const control=page.getByRole("button",{name:"Ver programación de pago"});await expect.poll(()=>control.evaluate(n=>{const r=n.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.bottom-2);return !!e&&n.contains(e);})).toBe(true);}
   if(["/panel","/viajes","/cuenta","/ganancias"].includes(path))await page.screenshot({path:info.outputPath(`${path.slice(1)}-${mode}-${width}.png`)});
  });}
 });
 test(`tema ${mode}: operación, formularios y emergencia`,async({page},info)=>{
  test.setTimeout(120_000);await theme(page,mode);await page.setViewportSize({width:320,height:568});
  for(const i of [1,2,3,4,57]){await page.goto(`/viajes/${trip(i)}`);await expect(page.locator("h1").first()).toBeVisible();await audit(page);}
  await page.goto(`/viajes/${trip(50)}/evidencia`);await expect(page.getByRole("heading",{name:"Frente",exact:true})).toBeVisible();await audit(page);
  const sos=page.getByRole("button",{name:"Abrir emergencia",exact:true});await sos.focus();expect(await sos.evaluate(n=>getComputedStyle(n).outlineStyle)).toBe("solid");await sos.click();await expect(page.getByRole("heading",{name:"¿Qué necesitas?"})).toBeVisible();await audit(page);await page.screenshot({path:info.outputPath(`emergencia-${mode}.png`)});await page.keyboard.press("Escape");
  await page.goto(`/viajes/${trip(54)}?cierre=1`);await expect(page.locator("h1").first()).toBeVisible();await audit(page);await expect(page.locator("[data-trip-primary] button").last()).toBeDisabled();
  await page.goto(`/viajes/${trip(1)}`);await page.route("**/rest/v1/rpc/conductor_avanza_traslado",r=>r.fulfill({status:500,contentType:"application/json",body:JSON.stringify({message:"Servicio temporalmente no disponible"})}));await page.getByRole("button",{name:"Iniciar ruta",exact:true}).click();await expect(page.locator("[data-trip-primary]").getByRole("alert")).toBeVisible();await audit(page);
 });
 test(`tema ${mode}: acceso y campos`,async({page,context},info)=>{
  await context.clearCookies();await theme(page,mode);await page.setViewportSize({width:320,height:568});
  for(const path of ["/login","/recuperar-password","/registro"]){await page.goto(path);await expect(page.locator("h1").first()).toBeVisible();await audit(page);const input=page.locator('input:not([type=hidden]):not([type=checkbox])').first();await input.focus();expect(await input.evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(16);expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(48);
   if(path==="/login")for(const target of [page.getByRole("button",{name:"Entrar",exact:true}),page.getByRole("link",{name:"Crear cuenta de conductor"})])expect(await target.evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})).toBe(true);await page.screenshot({path:info.outputPath(`${path.slice(1)}-${mode}.png`)});}
 });
}

test("preferencia de tema persiste entre rutas y recarga con clave heredada",async({page})=>{
 await page.goto("/cuenta/preferencias");
 await page.evaluate(()=>{localStorage.setItem("ruum-tema","light");localStorage.setItem("ruum-theme","light");});
 await page.reload();await page.getByRole("tab",{name:"Tema",exact:true}).click();
 await page.getByRole("button",{name:"Noche Fondo oscuro"}).click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.goto("/viajes");await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.goto("/cuenta/preferencias");await page.getByRole("tab",{name:"Tema",exact:true}).click();
 await expect(page.getByRole("button",{name:"Noche Fondo oscuro"})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"Día Fondo claro"}).click();await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","light");
});
