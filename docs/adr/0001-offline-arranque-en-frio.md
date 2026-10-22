# ADR-0001 — Offline de arranque en frío (app del conductor)

- **Estado**: Propuesta (decisión tomada; pendiente la firma de Operación)
- **Fecha**: 2026-10-21
- **Decisores**: Operación (Torre de Control) e Ingeniería
- **Ámbito**: app del conductor (Capacitor / PWA), piloto de traslado con conductor
- **Criterio de terminado**: ADR firmado por Operación

## Contexto

La app del conductor es una PWA/Capacitor que hoy **no tiene shell local**: al
arrancar en frío sin cobertura, el service worker puede servir el shell
cacheado y `offline-active-trip-cache` puede exponer el viaje activo, pero la
reapertura de un viaje en curso y la captura de evidencia dependen de que el
dispositivo vuelva a tener red.

El escenario que preocupa a Operación es el **cierre forzado durante un viaje**:

1. El conductor está en ruta y la app se cierra por falta de batería, crash del
   sistema o cierre forzado desde Ajustes.
2. El conductor queda sin cobertura (tramos sin señal, túnel, sótano de parking).
3. Al reabrir la app, ¿puede volver al viaje activo? ¿puede documentar el
   vehículo para la cadena de custodia? ¿qué hace el sistema con las fotos que
   no pudo subir?

Hoy esa pregunta no tiene respuesta cerrada: depende de qué quedó cacheado,
de si el service worker sobrevivió al cierre forzado y de cuánto tarda la app
en detectar que no hay red.

Esto no es un detalle técnico menor: la evidencia fotográfica es lo que sostiene
el pago del conductor y la cadena de custodia del traslado. Un conductor que no
puede documentar es un conductor que no cobrará y un traslado sin soporte para
la Torre de Control.

## Opciones consideradas

### Opción A — Aceptar el protocolo operativo de Torre de Control para el piloto

La app se usa **con red** para el arranque en frío; el cierre forzado sin red
se cubre con un procedimiento: la Torre de Control contacta al conductor por
teléfono, el conductor documenta por otro medio (foto por mensajería) y
Operación valida la evidencia fuera de banda. Se mide la incidencia real durante
el piloto y, si el volumen o la severidad lo justifican, se resuelve con la
opción B.

- A favor: el piloto cierra sin desarrollo adicional; el riesgo queda
  contenido por un procedimiento y por monitorización.
- En contra: depende de la red en el momento crítico; desplaza carga operativa
  a la Torre de Control; la evidencia recuperada por otro medio tiene menor
  valor probatorio.

### Opción B — Exigir una solución técnica antes del piloto

Empaquetar un shell local en Capacitor que se apoye en `offline-active-trip-cache`,
con alcance limitado a **reabrir el viaje activo** y **capturar evidencia sin
red**. La evidencia capturada offline entra en la cola local con su huella
sha256 y se sincroniza al recuperar la red.

- A favor: el conductor recupera el control de su evidencia sin depender de la
  red ni de que un operador conteste.
- En contra: es un proyecto (service worker con precache del shell, rutas de
  evidencia, persistencia de la cola y su sincronización), con su propio
  calendario y su propia superficie de prueba. Bloquea el cierre del piloto.

### Opción C — No hacer nada hasta que haya datos

- En contra: es la opción B con el coste de B pero sin la garantía de B; durante
  el piloto no se mide nada y la decisión se sigue aplazando.

## Decisión

**Se adopta la Opción A para el piloto.**

El piloto acepta el **protocolo operativo de Torre de Control** para el
arranque en frío sin red. La implementación técnica de la Opción B (shell local
en Capacitor) **queda fuera del cierre del piloto** y solo se ejecuta si
Operación lo exige, con la medición de abajo como criterio de activación.

La decisión es revisable: no es "no hacer nada", es "no bloqueamos el piloto por
ello y medimos para decidir con datos".

## Cómo se mide la gravedad (el dato que decide la Opción B)

Durante el piloto se ejecuta la **prueba de cierre forzado sin red** de forma
sistemática, no sólo cuando ocurre:

**Procedimiento**

1. Con un traslado en curso, forzar el cierre de la app (Ajustes → forzar
   detención / matar el proceso). No es un cierre limpio.
2. Activar el modo avión (o equivalentemente, quedarse sin cobertura).
3. Reabrir la app y registrar qué ocurre.
4. Repetir en el punto de origen, en ruta y en el punto de entrega.

**Qué se registra en cada ejecución**

| Métrica | Definición |
|---|---|
| Reapertura | ¿La app abre sin red? (binario) |
| Viaje activo | ¿Muestra el viaje activo en curso? (binario) |
| Captura de evidencia | ¿Permite tomar y dejar la foto localmente? (binario) |
| Aviso de sin conexión | Tiempo desde el arranque hasta que la app avisa de que no hay red (segundos) |
| Escalamiento | ¿Hizo falta que la Torre de Control interveniera para documentar? (binario) |

**Umbral de activación de la Opción B**

La Opción B se exige si, durante el piloto, se cumple **cualquiera** de:

- más del **10 %** de las reaperturas sin red no permiten reabrir el viaje
  activo, o
- más del **5 %** no permiten capturar evidencia, o
- se registra **algún** caso con intervención de la Torre de Control por
  documento irrecuperable, o
- el tiempo hasta el aviso de "sin conexión" supera los **10 segundos** de
  forma repetida (el conductor no puede saber si la app funcionó).

**Volumen mínimo**: al menos **20 ejecuciones** de la prueba y **2 semanas** de
piloto. Por debajo de ese volumen no se decide: se sigue midiendo.

Los datos se consolidan en el reporte de QA del piloto
(`docs/qa/`) y se anexan a este ADR cuando se cierre la medición.

## Consecuencias

**Positivas**

- El piloto no se bloquea por una funcionalidad que el volumen real todavía
  no justifica.
- El riesgo queda contenido por un procedimiento conocido por ambas partes y
  por una métrica que lo hace visible.
- La decisión queda documentada con el criterio de reversión, no como un
  "lo vemos luego".

**Negativas**

- Durante el piloto existe una ventana en la que la evidencia depende de la
  red y del protocolo humano.
- La Torre de Control asume carga operativa de contacto y validación fuera de
  banda. Hay que dimensionarla (turnos, horario de cobertura).
- El conductor puede quedar sin poder documentar y sin saber que la app no
  funcionó: hay que comunicar el procedimiento (pantalla de "sin conexión" y
  mensaje explícito, no sólo un spinner).

**Neutras / a revisar**

- La evidencia recuperada por mensajería tiene menor valor probatorio que la
  fotografía original con metadatos: la cadena de custodia se rompe de forma
  consciente y documentada, no por accidente. Si el volumen de estos casos
  crece, la Opción B deja de ser opcional.

## Implementación diferida (fuera del cierre del piloto)

Si Operación activa la Opción B, el alcance técnico queda acotado así:

1. **Shell local en Capacitor** con precache del shell y de las rutas de
   evidencia (reapertura del viaje activo, captura de foto, detalle del
   traslado).
2. **Apoyo en `offline-active-trip-cache`** para reabrir el viaje activo sin
   red (ya existe la cache; falta el shell que la consume).
3. **Cola local de evidencia** con la huella sha256 del archivo (RT-68), de
   forma que la evidencia capturada offline se sincronice después **sin**
   sobrescribir la ya registrada: el mismo sha256 es idempotencia, un sha256
   distinto es un conflicto de custodia que se escala.
4. **Alcance explícitamente excluido**: chat con la Torre de Control, pagos,
  asignación de traslados y cualquier otra pantalla que requiera servidor.

## Firmas

| Rol | Nombre | Fecha | Estado |
|---|---|---|---|
| Operación (Torre de Control) | — | — | **Pendiente** |
| Ingeniería | — | 2026-10-21 | Hecho (ADR redactado) |

El ADR pasa a **Aceptada** cuando Operación firme. Hasta entonces, el piloto
opera bajo el protocolo operativo descrito en la Decisión y la medición de la
sección "Cómo se mide la gravedad" sigue en curso.

## Referencias

- `apps/app-conductor/src/lib/offline-active-trip-cache.ts` — cache del viaje activo.
- `apps/app-conductor/src/lib/cola-offline.ts` — cola local de evidencia (con sha256, RT-68).
- `packages/api/src/custody/evidencia.ts` — regla de idempotencia y conflicto de custodia.
- `docs/runbooks/` — runbooks operativos donde se detallará el protocolo.
