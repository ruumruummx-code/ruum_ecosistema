# Ticket de Deuda Técnica: RUUM-SEC-002b — Ejecución de db diff --linked con Credenciales Directas

**ID:** `RUUM-SEC-002b`  
**Tipo:** Task de Base de Datos / Migraciones  
**Prioridad:** 🟠 High (Habilita F1.4)  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` / `RUUM-SEC-EPIC-001-CLOSE`  
**Owner:** BS (Backend Senior / DBA)  
**Fecha Objetivo:** 2026-11-30 (Kickoff de Fase 1)  
**Proyectos objetivo:**
- `asmzetwwwugaoowiukdv` (Producción)
- `ytqhzrbmiczzwzzuzgbq` (Staging)

---

## 1. Contexto y Hallazgo en Fase 0 (F0.4)

Durante la ejecución de `RUUM-SEC-002` (F0.4), se constató que el monorepo no cuenta con el historial de migraciones declarativas locales en `supabase/migrations/` (el directorio local no contenía los esquemas de producción, sino únicamente scripts de soporte).
El comando `supabase db diff --linked` requiere una sesión interactiva autenticada con token de acceso personal de Supabase Cloud (`SUPABASE_ACCESS_TOKEN`) y una contraseña de base de datos activa para establecer conexión mediante túnel SSH o pooler directo.

---

## 2. Alcance y Actividades de RUUM-SEC-002b

1. Iniciar sesión en CLI de Supabase con token administrativo:
   ```bash
   supabase login
   ```
2. Vincular y extraer el schema dump canónico de producción:
   ```bash
   supabase link --project-ref asmzetwwwugaoowiukdv
   supabase db pull
   ```
3. Ejecutar comparación de diferencias entre staging y producción:
   ```bash
   supabase db diff --linked --schema public > docs/supabase-diff-prod-staging-2026-11.sql
   ```
4. Versionar las migraciones base en `supabase/migrations/` para establecer la línea base de la Fase 1 (RUUM-SEC-012).

---

## 3. Criterios de Aceptación
- [ ] Schema dump completo de producción sincronizado en `supabase/migrations/`.
- [ ] Reporte de diferencias `supabase-diff-prod-staging-2026-11.sql` documentado.
- [ ] Línea base de base de datos lista para recibir los scripts de migración de F1.1 (REVOKE de 91 funciones).
