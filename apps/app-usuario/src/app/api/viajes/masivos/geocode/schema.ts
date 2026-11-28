import { z } from "zod";

export const MAX_PARES_GEOCODE = 100;
export const MAX_BYTES_GEOCODE = 50 * 1024; // 50 KB

export const esquemaTamanioRequest = z.string().max(MAX_BYTES_GEOCODE, "Payload demasiado grande.");

const esquemaParGeocode = z.object({
  origenCP: z.string().regex(/^\d{5}$/, "El Código Postal de origen debe tener 5 dígitos numéricos."),
  destinoCP: z.string().regex(/^\d{5}$/, "El Código Postal de destino debe tener 5 dígitos numéricos."),
  indice: z.number().int("El índice debe ser un número entero.").min(0, "El índice no puede ser negativo."),
});

export const esquemaGeocodeMasivo = z.object({
  pares: z.array(esquemaParGeocode)
    .min(1, "Debe enviar al menos un par de códigos postales.")
    .max(MAX_PARES_GEOCODE, `Máximo ${MAX_PARES_GEOCODE} pares por solicitud.`),
});

<<<<<<< HEAD
const esquemaGeocode = esquemaGeocodeMasivo;
=======
>>>>>>> 99920eaeaf3251d9baeea164ac31f794d1715d77
