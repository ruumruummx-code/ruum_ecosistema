# Nivel CONCER por calificaciones de usuarios

Decisión de producto del 29 de octubre de 2026: todo conductor ingresa con
calificación 5.0 y nivel operativo máximo, Concer 4 (`coleccion`).
La experiencia y las certificaciones históricas dejan de limitar este nivel.
Las certificaciones se conservan como registros; no se generan certificados ficticios.

Se conservan los rangos existentes:

| Promedio | Nivel |
| --- | --- |
| 4.90–5.00 | Concer 4 (`coleccion`) |
| 4.80–4.89 | Concer 3 (`luxury`) |
| 4.50–4.79 | Concer 2 (`ejecutivo`) |
| 4.00–4.49 | Concer 1 (`basico`) |
| Menor de 4.00 | Sin elegibilidad ordinaria |

El promedio usa hasta las 100 valoraciones más recientes de los últimos seis
meses. Sin valoraciones en esa ventana vale 5.0; la primera valoración real
sustituye ese valor, sin agregar una valoración artificial de cinco estrellas.
Los conductores existentes se recalculan con sus valoraciones reales.

La columna generada `nivel_operativo_vigente` depende del promedio, tanto en
asignación automática como en contingencia administrativa. Los campos legacy
por experiencia se conservan por compatibilidad, sin limitar el resultado.
`nivel_por_calificacion` se sincroniza mediante trigger.

Las condiciones de operación siguen aplicando: aprobación del expediente,
documentos vigentes, estado, suspensiones, incidencias, preferencias y ausencia
de otro traslado activo. No se cambian la certificación de pago, las tarifas,
el historial ni los estados de los traslados.

Validación: pruebas unitarias del paquete shared, TypeScript, comprobación de
migraciones y regresión SQL `test/rt69_concer_nivel_por_calificacion.test.sql`.
