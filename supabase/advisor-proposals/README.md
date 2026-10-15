# Correcciones pendientes de aprobación

Proyecto: ruum_ecosistema (asmzetwwwugaoowiukdv).

Se aplicó únicamente la migración de 79 índices de claves foráneas. Todos están
válidos y Advisor ya no devuelve unindexed_foreign_keys.

La revisión automática rechazó cambios persistentes de seguridad en producción.
Los archivos de esta carpeta son propuestas, no migraciones aplicadas.

## seguridad-y-permisos.sql

- Fija search_path en las 25 funciones señaladas por Advisor.
- Cambia is_superadmin a invoker: sólo lee claims y no necesita privilegios del dueño.
- Cambia obtener_paradas_traslado a invoker para respetar RLS al consultarlo directamente.
- Restringe dos tareas cron a postgres/service_role, conservando los cron existentes.
- Revoca acceso anónimo a actualizar_datos_facturacion y conserva authenticated/service_role.
- Declara políticas sólo para service_role en cuatro tablas internas ya restringidas.
- Mueve unaccent y btree_gist a extensions; califica antes el uso de unaccent en catálogo.

Validar después los flujos de facturación, consulta de paradas, catálogo de vehículos,
permisos de administrador y ejecución de las dos tareas cron.

## rls-optimizacion.sql

Envuelve auth.uid()/auth.role()/auth.jwt() en subconsultas para evaluación una vez por
sentencia en 90 políticas. Conserva nombres, roles, operaciones y condiciones de acceso.
Validar que una cuenta conserva sus registros y no ve registros de otra.

## Trabajo que requiere una fase adicional

Los avisos de múltiples políticas permisivas requieren consolidación por tabla y operación,
manteniendo la unión lógica de los permisos actuales. No se propone borrarlas en masa.
Las funciones SECURITY DEFINER necesitan clasificación por uso: RLS, API administrativa,
API de usuario/conductor o servicio interno; no cambiar todas a invoker ni revocar
authenticated en bloque.

La protección contra contraseñas filtradas se configura en Auth y depende del plan de
Supabase. No cambiar el plan ni activar costes sin autorización.

Los avisos unused_index son informativos; incluyen índices de restricciones y los 79
recién creados. Se conservan hasta disponer de estadísticas representativas.

Resultado completo: ../audits/advisor-20261014.json.
