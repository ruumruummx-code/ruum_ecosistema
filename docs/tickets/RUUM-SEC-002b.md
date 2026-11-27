# Ticket RUUM-SEC-002b: Drift Check Completo de Base de Datos (db diff --linked)

**Metadatos del Ticket:**
- **ID:** `RUUM-SEC-002b`
- **Tipo:** Task
- **Título:** [Fase 1 / Deuda F0.4] Ejecución de drift check completo contra prod y staging con credenciales directas
- **Owner:** DO (DevOps / SRE)
- **Esfuerzo:** 0.5 pd
- **Prioridad:** 🔴 Alta
- **Bloquea a:** `RUUM-SEC-012` (F1.4: Sanitización de esquema y drift local) — Fecha límite de cierre: 2026-12-14
- **Dependencia de:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata / RUUM-SEC-002)
- **Estado:** En curso — comparación prod↔staging hecha el 2026-11-27 (ver `docs/supabase-drift-2026-11.md` §4); falta `db diff --linked` con credenciales

---

## 1. Contexto y Descripción

Durante la Fase 0 (ticket `RUUM-SEC-002` / F0.4), el análisis estático y de advisors identificó dos drifts conocidos:
1. Bucket de Storage `documentos-vehiculo` presente en producción pero no declarado en migraciones locales.
2. Tablas añadidas a la publicación de Supabase Realtime en producción.

Sin embargo, el script `pnpm check:supabase-drift` no pudo ejecutar la comparación completa `supabase db diff --linked` en el pipeline desasistido por requerir sesión autenticada con token de gestión de Supabase (`SUPABASE_ACCESS_TOKEN`) y contraseña de base de datos activa.

### Actividades:
1. Iniciar sesión administrativa con Supabase CLI:
   ```bash
   supabase login
   ```
2. Ejecutar `pnpm check:supabase-drift` (o `supabase db diff --linked`) contra Producción (`asmzetwwwugaoowiukdv`) y Staging (`ytqhzrbmiczzwzzuzgbq`).
3. Mergear el output completo de las diferencias en [supabase-drift-2026-11.md](file:///c:/ruum_ecosistema-main/docs/supabase-drift-2026-11.md).
4. Listar exhaustivamente todos los drifts detectados (esquemas de tablas, índices, extensiones, triggers y publicaciones).
5. Si se identifican drifts estructurales adicionales a los 2 conocidos, emitir tickets de resolución correspondientes para Fase 1.4 o Fase 2.

---

## 2. Criterios de Aceptación

- [ ] Output de `db diff --linked` ejecutado y mergeado para Producción y Staging en `docs/supabase-drift-2026-11.md`.
- [ ] Lista completa de discrepancias documentada con categoría e impacto.
- [ ] Tickets de remediación creados para cualquier drift no contemplado en el roadmap.
- [ ] Cierre formal antes del **2026-12-14** para desbloquear `RUUM-SEC-012` (F1.4).

---

## 3. Riesgos de Incumplimiento

> [!WARNING]
> Si este ticket no se resuelve antes del 2026-12-14, la tarea `RUUM-SEC-012` (F1.4) deberá ejecutarse considerando únicamente los dos drifts conocidos (Storage y Realtime), obligando a que cualquier discrepancia oculta sea absorbida posteriormente en la Fase 2 (F2.5), extendiendo la ventana de deuda de base de datos.
