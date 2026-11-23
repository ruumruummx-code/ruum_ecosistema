# Ticket de Operación: RUUM-SEC-003-Vercel — Provisión de TARIFA_SNAPSHOT_SECRET en Vercel Prod

**ID:** `RUUM-SEC-003-Vercel`  
**Tipo:** Task Operativa / Infraestructura  
**Prioridad:** 🔴 Blocker para Despliegue en Producción  
**Epic Vinculado:** `RUUM-SEC-EPIC-001` (Fase 0: Mitigación Inmediata) / `RUUM-SEC-EPIC-001-CLOSE`  
**Owner:** DevOps / Cloud Lead / Release Manager  
**Fecha Objetivo:** Previo al despliegue a producción de `app-usuario` (2026-11-28)

---

## 1. Contexto

Con la resolución de `RUUM-SEC-003` (F0.3), el código en `apps/app-usuario/src/lib/tarifa-snapshot.ts` implementa un comportamiento estricto **fail-closed**:
Si `NODE_ENV === "production"`, la variable `TARIFA_SNAPSHOT_SECRET` es obligatoria y debe contar con una longitud mínima de **32 caracteres**. Si falta o no cumple la entropía requerida, cualquier intento de generar o verificar un snapshot de cotización de viaje lanzará una excepción fatal bloqueante:
```typescript
throw new Error("TARIFA_SNAPSHOT_SECRET faltante o longitud insuficiente (mínimo 32 caracteres) en producción");
```

---

## 2. Procedimiento de Provisión

### Paso 1: Generación de Secreto Criptográfico
Ejecutar en terminal segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*(Debe producir una cadena hexadecimal de 64 caracteres).*

### Paso 2: Alta en Vercel Dashboard / CLI
1. En el proyecto `ruum-app-usuario` en Vercel:
   - Ir a **Settings** -> **Environment Variables**.
   - Nombre: `TARIFA_SNAPSHOT_SECRET`
   - Valor: `<secreto_generado>`
   - Entornos: Marcar **Production** y **Preview** (desmarcar Development para permitir fallbacks locales).
   - Tipo: **Secret (Encrypted)**.
   - Clic en **Save**.
2. O vía Vercel CLI:
   ```bash
   vercel env add TARIFA_SNAPSHOT_SECRET production
   ```

---

## 3. Criterios de Aceptación
- [ ] Variable `TARIFA_SNAPSHOT_SECRET` provisionada en Vercel para el entorno Production con >= 32 caracteres.
- [ ] Validación de prebuild `node scripts/validate-env.mjs app-usuario` ejecutada exitosamente en el runner CI/CD.
- [ ] Verificación de cotización exitosa en el primer deployment de staging/prod.
