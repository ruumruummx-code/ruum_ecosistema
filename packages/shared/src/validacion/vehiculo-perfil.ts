import { z } from "zod";
export const esquemaVehiculoPerfil = z.object({
  alias: z.string().trim().max(60).default(""),
  marca: z.string().trim().min(2, "Indica la marca.").max(80),
  modelo: z.string().trim().min(2, "Indica el modelo.").max(80),
  anio: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  tipo: z.enum(["sedan", "suv", "pick_up", "van", "luxury", "coleccion"]),
  color: z.string().trim().min(2, "Indica el color.").max(40),
  placas: z.string().trim().toUpperCase().max(20).transform(v => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^$|^[A-Z0-9]{5,10}$/, "Revisa las placas (5 a 10 letras o números).")),
  vin: z.string().trim().toUpperCase().regex(/^$|^[A-HJ-NPR-Z0-9]{17}$/, "El VIN debe tener 17 caracteres, sin I, O ni Q."),
  transmision: z.enum(["manual", "automatica", "electrica"]),
  tiene_tarjeta_circulacion: z.boolean().default(false),
  tiene_verificacion: z.boolean().default(false),
  puede_circular_rodando: z.boolean().default(false),
}).strict().refine(d => Boolean(d.placas || d.vin), { message: "Indica las placas o el VIN para identificar el vehículo.", path: ["placas"] });
export type VehiculoPerfil = z.output<typeof esquemaVehiculoPerfil>;
