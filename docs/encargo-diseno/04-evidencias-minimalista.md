# 04 · Evidencias: estilo minimalista

**Depende de:** paso 03 aprobado. **Rama:** `feat/diseno-04-evidencias-minimal`.

## Objetivo
Llevar "Registro del vehículo" (checklist de evidencias) al estilo minimalista: poco texto, mucho aire, una sola acción principal. Solo presentación.

## Alcance
`apps/app-conductor/src/app/viajes/[id]/evidencia/` (mismos archivos del paso 03). Reutilizar `--conductor-*`, `--ruum-gradient-action` y `--font-mono`.

## Datos reales que NO se deben alterar
- Las 5 fotos obligatorias: `frente`, `trasera`, `lado_piloto`, `lado_copiloto`, `tablero`.
- Pestañas FOTOS (x/5), LLAVES, FORMULARIO; cálculo de progreso y lógica de `finalizar()`.
- Pantalla sin scroll de página (`h-screen`, contenido compacto).

## Qué hacer (solo presentación)
1. **Progreso:** barra fina (4 px) con el degradado de ruta; el texto "Progreso: x/y requisitos (z%)" se mantiene, más discreto.
2. **Casillas de foto:** borde punteado en reposo; al capturarse, borde sólido de acción, fondo suave de acción e icono de verificación (no depender solo del color).
3. **Tarjeta contenedora:** quitar caja y sombra; separar con líneas finas.
4. **Acción principal:** un solo botón de 56 px con degradado, siempre visible; acciones secundarias como texto discreto.
5. **Encabezado:** más ligero; conservar Volver, Soporte y emergencia.

## Criterios de aceptación por pantalla

### FOTOS
- [ ] Cinco casillas visibles sin scroll en 390×844 y alcanzables en 320×568 (scroll solo del cuerpo).
- [ ] Casilla por capturar: borde punteado + icono de cámara + etiqueta ("1. Frontal"…).
- [ ] Casilla capturada: borde sólido + icono de verificación; **no** se distingue solo por color.
- [ ] Casilla subiendo (`enviando`): estado de carga visible y deshabilitada.
- [ ] `aria-label` idénticos: "…: Toca para capturar fotografía." / "…: Foto capturada. Toca para volver a capturar."
- [ ] Contador de pestaña "FOTOS (x/5)" correcto.
### LLAVES
- [ ] Un solo control protagonista (cantidad), tamaño táctil ≥ 48 px.
### FORMULARIO
- [ ] Campos con estilo de subrayado, etiqueta arriba, placas/VIN en IBM Plex Mono.
- [ ] Error visible con texto (no solo color).
- [ ] Combustible, kilometraje, documentos y notas funcionan como antes.
### Pie / acción principal
- [ ] Botón principal de 56 px, deshabilitado hasta cumplir requisitos, con razón visible o accesible.
- [ ] "Siguiente" avanza FOTOS → LLAVES → FORMULARIO; "Finalizar" solo al completar todo.
### Estados especiales
- [ ] Cargando, error y "sin pasaporte" (reintentar / volver) con el mismo estilo minimalista.
- [ ] Sin conexión: indicador de sincronización pendiente visible (`EvidenceSyncStatus`).
### Modo de evidencia final
- [ ] Título "Checklist de Destino" y flujo final sin diferencias de comportamiento.

## Criterios globales
- [ ] No cambia ninguna llamada a servicios ni el orden de pasos.
- [ ] Verificación común del documento 00 en verde, más una captura por pestaña en claro y oscuro adjunta al PR.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 04. Aplica el estilo minimalista a la pantalla de evidencias
(solo presentación; no toques lógica, textos, roles ni aria-label). Trabaja por pestaña
(FOTOS, LLAVES, FORMULARIO, pie), un commit por pestaña. Antes de cada commit levanta la
app y verifica los criterios en 320 px y 390 px, claro y oscuro. Entrégame la tabla de
criterios con evidencia y capturas.
```
