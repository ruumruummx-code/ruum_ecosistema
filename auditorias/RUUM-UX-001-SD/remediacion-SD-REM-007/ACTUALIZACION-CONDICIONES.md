# Actualización de condiciones · 2026-11-07

**SD-REM-004 y SD-REM-007: APROBADOS CON CONDICIONES. P2-1 NO CERRADA.** Esta es la decisión vigente del usuario; no transforma las pruebas automáticas en sesión asistiva ni en firmas de las áreas.

1. **Revisión del expediente 004 realizada.** `../remediacion-SD-REM-004/SESION-ASISTIVA-SD-REM-004.md` se marca NO VÁLIDO PARA EL GATE, conservando su texto histórico. Anuncios, participantes genéricos y firmas sin respaldo no se aceptan. El manifiesto antiguo de 004 queda retirado como sello vigente mediante `ESTADO-MANIFIESTO-ANTIGUO.md`, sin alterar sus bytes; copia en `sellos-pre-sesion/manifiesto-antiguo-004.json`.
2. **Sesión asistiva pendiente.** El guion conjunto está en `SESION-AT.json`. Requiere operador nominal, transcriptor distinto, sistema, lector/versión, navegador/versión, anuncios literales, intentos de activación, Tab/Shift+Tab, rehabilitación, fecha y respaldo verificable con ruta/hash. Los campos siguen vacíos; no hay personas designadas ni una sesión ejecutada. Esta sesión depende de participantes y equipo de lectura reales.
3. **Firmas pendientes.** Frontend Plataforma y Accesibilidad deben registrar responsable nominal, decisión, fecha y evidencia de firma. H Manuel es responsable de coordinación informado y delegó la decisión técnica, no la co-revisión de ambas áreas. `DECISION-Y-FIRMAS.md` y `estado-gate.json` conservan esa distinción.
4. **Co-revisión de Diseño pendiente.** Se añade solicitud específica a `../CO-REVISION.md`: evaluar `--ruum-on-primary` en NextOperationalAction con ambos temas/estados y degradado, junto con revisiones anteriores. Resultados de contraste no se presentan como firma de Diseño. No se enviaron mensajes a terceros.
5. **Sellado en dos fases preparado.** El manifiesto vigente antes de esta revisión y su sello se preservan byte a byte en `sellos-pre-sesion/manifiesto-original.json` y `.sha256`. `registro-preservacion.json` añade el hash del commit base y hashes de los archivos preservados. El manifiesto actualizado registra `sourceState.baseCommit`, estado de trabajo sin commit y hashes del código probado; HEAD no se confunde con un commit que contenga el cambio. El manifiesto raíz actualizado sigue siendo **pre-sesión**. Solo tras sesión/respaldo/firmas se podrá generar `manifiesto-post-sesion.json` con `--post-session`, sin sobrescribir los anteriores. Ese modo rechaza participantes idénticos, campos AT incompletos, respaldo cuyo hash no coincida o firmas faltantes. Generar un sello nunca cierra por sí mismo P2-1.
6. **Cambio de alcance declarado.** El barrido fuente encuentra consumidores únicamente en `app-conductor`: dos sitios MobileRow en preferencias y dos NextOperationalAction en componentes de contacto sin montaje desde rutas actuales. No se afirma remediación de consumidores de esos componentes en app-usuario, porque no existen en su código actual. La evidencia de conductor se limita al inventario/análisis estático, TypeScript, dos pruebas de consumidor y harness de componentes compartidos; **no hay captura ni recorrido asistivo de una ruta real de app-conductor**. Las capturas del harness no se presentan como integración de esa app. Una futura exigencia de evidencia real de app-usuario requerirá primero identificar un consumidor; no se modifica una ruta artificialmente para aparentar cobertura.
7. **Contrato protegido por prueba automatizada.** `packages/ui/src/components/composition-contract.test.ts` entra en `pnpm --filter @ruum/ui test`: rechaza handlers de activación (incluidas fases capture) y spreads no verificables en ancestros JSX de los componentes, wrappers transitivos identificados, layouts de sus rutas y providers revisados. Comprueba alias importados y miembros JSX. Incluye casos negativos que prueban la detección, y positivos para handlers propios/hermanos. Suite: **45 pruebas aprobadas**; build UI correcto. Es una protección de composición estática; no certifica DOM creado dinámicamente, listeners imperativos externos ni transformaciones arbitrarias de terceros.

## Operación de sellado

```
# Actualizar sello pre-sesión después de cambios al expediente
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs --check

# ÚNICAMENTE tras sesión real, respaldo y firmas en SESION-AT.json/estado-gate.json
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs --post-session
node auditorias/RUUM-UX-001-SD/remediacion-SD-REM-007/sellar-evidencia.cjs --post-session --check
```

No generar ahora sello post-sesión ni declarar cierre. Las revisiones históricas permanecen para trazabilidad; esta actualización y `estado-gate.json` definen el estado vigente.
