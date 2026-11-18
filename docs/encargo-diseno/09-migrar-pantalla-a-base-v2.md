# 09 · Migrar una pantalla al sistema base v2

**Depende de:** sistema base v2 (`design-system/docs/sistema-base-v2.md`). **Rama:** `feat/base-v2-<pantalla>`.
**Referencia terminada:** `apps/app-usuario/src/app/mis-viajes` (móvil 390 px y escritorio 1440 px, claro y oscuro).

## Orden sugerido (app usuario)

| # | Ruta | Estilos sueltos al iniciar* | Notas |
|---|---|---|---|
| ✓ | `mis-viajes` | 461 → 0 | Pantalla patrón. |
| 1 | `viajes/nuevo` | ~750 | Flujo de solicitud; mayor impacto. Tiene `NuevoTrasladoDesktop`. |
| 2 | `viajes/[id]` | ~270 | Seguimiento y pasaporte. |
| 3 | `/` (inicio) | ~330 | Incluye `dashboard/` e `InicioUsuario.css`; tiene `InicioDesktop` / `InicioMobile`. |
| 4 | `login`, `registro`, `recuperar-password`, `nueva-password` | ~820 | Mismo lenguaje visual que el resto. |
| 5 | `cuenta/**` | ~1,500 | Tiene `CuentaDesktop`, `VehiculosDesktop`. |
| 6 | `viajes/masivo` | ~800 | Tiene `CargaMasivaDesktop`. |
| 7 | `verificacion`, `ubicaciones`, `soporte`, `legal/*`, `preguntas-frecuentes` | ~700 | |

\* Conteo de `pnpm check:estilos --detalle` por archivo; consultar `config/estilos-ui.json`.

## Qué hacer

1. **Mapa (solo lectura).** Lista los componentes de la ruta, cuáles son versión móvil y de
   escritorio, qué textos, roles y `aria-label` usan las pruebas (`*.test.tsx`,
   `tests/e2e/*.spec.ts`) y qué reglas de `globals.css` le pertenecen. Espera el OK.
2. **Un solo componente.** Une las versiones móvil y escritorio en un componente responsivo
   con `@ruum/ui/base`. Conserva la lógica (hooks, reglas de negocio, llamadas) tal cual.
3. **Glosario único.** Si móvil y escritorio usan etiquetas distintas para lo mismo
   ("Activos" / "En curso"), unifica con el glosario de marca y avisa en el PR.
4. **Limpieza.** Borra los componentes duplicados, sus módulos CSS y sus reglas en
   `globals.css`.
5. **Candado.** Agrega la ruta a `"migradas"` en `config/estilos-ui.json` y ejecuta
   `pnpm check:estilos --actualizar`.
6. **Pruebas.** Reescribe las pruebas unitarias contra el componente nuevo (mismos
   comportamientos) y actualiza las e2e que dependían del DOM anterior.

## Criterios de aceptación

- [ ] Un componente de contenido para todos los anchos; sin `…Desktop.tsx` / `…Mobile.tsx`.
- [ ] `pnpm check:estilos` en verde con la ruta en `"migradas"` (cero hex, paleta de Tailwind, `text-[N]`, `rounded-[N]`, `dark:`).
- [ ] Capturas en 320×568, 390×844, 1024×768 y 1440×900, en claro y oscuro, sin desbordes horizontales.
- [ ] La acción principal es única por bloque y visible sin buscarla.
- [ ] Foco visible y áreas táctiles ≥ 44 px.
- [ ] `pnpm --filter @ruum/app-usuario typecheck`, `lint`, `test` en verde; e2e de la ruta en verde
  (incluye `contraste-ux002` y `semantica-listas-ux003` si la ruta aparece ahí).
- [ ] La línea base de `config/estilos-ui.json` baja; nunca sube.

## Prompt para Claude Code

```text
Lee design-system/docs/sistema-base-v2.md y docs/encargo-diseno/09-migrar-pantalla-a-base-v2.md.
Usa apps/app-usuario/src/app/mis-viajes como referencia de estructura y estilo.
Pantalla a migrar: <ruta>. Haz primero el paso 1 (mapa, solo lectura) y espera mi OK.
Después migra con @ruum/ui/base, sin cambiar lógica, textos legales ni validaciones,
y valida cada criterio de aceptación antes de terminar.
```
