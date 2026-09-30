# CLOSE P1 Android: Go/No-Go y rollback

Este runbook define la decisión de liberación y el procedimiento de reversión de
la aplicación Android de Conductor. Debe ejecutarse con el artefacto firmado que
se pretende publicar y con la misma configuración de ambiente de producción.

## Responsables

- Release owner: coordina la decisión y registra la versión y `versionCode`.
- Operaciones: valida un traslado completo y el comportamiento sin conexión.
- Ingeniería móvil: valida tracking, colas cifradas, cierre de sesión y rollback.
- Seguridad: confirma que no existen secretos ni datos de otro usuario en el dispositivo.

La liberación requiere aprobación explícita de Release owner, Operaciones e
Ingeniería móvil. Cualquier criterio bloqueante fallido produce un **No-Go**.

## Evidencia previa obligatoria

Registrar en el ticket de liberación:

- commit y artefacto firmado;
- versión y `versionCode` de `config/app-version.json`;
- ambiente y URL remota configurada;
- dispositivo, versión de Android, fecha y responsable de cada prueba;
- resultados y enlaces a logs, capturas o videos, sin tokens ni datos personales.

Ejecutar desde la raíz del repositorio:

```sh
pnpm install --frozen-lockfile
node scripts/verify-app-version.mjs
node apps/app-conductor/tests/android/sprint-close-p0-static.test.mjs
node apps/app-conductor/tests/android/sprint-close-p1-static.test.mjs
node apps/app-conductor/tests/android/sprint-close-fix-static.test.mjs
node apps/app-conductor/tests/android/sprint-close-fix2-static.test.mjs
pnpm --filter @ruum/app-conductor test
```

## Criterios Go

Todos deben cumplirse:

- CI verde y sin hallazgos bloqueantes de seguridad.
- Instalación limpia, actualización desde la versión publicada y cold start exitosos.
- Inicio y cierre de sesión eliminan credenciales, colas y tracking del usuario anterior.
- Tracking en foreground y background funciona con permisos progresivos y sólo con una sesión válida.
- La cola offline permanece cifrada, separada por usuario y sincroniza al recuperar conectividad validada.
- Una respuesta parcial elimina aceptados, duplicados y rechazos permanentes, conservando sólo reintentables.
- El shell offline muestra el resumen operativo y se recupera al volver la red.
- Un traslado crítico completo funciona sin pérdida ni duplicación de evidencia o telemetría.
- Crash-free smoke test y consumo de batería/red dentro de los límites acordados para el piloto.

## Criterios No-Go

Detener la liberación ante cualquiera de estos casos:

- fallo de un chequeo estático, prueba crítica o validación de versión;
- pérdida, mezcla entre usuarios o almacenamiento en claro de telemetría/evidencia;
- tracking activo después del cierre de sesión o sin autorización;
- reintentos infinitos, duplicación creciente o imposibilidad de drenar la cola;
- URL o credenciales de ambiente incorrectas;
- regresión de cold start, autenticación, traslado activo o recuperación offline;
- imposibilidad de instalar el artefacto anterior de rollback.

## Despliegue controlado

1. Publicar primero al canal interno y completar el smoke test físico.
2. Ampliar gradualmente el porcentaje sólo si no aparecen errores críticos ni crecimiento anómalo de colas.
3. Vigilar errores nativos, sesiones forzadas, salud de tracking, rechazos permanentes y latencia de sincronización.
4. Pausar el rollout ante cualquier señal No-Go y conservar la evidencia diagnóstica sanitizada.

## Rollback

1. Pausar inmediatamente el rollout y bloquear nuevas promociones del artefacto afectado.
2. Declarar incidente, anotar versión, `versionCode`, hora, alcance y métrica que activó el rollback.
3. Restaurar la última versión firmada aprobada mediante el canal de distribución. Si la tienda no permite reducir
   `versionCode`, republicar el código estable con un `versionCode` superior.
4. Desactivar mediante configuración remota cualquier funcionalidad nueva implicada, si existe un control seguro.
5. No borrar colas manualmente salvo riesgo de seguridad. La versión estable debe procesar datos compatibles;
   ante incompatibilidad, aislarlos y preservar evidencia para recuperación controlada.
6. Confirmar en un dispositivo actualizado: login, traslado activo, tracking, sincronización y logout.
7. Mantener el incidente abierto hasta comprobar que las métricas regresaron a su línea base y documentar la causa raíz.

## Cierre

La decisión final debe quedar registrada como `GO` o `NO-GO`, con los nombres de
quienes aprobaron, la evidencia de los criterios y, si hubo rollback, el resultado
de la validación posterior. La ausencia de evidencia equivale a **No-Go**.
