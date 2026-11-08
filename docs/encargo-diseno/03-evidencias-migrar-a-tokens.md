# 03 · Evidencias: migrar de hexadecimales a tokens

**Depende de:** paso 02 resuelto. **Rama:** `feat/diseno-03-evidencias-tokens`.

## Objetivo
Reemplazar los colores fijos de la pantalla de evidencias por tokens, **sin cambiar el diseño visible**. Es una migración mecánica y revisable.

## Alcance
`apps/app-conductor/src/app/viajes/[id]/evidencia/`: `page.tsx` (785 líneas) y sus secciones (`EvidenciaFotosSection`, `EvidenciaKmCombustibleSection`, `EvidenciaLlavesSection`, `EvidenciaDocumentosSection`, `EvidenciaNotasSection`, `EvidenciaProgress`, `EvidenciaFooter`, `EvidenciaHeader`, `EvidenciaCsatSheet`, etc.).

## Tabla de equivalencias sugerida (confirmar contraste en cada caso)
| Hex fijo | Token sugerido |
|---|---|
| `#0066FF` | `--conductor-action` |
| `#0A1E3C` | `--conductor-primary` |
| `#5A6B87` | `--conductor-muted` |
| `#F4F8FD`, `#F8FAFD`, `#F7FAFD` | `--ruum-surface-subtle` |
| `#DCE5F2`, `#DCE7F5`, `#E2EAF4` | `--conductor-border` |
| `#0057D9` | `--conductor-action` |
| `#DC2626` | `--conductor-error` |
| `#25D366` | **Dejar** (verde de WhatsApp, de terceros) |
Los azules claros de fondo (`#EAF2FD`, `#DEECFD`, `#CCE0F8`, `#B8D3F2`…) mapear al token de superficie/borde de acción más cercano; si no hay equivalente, **listarlo como pendiente** en lugar de inventar uno.

## Qué hacer
1. Inventario: lista de cada hex con archivo y línea.
2. Reemplazar por `var(--token)` (o la clase Tailwind equivalente si el proyecto la tiene).
3. Un commit por archivo.
4. Reportar cada reemplazo dudoso.

## Criterios de aceptación por pantalla
Para cada pestaña, comparar **captura antes/después** en claro y oscuro (la diferencia debe ser imperceptible, salvo el modo oscuro, que antes no estaba soportado y ahora sí):

### Pestaña FOTOS
- [ ] Mosaico de 5 casillas (1. Frontal, 2. Trasera, 3. Lateral izq., 4. Lateral der., 5. Tablero / Interior) sin cambio de tamaño ni orden.
- [ ] Estados "capturada" y "por capturar" distinguibles y con el mismo `aria-label` de antes.
### Pestaña LLAVES
- [ ] Selector de cantidad de llaves sin cambios de comportamiento.
### Pestaña FORMULARIO
- [ ] Kilometraje, combustible, documentos y notas sin cambios de comportamiento.
- [ ] Mensajes de error con el color de error del token.
### Encabezado, progreso y pie
- [ ] Barra de progreso (`role="progressbar"`, `aria-valuenow`) igual de visible.
- [ ] "Checklist de Origen" / "Checklist de Destino", botón de Soporte y de emergencia intactos.
### Hojas (CSAT y Soporte)
- [ ] Se ven bien en claro y oscuro.

## Criterio global
- [ ] `grep -E "#[0-9A-Fa-f]{6}" apps/app-conductor/src/app/viajes/[id]/evidencia -r` devuelve **solo** `#25D366` y los pendientes documentados.
- [ ] Verificación común del documento 00 en verde.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 03. Primero entrégame el inventario de hexadecimales de
apps/app-conductor/src/app/viajes/[id]/evidencia/ (archivo, línea, hex, token propuesto)
y espera mi OK. Después migra, un commit por archivo, sin cambiar diseño, lógica, textos,
roles ni aria-label. Al final corre typecheck, lint, a11y y e2e y entrégame la tabla de
criterios con evidencia y la lista de reemplazos dudosos.
```
