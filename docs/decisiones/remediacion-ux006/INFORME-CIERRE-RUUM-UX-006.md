# Informe de cierre técnico — RUUM-UX-006

**Título:** Resolver selección English/EN sin traducción efectiva.  
**Fecha:** 6 de noviembre de 2026 · America/Mexico_City.  
**Prioridad:** P2.  
**Decisión ejecutada:** Opción B, aprobada explícitamente por el solicitante.  
**Estado técnico:** Implementado y verificado localmente; listo para reauditoría UX-06.

## Decisión de Producto y coordinación

El solicitante autorizó «Opción B: deshabilitar English y explicar que solo hay español» y confirmó la conclusión de UX-011 → UX-010 y la disponibilidad de los archivos compartidos. La [nota de decisión](DECISION-PRODUCTO.md) registra la fecha, aprobación y alcance. El propietario funcional es Producto; no se facilitó nombre nominal, que debe consignarse en el registro de liberación.

## Resultado funcional

- English está deshabilitado en móvil y escritorio y no conserva un manejador que simule un cambio.
- Español permanece seleccionado. La explicación **«La interfaz está disponible únicamente en español. El inglés aún no está disponible.»** aparece antes del control y se asocia mediante `aria-describedby`.
- El HTML del servidor y el documento activo declaran `lang="es-MX"`. La palabra English declara `lang="en"` en su botón, sin cambiar el idioma del documento.
- Se eliminó `aplicarIdiomaEnDocumento`, que recibía una elección sin traducción real. La nueva función `aplicarIdiomaDisponible` corrige únicamente los metadatos para que coincidan con el contenido y solo escribe si el atributo difiere.
- El contrato de preferencias acepta únicamente `es`. Las entradas heredadas de servidor, almacenamiento local y pendientes se interpretan como español; los nuevos guardados y reintentos no envían `en`.
- El saneamiento conserva los demás campos y actúa sobre la cuenta activa y las claves históricas de idioma. No migra otras cuentas por anticipado ni ejecuta escrituras remotas por abrir la pantalla.
- Los valores remotos heredados se corrigen al siguiente guardado general. Se conserva el mecanismo de fusión, control de sesión, concurrencia y error/reintento existente.
- Se revalidó el acceso a 390 y 1440 px: el selector EN retirado previamente sigue ausente.

## Verificación

| Comprobación | Resultado |
|---|---|
| Vitest · idioma, preferencias y restauración de sesión | **34 pruebas aprobadas** |
| Navegador · acceso y preferencias | **4 casos finales aprobados**, 390/1440 px |
| Disponibilidad | English deshabilitado y descrito; español seleccionado |
| Idioma del documento | `es-MX` en preferencias y acceso; comprobación adicional del HTML inicial de acceso |
| Recarga | Conserva español; las preferencias heredadas se normalizan a `es` |
| 503 y reintento | Verificados en ambos componentes; sin falso éxito y con limpieza de pendientes tras éxito |
| Solicitudes generales observadas | Todas contienen `idioma: "es"`, tanto en los intentos fallidos como en los exitosos |
| Cambio de cuenta | Pruebas de contrato y de componentes preservan idioma disponible y aislamiento de unidades/preferencias |
| Nombres accesibles | Cero violaciones en las reglas axe evaluadas; 8 interruptores móviles y 9 de escritorio con nombres únicos |
| TypeScript · app-usuario | **Aprobado** |
| ESLint · archivos de la remediación | **0 errores**; 1 advertencia en el efecto existente de reintento de `PreferenciasCliente.tsx` |

Las reglas axe ejecutadas son `button-name`, `select-name`, `aria-toggle-field-name`, `html-has-lang`, `html-lang-valid` y `valid-lang`. Las pruebas existentes de UX-010 también verifican los cinco selectores de escritorio y el estado de los interruptores.

En el primer arranque frío de preferencias móvil, la comprobación del almacenamiento expiró a los diez segundos antes de observar su normalización. Se amplió esa espera de hidratación a sesenta segundos y el caso se repitió satisfactoriamente, exigiendo el mismo resultado `es`. No se aceptó `en` ni se omitieron las comprobaciones de persistencia.

Se corrigió además el tipo de dos mocks del archivo de pruebas de escritorio para que admitan argumentos rest y permitan ejecutar TypeScript sin los errores TS2556 detectados anteriormente. Ese ajuste no modifica el contrato ni el comportamiento de producción.

La advertencia de lint señala la dependencia `handleGuardarCambios` en el efecto de reintento existente. El efecto de persistencia y su lista de dependencias se conservaron; sus casos de 503, red, reintento y aislamiento pasaron.

## Criterios de aceptación

| AC | Evidencia / situación |
|---|---|
| AC-0 · Decisión documentada | Opción B aprobada en el chat; fecha registrada. Falta consignar propietario nominal en el registro de Producto. |
| AC-1 · Traducción completa | No aplica a la opción elegida. |
| AC-2 · English retirado/deshabilitado con aviso previo | Cumplido; capturas, estado `disabled` y descripción accesible en ambas variantes. |
| AC-3 · Idioma del documento honesto | Cumplido; desaparece el manejador de cambio ficticio y el contenido español conserva `es-MX`. |
| AC-4 · Persistencia y cambio de cuenta | Cumplido en las pruebas locales; normalización de legados, recarga, aislamiento y payloads exclusivamente `es`. |
| AC-5 · Mensajes coherentes | Cumplido; explicación previa y ausencia del aviso engañoso de idioma guardado. |
| AC-6 · Acceso revalidado | Cumplido en ambos anchos; sin selector EN y con idioma español de México. |
| AC-7 · Sin regresión de UX-011 | Pruebas unitarias y de navegador de 503/reintento en móvil/escritorio, más recarga y cambio de cuenta. |
| AC-8 · Sin regresión de UX-010 | Cero violaciones en las reglas de nombre/idioma evaluadas; pruebas de nombres de interruptores y selectores aprobadas. |

## Archivos principales

- `src/lib/idioma-aplicacion.ts`: idioma disponible, mensaje, metadatos y saneamiento local.
- `src/lib/preferencias-contrato.ts` y `src/lib/preferencias-pendientes.ts`: normalización antes de leer, guardar o reintentar.
- `src/app/cuenta/Preferencias.tsx` y `src/app/cuenta/preferencias/PreferenciasCliente.tsx`: controles deshabilitados y explicación asociada.
- `src/app/layout.tsx`, `src/app/PreferenciasAplicacion.tsx` y `src/lib/preferencias-aplicacion.ts`: idioma coherente desde el arranque y al cambiar de sesión.
- Pruebas permanentes: `src/lib/idioma-aplicacion.test.ts`, pruebas existentes de preferencias y `tests/e2e/idioma-ux006.spec.ts`.

Las rutas anteriores son relativas a `apps/app-usuario`. Los cambios de otros trabajos presentes en el workspace se conservaron.

## Evidencias y reproducción

- [Galería de capturas](EVIDENCIA.html).
- [Resultados estructurados](resumen.json).
- [Decisión de Producto](DECISION-PRODUCTO.md).
- [Diff de esta remediación](correccion.diff).
- `390-preferencias.json` y `1440-preferencias.json`: axe, nombres accesibles, recarga, intentos 503 y solicitudes posteriores.
- `390-login.json` y `1440-login.json`: idioma y ausencia de selector EN en acceso.
- Siete capturas de preferencias, fallos 503, acceso y notificaciones móviles.

```powershell
pnpm --filter @ruum/app-usuario exec vitest run src/lib/idioma-aplicacion.test.ts src/app/cuenta/preferencias src/app/PreferenciasAplicacion.test.tsx
pnpm --filter @ruum/app-usuario typecheck
pnpm exec playwright test --config apps/app-usuario/playwright.config.ts idioma-ux006 --workers=1 --reporter=list
node docs/remediacion-ux006/generar-evidencia.cjs
```

Se utilizó Node 24, Chromium y servicios locales sintéticos. La ejecución aisló el servidor en 3056, los dobles en 54429/54430 y la caché en `.next-ux006`, mediante un preloader temporal que solo selecciona la carpeta de caché. Las referencias de tipos generadas se restauraron y la caché quedó excluida localmente en `.git/info/exclude`. No se cambiaron dependencias ni configuración de Turborepo.

Referencia técnica consultada para conservar el manejo de las actualizaciones: [documentación oficial de Supabase](https://supabase.com/docs/reference/javascript/update). Las pruebas no modificaron datos de un proyecto real ni validaron RLS o un despliegue de producción.

## Pendientes para cierre administrativo

1. Consignar el propietario nominal de Producto en la decisión y el registro de liberación.
2. Reauditar UX-06 con las evidencias entregadas y registrar la aceptación correspondiente a la P2.
3. Completar el gate de plataforma/producción, incluida la revisión con tecnología de asistencia prevista en el ticket.

**Dictamen:** implementación de la Opción B terminada y verificada localmente. Lista para reauditoría; sin promesa de traducción inexistente. Este informe no registra una aprobación de liberación, merge o despliegue.
