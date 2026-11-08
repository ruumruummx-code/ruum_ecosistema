# 06 · App usuario

**Depende de:** pasos 02 y 05 (reutiliza el lenguaje). **Rama:** `feat/diseno-06-app-usuario`.

## Objetivo
Llevar la app usuario al mismo estilo minimalista, con foco en solicitar, seguir y recibir un traslado.

## Alcance (rutas verificadas en `apps/app-usuario/src/app/`)
`inicio`, `mis-viajes`, `pasaporte`, `login`, `registro`, `onboarding`, `soporte`. **Primer paso del agente:** confirmar cuál ruta es el seguimiento y cuál la solicitud, y mostrarte el mapa de pantallas antes de editar.
Componentes de `@ruum/ui` a reutilizar: `EstadoStepper`, `EstadoBadge`, `StatusChip`, `Field`, `PassportCard`, `NextOperationalAction`.

## Qué hacer
1. Mapa de pantallas y estados (solo lectura).
2. Seguimiento: etapa actual como protagonista y las 7 etapas en una barra fina.
3. Solicitud: campos de subrayado, una sola acción ("Cotizar" / "Confirmar").
4. Entrega: resultado y acceso al pasaporte digital.
5. Auth y onboarding: mismo lenguaje, sin cambiar flujos.

## Criterios de aceptación por pantalla

### Inicio / lista de viajes (`inicio`, `mis-viajes`)
- [ ] Cada viaje muestra ruta, etapa (con su etiqueta del glosario) y placas en mono; sin tarjetas con exceso de borde.
- [ ] Un solo botón principal para pedir un traslado.
### Seguimiento (probablemente `pasaporte`; confirmar)
- [ ] La etapa actual se lee de `ETAPAS_TRASLADO` (no inventar etiquetas).
- [ ] Barra de 7 segmentos con las etapas completadas rellenas; accesible (`aria-label` "Etapa N de 7").
- [ ] **No** se muestra ETA ni distancia restante si el modelo no las trae.
- [ ] Acceso al chat solo cuando `chatDisponible(estado)` es verdadero.
### Solicitud de traslado
- [ ] Origen, destino y vehículo con etiqueta arriba y validación con texto.
- [ ] Importes solo desde datos oficiales; sin cifras de ejemplo.
### Entrega / pasaporte digital
- [ ] Mensaje de resultado breve, "Ver pasaporte" como acción principal.
### Login, registro y onboarding
- [ ] Mismo estilo; ningún cambio en validaciones, textos legales ni redirecciones.

## Criterios globales
- [ ] Verificación común del documento 00 (viewports móviles).
- [ ] Pruebas existentes de `apps/app-usuario` en verde.

## Prompt para Claude Code
```text
Lee docs/encargo-diseno/00 y 06. Primero entrégame el mapa de pantallas de
apps/app-usuario (ruta, propósito, componentes de @ruum/ui que usa) y espera mi OK.
Luego aplica el estilo minimalista pantalla por pantalla, un commit por pantalla,
solo presentación, validando cada criterio del documento.
```
