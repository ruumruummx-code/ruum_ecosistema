# Revisión de interfaz del conductor — 5 noviembre 2026

## Diagnóstico del código

- Inicio excluía el shell global y duplicaba navegación, encabezado y estructura de escritorio. La reserva inferior del shell no medía esa barra local.
- Las reglas de `globals.css` para compactar Inicio competían con las de los componentes; el contenido podía quedar recortado por el viewport fijo.
- Cuenta, Traslados, Registro y Ganancias fijaban variantes de azules y turquesas en sus módulos, al margen de los tokens de la aplicación.
- Ganancias no participaba en el viewport de las pantallas principales. Las condiciones de pago ocupaban espacio antes de la acción y la desplazaban debajo de la navegación.

## Cambios implementados

- Inicio utiliza `ConductorNav`, incluido su cálculo de altura mediante ResizeObserver y safe areas. Conserva el mismo marco móvil de 440 px máximo también en escritorio.
- Se eliminan encabezado y sidebar de escritorio exclusivos de Inicio, ilustración de escritorio y reglas antiguas de compactación.
- El panel usa un módulo de layout, métricas completas como enlaces táctiles y una tarjeta compacta para continuar el viaje. La notificación del encabezado se muestra solo cuando hay avisos sin leer.
- Se conectan colores de los módulos a tokens compartidos y se simplifican superficies y tipografía. No se añaden dependencias ni fuentes remotas.
- Ganancias comparte el viewport principal. Las condiciones completas y el acceso a soporte están en un diálogo nativo con cierre por Escape. En pantallas bajas se muestra un pago reciente y se conserva «Ver todos».
- Se respeta la preferencia de movimiento reducido. Cuando el zoom, la desconexión o una altura excepcional requieren más espacio, el contenido puede desplazarse dentro del panel para evitar perder acciones.

## Validación ejecutada

- Compilación de producción Next.js: correcta (31 páginas generadas), con advertencias preexistentes del repositorio.
- TypeScript: correcto.
- ESLint de componentes modificados: sin errores; tres advertencias preexistentes en DriverAvailabilityControl.
- 19 pruebas unitarias aprobadas: navegación, layout móvil, resumen de ganancias y carga de ganancias.
- Tres pruebas de navegador aprobadas, cada una recorriendo Inicio, Cuenta, Traslados y Ganancias: 320×568, 390×844 y 1280×960. Verifican navegación única, anchura máxima, ausencia de scroll raíz y visibilidad de acciones. También verifican apertura y cierre del diálogo de pagos.
- Inspección adicional en Chromium de esas cuatro rutas: sin acciones fuera del viewport, sin desbordamiento horizontal ni regiones con contenido desplazable en los estados vacíos probados.

Repetir la matriz:

```sh
pnpm exec playwright test --config playwright.mobile-shell.config.ts
```

Desde `apps/app-conductor`. La configuración inicia el API de pruebas local; no usa cuentas reales. Puede seleccionarse Chromium instalado mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

El build reporta 340 kB de First Load JS para Inicio, 320 kB para Traslados y 305 kB para Ganancias. Son tamaños del artefacto, no mediciones de latencia o fluidez en un móvil; el trabajo de layout no permite afirmar que el rendimiento esté optimizado al 100 %.

## Límites de la validación

Esto constituye la base común y una corrección de los fallos de layout observados; no certifica el 100 % de los estados de la aplicación. Quedan por medir rendimiento de producción en dispositivos físicos, teclado nativo Android, texto ampliado, viajes activos completos, volúmenes reales de datos, desconexión y los distintos estados de registro. Documentos, legales y diálogos conservan desplazamiento interno para mantener acceso a todo su contenido.

No se ha publicado un despliegue ni se han cambiado datos remotos.
