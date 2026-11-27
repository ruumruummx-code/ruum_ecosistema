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

---

## 4. RUUM-SEC-002b — Comparación completa Producción vs Staging (2026-11-27)

**Método.** Se consultó el catálogo de ambos proyectos (vía Supabase MCP, solo lectura) y se compararon huellas md5 por categoría. Esto sustituye la parte prod↔staging de `db diff --linked`; la parte migraciones↔remoto (shadow DB) sigue pendiente de correr con credenciales (ver §4.4).

### 4.1 Resultado por categoría

| Categoría | Producción | Staging | ¿Igual? |
|---|---|---|---|
| Historial de migraciones | 299 (máx. `20261127130000`) | 299 (máx. `20261127130000`) | ✅ (y coincide 1:1 con `supabase/migrations/`) |
| Columnas (public, storage, private, extensions) | 1688 | 1688 | ✅ |
| Funciones public/private: cuerpo, `search_path`, SECURITY DEFINER | 362 | 362 | ✅ |
| Funciones: ACL (EXECUTE) | — | — | ❌ 6 funciones (ver §4.2) |
| Políticas RLS | 300 | 300 | ✅ |
| Índices | 449 | 449 | ✅ |
| Triggers | 137 | 137 | ✅ |
| Grants de tablas | 3851 | 3851 | ✅ |
| RLS habilitado por tabla | 143 | 143 | ✅ |
| Buckets de Storage | 7 | 7 | ✅ (incluye `documentos-vehiculo`, drift §2.1 resuelto por `20261123000005`) |
| Publicación `supabase_realtime` | igual | igual | ✅ (drift §2.2 resuelto). Prod lista además particiones diarias de `realtime.messages` (gestionado por la plataforma, no es drift) |
| Cron jobs | 5 | 5 | ✅ |
| Extensiones | 9 | 9 | ⚠️ solo `supabase_vault` 0.3.1 (prod) vs 0.3.2 (staging): gestionada por la plataforma, no requiere migración |

### 4.2 Drift real: ACL de funciones

| Función | Producción | Staging | Esperado (migraciones) |
|---|---|---|---|
| `auth_es_conductor_de_traslado(uuid,uuid)` | service_role | authenticated, service_role | authenticated, service_role |
| `auth_es_conductor_de_traslado_activo(uuid,uuid)` | service_role | authenticated, service_role | authenticated, service_role |
| `auth_es_usuario_de_traslado(uuid)` | service_role | authenticated, service_role | authenticated, service_role |
| `empresa_tiene_permiso(uuid,text)` | service_role | authenticated, service_role | authenticated, service_role |
| `mis_empresas_miembro()` | service_role | authenticated, service_role | authenticated, service_role |
| `usuario_cancela_traslado` (2 sobrecargas) | **authenticated**, service_role | **anon**, service_role | solo service_role |

**Impacto.**
- Las 5 helpers se usan en políticas RLS de `ubicaciones_traslado` (tracking en vivo), `empresas`, `empresa_miembros`, `empresa_sucursales`, `operaciones`, `sla_empresa_politicas` y `sla_operacion_politicas`. Sin EXECUTE para `authenticated`, esas lecturas fallan en producción con `permission denied for function`. Es el mismo patrón que las migraciones `restaurar_*` del 2026-11-27 corrigieron para `usuario_id_actual`, `conductor_id_actual`, etc.
- `usuario_cancela_traslado` es el camino directo que `20261119000001` cerró (cancelaba traslados pagados sin reembolso). En producción sigue abierto para `authenticated`; en staging está abierto para `anon`. Ningún cliente lo llama ya (la cancelación va por la Edge Function `cancelar-traslado-usuario` → `servidor_cancela_traslado`).

**Remediación.** `supabase/migrations/20261127140000_sec002b_alinear_grants_drift.sql` (idempotente) deja ambos entornos en el estado esperado.

### 4.3 Hallazgo lateral (fuera de alcance de este ticket)

En los logs de Postgres de producción (últimas 24 h) aparecen también `permission denied for function obs_resolver_correlation` (5) y `registrar_evento_registro_conductor_v2` (4). Lote 3 revocó `obs_resolver_correlation` a `authenticated` a propósito; conviene revisar qué ruta de cliente aún la invoca. Los errores de `usuario_id_actual`, `conductor_id_actual`, `empresa_id_del_titular_actual`, etc. son anteriores a las migraciones `restaurar_*` de hoy.

### 4.4 Pendiente con credenciales: migraciones ↔ remoto

Requiere Docker local, `supabase login` y la contraseña de BD de cada proyecto:

```bash
supabase login
# Producción
supabase link --project-ref asmzetwwwugaoowiukdv
supabase db diff --linked --schema public,storage,private > docs/supabase-diff-prod-2026-11.sql
# Staging
supabase link --project-ref ytqhzrbmiczzwzzuzgbq
supabase db diff --linked --schema public,storage,private > docs/supabase-diff-staging-2026-11.sql
# Volver a enlazar producción si ese es el enlace por defecto del repo
supabase link --project-ref asmzetwwwugaoowiukdv
```

Ejecutar **después** de aplicar `20261127140000`. Un archivo vacío (o JSON con `diff` vacío) significa sin drift. Nota: `db diff` no compara ACL de funciones, por eso el drift de §4.2 solo apareció con la consulta de catálogo.
