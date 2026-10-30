import { datosVerificacion, modoStripe, type IntentoStripe } from "./_shared/stripe-verificacion.ts";
function assert(value: unknown, message="assertion_failed"): void { if (!value) throw new Error(message); }
type Handler=(req:Request)=>Promise<Response>;
let captured: Handler;
const originalServe=Deno.serve;
(Deno as unknown as {serve:(handler:Handler)=>void}).serve=(handler)=>{captured=handler;};
Deno.env.set("SUPABASE_URL","https://unit.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","unit-service-key");
Deno.env.set("STRIPE_SECRET_KEY","sk_test_unit");
Deno.env.set("STRIPE_WEBHOOK_SECRET","whsec_unit");
// Supabase captures fetch when constructed; keep one dispatcher for both handlers.
let activeFetch: typeof fetch;
globalThis.fetch=(...args)=>activeFetch(...args);
await import("./stripe-webhook/index.ts");
const webhook=captured!;
await import("./reconciliar-pagos-stripe/index.ts");
const worker=captured!;
Deno.serve=originalServe;
const originalFetch=globalThis.fetch;
const intent:IntentoStripe={ id:"pi_unit",status:"succeeded",amount:238167,amount_received:238167,currency:"mxn",livemode:false,metadata:{traslado_id:"10000000-0000-4000-8000-000000000001"} };
let snapshot:IntentoStripe, calls:string[], claimed:boolean, results:Record<string,unknown>[];
function reset() {
  snapshot=structuredClone(intent); calls=[]; claimed=false; results=[];
  activeFetch=async(input,init)=>{
    const url=String(input instanceof Request?input.url:input);calls.push(url);
    if(url.startsWith("https://api.stripe.com/")) return Response.json(snapshot);
    if(url.includes("/rpc/tomar_ejecucion_conciliacion")) {const body=JSON.parse(String(init?.body));const ok=body.p_nonce==="a".repeat(64)&&!claimed;claimed=claimed||ok;return Response.json(ok);}
    if(url.includes("/rpc/aplicar_verificacion_pago_stripe")) { results.push(JSON.parse(String(init?.body)));return Response.json({ok:true}); }
    if(url.includes("/rpc/confirmar_checkout_masivo")) return Response.json({ok:true});
    if(url.includes("/rest/v1/pagos")) return Response.json([{stripe_payment_intent_id:"pi_unit"}]);
    if(url.includes("/rest/v1/stripe_conciliacion_ejecuciones")) return Response.json([]);
    throw new Error("unexpected_network_request");
  };
}
async function signedRequest(livemode=false,type="payment_intent.succeeded") {
  const payload=JSON.stringify({id:"evt_unit",object:"event",type,livemode,data:{object:{id:"pi_unit"}}});
  const timestamp=Math.floor(Date.now()/1000);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode("whsec_unit"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${timestamp}.${payload}`)))).map((n)=>n.toString(16).padStart(2,"0")).join("");
  return new Request("https://unit/webhook",{method:"POST",body:payload,headers:{"stripe-signature":`t=${timestamp},v1=${signature}`}});
}
Deno.test("real webhook validates signature and retrieves current provider state before atomic RPC",async()=>{
  reset();try {
    const res=await webhook(await signedRequest());assert(res.status===200);
    assert(calls.some((url)=>url.startsWith("https://api.stripe.com/")));
    assert((results[0].p_datos as Record<string,unknown>).monto_centavos===238167);
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test("forged webhook does not reach provider or database",async()=>{
  reset();try { const res=await webhook(new Request("https://unit/webhook",{method:"POST",body:"{}",headers:{"stripe-signature":"bad"}}));assert(res.status===400);assert(calls.length===0); }
  finally {globalThis.fetch=originalFetch;}
});
Deno.test("out-of-order failure event uses current succeeded state",async()=>{
  reset();try {const res=await webhook(await signedRequest(false,"payment_intent.payment_failed"));assert(res.status===200);assert((results[0].p_datos as Record<string,unknown>).estado_proveedor==="succeeded");}
  finally {globalThis.fetch=originalFetch;}
});
Deno.test("environment mismatch fails without applying a confirmation",async()=>{
  reset();try {const res=await webhook(await signedRequest(true));assert(res.status===500);assert(results.length===0);}
  finally {globalThis.fetch=originalFetch;}
});
Deno.test("worker requires valid one-time nonce and rejects its replay",async()=>{
  reset();try {
    const req=(nonce:string)=>new Request("https://unit/worker",{method:"POST",body:JSON.stringify({ejecucion_id:"10000000-0000-4000-8000-000000000002",nonce})});
    assert((await worker(req("b".repeat(64)))).status===401);assert(results.length===0);
    assert((await worker(req("a".repeat(64)))).status===200);assert(results.length===1);
    assert((await worker(req("a".repeat(64)))).status===401);assert(results.length===1);
  } finally {globalThis.fetch=originalFetch;}
});
Deno.test("pending provider status remains pending input; amount and mode validation fail closed",()=>{
  const pending=datosVerificacion({...intent,status:"processing",amount_received:0},false,"conciliacion");assert(pending.estado_proveedor==="processing");
  assert(modoStripe("rk_test_unit")===false);assert(modoStripe("rk_live_unit")===true);
  for(const value of [{...intent,livemode:true},{...intent,currency:"usd"},{...intent,amount:NaN}]) {
    let failed=false;try{datosVerificacion(value,false,"conciliacion");}catch{failed=true;}assert(failed);
  }
});
