# RUUM-UX-009 · Informe de cierre técnico

Fecha: 6 de noviembre de 2026, America/Mexico_City.
Estado: implementado, validado y listo para reauditoría de UX-09. La autorización de salida P2 sigue su gate independiente.

## Resultado

La aplicación distingue recepción de reportes, horario de atención, primera respuesta estimada y emergencias por correo. Se eliminó la promesa genérica «Soporte/Asistencia 24/7» y la afirmación de contacto inmediato. «24/7» queda ligado específicamente a recepción de reportes; el correo de emergencia indica cobertura continua sin prometer respuesta inmediata.

El contenido aprobado se centraliza en `src/lib/promesa-soporte.ts`. El componente `InformacionSoporte` lo presenta en soporte, formulario y la respuesta de preguntas frecuentes. Inicio móvil y escritorio, ambos accesos del pasaporte y las dos confirmaciones reutilizan la misma fuente. El correo de emergencia usa el contacto de soporte configurado, sin nuevos números o direcciones fijas.

No se modificaron horarios operativos, entregas de correo, API de registro, folios, reglas de incidencia ni el mapa. La revisión React conservó los hooks y la lógica de persistencia existentes; los nuevos textos y el componente informativo no introducen consultas ni efectos.

## Decisión aprobada

Propietario: HManuel, Administración e Innovación Digital. Aprobación explícita del usuario en este chat el 6/11/2026; ver DECISION-PRODUCTO-OPERACION.md.

- Formulario: recepción las 24 horas, todos los días.
- Atención: lunes a viernes de 8:00 a 20:00, hora de Ciudad de México.
- Primera respuesta estimada a reportes: menos de 30 minutos en horario y menos de 2 horas fuera.
- Emergencias: correo a soporte las 24 horas, todos los días.

Llamada y WhatsApp permanecen como canales existentes. No se les atribuyen tiempos ni cobertura no confirmados; la pantalla pide consultar su disponibilidad con soporte. El chat del conductor no se presenta como canal de emergencia aprobado.

## Criterios de aceptación

| Criterio | Resultado y evidencia |
|---|---|
| AC-1 | Cumple: decisión con propietario, fecha, recepción, horario, tiempos y correo de emergencia. |
| AC-2 | Cumple: inicio móvil y escritorio muestran disponibilidad diferenciada. Captura del acceso móvil y revisión del cambio de escritorio. |
| AC-3 | Cumple: soporte y formulario reutilizan el contenido centralizado. Capturas por ancho y tema. |
| AC-4 | Cumple: consulta general con folio SOP e incidencia con folio INC repiten el mismo resumen aprobado; pruebas unitarias y capturas de ambas ramas. |
| AC-5 | Cumple: recepción, atención, respuesta estimada y emergencia tienen frases separadas; correo de emergencia enlazado en la información de soporte. |
| AC-6 | Cumple: sin promesas genéricas de disponibilidad continua o contacto inmediato; disponibilidad continua solo para los usos expresamente aprobados. |
| AC-7 | Cumple en el alcance evaluado: axe de mensajes de inicio, información de soporte y confirmaciones, en dos anchos y temas. Texto sin abreviatura SLA, horario con zona explícita y enlaces nombrados. |
| AC-8 | Cumple por búsqueda y revisión: inicio móvil/escritorio, soporte, formulario, dos confirmaciones, dos accesos de pasaporte y preguntas frecuentes. No quedan promesas genéricas 24/7 en esos puntos. |

## Validación

- Node 24.13.0; sin cambios de dependencias.
- Vitest: 32 pruebas de soporte e inicio, más 12 de preguntas frecuentes y pasaporte; **44 aprobadas**.
- Se actualizó la prueba del nombre accesible de soporte y se verificó que ambas confirmaciones contienen el resumen compartido.
- TypeScript de app-usuario: aprobado.
- ESLint de todos los TSX modificados y archivos nuevos: aprobado, sin errores ni advertencias.
- `git diff --check`: aprobado; avisos de normalización CRLF/LF, sin errores de espacios.
- Chromium: 390 y 1440 px, temas claro y oscuro. Registro de consulta e incidencia simulados para verificar contenido de ambas confirmaciones.
- Axe: reglas `color-contrast` y `link-name` sobre los mensajes evaluados, incluidos los resultados; ver navegador.json.
- Inspección visual de acceso móvil y bloque de soporte: texto completo, legible y sin recortes.

## Evidencia y reproducción

EVIDENCIA.html contiene 16 capturas: acceso de inicio móvil, información de soporte, confirmación de consulta y confirmación de incidencia, por ancho y tema. La fixture usa componentes y estilos reales; simula el registro y la navegación. Sus contactos son valores de prueba, no direcciones de producción.

La captura de inicio a 1440 px es del componente móvil montado aisladamente; no representa la composición de InicioDesktop. Ese componente, los accesos del pasaporte y preguntas frecuentes se verificaron por código y sus pruebas existentes. No se afirma una prueba integral autenticada de todas las pantallas.

Comandos:

1. `pnpm --filter @ruum/app-usuario exec vitest run src/app/soporte src/app/InicioUsuario.test.tsx src/app/InicioDesktop.test.tsx`
2. `pnpm --filter @ruum/app-usuario exec vitest run src/app/preguntas-frecuentes/PreguntasFrecuentes.test.tsx "src/app/viajes/[id]/PasaporteDigitalSegmentado.test.tsx"`
3. `pnpm --filter @ruum/app-usuario typecheck`
4. `node docs/remediacion-ux009/generar-fixture.cjs`
5. `node docs/remediacion-ux009/verificar-navegador.cjs`

correccion.diff contiene los cambios del ticket; para InicioDesktop se incluye únicamente la modificación de contenido sobre el archivo de trabajo, preservando los cambios previos de otros tickets. Los archivos nuevos también se incluyen.

## Pendiente para liberación

Solicitar reauditoría de UX-09 y decisión explícita de salida P2. RUUM-UX-GATE debe verificar atención real, entrega del correo de emergencia, canales, notificaciones y seguimiento. Estas comprobaciones operativas estaban fuera del alcance de UX-009 y no se declaran realizadas.
