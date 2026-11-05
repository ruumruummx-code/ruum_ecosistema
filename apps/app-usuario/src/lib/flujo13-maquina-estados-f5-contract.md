# Contrato de Máquina de Estados Documentales, Integración Didit (F5) y Seguridad CORS (Flujo 13)
**Identificador**: `RUUM-CONTRATO-F13-MAQUINA-ESTADOS-F5`  
**Ticket**: `RUUM-USR-F13-001` (Condición Bloqueante CB-2)  
**Versión**: `1.0.0`  
**Fecha**: `2026-11-05`  
**Estado**: `APROBADO_EN_CONTRATO`

---

## 1. Definición Canónica de Estados Documentales

Todo documento cargado por el usuario (`comprobante`, `constancia`, `licencia`, `identidad`) obedece estrictamente a uno de los siguientes 5 estados en base de datos:

| Estado | Significado Operativo | Visualización Usuario | Tono UI |
|---|---|---|---|
| `recibido` | Documento subido con éxito, pendiente de asignación a revisión | "Recibido" | `pending` (ámbar) |
| `en_revision` | Un revisor (humano o proceso automatizado) tiene el documento en validación activa | "En revisión" | `pending` (ámbar) |
| `verificado` | El documento cumple con todos los requisitos legales y de calidad | "Verificado" | `success` (verde) |
| `rechazado` | El documento es ilegible, inválido, o no corresponde al titular. Requiere motivo descriptivo obligatorio | "Rechazado" | `error` (rojo) |
| `expirado` | El documento superó su vigencia legal máxima (comprobante > 3 meses o constancia no vigente) | "Expirado" | `error` (rojo) |

---

## 2. Matriz de Transiciones y SLAs

| Estado Origen | Estado Destino | Actor Responsable | Reglas de Negocio / Precondiciones | SLA Canónico |
|---|---|---|---|---|
| `sin_cargar` | `recibido` | Usuario | Archivo válido (JPG/PNG/PDF, <=10MB, hash SHA-256 verificado) | Inmediato |
| `recibido` | `en_revision` | Sistema / Admin | Asignación en Torre de Control o inicio de OCR | <= 24 horas |
| `en_revision` | `verificado` | Admin / Didit / OCR | Cotejo positivo de domicilio, vigencia o datos SAT | <= 48 horas |
| `en_revision` | `rechazado` | Admin / Sistema | Parámetro `p_motivo` obligatorio y detallado | Inmediato al dictamen |
| `verificado` | `expirado` | Cron Sistema | Transcurridos 90 días naturales para comprobantes o caducidad fiscal | Cron diario medianoche |
| `rechazado` | `recibido` | Usuario | Carga de un nuevo archivo reemplazando el rechazado | Inmediato |
| `expirado` | `recibido` | Usuario | Carga de un archivo vigente que subsana la expiración | Inmediato |

Toda transición se audita en la tabla `public.historial_estados_documentos_cuenta` mediante la función atómica `public.transicionar_estado_documento_cuenta`.

---

## 3. Consumo del Contrato de Identidad Didit (Flujo 5)

La verificación biométrica y de credenciales de identidad no duplica esquemas ni endpoints. Consume directamente la infraestructura consolidada en el Flujo 5:

1. **Sesión de Identidad**: Creación de sesión asociada a `session_id` con expiración formal.
2. **Recepción de Webhook**:
   - Validación criptográfica obligatoria de firma HMAC en encabezado `x-didit-signature`.
   - Normalización de flotantes enteros y ordenamiento alfabético canónico de claves según `payloadCanonicoDidit`.
   - Validación de timestamp para evitar ataques de replay (ventana máxima de 300 segundos).
3. **Idempotencia Transaccional**:
   - Consumo exclusivo de la RPC `public.reconciliar_verificacion_didit_resultado(p_session_id, p_decision, p_motivo)`.
   - Si `procesado_en is not null`, la RPC responde `{ ok: true, ya_procesado: true }` de forma segura sin re-ejecutar mutaciones.

---

## 4. Política Estricta de CORS en Edge Functions

Queda terminantemente prohibido el retorno de `Access-Control-Allow-Origin: "*"` en endpoints que manipulen documentos o PII (`documentos-cuenta-usuario`, `validar-documento-identidad`).

### Implementación (`supabase/functions/_shared/cors-documentos.ts`):
- Validación dinámica del encabezado `Origin` contra lista autorizada:
  - Dominios oficiales: `https://ruum.mx`, `https://app.ruum.mx`, `https://admin.ruum.mx`.
  - Entornos de desarrollo local: `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`, `http://127.0.0.1:3001`.
  - Previews autorizados: `https://*.ruum.mx`, `https://ruum-*-*.vercel.app`.
- Si el `Origin` no pertenece a la lista permitida, la Edge Function responde con el dominio canónico `https://ruum.mx` (o bloquea preflight), impidiendo fugas cross-origin.
- Envío obligatorio de cabecera `Vary: Origin`.

---

## 5. Aislamiento de Borradores (Drafts) en Cliente y TTL

1. **Namespace por Cuenta**:
   - Clave obligatoria: `ruum_draft_fiscal_${usuario.id}` y `ruum_draft_docs_${usuario.id}`.
   - Elimina la clave global sin namespace (`ruum:draft:fiscal`) que provocaba fuga de datos fiscales entre distintas sesiones de usuario en un mismo navegador.
2. **Envoltorio con Timestamp y TTL**:
   - Estructura: `{ datos: { ... }, timestamp: number }`.
   - TTL: 24 horas (`86,400,000` ms). Si al leer el borrador ha transcurrido más de 24 horas, se destruye automáticamente del `localStorage`.
3. **Limpieza en Logout**:
   - Al invocar el cierre de sesión, se eliminan todas las claves locales de borradores del usuario autenticado.
