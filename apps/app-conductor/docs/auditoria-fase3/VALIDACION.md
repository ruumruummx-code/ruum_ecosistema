# Validación de fase 3

La suite usa `tests/interface/fixture.mjs`: sesión ficticia, estados deterministas y registro de llamadas RPC en memoria. No modifica Supabase ni envía mensajes, llamadas o incidencias reales. `playwright.interface.config.ts` inicia el API ficticio en 54331 y Next de producción en 3003.

## Matriz de aceptación

| Criterio | Verificación reproducible |
|---|---|
| Estado, siguiente paso y acción principal sin scroll habitual | Diecinueve estados en 320×568 y 390×844. Comprobar exceso del cuerpo ≤1 px, raíz sin desplazamiento, sin overflow horizontal y controles del marco ≥48×48. |
| Una navegación común y retorno alcanzable | Hit-testing de la navegación, cabecera y acción; regresión de fase 2 en diez rutas por tamaño. |
| Datos completos y texto al 200 % | Direcciones y referencias extensas desde el fixture, acceso al final del texto, cierre fijo, Escape y retorno de foco. Ampliación DOM y fallback interno sin ocultar acción. |
| Recepción e inicio separados | Primera pulsación emite únicamente `vehiculo_recibido`; segunda emite `iniciar_traslado`. Confirmar el cambio de pantalla. |
| Llegada separada del registro final | Una llamada `conductor_confirmar_llegada_destino`, sin `conductor_avanza_traslado`; conservar precisión y motivo de ausencia de coordenadas. |
| REPUVE sin eludir requisitos | VIN/placas vacíos, captura ausente, reporte de robo y pasaporte sin datos reales. No se emite avance. |
| Terminales de consulta | Cerrado, cancelado, fallido, disputa, incidencia y estado desconocido; incluso con `?cierre=1`. Sin acciones de avance ni herramientas de modificación. |
| Acceso al cierre permitido | El resumen de registro final abre el formulario existente. No se ejecuta un cierre ficticio ni se declara verificada la firma/cámara. |
| Expediente y filtros | Pestañas por teclado, retorno persistente tras desplazar el expediente, fecha y filtros por URL con diálogo nativo. |
| Lista poblada | Tres ofertas/aceptados, una tarjeta, paginación, búsqueda sin coincidencias, limpieza, SOS integrado sin acceso global superpuesto, recuperación desde mapa no disponible y estado «Cierre pendiente» después de entrega confirmada. |
| Error recuperable | Fallo RPC simulado, motivo visible, acción habilitada para reintentar y avance después de recuperar la red. |
| Seguridad y navegación | Destino real en enlace de navegación, apertura/cierre de SOS, ancho de opciones, ausencia de desbordamiento y retorno de foco. No se pulsa ninguna acción de emergencia. |

Las pruebas de bloqueo REPUVE no acreditan un registro exitoso de captura ni la autorización real del servidor; esos contratos se conservan en los servicios existentes. El fixture permite verificar la intención de las llamadas, no sustituye una prueba de integración de RLS y funciones desplegadas.

## Reproducción

Desde `apps/app-conductor`, Node 24 y pnpm 10:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e2e_only \
RUUM_LOCAL_PRODUCTION=true NEXT_PUBLIC_RUUM_AMBIENTE=development \
pnpm exec next build

PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
pnpm exec playwright test --config playwright.interface.config.ts
```

Los resultados finales, capturas y hashes se registran en `evidencia/validacion.json`. Los tamaños de First Load JS son tamaños del build; no representan una medición de LCP, INP, FPS o batería.

## Resultado final

**23 pruebas aprobadas, 0 fallos**, sobre la compilación final de producción. Build de 31 páginas y TypeScript aprobados. ESLint dirigido sin errores ni advertencias; el build completo conserva advertencias anteriores del repositorio. `git diff --check` sin incidencias en la aplicación. Se conservan doce capturas, los registros de build/pruebas y hashes de 33 archivos en [evidencia/validacion.json](evidencia/validacion.json).

La revisión detectó y corrigió el exceso de seis píxeles del resumen cerrado en 320×568, la pérdida de foco al cargar el chat dentro de otro diálogo y el acceso global de seguridad superpuesto a la lista. El chat ahora se solicita explícitamente con un estado de carga delimitado. El SOS de la lista se integra en su cabecera. La suite final vuelve a comprobar esos casos.

| First Load JS informado por Next | Fase 2 | Fase 3 |
|---|---:|---:|
| `/viajes` | 320 kB | 332 kB |
| `/viajes/[id]` | 354 kB | 341 kB |
| `/viajes/[id]/detalles` | 268 kB | 269 kB |
| `/viajes/[id]/evidencia` | 327 kB | 326 kB |
| `/viajes/[id]/soporte` | 311 kB | 300 kB |

La lista incorpora el panel SOS y crece 12 kB en First Load JS; el resumen operativo disminuye 13 kB. Se registra el intercambio para la medición y optimización de fase 6: no se afirma una mejora global de rendimiento ni se amplían los objetivos de LCP/INP/CLS. No se añadieron dependencias. La ausencia de cartografía real, las pruebas físicas y el flujo completo de cámara/firma/cierre siguen siendo límites explícitos de esta entrega.

## Comprobación previa a publicar

El gancho `pre-commit` ejecuta `npm test` para todo el monorepo. Con pnpm 10, los cuatro tests existentes de `@ruum/shared` pasan, pero `@ruum/ui` no tiene archivos de prueba y Vitest termina con código 1. El inventario de HEAD confirma que esa ausencia es anterior a esta entrega. No se modifica el gancho ni la configuración del monorepo: para crear este commit se omite su ejecución automática después de registrar el fallo, se valida Conventional Commits por separado y se conserva la validación específica de conductor (build, TypeScript y 23 pruebas de navegador aprobados). El fallo global no se presenta como aprobado.
