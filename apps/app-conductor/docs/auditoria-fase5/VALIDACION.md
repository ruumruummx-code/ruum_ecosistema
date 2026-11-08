# Validación de fase 5

## Matriz y límites

La nueva suite `tests/interface/theme.spec.ts` verifica 16 destinos de acceso autenticado en ambos temas y tamaños; además revisa etapas operativas, evidencia, bloqueo de cierre, error de red, emergencia y tres rutas de acceso. Una prueba adicional cambia el tema desde Preferencias y comprueba su persistencia con una clave heredada presente. Comprueba el contraste de los nodos de texto visibles sobre fondos sólidos, componiendo transparencias y opacidades, con umbrales WCAG AA. No se cuentan iconos decorativos ni texto sobre fotografías, mapas o gradientes. La medición de texto no acredita por sí sola contraste de todos los glifos, controles nativos del sistema o contenido de terceros.

La suite existente mantiene pruebas de hit testing, teclado simulado, texto ampliado, foco, regreso desde diálogos, borradores, archivos, firma y transiciones. Los fixtures son sintéticos: no se envían OTP, mensajes, llamadas ni registros a servicios reales.

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

El pre-commit global ejecuta `npm test`; su fallo preexistente por ausencia de archivos de pruebas en `@ruum/ui` está documentado en las fases 3–4. No se modifica el hook ni se declara aprobada la suite global. La entrega usa comprobaciones específicas y valida el mensaje de commit antes de omitir ese hook mediante `HUSKY=0`.

La fase 6 conserva la validación en dispositivos físicos Android/iOS, teclado nativo, cámara, biometría y medición de LCP/INP/CLS. Un tamaño de bundle o una captura no acredita esos objetivos.

## Pares del contrato visual

Ratios calculados desde los valores finales de la paleta. Complementan la medición de texto renderizado y no la sustituyen.

| Par | Día | Noche |
|---|---:|---:|
| Texto principal / superficie | 15,72:1 | 15,30:1 |
| Apoyo / superficie secundaria | 5,61:1 | 7,63:1 |
| Acción / superficie | 6,24:1 | 8,44:1 |
| Texto / botón primario | 6,24:1 | 8,00:1 |
| Texto / botón deshabilitado | 4,55:1 | 6,22:1 |
| Borde de campo / superficie | 3,80:1 | 6,15:1 |
| Éxito / superficie de éxito | 5,80:1 | 7,56:1 |
| Pendiente / superficie de pendiente | 6,47:1 | 8,81:1 |
| Error / superficie de error | 5,67:1 | 6,54:1 |

La inspección estática de los módulos CSS encuentra solo dos literales hexadecimales: fondo y tinta del lienzo de firma, conservados por su función de comprobante. Los valores de área visible se publican por el hook compartido; sus variables no se redeclaran como un nuevo algoritmo de viewport.

## Observación operativa durante la regresión

Una ejecución del caso «recepción e inicio son dos decisiones y una RPC por pulsación» agotó la espera de 15 s después del segundo clic: la pantalla conservó «Actualizando…». La traza muestra ambas RPC y las solicitudes RSC con HTTP 200. No se atribuye una causa a partir de esos códigos. La siguiente ejecución aprobó las 37 pruebas de regresión sin cambiar la lógica del viaje, los tiempos de espera ni las aserciones. Se conserva `evidencia/espera-operativa-inicial.zip` para revisión posterior; se reproduce con `pnpm exec playwright show-trace`.

## Resultado final

- Build de producción y comprobación de tipos: aprobados.
- Playwright: **46/46 aprobadas** en una ejecución completa de 3,2 minutos: 9 pruebas de tema y 37 de regresión. Se mantienen los tiempos y aserciones de las fases anteriores.
- ESLint en fuentes TypeScript modificadas: 0 errores y 1 advertencia `security/detect-object-injection` en Preferencias, en el acceso al objeto de preferencias ya existente.
- First Load JS estimado por Next: Inicio 342 kB; Traslados 331 kB; Cuenta/expedientes según ruta; Registro 327 kB; Login 241 kB; Ganancias 305 kB. Son tamaños de compilación, no LCP, INP o CLS.
- Revisión visual: Inicio, Cuenta y Ganancias completos en 320×568; acceso con campos y acciones alcanzables; registro oscuro legible. Se conservan 14 capturas seleccionadas, cuatro logs, la traza inicial y hashes en `validacion.json`.

La entrega mantiene explícitamente los límites de la fase 6 y el fallo preexistente del hook global descrito arriba.
