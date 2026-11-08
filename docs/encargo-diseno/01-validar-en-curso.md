# 01 · Validar la pantalla "En curso"

**Depende de:** nada. **Rama:** `feat/conductor-en-curso-minimal` (aplicar `en-curso-minimal.patch` con `git am`).

## Objetivo
Confirmar que la variante `minimal` de `TripStage`, ya activada en `ConduceADestinoDetails`, funciona y se ve bien. Ya pasó `tsc` y `eslint`; faltan las pruebas e2e y la revisión visual.

## Alcance
- `apps/app-conductor/src/app/viajes/[id]/TripStage.tsx` (prop `minimal`)
- `apps/app-conductor/src/app/viajes/[id]/ConduceADestinoDetails.tsx`
- `apps/app-conductor/src/app/viajes/[id]/trip-stage.module.css` (bloque `.minimal`)
- `apps/app-conductor/tests/interface/stages.spec.ts` (prueba nueva)

## Qué hacer
1. Correr `typecheck`, `lint` y los e2e de `apps/app-conductor`.
2. Levantar la app y abrir un viaje en estado `traslado_en_curso`.
3. **Solo reportar**: qué falla y qué se ve mal. No modificar nada en este paso.

## Criterios de aceptación por pantalla

### Pantalla "Conduce al destino" (estado `traslado_en_curso`)
- [ ] La dirección de entrega es el elemento más grande y destacado; la ciudad aparece como etiqueta secundaria.
- [ ] Ya no hay tarjeta con borde alrededor del punto: solo líneas finas arriba y abajo.
- [ ] Las placas aparecen en IBM Plex Mono.
- [ ] "Navegar" y "Detalles y herramientas" son acciones discretas (sin caja) pero con área táctil ≥ 48 px.
- [ ] El botón "Confirmar llegada a destino" mide ≥ 56 px, usa el degradado de acción y queda siempre visible.
- [ ] El botón SOS y el enlace "Volver a Traslados" siguen en el encabezado y accesibles.
- [ ] En alturas ≤ 600 px (320×568) el título baja a 22 px, no hay recortes y la acción sigue visible.

### Pantalla "Registra la entrega" (estado `llegada_a_destino` / `evidencia_final_en_proceso`)
- [ ] Mismo tratamiento visual; el botón "Continuar registro final" cumple lo mismo que arriba.

### Etapas que NO deben cambiar
- [ ] "Prepara la recogida", "Ve al punto de recogida", oferta y cierre se ven **exactamente igual que antes** (la variante solo aplica a "En curso").

## Prompt para Claude Code
```text
Lee AGENTS.md y docs/encargo-diseno/00-contexto-y-reglas.md y 01-validar-en-curso.md.
Haz solo el paso 01: corre typecheck, lint y los e2e de apps/app-conductor, levanta
la app y revisa la etapa En curso en claro, oscuro, 320 px y modo calle. NO cambies
código. Entrégame una tabla: criterio | cumple (sí/no) | evidencia (captura o salida).
Espera mi confirmación antes de continuar.
```
