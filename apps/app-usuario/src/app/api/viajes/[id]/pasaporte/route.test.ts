import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user:vi.fn(), perfil:vi.fn(), datos:vi.fn(), pdf:vi.fn(), inspecciones:vi.fn(), historial:vi.fn(), custodia:vi.fn() }));
vi.mock("@/lib/supabase-server",()=>({crearClienteServidor:async()=>({auth:{getUser:m.user}})}));
vi.mock("@ruum/api/identity",()=>({obtenerUsuarioIdPorAuth:m.perfil}));
vi.mock("@ruum/api/drivers",()=>({listarInspeccionesTraslado:m.inspecciones}));
vi.mock("@ruum/api/services",()=>({listarHistorialTraslado:m.historial}));
vi.mock("@ruum/api/custody",()=>({listarEventosCustodia:m.custodia}));
vi.mock("@/app/viajes/[id]/obtenerDatosTraslado",()=>({obtenerDatos:m.datos}));
vi.mock("@/lib/pasaporte-pdf",()=>({generarPasaportePdf:m.pdf}));
import { GET } from "./route";
const id = "12345678-1234-4234-8234-123456789abc";
const llamar = () => GET(new Request("http://localhost"),{params:Promise.resolve({id})});
beforeEach(()=>{
  vi.resetAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://project.supabase.co");
  m.user.mockResolvedValue({data:{user:{id:"auth"}}}); m.perfil.mockResolvedValue("titular");
  m.datos.mockResolvedValue({pasaporte:{usuario_id:"titular"}});
  m.inspecciones.mockResolvedValue([]); m.historial.mockResolvedValue([]); m.custodia.mockResolvedValue([]);
  m.pdf.mockResolvedValue(new Uint8Array([37,80,68,70]));
});
it("exige sesión antes de consultar el expediente",async()=>{
 m.user.mockResolvedValue({data:{user:null}});
 expect((await llamar()).status).toBe(401); expect(m.datos).not.toHaveBeenCalled();
});
it("rechaza el expediente ajeno incluso si RLS devolviera una fila",async()=>{
 m.datos.mockResolvedValue({pasaporte:{usuario_id:"otra-persona"}});
 expect((await llamar()).status).toBe(404); expect(m.pdf).not.toHaveBeenCalled(); expect(m.inspecciones).not.toHaveBeenCalled();
});
it("descarga el PDF completo como adjunto privado",async()=>{
 const res=await llamar(); expect(res.status).toBe(200);
 expect(res.headers.get("Content-Type")).toBe("application/pdf"); expect(res.headers.get("Cache-Control")).toContain("no-store");
 expect(res.headers.get("Content-Disposition")).toContain(`pasaporte-${id}.pdf`);
 expect(m.pdf).toHaveBeenCalledWith(expect.anything(),{inspecciones:[],historial:[],custodia:[]},expect.any(Function));
});
it("no genera un pasaporte parcial si falla una lectura del expediente",async()=>{
 m.inspecciones.mockRejectedValue(new Error("Lectura no disponible"));
 expect((await llamar()).status).toBe(503); expect(m.pdf).not.toHaveBeenCalled();
});
it("impide descargar evidencias desde un servidor externo",async()=>{
 const fetchMock=vi.fn(); vi.stubGlobal("fetch",fetchMock);
 m.pdf.mockImplementation(async(_datos,_anexos,cargar)=>cargar("https://externo.example/evidencia.png"));
 expect((await llamar()).status).toBe(503); expect(fetchMock).not.toHaveBeenCalled();
 vi.unstubAllGlobals();
});

it("entrega expedientes grandes por bloques sin truncar el adjunto",async()=>{
 const bytes=new Uint8Array(5*1024*1024); bytes[0]=37; bytes[bytes.length-1]=70;
 m.pdf.mockResolvedValue(bytes);
 const res=await llamar(); const reader=res.body!.getReader();
 let total=0; let bloques=0; let ultimo=0;
 while(true) { const {done,value}=await reader.read(); if(done) break; expect(value.byteLength).toBeLessThanOrEqual(64*1024); total+=value.byteLength; bloques++; ultimo=value[value.length-1]; }
 expect(total).toBe(bytes.length); expect(bloques).toBeGreaterThan(1); expect(ultimo).toBe(70);
});
