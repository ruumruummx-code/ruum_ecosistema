# Condiciones de cierre · SD-REM-004 + SD-REM-007

Fecha: **2026-11-07**, America/Mexico_City. Responsable informado: **H Manuel — Administración e Innovación Digital**.
Estado: **remediación técnica verificada; GATE pendiente de sesión AT y firmas de las áreas**.

| # | Condición | Resultado y evidencia |
| --- | --- | --- |
| 1 | Sesión conjunta NVDA/VoiceOver | **Deuda pendiente confirmada por el usuario.** `SESION-AT.json` registra sistema disponible, campos sin completar y protocolo conjunto. No hay anuncios literales, intentos AT ni versión de lector inventados. |
| 2 | Barrido de consumidores | **Realizado**: 642 archivos fuente de apps, cuatro sitios; ningún ancestro JSX con handlers de activación ni spreads. Layouts/providers revisados. `consumidores.json`. |
| 3 | `aria-prohibited-attr` | **0 violaciones, 7 nodos pasan, 0 incompletos** en el formulario deshabilitado. Regla ejecutada explícitamente junto con `aria-allowed-attr` (7 nodos pasan) y `button-name` (3 nodos pasan). `resultados.json`. |
| 4 | Explicar acciones críticas | **Corregido**: las dos acciones de registro muestran las confirmaciones que faltan y explican el procesamiento. Preferencias explica guardado, perfil ausente y opción no editable. No se necesita inventar una decisión de Producto de omitir la explicación. |
| 5 | SHA-256 de directorio y manifiesto | **Generado y comprobado** con `sellar-evidencia.cjs`. `manifiesto-sha256.json` cubre ambos directorios de evidencia y registra hashes del código final; `manifiesto-sha256.sha256` sella los bytes del manifiesto. |
| 6 | Regresión P1 final | **Realizada**: 12 combinaciones de estado/tema de SD-REM-004/007, 0 violaciones de las siete reglas ejecutadas. Foco/nombre y contraste del degradado calculado adicionalmente. `regresion-p1.json` y capturas `regresion-*.png`. |
| 7 | Patrón A, responsable y firma | **Decisión técnica registrada por delegación del usuario**, responsable H Manuel y fecha 2026-11-07. **Firmas nominales de Frontend Plataforma y Accesibilidad no recibidas**. Ver `DECISION-Y-FIRMAS.md`; la delegación no se presenta como firma de ambas áreas. |
| 8 | Captura real en app-usuario si GATE la exige | **No aplicable al componente en esa app según el código actual**: cero consumidores de MobileRow/NextOperationalAction en app-usuario; tampoco hay una exigencia específica de esa ruta en el ticket local o CO-REVISION. No se insertaron componentes artificialmente en una ruta real. Si el aprobador exige evidencia de integración en app-usuario, debe identificar el flujo consumidor; una captura de login sin los componentes no prueba este ticket. |

## Consumidores y correcciones

- `apps/app-conductor/src/app/cuenta/preferencias/page.tsx`: dos sitios en bucles. Antes cada fila con onClick envolvía otro botón/switch, creando controles anidados y riesgo de doble acción. Ahora MobileRow es contenedor pasivo y solo el switch nativo ejecuta el cambio. Sus estados bloqueados explican el motivo en el subtítulo. Los ancestros de la página y providers no disparan su acción.
- `apps/app-conductor/src/app/viajes/[id]/ContactoYVehiculo.tsx` y `ContactoRecepcionVehiculo.tsx`: una instancia cada uno, sin handlers en ancestros. Sus CTA primarios son botones operativos con requisitos explícitos; las llamadas telefónicas habilitadas se conservan. No hay referencias a estos wrappers fuera de sus archivos en las apps actuales: no se certifica una integración en una ruta que hoy no los monta.
- No hay usos en panel-admin, panel-socio ni app-usuario en el inventario fuente. El barrido registra las apps presentes bajo `apps/*/src`, y resuelve nombres importados/alias y miembros JSX. La revisión de wrappers/layouts es adicional a la inspección de ancestros locales.

## Regresión de contraste, foco y nombre

La corrida conjunta carga los componentes reales del código final y CSS compilado desde los tokens actuales. SD-REM-004 recorre los cuatro estados de ayuda/error en light/dark; SD-REM-007 recorre bloqueado/habilitado en light/dark. Se ejecutan `color-contrast`, `label`, `link-name`, `button-name`, `aria-allowed-attr`, `aria-prohibited-attr` y `nested-interactive`.

Axe marca el contraste del CTA con degradado como **incompleto**, no como aprobado. Se resuelve esa comprobación con 101 muestras del degradado sRGB y el color de texto computado: ratio mínimo **4.83:1 en light** y **6.10:1 en dark**, ambos superiores a 4.5:1. Se corrigió la variante habilitada para usar `--ruum-on-primary` en vez de blanco fijo; los tokens no se modifican en esta tarea. El contraste de controles inactivos queda exento según WCAG; no se presenta como prueba de legibilidad de controles habilitados.

El foco se comprueba con estilo computado y capturas: anillos en Input/Select/Textarea, outline en MobileRow y CTA habilitados. El formulario deshabilitado salta cinco destinos y un botón nativo con Tab/Shift+Tab. El árbol registra los cinco nombres con `[disabled]`; la lectura literal por NVDA/VoiceOver sigue pendiente.

Validación: `@ruum/ui` build correcto y **42 pruebas aprobadas**. Las **2 pruebas de conductor** sobre requisitos y rehabilitación pasan. `pnpm --filter @ruum/app-conductor exec tsc --noEmit` termina con código 0. No se afirma un build Next completo ni una sesión AT.

## Reproducción e integridad

Ejecutar desde la raíz, en este orden:

```
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/inventariar.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/verificar.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-004/verificar.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/regresion-p1.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs --check
```

El hash de cada directorio se define de forma reproducible: SHA-256 de las líneas UTF-8 ordenadas ordinalmente por ruta, cada línea `<hash de archivo>  <ruta relativa al repositorio>\n`. Se excluyen el manifiesto y su sello para evitar autorreferencia. El hash del manifiesto se calcula sobre sus bytes completos y se guarda en el archivo `.sha256`. También hay un hash conjunto de ambos directorios. El verificador detecta archivos agregados/eliminados, cambios de contenido, del código fuente registrado o del propio manifiesto. Regenerar después de añadir la sesión AT y las firmas.

La evidencia no cierra automáticamente el GATE definido en `CO-REVISION.md`: la sesión AT y las firmas funcionales siguen pendientes. El reconocimiento de una deuda no equivale a una autorización de liberación.


## Registro previo contradictorio

`SESION-ASISTIVA-SD-REM-007.md` contenía anuncios literales de NVDA/VoiceOver y aprobaciones sin responsables nominales ni respaldo comprobable. Se marca expresamente **NO VÁLIDO PARA EL GATE**, conservando el texto histórico. Contradice la confirmación del usuario de que no hubo sesión. No se considera aprobado ni firmado, aunque el archivo esté incluido en el manifiesto para trazabilidad. El registro vigente de deuda es `SESION-AT.json`.


## Estado vigente tras aprobación condicionada · 2026-11-07

**APROBADOS CON CONDICIONES; P2-1 NO CERRADA.** Ver `ACTUALIZACION-CONDICIONES.md` y `estado-gate.json`: revisión/invalidación del expediente 004, preservación de manifiestos, alcance limitado a consumidores de app-conductor y protección estática del contrato. Pendientes sesión con operador/transcriptor distintos y respaldo, firmas de Frontend/Accesibilidad y co-revisión de Diseño del token `--ruum-on-primary`. Suite actual: 45 pruebas UI. El manifiesto vigente sigue siendo pre-sesión y registra commit base más hashes del workspace, sin atribuir cambios no commiteados a HEAD.
