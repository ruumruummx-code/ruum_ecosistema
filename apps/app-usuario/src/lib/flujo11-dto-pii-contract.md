# Contrato de DTO por Sección y Criterio de PII — Flujo 11 (Cuenta)
**Ticket:** RUUM-USR-F11-001  
**Condición Bloqueante:** CB-1 (DTO por sección y criterio de PII)  
**Criterios de Aceptación:** CA-1, CA-2, CA-3, CA-4  
**Fecha:** 2026-11-04  
**Snapshot auditado:** commit `2767e291a58ba9716a18467e585ffe65ccfeef32`

---

## 1. Problema de PII Sobreexpuesta Auditado
En la implementación previa del Flujo 11 (Cuenta):
1. **Sobreexposición en queries masivos:** La pantalla de cuenta y sus subsecciones ejecutaban `select("*")` sobre `usuarios`, `empresas` y llamaban a funciones como `listarTrasladosDeUsuario`, trayendo el historial digital completo (incluyendo geolocalizaciones GPS, coordenadas lat/lng de inicio/fin, telemetría y nombres/teléfonos de terceros).
2. **PII en texto plano en HTML/DOM:** El RFC (`EMP010101XX1`), VIN de vehículos (`3VW2K7AJ4HM123478`), teléfonos personales (`+52 55 1234 5678`) y líneas de crédito empresarial completas se serializaban directamente en el HTML inicial (SSR/RSC) sin máscara ni permisos.
3. **Exposición de URLs firmadas de larga duración:** Los documentos de identidad (INE, licencia, comprobante de domicilio) generaban URLs firmadas en el render inicial con expiraciones extensas, transmitiendo hipervínculos a documentación legal confidencial aunque el usuario solo estuviese revisando su perfil básico.

---

## 2. Especificación Formal de Secciones y DTOs (CA-1)

Se establecen cinco secciones con interfaces DTO estrictamente filtradas (*whitelisted*):

### 2.1 Sección Identidad (`IdentidadCuentaDTO`)
| Campo | Tipo | Criterio de PII | Justificación |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Técnico | Identificador interno de usuario |
| `nombre` | `string` | Completo | Identidad nominal del titular |
| `primerNombre` | `string` | Completo | Saludo personalizado accesible |
| `correo` | `string` | Completo | Identificador principal de cuenta |
| `telefonoEnmascarado` | `string` | Enmascarado | `+52 •••••• 5678` (solo últimos 4 dígitos visibles) |
| `pais` | `string` | Completo | País de residencia para soporte |
| `estadoResidencia` | `string` | Agregado | Estado de la república |
| `ciudad` | `string` | Agregado | Municipio o alcaldía |
| `codigoPostal` | `string` | Agregado | Código postal de residencia |
| `direccionResumen` | `string` | Agregado | Formato calle principal y colonia, sin coordenadas |
| `fotoPerfilUrl` | `string \| null` | URL pública/restringida | Foto de perfil personal |
| `estadoVerificacion` | `EstadoVerificacion` | Dominio | `verificado`, `en_revision`, `rechazado`, `pendiente` |
| `etiquetaVerificacion`| `string` | UI | Texto legible honesto |
| `creadoEn` | `string` | Metadato | Fecha de registro |
| `rol` | `RolEfectivoCuentaDTO` | Dominio | Rol derivado conforme a CB-2 |

*Campos eliminados:* Coordenadas GPS, teléfonos de contactos de emergencia sin consentimiento, metadatos de sesión interna.

### 2.2 Sección Vehículos (`VehiculoCuentaDTO[]`)
| Campo | Tipo | Criterio de PII | Justificación |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Técnico | ID del vehículo en garaje |
| `marca` | `string` | Completo | Fabricante |
| `modelo` | `string` | Completo | Modelo |
| `anio` | `number \| null` | Completo | Año |
| `color` | `string \| null` | Completo | Color |
| `placas` | `string \| null` | Completo | Placas vehiculares visibles para el titular |
| `vinEnmascarado` | `string` | Enmascarado | `3VW••••••••••••78` (primeros 3 y últimos 2) |
| `tipoVehiculo` | `string \| null` | Clasificación | Categoría de unidad |
| `activo` | `boolean` | Estado | Disponibilidad en cuenta |

*Campos eliminados:* Números de motor, facturas originales, pólizas completas serializadas.

### 2.3 Sección Resumen de Traslados (`TrasladosResumenCuentaDTO`)
| Campo | Tipo | Criterio de PII | Justificación |
| :--- | :--- | :--- | :--- |
| `totalTraslados` | `number` | Agregado | Contador global de traslados |
| `incidenciasAbiertas`| `number` | Agregado | Contador de tickets activos |
| `actividadesRecientes`| `ActividadRecienteCuentaDTO[]`| Mínimo | Últimos 4 eventos de traslado |
| `actividadesRecientes[].id` | `string` | Técnico | ID de traslado |
| `actividadesRecientes[].titulo`| `string` | Agregado | Marca · Modelo · Placas |
| `actividadesRecientes[].fecha` | `string` | ISO 8601 | Fecha de creación |
| `actividadesRecientes[].fechaFormateada`| `string` | Local | Fecha en America/Mexico_City |
| `actividadesRecientes[].estado`| `string` | Dominio | Estado honesto |
| `actividadesRecientes[].tono`| `string` | UI | Semáforo visual accesible |
| `actividadesRecientes[].enlace`| `string` | Navegación | `/viajes/{id}` |

*Campos eliminados:* Coordenadas GPS lat/lng, direcciones completas de recolección y entrega, datos y teléfonos de conductores en este resumen.

### 2.4 Sección Empresa (`EmpresaCuentaDTO | null`)
| Campo | Tipo | Criterio de PII | Justificación |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Técnico | ID corporativo |
| `nombreComercial` | `string` | Completo | Nombre público |
| `razonSocial` | `string` | Completo | Razón social registrada |
| `rfcEnmascarado` | `string` | Enmascarado | `EMP0••••••X1` |
| `regimenFiscal` | `string \| null`| Código | Clave SAT |
| `codigoPostalFiscal`| `string \| null`| Agregado | Domicilio fiscal SAT |
| `creditoResumen` | `object` | Enmascarado | `{ tieneCredito: boolean, limiteEnmascarado: string }` |

*Campos eliminados:* Saldos exactos pendientes de pago, estados financieros internos, contratos bancarios.

### 2.5 Sección Documentos (`DocumentoCuentaDTO[]`)
| Campo | Tipo | Criterio de PII | Justificación |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Técnico | Identificador de documento |
| `tipo` | `string` | Clasificación | `ine`, `licencia`, `comprobante_domicilio`, etc. |
| `estado` | `string` | Dominio | `verificado`, `en_revision`, `rechazado`, `pendiente` |
| `actualizadoEn` | `string` | Metadato | Timestamp |
| `requiereUrlFirmada`| `boolean` | Bandera | Indica disponibilidad para solicitud bajo demanda |

*Regla crítica:* Ningún documento incluye `signedUrl` en la respuesta inicial.

---

## 3. Criterio de Clasificación de PII y Reglas de Enmascaramiento (CA-2)

1. **RFC:**
   - Regla: Primeros 4 caracteres visibles, asteriscos en la parte central, y los últimos 2 caracteres visibles.
   - Longitud 12 (moral): `EMP0••••••X1`
   - Longitud 13 (física): `MERC••••••1A`
2. **VIN Vehicular:**
   - Regla: Primeros 3 caracteres (WMI) y últimos 2 caracteres (VIS) visibles; los 12 caracteres intermedios se reemplazan por `••••••••••••`.
   - Ejemplo: `3VW••••••••••••78`
3. **Teléfono:**
   - Regla: Conserva los primeros 4 caracteres (código de país o lada) y los últimos 4 dígitos. Los dígitos centrales se sustituyen por `••••••`.
   - Ejemplo: `+52 •••••• 5678`
4. **Crédito Empresarial:**
   - Regla: No muestra montos exactos en pantalla de cuenta regular; expone `$••••.00` o rango consolidado, revelándose solo en la sección autorizada de facturación empresarial mediante rol verificado.
5. **Dirección Resumen:**
   - Regla: Agrega solo calle y colonia; omite referencias sensibles y geolocalización precisa.

---

## 4. Obtención Bajo Demanda y URLs Firmadas de Corta Duración (CA-3)

- Las URLs firmadas para previsualizar o descargar identificaciones o comprobantes se generan exclusivamente mediante invocación explícita de `obtenerUrlDocumentoBajoDemanda(...)`.
- **Expiración:** 900 segundos (15 minutos).
- **Prohibición:** Está prohibido inyectar URLs firmadas de almacenamiento en el HTML del servidor (SSR), en metadatos de página, o en estado inicial deshidratado.

---

## 5. Auditoría de Acceso a Datos Sensibles (CA-4)

- Cualquier acceso a un dato sensible en claro o generación de URL firmada emite un evento de auditoría en la tabla `registro_auditoria`:
  - `evento`: `"consulta_dato_sensible"`
  - `actor`: `"usuario"`
  - `actor_id`: ID del usuario autenticado
  - `metadata`: `{ tipoDato: "documento" | "rfc" | "vin" | "telefono", campo: "ine_frente", motivo: "solicitud_url_firmada_bajo_demanda", timestamp: ISO }`
- **Integridad:** El registro de auditoría no almacena el dato sensible en claro ni el token de la URL firmada.

---

## 6. Garantía RLS en Fuentes de Datos de los DTOs (CB-1)

El filtrado en memoria (*whitelisting* de campos) es solo la segunda línea de defensa. La primera línea es el aislamiento estricto de filas en el motor de base de datos PostgreSQL:

1. **Cliente Autenticado con Sesión**:
   - Tanto `crearClienteServidor()` (en SSR) como `crearClienteNavegador()` (en cliente) utilizan la clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) inyectando el token JWT de la sesión activa (`auth.jwt()`).
   - Queda terminantemente prohibido utilizar `service_role_key` o clientes sin contexto de sesión para alimentar las vistas o DTOs de cuenta.
2. **Políticas de Row Level Security (RLS) Activas**:
   - `public.usuarios`: `for select using (auth.uid() = auth_user_id)`
   - `public.vehiculos`: `for select using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()))`
   - `public.empresas`: `for select using (id in (select u.empresa_id from public.usuarios u where u.auth_user_id = auth.uid()))`
   - `public.pasaporte_digital` (vista): Restringida por RLS de `traslados` a `usuario_id = public.usuario_id_actual()`.
   - `public.solicitudes_conductor`: `for select using (auth_user_id = auth.uid())`
   - `public.conductores`: `for select using (auth_user_id = auth.uid())`
3. **Invariante Cross-Tenant**:
   - Una consulta ejecutada por un usuario contra filas de otro tenant retorna **0 filas** (`data: []`) a nivel de motor SQL, independientemente de los filtros `.eq()` aplicados en la consulta.

---

## 7. Criterio de Enmascaramiento vs. Necesidad Funcional

Para evitar ambigüedades sobre cuándo un dato sensible debe presentarse con máscara y cuándo debe exponerse completo:

| Dato Sensible | En Vistas de Cuenta, Listas y Resúmenes | En Formularios de Edición Autorizados | En Transacciones Operativas |
| :--- | :--- | :--- | :--- |
| **RFC** | **Enmascarado:** `EMP0••••••X1` | **Completo:** En `/cuenta/facturacion` únicamente dentro del `<input>` editable por el titular. | Completo en timbrado CFDI (servidor a servidor). |
| **VIN** | **Enmascarado:** `3VW••••••••••••78` | **Completo:** En `/cuenta/vehiculos/[id]` únicamente en modo edición por el dueño del vehículo. | Completo en inspección física y póliza de seguro. |
| **Teléfono** | **Enmascarado:** `+52 •••••• 5678` | **Completo:** En `/cuenta/datos-personales` en el input telefónico. | Visible al conductor asignado únicamente durante el traslado en curso. |
| **Crédito Empresarial** | **Enmascarado:** Indicador booleano o `$••••.00` | **Completo:** En portal corporativo exclusivo para rol `titular_empresa`. | Validado en backend contra límite disponible. |
| **Documentos de Identidad** | **Oculto:** Sin URL firmada inicial. | **Bajo demanda:** URL firmada (TTL 15 min) tras evento de auditoría. | Verificación KYC Didit (servidor a servidor). |

---

## 8. Consumidor, Alertas y Retención de `consulta_dato_sensible`

1. **Consumidores del Evento**:
   - **Módulo de Auditoría y Cumplimiento:** Revisión periódica por el oficial de privacidad de datos (DPO).
   - **Sistema de Monitoreo de Seguridad (SIEM):** Ingesta de eventos para detección de comportamiento anómalo.
2. **Reglas de Detección y Alerta**:
   - *Alerta de Frecuencia Inusual:* Más de 10 eventos de `consulta_dato_sensible` para un mismo usuario o IP en una ventana de 5 minutos dispara una alerta de severidad media por potencial exfiltración o raspado de datos.
   - *Alerta de Patrón Concurrente:* Consultas a múltiples documentos de diferentes identidades desde una misma sesión activa un bloqueo preventivo de sesión.
3. **Política de Retención Legal**:
   - Los registros de `consulta_dato_sensible` se conservan por un período mínimo de **12 meses** en la tabla `registro_auditoria` con almacenamiento WORM (Write Once, Read Many) para dar cumplimiento al Artículo 19 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).

