import type { Usuario } from "@ruum/shared/types";
import type { DatosFormulario } from "../app/viajes/nuevo/types";

/**
 * Inversión de capas (auditoría): `src/state/app-state.ts` importaba VALORES
 * de `../app/viajes/nuevo/constants` — el estado global dependía de los
 * internos de una ruta concreta (los imports de tipo se borran en compilación,
 * pero los valores no). La definición vive aquí, en la capa de estado;
 * `nuevo/constants` los re-exporta para no romper importadores existentes.
 */
export const VALORES_INICIALES: DatosFormulario = {
  tipo: "sedan",
  transmision: "automatica",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  placas: "",
  vin: "",
  condicion: "",
  estadoGeneral: "",
  tieneTarjeta: false,
  tieneVerificacion: false,
  tienePlacas: false,
  puedeCircular: false,
  origenCodigoPostal: "",
  origenEstado: "",
  origenCiudad: "",
  origenColonia: "",
  origenCalle: "",
  origenNumero: "",
  origenReferencias: "",
  destinoCodigoPostal: "",
  destinoEstado: "",
  destinoCiudad: "",
  destinoColonia: "",
  destinoCalle: "",
  destinoNumero: "",
  destinoReferencias: "",
  entregaNombre: "",
  entregaApellido: "",
  entregaTelefono: "",
  recepcionNombre: "",
  recepcionApellido: "",
  recepcionTelefono: "",
  instruccionesEspeciales: "",
  modalidadProgramacion: "lo_antes_posible",
  fechaHoraProgramada: "",
  tipoRuta: "local",
  ventanaRecoleccion: "",
  ventanaEntrega: "",
  tipoServicio: "personal",
  motivoServicio: "entrega_cliente",
  paradas: []
};

// Usuario sin historial (PRD §4.6): valor temporal mientras se confirma
// la sesión real. Nunca se usa para insertar registros.
export const USUARIO_PENDIENTE: Usuario = {
  id: "",
  tipo_cuenta: "personal",
  rol: "personal",
  estado_verificacion: "pendiente",
  traslados_completados_sin_incidencia: 0,
  metodo_pago_registrado: false,
  creado_en: new Date().toISOString()
};
