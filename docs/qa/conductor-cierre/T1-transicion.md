# T1 · Transición al registro final

`estadoLocal` permite mostrar «Registra la entrega» cuando la RPC de llegada
finaliza correctamente, mientras `router.refresh()` recupera el pasaporte.
Evita mantener disponible la confirmación de llegada ya completada. No cambia
la RPC, la geocerca ni el inicio explícito del registro final.

El servidor conserva autoridad: el efecto sincroniza el estado local cuando
cambia `pasaporte.estado`. La prueba de componente verifica el efecto sin
remontar, incluyendo una corrección de llegada a trayecto en curso. La prueba
de interfaz verifica tanto la transición y el botón ≥56 px como un refresco
que devuelve un registro final ya completado.

Validación: 3 e2e de llegada aprobadas; 1 prueba de sincronización aprobada.
La [nota de seguimiento en PR #34](https://github.com/ruumruummx-code/ruum_ecosistema/pull/34#issuecomment-6729266483)
aclara la razón de `estadoLocal` y que el PR incluye el arreglo urgente de
scroll de app usuario, fuera del alcance de este ticket.
