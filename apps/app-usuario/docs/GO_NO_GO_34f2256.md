# Dictamen de App Usuario para `34f2256`

**No Go.** La corrida 43542495510 terminó en rojo para el commit exacto `34f22569cceaa54b295325276feb0ae95e0ef3cf`. El criterio de salida exige ambos jobs en verde. [Corrida de GitHub Actions](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/43542495510)

| Job | Estado | Evidencia |
| --- | --- | --- |
| `reconciliacion-sql` | Verde | Supabase local arrancó desde una base limpia. El log registra 275 migraciones únicas, el mismo número de archivos del commit, frente a las 211 del criterio original. El script SQL terminó con `ON_ERROR_STOP=1` y pasaron las aserciones de conciliación concurrente, `{"confirmados":1,"compensados":1,"errores":0}`, y del reintento idempotente, `{"confirmados":0,"compensados":0,"errores":0}`. Los valores se verifican en el SQL del commit y el log registra la ejecución exitosa de los bloques. [Job SQL](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/43542495510/job/132286017374) · [Prueba SQL del commit](https://github.com/ruumruummx-code/ruum_ecosistema/blob/34f22569cceaa54b295325276feb0ae95e0ef3cf/apps/app-usuario/test/reconciliacion-individual.sql) |
| `usuario` | Rojo | Lint, TypeScript, build, responsive con CSS de producción y cobertura pasaron. Playwright en producción registró 75 pruebas aprobadas y una fallida. [Job Usuario](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/43542495510/job/132286017248) |

La cobertura superó los umbrales de líneas, ramas, funciones y sentencias. [Configuración del commit](https://github.com/ruumruummx-code/ruum_ecosistema/blob/34f22569cceaa54b295325276feb0ae95e0ef3cf/apps/app-usuario/vitest.config.ts)

| Métrica | Resultado | Umbral |
| --- | ---: | ---: |
| Líneas | 80.97 % | 70 % |
| Ramas | 75.43 % | 60 % |
| Funciones | 76.09 % | 70 % |
| Sentencias | 80.97 % | 70 % |

## Hallazgo para decidir aparte

`UX-002 dark 1440` falló en el intento inicial y en ambos reintentos. Axe registró relaciones de contraste de 1.15:1 en `/` y 1.10:1 en `/mis-viajes`, frente al mínimo de 4.5:1. El hallazgo bloquea el Go para este commit. [Log de Playwright](https://github.com/ruumruummx-code/ruum_ecosistema/actions/runs/43542495510/job/132286017248)
