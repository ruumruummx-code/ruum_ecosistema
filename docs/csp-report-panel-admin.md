# Documentación de Endpoint CSP Report: `panel-admin` (RUUM-SEC-008 / F0.7)

**Fecha:** 2026-11-22  
**Autor:** Antigravity Architect  
**Ticket:** RUUM-SEC-008 (Fase 0: Mitigación Inmediata)  
**Estado:** Resuelto (Opción A implementada)  
**Ruta:** `apps/panel-admin/src/app/api/csp-report/route.ts`

---

## 1. Contexto y Decisión

En `apps/panel-admin/src/middleware.ts:48`, las cabeceras CSP de staging declaran:
```http
Content-Security-Policy-Report-Only: ...; report-uri /api/csp-report; report-to csp-endpoint
```
Sin embargo, el endpoint `/api/csp-report` no existía en `panel-admin`, provocando ceguera de seguridad: violaciones de Content Security Policy en staging/dev eran descartadas con errores 404 por Next.js.

### Alternativas Evaluadas

1. **Opción A (Implementada):** Crear el endpoint receptor en `apps/panel-admin/src/app/api/csp-report/route.ts`, estructurado, rate-limitado y con sanitización de tokens JWT, devolviendo HTTP 204 No Content.
2. **Opción B:** Remover la directiva `report-uri /api/csp-report` de `apps/panel-admin/src/middleware.ts`.

**Justificación:** Se eligió la **Opción A** porque permite mantener la telemetría activa en staging y desarrollo para auditoría temprana de violaciones de directivas (`script-src`, `connect-src`, `img-src`) previo al despliegue en producción, alineándose con las implementaciones homólogas en `app-usuario` y `app-conductor`.

---

## 2. Especificación Técnica del Endpoint

### Métodos Soportados
- `POST`: Recepción de reportes CSP (W3C CSP Level 2 `application/csp-report` o Level 3 Reporting API).
- `GET`, `HEAD`: Algunos navegadores antiguos o extensiones verifican disponibilidad con GET/HEAD; responden `204 No Content` inmediato sin loguear.

### Parámetros y Cuotas de Seguridad
| Control | Parámetro | Comportamiento |
| :--- | :--- | :--- |
| **Límite de Carga (Header)** | `Content-Length > 16 KB` | HTTP `413 Payload Too Large` |
| **Límite de Carga (Body)** | `body.length > 16 KB` | HTTP `413 Payload Too Large` |
| **Rate Limiting** | 60 req / hora por IP (`@ruum/api/rate-limit`) | HTTP `429 Too Many Requests` con header `Retry-After` |
| **Fail-mode** | `failClosed: false` | Degradación graciosa si Redis/almacenamiento no responde |
| **Sanitización** | Regex JWT en payload | Reemplazo automático por `[REDACTED_JWT]` |
| **Observabilidad** | `console.warn` estructurado + Sentry opcional | Tag `[csp-report-panel-admin]` truncado a 2000 caracteres |

---

## 3. Formato del Payload Esperado

El endpoint procesa cargas enviadas por el navegador bajo la especificación estándar CSP:

```json
{
  "csp-report": {
    "document-uri": "https://admin.ruum.mx/vehiculos",
    "referrer": "",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self' 'nonce-...'",
    "disposition": "report",
    "blocked-uri": "https://untrusted-cdn.com/script.js",
    "line-number": 12,
    "source-file": "https://admin.ruum.mx/vehiculos",
    "status-code": 200,
    "script-sample": ""
  }
}
```

---

## 4. Pruebas Unitarias Automatizadas

Las pruebas automatizadas residen en:
`apps/panel-admin/src/app/api/csp-report/route.test.ts`

Cobertura verificada:
1. `POST` con reporte válido -> `204 No Content` con `Cache-Control: no-store`.
2. `POST` con cuerpo `{}` -> `204 No Content`.
3. `POST` con `Content-Length > 16 KB` -> `413 Payload Too Large`.
4. `POST` con cuerpo real > 16 KB -> `413 Payload Too Large`.
5. Sanitización de JWT: confirmación de que tokens en payload son reemplazados por `[REDACTED_JWT]`.
6. Métodos `GET` y `HEAD` -> `204 No Content`.
7. Rate limiting: peticiones repetidas (> 60 en la ventana) bloqueadas con `429` y `Retry-After`.
