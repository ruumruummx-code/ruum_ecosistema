# Gobernanza de claims públicos de la app usuario

Contrato RUUM-USR-F1-001, condición bloqueante CB-3.

La landing sólo puede publicar afirmaciones de cobertura, certificación,
seguimiento o disponibilidad que tengan una fuente operativa verificable. La
fuente actual es `apps/app-usuario/src/lib/public-claims.ts`.

## Responsable

El responsable de publicación es **Producto y Operaciones Ruum Ruum**. Producto
propone el texto; Operaciones confirma que la capacidad existe; Seguridad revisa
que no se convierta en una promesa técnica o regulatoria no demostrable.

## Versionado

Cada cambio requiere actualizar `PUBLIC_CLAIMS_VERSION`, `reviewedAt`, la fuente
y esta evidencia. El formato es `YYYY-MM-DD.N`. No se acepta cambiar texto en
`page.tsx` sin actualizar el contrato central.

## Evidencia mínima

- Cobertura: catálogo de zonas y fecha de vigencia.
- Certificación: catálogo CONCER y criterio de aprobación.
- Seguimiento y evidencia: capacidades habilitadas en el flujo operativo.

El despliegue debe incluir la versión de claims en el changelog de producto y
una revisión de regresión de contenido. Si una capacidad se suspende, se debe
retirar o marcar el claim antes de reactivar tráfico.
