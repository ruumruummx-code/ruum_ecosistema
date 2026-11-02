# Alta de vehículos desde el perfil

Los accesos de registro de `/cuenta/vehiculos`, en móvil y escritorio, llevan a
`/cuenta/vehiculos/nuevo`. El formulario permite guardar alias, marca, modelo,
año, tipo, color, placas o VIN, transmisión y declaraciones de documentación y
circulación. Las sugerencias de marca/modelo reutilizan el catálogo existente.

La operación `usuario_registra_vehiculo` asigna el propietario desde Auth,
requiere una cuenta activa, valida los datos en servidor y registra auditoría.
No crea traslados, cotizaciones ni pagos. El INSERT directo continúa cerrado.
No recibe propietario ni empresa desde el cliente; conserva el modelo de flota
por cuenta de usuario existente. No añade permisos para gestionar flotas ajenas.

La clave de solicitud se reutiliza en reintentos del mismo contenido. El servidor
no sobrescribe un vehículo existente y detecta placas/VIN duplicados en la misma
cuenta. Los datos del formulario se conservan ante fallos; al confirmar se abre el
expediente guardado. Las declaraciones permanecen en falso hasta que el usuario
las indique, y no equivalen a una verificación administrativa.

La consulta de vehículos y el flujo existente de corrección permanecen separados
de esta alta. No se incorpora eliminación de vehículos ni cambios de propietario.

## Despliegue

Aplicar `20261102021706_usuario_registra_vehiculo.sql` antes de desplegar
app-usuario. No requiere nuevas dependencias ni variables de entorno. La
migración se aplica primero en la base local para las pruebas; la aplicación a
producción se informa por separado.

Validación: formulario, enlaces móvil/escritorio, contrato del servicio, esquema
compartido y `test/vehiculo_perfil.test.sql` con cuentas sintéticas y rollback.
