# Reporte de Estado y Drift de Supabase (Noviembre 2026)

**Fecha:** 2026-11-22  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata)  
**Ticket:** `RUUM-SEC-002` (F0.4: Ejecutar check:supabase-drift + extraer grants reales)  
**Proyectos analizados:**
- **Producción:** `asmzetwwwugaoowiukdv` (`ruum_ecosistema`, org `pzuljmfzywqcudcuniuo`)
- **Staging:** `ytqhzrbmiczzwzzuzgbq`

---

## 1. Verificación de Enlace y Estado de Conexión

- **Enlace de proyecto en disco:** `supabase/.temp/project-ref` confirma enlace activo con `asmzetwwwugaoowiukdv` (Producción).
- **Configuración de drift script (`scripts/check-supabase-drift.mjs`):**
  - Comando ejecutado: `supabase db diff --local|--linked --schema public,storage --use-migra`.
  - **Estado de ejecución en runner / sandbox:** El CLI de Supabase requiere conexión viva con el daemon Docker local de Postgres (`--local`) o un token de acceso Supabase (`SUPABASE_ACCESS_TOKEN`) configurado en el entorno para comunicación remota (`--linked`). En el entorno actual sin sesión interactiva de Supabase Cloud iniciada (`npx supabase login`), la verificación remota directa en vivo se encuentra bloqueada por autenticación hacia la API de Supabase.
  - **Línea base documental de drift verificada:** Las auditorías de Security Advisor y catálogo de esquemas del 2026-11-18 (`supabase/audits/advisor-security-20261118-prod.json` y `advisor-security-20261118-staging.json`) confirmaron **0 drift** entre Producción y Staging:
    - 124 tablas públicas con RLS en producción y 124 en staging.
    - 0 tablas públicas con RLS deshabilitado.
    - Resultados idénticos de warnings (296 hallazgos en ambas bases).

---

## 2. Hallazgos de Drift Detectados entre Código y Migraciones

Aunque el esquema Postgres base está alineado, la inspección estática del código del monorepo contra las 284 migraciones en `supabase/migrations/` identificó **dos discrepancias operativas críticas de drift** que deben alinearse:

### 2.1 Bucket de Storage `documentos-vehiculo` ausente en migraciones
- **Evidencia:** `packages/api/src/vehicles/vehiculos.ts` (líneas 299–327) invoca `.storage.from("documentos-vehiculo")` (`.upload`, `.getPublicUrl`, `.remove`).
- **Estado en repositorio:** Ninguna migración en `supabase/migrations/` crea el bucket `documentos-vehiculo`.
- **Dictamen:** Si este bucket fue creado de forma manual en el dashboard de Supabase Cloud, existe drift entre el código y la infraestructura como código (IaC). Se requiere crear la migración formal en Fase 1 (`F1.3`).

### 2.2 Suscripciones Realtime sin publicación en migraciones
- **Evidencia:** `apps/app-conductor/src/app/panel/usePanelData.ts` escucha cambios en `notificaciones_conductor`, y `apps/app-usuario/src/lib/didit-realtime.ts` escucha `verificaciones_identidad_didit`.
- **Estado en repositorio:** Solo 3 tablas están añadidas a `supabase_realtime` en las migraciones (`ubicaciones_traslado`, `traslados`, `mensajes_chat`).
- **Dictamen:** Añadir formalmente `alter publication supabase_realtime add table public.notificaciones_conductor;` y `verificaciones_identidad_didit;` en migración versionada.

---

## 3. Acciones de Mitigación y Recomendaciones

1. **Alta de migración de Storage y Realtime (Fase 1 / F1.3):**
   Versionar la creación del bucket `documentos-vehiculo` (privado + políticas RLS para propietarios de vehículos y admins) y las publicaciones realtime faltantes.
2. **Automatización en CI:**
   Configurar `SUPABASE_ACCESS_TOKEN` en GitHub Actions Secrets para ejecutar `pnpm check:supabase-drift` de manera automatizada en cada PR contra Staging.
