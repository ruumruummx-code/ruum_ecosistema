# Catálogos fiscales SAT — RR-2026-020

Fuente oficial: [Anexo 20](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm), archivo `catCFDI_V_4_20261015.xls` enlazado por el SAT el 15 de octubre de 2026. Se importaron íntegramente `c_RegimenFiscal` (19 claves) y `c_UsoCFDI` (24 claves), incluyendo fechas de vigencia, tipo de persona y régimen receptor. El JSON conserva URL, fecha y SHA256 del XLS original.

`GET /api/catalogos/sat` expone ambas listas. Admite `regimen=626`, `persona=fisica|moral` y `q=resico`. Una clave de régimen o tipo de persona desconocida devuelve HTTP 400. La vigencia se evalúa en cada consulta. No requiere sesión: son datos oficiales públicos y no contiene información de usuarios.

Los selectores consultan este endpoint al abrir, muestran clave y descripción, filtran localmente sin acentos y reconocen el alias RESICO. Los errores de red permiten reintentar. El diálogo nativo anidado bloquea el fondo, conserva el formulario y restaura el foco; sólo su lista tiene desplazamiento. Cambiar régimen descarta un uso incompatible. Los valores legados con descripción se normalizan a clave al leerlos, y los nuevos guardados sólo aceptan claves exactas.

El servicio compartido valida antes de llamar a la RPC transaccional existente. La migración `20261017014451_rr2026020_catalogos_fiscales_sat.sql` agrega catálogos de sólo lectura con RLS y triggers de validación en `usuarios` y `empresas`. No cambia las autorizaciones ni la atomicidad de `actualizar_datos_facturacion`. Valida claves, compatibilidad, persona según longitud del RFC y vigencia también en escrituras directas. Las cuentas sin datos fiscales pueden registrarse; no modifica registros legados ni bloquea actualizaciones ajenas a sus campos fiscales.

## Actualizar una publicación

Se sirve una copia versionada para evitar depender del tiempo de respuesta del SAT en cada captura. No es una sincronización automática. Antes de cada actualización fiscal:

1. Descargar el XLS vigente enlazado por la página oficial del Anexo 20.
2. Crear una nueva migración con `supabase migration new actualizar_catalogos_sat`.
3. Con Python y `xlrd` instalado en el entorno de desarrollo, ejecutar:

```powershell
python scripts/importar-catalogos-sat.py RUTA_AL_XLS --fuente URL_OFICIAL --publicado AAAA-MM-DD --sql RUTA_DE_LA_NUEVA_MIGRACION
```

4. Revisar el diff del JSON y del SQL. El importador conserva las filas y sus reglas, rechaza duplicados y referencias desconocidas, y desactiva claves retiradas de la nueva publicación.
5. Actualizar los conteos de las pruebas si el SAT añadió o retiró claves. Ejecutar pruebas compartidas, API, selectores y `test/rr2026020_catalogos_sat.test.sql` en la base local con la migración presente.
6. Aplicar la migración en el entorno de destino y desplegar el código con la misma versión del JSON. El catálogo y su validación de persistencia deben actualizarse juntos.

No requiere nuevas dependencias Node ni cambios en las columnas fiscales existentes.
