# Cotización individual: autoridad SQL y protección antifraude

Este contrato sustituye el cálculo duplicado de F6 en `tarifa-snapshot.ts`.
El monto oficial usa exclusivamente `calcular_tarifa_traslado`, sus tablas
administrables, `rango_desde_distancia` (15/45/75 km) y la zona
`America/Mexico_City`. No se modifican las tarifas comerciales existentes.

1. `POST /api/viajes` autentica sesión, valida CSRF, aplica límites y valida
   la solicitud. Geocodifica en servidor los domicilios completos, incluidas
   todas las paradas ordenadas, y consulta Directions o una ruta validada en
   caché. Las coordenadas y precios declarados por el navegador no son autoridad.
2. Una conexión aislada con `SUPABASE_SERVICE_ROLE_KEY` llama
   `servidor_cotizar_traslado_individual`. SQL comprueba usuario verificado,
   propiedad del vehículo y clasificación real. Un vehículo desconocido o una
   ruta sin confirmar bloquean la cotización: no se usan categorías baratas ni
   distancias geodésicas como sustituto para cobrar.
3. SQL guarda en `private.cotizaciones_individuales` el payload exacto, importe,
   snapshot 2.1, nonce aleatorio y vencimiento de 15 minutos. La tabla tiene RLS
   y carece de acceso para usuarios, conductores y conexiones Data API normales.
   Solo la RPC de emisión puede crear esa evidencia con privilegios de servidor.
4. El navegador reenvía la solicitud emitida, sin reconstruirla ni recalcularla.
   `usuario_crea_traslado` coteja usuario, vehículo, direcciones, coordenadas,
   paradas y snapshot completos con la evidencia privada. Cambiar cualquier
   campo exige volver a cotizar. La firma antigua sin paradas queda revocada.
5. Un bloqueo de fila y la transacción de creación consumen la cotización una
   sola vez. Reintentar la misma clave idempotente devuelve el traslado ya
   creado; otra clave no permite reutilizar la cotización. Un fallo de creación
   revierte también su consumo. Stripe continúa usando el precio persistido.

La autoridad del snapshot 2.1 es la evidencia privada, no una firma HMAC
recibida del cliente. Un nonce inventado, una firma falsa o un monto alterado
no autorizan crear un traslado. Las utilidades HMAC 2.0 conservadas por
compatibilidad no intervienen en este flujo.

## Despliegue

Aplicar la migración `20261105131911_cotizacion_individual_autoridad_sql.sql`
y desplegar la API y el formulario juntos en una ventana controlada. El
servidor necesita `SUPABASE_SERVICE_ROLE_KEY` y un token de Mapbox válido;
ninguno debe exponerse con prefijo `NEXT_PUBLIC_` salvo el token público de
Mapbox ya existente. Este cambio no modifica importes de traslados anteriores.

Un formulario o bundle móvil antiguo que reconstruya el payload después de
cotizar debe actualizarse. Los snapshots 2.0 sin evidencia privada no se
aceptan para solicitudes nuevas. Si falta la migración o los servicios de
cotización/mapas, la creación se bloquea; no se vuelve al cálculo anterior.

## Regresiones

- Pruebas de aplicación: ruta con paradas, errores de mapas, geocodificación
  del servidor, payload autorizado, propagación del monto SQL y límites.
- `test/rt71_cotizacion_individual_autoridad_sql.test.sql`: 27 comprobaciones
  de fórmula, configuración vigente, propiedad, permisos, manipulación,
  caducidad, idempotencia y rechazo de reutilización.
- Fixtures B1, B2, RT49 y RT62 actualizadas para emitir cotizaciones mediante
  un helper exclusivamente temporal de pruebas. El helper no es una migración.

Ejemplo determinista: camión, gama entrada, seminuevo, 100 km, tres horas,
diurno entre semana, con las tarifas originales: **$8,864.50**, frente a
$4,864.50 del cálculo JavaScript eliminado.
