# Auditoría de preparación para producción — App Usuario

Fecha: 19 de noviembre de 2026, America/Mexico_City. Dictamen: **NO GO**.

Se bloquea una liberación general y la aprobación del servicio actualmente publicado hasta cerrar los hallazgos críticos de autorización documental. La disponibilidad del sitio y un despliegue READY no acreditan seguridad ni integridad operacional.

## Alcance y trazabilidad

- Código: `c38ed2dec8490919b3183672541b48d08e70c727`, árbol inicialmente limpio, Node 24.13.0, pnpm 10.0.0.
- Aplicación: `apps/app-usuario`; dependencias compartidas, migraciones y Edge Functions utilizadas por sus flujos.
- Sitio observado: `https://www.usuario.ruumruum-moviliax.online`. El dominio sin `www` redirige al anterior.
- Vercel: proyecto `ruum-ecosistema-kcct`, despliegue `dpl_JosiDANQgwuh6sxT8XxH1fbNTAsQ`, Production READY, mismo commit. [Registro de despliegue](https://vercel.com/ruumruumconductor/ruum-ecosistema-kcct/JosiDANQgwuh6sxT8XxH1fbNTAsQ).
- Supabase principal: `asmzetwwwugaoowiukdv`, identificado también en la CSP del sitio. Existe un proyecto separado `ruum-ruum-staging` (`ytqhzrbmiczzwzzuzgbq`); esta auditoría no presupone que sus controles sean iguales a los del principal.
- Inspección remota de solo lectura: privilegios, definiciones SQL, advisors, inventario de funciones, migraciones y estado de jobs. No se ejecutaron transiciones documentales, reclamaciones de colas, cobros, borrados, despliegues ni cambios de configuración.
- Prueba pública en Chromium: login, registro, privacidad y acceso privado sin sesión, en 390×900 y 1440×900. No se enviaron formularios.

No se certificó una operación completa con dos cuentas reales, identidad, SMS, pago y entrega; tampoco una compilación Android firmada ni restauración de backups. Estas ausencias son gates pendientes, no defectos de funcionamiento demostrados.

## Hallazgos que bloquean producción

### AU-01 — Crítico: instrucciones de borrado documental accesibles sin autorización

**Confirmado en el proyecto principal.** `encolar_limpieza_documento`, `reclamar_lote_limpieza_documentos` y `registrar_resultado_limpieza_documento` son `SECURITY DEFINER`; `anon` y `authenticated` conservan permiso efectivo de ejecución. Sus cuerpos no validan sesión, rol ni propiedad. Lo mismo ocurre con las tres funciones equivalentes de fotos de perfil.

La función de encolado acepta `p_usuario_id` y `p_storage_path` del llamante. El FK exige un usuario existente, pero no vincula el objeto al llamante ni al usuario indicado. En documentos, el CHECK limita los buckets a `documentos-cuenta` y `documentos-identidad`; no limita el propietario del path.

El worker desplegado `limpiar-documentos-cuenta-obsoletos`, versión 2 ACTIVE, crea un cliente de servicio y borra `doc.storage_path` en `doc.bucket`. Su autenticación HTTP protege la ejecución del worker, pero no la procedencia de los registros que consume. Un registro malicioso puede provocar borrado ajeno cuando el worker lo procese. Reclamar lotes también devuelve paths/usuarios y cambia su estado; registrar resultados permite falsear o impedir la limpieza. No se explotó este camino.

Evidencia: `supabase/migrations/20261105000001_flujo13_documentos_reemplazo_maquina_estados.sql:82`, `:119`, `:156`; fotos en `supabase/migrations/20261104000008_flujo12_cola_limpieza_fotos_perfil_dlq.sql:30`; worker `supabase/functions/limpiar-documentos-cuenta-obsoletos/index.ts:67`; [privilegios efectivos](evidence/auditoria-usuario-2026-11-19/permisos-rpc.json).

**Cierre exigido:** revocar EXECUTE de PUBLIC/anon/authenticated en las funciones de worker; mantener service_role explícito. Encolado solo desde infraestructura o con propiedad y motivos autorizados comprobados. Verificar nuevamente el objeto y su elegibilidad antes del borrado. Agregar pruebas anon/usuario A/usuario B/servicio y comprobar que los privilegios efectivos no reaparecen tras todas las migraciones.

### AU-02 — Crítico: estado de documentos verificable por un actor no autorizado

**Confirmado en el proyecto principal.** `transicionar_estado_documento_cuenta(uuid,text,text,uuid,text,timestamptz)` es `SECURITY DEFINER` y ejecutable por anon/authenticated. Obtiene el documento por ID y actualiza su estado sin consultar identidad ni permisos. `p_actor` y `p_actor_id` provienen del llamante. Las restricciones de transición no sustituyen autorización: un documento recibido/en revisión puede marcarse verificado o rechazado y generar historial con actor declarado.

Esto permite adulterar la revisión documental con conocimiento de un ID, incluso de un documento propio. No se afirmó que esta RPC por sí sola apruebe toda la cuenta KYC; el impacto confirmado es la integridad del documento y su historial.

Evidencia: migración anterior, líneas 242–327; definición desplegada consultada y permiso efectivo registrado en `permisos-rpc.json`.

**Cierre exigido:** reservar la transición a un servicio o actor administrativo autorizado; derivar el actor de la identidad validada; probar rechazo anónimo, usuario propietario sin permiso de revisión y usuario ajeno, además de transiciones válidas del revisor.

### AU-03 — Alto: inyección anónima de observabilidad privilegiada

**Confirmado por privilegios y cuerpo desplegado.** `obs_registrar_log` permite EXECUTE a anon. Su condición de rechazo es `auth.uid() is not null and not public.es_admin()`: un llamante anónimo tiene UID nulo y evita ese rechazo. La función inserta eventos como servicio/nombre/identificadores elegidos por el llamante, sujeto a validaciones de formato y filtro de datos sensibles.

Impacto: contaminación de telemetría y consumo de almacenamiento; los límites Redis de Next no protegen un RPC directo de Supabase. No se insertaron eventos de prueba.

Evidencia: `supabase/migrations/20260908000011_observabilidad_auditoria.sql:97`, definición remota y `permisos-rpc.json`.

**Cierre exigido:** revocar acceso público y comprobar positivamente rol autorizado; probar que anon no escribe y que el canal de infraestructura sigue funcionando.

### AU-04 — Alto: el control de seguridad de CI no detecta los bloqueos anteriores

`pnpm check:supabase-security` aprobó. El script inspecciona GRANT de tablas a anon y excluye snapshots generados; no determina privilegios efectivos de funciones, EXECUTE heredado de PUBLIC, ni autorización en cuerpos SECURITY DEFINER. Por ello su resultado verde no puede usarse como certificado de seguridad SQL.

**Cierre exigido:** agregar pruebas de privilegios efectivos sobre el esquema migrado y de autorización de funciones sensibles; incluir resultados remotos antes de promover una versión. Un GRANT solo a service_role no revoca el permiso por defecto de PUBLIC. Véase la [documentación oficial de permisos de funciones](https://supabase.com/docs/guides/database/functions).

## Calidad, configuración y operación

| Área | Evidencia observada | Evaluación |
| --- | --- | --- |
| Tipos | `pnpm --filter @ruum/app-usuario typecheck`: exit 0 | Conforme |
| Lint | Exit 0; advertencia de dependencia `ubicacion` en `MapaUbicacion.tsx:63` | Conforme con deuda menor |
| Estilos | Exit 0; 5 zonas migradas, 5,706 coincidencias heredadas frente a baseline 5,731 | Respeta el gate actual; no equivale a migración visual completa |
| Fronteras | Cero accesos directos no justificados en las tres apps | Conforme |
| Tokens y casts RPC | Paridad de colores JSON/CSS aprobada; control RPC aprobado, 46 casts frente a baseline 46 | Conformes con sus gates actuales |
| Migraciones | Convención aprobada; 277 versiones locales y 277 remotas, sin faltantes en ambas direcciones | Coincidencia de historial; no prueba igualdad de definiciones/checksums ni restauración desde cero |
| Seguridad SQL estática | Exit 0 | Insuficiente por AU-04 |
| Build habitual | Prebuild falla: `MAPBOX_SECRET_TOKEN` no empieza con `sk.` y `PHONE_VERIFY_SECRET` no cumple 32 caracteres | Entorno local no reproducible con su configuración actual; no demuestra que Vercel use esos valores |
| Build con sustitución local | Exit 0; se reemplazaron solo esas dos variables en el proceso por valores sintéticos y se habilitó `RUUM_LOCAL_PRODUCTION` | Compila; no acredita credenciales reales. Advierte dependencia circular de chunks y hook de mapa |
| Secretos | Scanner falla con 11 hallazgos en `.env.production.local` y `supabase/.env.staging` | Ambos archivos están ignorados y no versionados. Presencia local confirmada; no se demostró filtración en Git. No se copiaron valores al informe |
| Dependencias | `pnpm audit --audit-level=high --json`: exit 1; metadata 2 altas, 22 moderadas, 3 bajas, 0 críticas | JSON detallado visible solo enumera 19 moderadas y 3 bajas; existen exclusiones GHSA en package.json. Resolver discrepancia/alcance antes de dar este gate por aprobado; no atribuir automáticamente las altas al runtime de App Usuario |
| Shared | 5 pruebas CSP aprobadas | Cobertura de este paquete limitada a ese archivo |
| API compartida | `pnpm --filter @ruum/api test`: exit 0 con “No test files found”, `passWithNoTests: true` | No aporta evidencia de pruebas propias de servicios; las pruebas de la app no sustituyen automáticamente esta cobertura |
| Chromium público | 8 navegaciones correctas, cero `pageerror`, sin overflow horizontal | Smoke público aprobado; no cubre área autenticada ni métricas Core Web Vitals |
| Accesibilidad pública | axe-core 4.14.0, WCAG 2/2.1 A/AA, 390×900: cero infracciones automáticas en login, registro y privacidad | Pendientes manuales: contraste en 13 nodos de login y valores ARIA en 2 nodos de registro. No equivale a certificación de accesibilidad |
| Cabeceras públicas | CSP con nonce/strict-dynamic, HSTS, nosniff y no-store en login/registro | Conforme en muestra HTTP |
| Acceso privado | `/viajes/nuevo` redirige al login; reconciliador interno responde 401 sin secreto | Conforme en muestra anónima |
| Reconciliación | 5 jobs activos, últimas ejecuciones cron exitosas; respuestas HTTP 200 de workers individual y masivo | Se verificó ejecución, no solo encolado. No demuestra recuperación de un cobro real |
| Storage | 6 buckets privados, incluidos identidad, cuenta, evidencia y fotos | Buen control base; no neutraliza RPCs privilegiados vulnerables |

### Otros riesgos y deuda

- Advisor de seguridad: 94 avisos de funciones SECURITY DEFINER ejecutables por anon y 194 por authenticated. No todos son vulnerabilidades: algunas funciones revisadas sí comprueban propiedad/permisos. Los casos AU-01 a AU-03 se confirmaron inspeccionando cuerpos y privilegios.
- `conductores_publicos` usa `security_invoker=false`, lectura permitida a authenticated y denegada a anon. Proyecta solo ID, estado, nivel y calificación de conductores activos/modo prueba. El advisor lo marca ERROR; requiere una decisión explícita sobre visibilidad transversal, no puede declararse filtración de documentos o teléfonos.
- Protección contra contraseñas filtradas desactivada según advisor. Revisar como endurecimiento de autenticación.
- Rendimiento SQL: 15 FKs sin índice de cobertura, 83 avisos de reevaluación de Auth en RLS y 549 de políticas permisivas múltiples. Son hallazgos de configuración, no mediciones de saturación; no eliminar índices/políticas sin verificar uso y autorización.
- Android: el asset generado `android/app/src/main/assets/capacitor.config.json:32` contiene `webContentsDebuggingEnabled: true`; la fuente condiciona el valor a NODE_ENV. No se aprobó una distribución nativa. Exigir sincronización en producción, inspección del artefacto firmado y pruebas en dispositivo. Manifest deshabilita backup y tráfico cleartext.
- El build informa 439 kB de First Load JS en nuevo traslado y 350 kB en pasaporte; es presupuesto de bundle, no latencia medida. Priorizar medición móvil real antes de concluir que se cumplen objetivos de rendimiento.
- Interfaz, deuda media: `src/app/ubicaciones/page.tsx` monta simultáneamente `UbicacionesMovil` y `UbicacionesDesktop` y los alterna por CSS. No cumple la regla de un componente responsivo del repositorio y mantiene dos árboles/estados. Debe unificarse al migrar esa pantalla; no se atribuyó a este patrón una pérdida de datos que no se haya reproducido.
- Documentación desactualizada: README de App Usuario mezcla pendientes antiguos con funcionalidades actuales; `flujo6-production-verification.md` contiene evidencia histórica de commits distintos y verificaciones aún pendientes. Las afirmaciones “CUMPLIDO” de otros documentos no se tomaron como reproducción de esta auditoría.

## Pruebas funcionales y límites

La suite principal de App Usuario se ejecutó completa dos veces. La corrida final con cobertura y dos workers terminó con **1,150 aprobadas, 3 fallidas y 2 omitidas**. La cobertura supera los umbrales configurados, pero el gate global sigue en rojo por las tres pruebas fallidas.

La primera corrida completa terminó con **1,148 aprobadas, 5 fallidas y 2 omitidas** (166 archivos, 827.94 s). Los fallos fueron:

- Dos casos de integración de login buscan un botón `/iniciar sesión/i`, mientras el formulario actual presenta `Ingresar`. Se reproducen en la corrida con cobertura. El test se detiene antes de acreditar autenticación/redirección; no demuestra que el login real falle ni que exista un open redirect.
- La aserción de breakpoint literal 768px en `layout-no-scroll.test.tsx` falla también al repetirla. Compara texto fuente; no demuestra por sí sola un defecto visual.
- El límite temporal de chat (`ChatYSeguimiento.test.tsx`) y el benchmark in-process de registro (p95 1,270 ms frente a límite 1,200 ms) fallaron en la corrida paralela al build. Ambos aprobaron al repetir los tres archivos con un worker: **11 aprobadas y 1 fallida** (solo CSS). No se consideran por sí solos fallos de producción.

La suite requiere mantenimiento de selectores/aserciones y control determinista del reloj. No se alteraron pruebas ni aplicación durante esta auditoría.

Las pruebas E2E usan Supabase y Redis simulados por defecto. El spec Stripe requiere `PLAYWRIGHT_STRIPE_TEST=1`, y aun activado sustituye respuestas de creación de traslado/consulta de pago; no prueba el circuito completo Stripe → webhook → base. Los tests responsive de navegador están omitidos por defecto salvo `RUN_RESPONSIVE_UI=1`. No se ejecutó la suite privada completa ni Lighthouse en esta sesión.

Los scripts k6 admiten respuestas 400/401/429 como resultados esperados, usan OTP `123456` y permiten continuar con token mock; sirven para evaluar rechazos/rate limit, pero su aprobación no demuestra throughput de altas, cotizaciones y cobros exitosos. No se lanzó carga contra producción ni SMS reales.

## Condiciones para cambiar a GO

1. **Seguridad/backend:** cerrar AU-01, AU-02 y AU-03 mediante migraciones versionadas; probar permisos efectivos y ataques entre cuentas en staging, luego verificar los mismos privilegios en el proyecto principal. Revisar las otras funciones privilegiadas por familias y resolver AU-04.
2. **QA:** suite completa y cobertura sobre el commit corregido en verde; resolver el test CSS y estabilizar las pruebas temporales sin reducir aserciones de negocio. Conservar evidencia con commit, entorno y fecha.
3. **Integraciones:** en staging aislado ejecutar alta/SMS/confirmación de correo/recuperación/KYC, cotización y pago individual/masivo con Stripe sandbox; webhook duplicado, demorado y fuera de orden; reembolso, timeout y reconciliación. Contrastar estado de proveedor con pagos, traslados e historial. Verificar también rechazo cruzado entre dos usuarios.
4. **Operación:** demostrar entrega de una alerta controlada, seguimiento Realtime autenticado y reconexión, procedimiento de soporte ante pago pendiente, recuperación de backup y rollback de aplicación compatible con el esquema.
5. **Rendimiento y experiencia:** carga con sesiones válidas y operaciones exitosas separada de escenarios 429; objetivos de latencia y error acordados; Lighthouse y accesibilidad en flujos privados/móvil, teclado, foco, red degradada y permisos de ubicación.
6. **Release:** validar configuración del entorno destino y coherencia Stripe test/live sin publicar secretos; aclarar el resultado de auditoría de dependencias. Para Android, revisar el AAB/APK firmado y desactivar debugging en el artefacto.

No hay una aprobación condicional para producción mientras persistan AU-01 o AU-02. Si el sitio ya tiene usuarios, estos hallazgos requieren contención prioritaria por el equipo responsable.

## Artefactos de esta auditoría

- [Smoke público y resultados](evidence/auditoria-usuario-2026-11-19/smoke-publico.json), [login móvil](evidence/auditoria-usuario-2026-11-19/login-390.png), [login escritorio](evidence/auditoria-usuario-2026-11-19/login-1440.png), [accesibilidad pública](evidence/auditoria-usuario-2026-11-19/accesibilidad-publica.json).
- [Privilegios SQL](evidence/auditoria-usuario-2026-11-19/permisos-rpc.json), [resumen advisors](evidence/auditoria-usuario-2026-11-19/advisors-resumen.json), [versiones migradas](evidence/auditoria-usuario-2026-11-19/migraciones-remotas.json).
- [Pruebas shared](evidence/auditoria-usuario-2026-11-19/shared-tests.log), [pruebas API](evidence/auditoria-usuario-2026-11-19/api-tests.log), [repetición de fallos](evidence/auditoria-usuario-2026-11-19/retest-fallos.log), [48 pruebas SQL](evidence/auditoria-usuario-2026-11-19/sql-tests.log).
- [Build](evidence/auditoria-usuario-2026-11-19/build.log), [auditoría de dependencias](evidence/auditoria-usuario-2026-11-19/dependencias.json), [consultas remotas reproducibles](evidence/auditoria-usuario-2026-11-19/comprobaciones-solo-lectura.sql).

## Resultados finales de ejecución

| Validación final | Resultado |
| --- | --- |
| Suite con cobertura, 2 workers | 162 archivos aprobados, 2 fallidos, 2 omitidos; 1,150 pruebas aprobadas, 3 fallidas, 2 omitidas; 459.47 s |
| Fallos persistentes | 2 selectores de login desactualizados y 1 aserción CSS de breakpoint; chat y benchmark aprobaron |
| Cobertura | Líneas/sentencias 80.68%, ramas 75.90%, funciones 76.19%; supera umbrales 70/60/70/70 |
| Build con sustituciones locales descritas | Exit 0; dependencia circular de chunks y advertencia del hook de mapa |
| SQL local | 48 pruebas aprobadas en 2 archivos; no se recreó la base desde cero |
| Publicación o remediación | Ninguna. Solo se añadieron informe y evidencia; no se modificó el código de la app, dependencias ni producción |

[Log de la suite final](evidence/auditoria-usuario-2026-11-19/suite-final.log) y [resultado JSON](evidence/auditoria-usuario-2026-11-19/suite-final.json).

**Decisión final: NO GO.** Los controles de publicación y UI observados funcionan en la muestra, pero AU-01 y AU-02 permiten operaciones documentales privilegiadas sin autorización efectiva. Se exige corregirlas y verificar sus regresiones antes de aprobar producción.
