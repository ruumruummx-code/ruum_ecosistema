const REGLAS: Array<[RegExp,string]> = [
  // Errores de negocio del envío de solicitud de conductor (RPC). Van antes
  // que la regla genérica de "documento" para no enmascararlos.
  [/faltan los tres documentos obligatorios/i,"Faltan documentos obligatorios. Sube la licencia (frente y reverso) y tu identificación oficial."],
  [/datos obligatorios incompletos|contiene datos incompletos/i,"Tu solicitud tiene datos incompletos. Revisa todos los campos antes de enviarla."],
  [/todav[ií]a no est[aá] lista para env[ií]o/i,"Tu solicitud aún no está lista para envío. Completa todos los pasos anteriores."],
  [/no encontramos una solicitud activa|primero inicia la solicitud/i,"No encontramos una solicitud activa. Vuelve a iniciar el registro."],
  [/ya no admite consentimientos|ya no admite cambios/i,"Tu solicitud ya fue enviada. Puedes continuar con la verificación de identidad."],
  [/versi[oó]n .* no est[aá] vigente/i,"La versión del documento legal no está vigente. Recarga la página e inténtalo de nuevo."],
  [/conductor_duplicado:curp|solicitudes_conductor_curp|conductores_curp|\bcurp\b.*(duplicate|duplicad)/i,"Este CURP ya está asociado a otra solicitud."],
  [/conductor_duplicado:telefono|telefono.*(duplicate|duplicad)/i,"Este teléfono ya está asociado a otra cuenta."],
  [/conductor_duplicado:licencia|licencia.*(duplicate|duplicad)/i,"Este número de licencia ya está asociado a otra solicitud."],
  [/licencia (está )?vencida|vigencia.*(vencid|expired)/i,"Tu licencia está vencida. Actualiza la vigencia para continuar."],
  [/jwt expired|token.*expired|refresh token|auth session missing|invalid jwt|sesión inválida|session.*expir/i,"Tu sesión expiró; vuelve a verificar tu cuenta."],
  [/failed to fetch|network request|networkerror|fetch failed|sin conexi[oó]n/i,"Sin conexión. Conservamos tus cambios y volveremos a intentarlo."],
  [/documento|storage|bucket|archivo/i,"No pudimos registrar uno de tus documentos. Revisa el archivo e intenta nuevamente."],
  [/duplicate key value|unique constraint|violates.*constraint/i,"Ya existe un registro con esos datos. Revisa la información capturada."],
  [/permission denied|row-level security|rls/i,"Tu sesión no permite realizar esta acción. Vuelve a iniciar sesión."],
];

export function traducirErrorOperativo(error:unknown,respaldo="No pudimos guardar los cambios. Intenta nuevamente.") {
  const mensaje=typeof error==="string"?error:error&&typeof error==="object"&&"message" in error&&typeof error.message==="string"?error.message:"";
  return REGLAS.find(([patron])=>patron.test(mensaje))?.[1]??respaldo;
}
