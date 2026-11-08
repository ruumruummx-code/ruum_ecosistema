# 07 · Panel admin (escritorio)

**Depende de:** paso 02. **Rama:** `feat/diseno-07-panel`.

## Objetivo
Aplicar el estilo minimalista al panel, **solo escritorio**: densidad de información con aire, tablas limpias y estados claros.

## Alcance (rutas verificadas en `apps/panel-admin/src/app/`)
Prioridad: `operaciones`, `viajes`, `torre`, `asignaciones`, `conductores`, `incidencias`, `alertas-sla`. Después: `documentos`, `aprobaciones`, `vehiculos`, `empresas`, `reportes`, `mapa`, `usuarios`, `auditoria`, `configuracion`.

## Reglas específicas
- Ancho de diseño: **1280 a 1920 px**; sin versión móvil.
- Estados con chips semánticos del sistema (neutral, acción, advertencia, éxito, error) **siempre con texto**.
- Datos técnicos (folio, placas, VIN) en IBM Plex Mono.
- No cambiar permisos, filtros, consultas ni exportaciones.

## Criterios de aceptación por pantalla

### Operaciones (`operaciones`)
- [ ] Tabla con columnas folio, vehículo, ruta, etapa y conductor; filas con altura cómoda y líneas finas.
- [ ] Viaje con incidencia resaltado con tokens de error, y la causa visible en texto.
- [ ] Viaje sin conductor con chip de advertencia y acción "Asignar" a mano.
### Viajes (`viajes`) y Asignaciones (`asignaciones`)
- [ ] Filtros arriba en una sola línea; sin cajas anidadas.
- [ ] Acción principal única por vista.
### Torre de control (`torre`) y Alertas SLA (`alertas-sla`)
- [ ] Indicadores como cifra grande + etiqueta corta; umbrales con color **y** texto/icono.
### Conductores, Documentos y Aprobaciones
- [ ] Estados de verificación con chips; acciones de aprobar/rechazar claras y separadas.
### Navegación
- [ ] Barra lateral fija (colapsable) con el ítem activo marcado por contraste **y** peso de fuente.
### Teclado y lectores de pantalla
- [ ] Tablas navegables con teclado; encabezados `<th scope>`; foco visible.

## Criterios globales
- [ ] Verificación común del documento 00 (1280×720 y 1440×900, claro y oscuro).
- [ ] Pruebas del panel (incluidas RLS y roles si aplican) en verde: `pnpm test:e2e` y `pnpm test:sql:rls`.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 07. Empieza solo por apps/panel-admin/src/app/operaciones.
Aplica el estilo minimalista (solo presentación; no toques consultas, filtros ni permisos)
y valida los criterios a 1280 y 1440 px, claro y oscuro. Haz un commit por pantalla y
espera mi aprobación antes de pasar a viajes.
```
