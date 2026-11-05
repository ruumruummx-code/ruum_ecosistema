# Contrato de Consentimiento Transversal en Creación de Traslados (F6)
**Ticket**: RUUM-USR-F6-001  
**Condición Bloqueante**: CB-3  
**Criterio de Aceptación**: CA-8  
**Fecha de Publicación**: 2026-11-04  

---

## 1. Principio de No-Divergencia Transversal

De conformidad con los acuerdos de arquitectura establecidos en los tickets **RUUM-USR-F2** y **RUUM-USR-F3**:

> [!IMPORTANT]
> Ningún flujo operativo particular (incluyendo el Flujo 6 de Solicitud Individual) tiene permitido implementar tablas secundarias de términos, llamadas `INSERT` directas no auditadas a la base de datos o esquemas alternativos de consentimientos legales.

El Flujo 6 consume de forma exclusiva el escritor canónico establecido en el paquete de servicios transversal [`@ruum/api/services`](file:///c:/ruum_ecosistema-main/packages/api/src/services/):

```typescript
import { registrarConsentimientoUsuario } from "@ruum/api/services";
```

---

## 2. Parámetros del Contrato Canónico

Cuando el usuario acepta los términos y políticas en el paso final del wizard (`aceptaPoliticas: true`), el endpoint [POST /api/viajes](file:///c:/ruum_ecosistema-main/apps/app-usuario/src/app/api/viajes/route.ts) invoca el servicio canónico con las siguientes invariantes:

| Parámetro | Valor Canónico | Descripción |
| :--- | :--- | :--- |
| `cliente` | Supabase Server Client | Conexión autenticada con contexto de sesión del usuario. |
| `params.version` | `1` (`terminos_servicio`) | Versión vigente de términos del catálogo de consentimientos de RUUM. |
| `params.canal` | `"web"` | Canal digital donde se otorgó la aceptación. |
| `params.versionApp` | `"1.0.0"` | Versión vigente de la aplicación web de traslado individual. |

### Ejemplo de Invocación en `/api/viajes/route.ts`:
```typescript
if (parsed.data.aceptaPoliticas) {
  try {
    const { registrarConsentimientoUsuario } = await import("@ruum/api/services");
    if (typeof registrarConsentimientoUsuario === "function") {
      await registrarConsentimientoUsuario(cliente, {
        version: 1,
        canal: "web",
        versionApp: "1.0.0",
      });
    }
  } catch (errConsent) {
    logStructuredWarn("api/viajes", "registro_consentimiento_canonico_nota", errConsent, {
      userIdHash: userHash,
    });
  }
}
```

---

## 3. Manejo de Resiliencia e Idempotencia

1. **Idempotencia en Base de Datos**:
   - La función almacenada subyacente (`registrar_consentimiento_usuario`) cuenta con índice único por `(usuario_id, tipo_consentimiento_id, version)` o cláusula de resolución de conflictos que evita duplicación de registros históricos ante reintentos de red.
2. **Resiliencia de Creación**:
   - Si la escritura del consentimiento experimenta un bloqueo transitorio o latencia de red, se emite un log estructurado de advertencia (`registro_consentimiento_canonico_nota`) con el hash seudonimizado del usuario (`userIdHash`), garantizando observabilidad sin interrumpir la creación del traslado cuando el consentimiento ya fue verificado en el esquema de validación previo.
