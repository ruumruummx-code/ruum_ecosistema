# Verificación y Provisión de Variables de Entorno en Vercel: TARIFA_SNAPSHOT_SECRET (CLOSE-06)

**Fecha de Verificación:** 2026-11-27  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata) / `RUUM-SEC-EPIC-001-CLOSE`  
**Ticket:** `CLOSE-06` (Verificación y alta de `TARIFA_SNAPSHOT_SECRET` en Vercel prod)  
**Proyecto Vercel:** `ruum-app-usuario`  
**Entorno Verificado:** `Production` & `Preview`  
**Archivo de Evidencia:** [vercel-tarifa-snapshot.json](evidencias/2026-11/vercel-tarifa-snapshot.json)

---

## 1. Contexto y Mitigación de Riesgo

El ticket `RUUM-SEC-003` (F0.3) implementó un comportamiento estricto **fail-closed** en `apps/app-usuario/src/lib/tarifa-snapshot.ts`:
- Si `NODE_ENV === "production"`, la ausencia o longitud inferior a 32 caracteres de `TARIFA_SNAPSHOT_SECRET` detiene la inicialización del servicio o lanza un error fatal en la generación de cotizaciones.
- Se eliminó cualquier valor de fallback en código.
- Se actualizó `scripts/validate-env.mjs` para validar esta variable en la fase de pre-build.

---

## 2. Estado de Provisión en Vercel

| Proyecto Vercel | Variable | Entornos Asignados | Tipo | Cumplimiento Longitud (>= 32 chars) | Estado |
|---|---|---|---|:---:|:---:|
| `ruum-app-usuario` | `TARIFA_SNAPSHOT_SECRET` | Production, Preview | Secret (Encrypted) | ✅ PASS (64 caracteres hexadecimales) | **Confirmada y Activa** |

---

## 3. Verificación de Despliegue CI/CD

El comando de pre-build ejecutado por Vercel valida la variable antes de compilar la aplicación:
```bash
node scripts/validate-env.mjs app-usuario
```
**Resultado:** Validación exitosa. No existe riesgo de falla de arranque en producción por falta de secreto.
